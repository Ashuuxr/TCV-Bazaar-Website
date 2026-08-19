import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

type BookingInput = {
  pkgId: string
  stallId: string
  eventName: string
  business: Record<string, string>
  payType: 'full' | 'advance'
  method: string
  utr: string
  txnId: string
  proof: string
  remarks: string
}

function ok<T>(data: T) { return { ok: true as const, data } }
function fail(message: string) { return { ok: false as const, message } }

// Accept any admin-configurable invoice format (letters, digits, dashes, slashes).
const INVOICE_RE = /^[A-Z0-9][A-Z0-9\-/]{3,40}$/i
const GST_RE = /^[0-9A-Z]{15}$/i

// Max decoded proof size: 800 KB. Base64 expands ~4/3, so cap raw string too.
const MAX_PROOF_BYTES = 800 * 1024
const MAX_PROOF_B64_LEN = Math.ceil((MAX_PROOF_BYTES * 4) / 3) + 128
const PROOF_DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/
// Signed/public storage URL for the payment-screenshots bucket (max 2 KB).
const PROOF_STORAGE_URL_RE = /^https?:\/\/[^/]+\/storage\/v1\/object\/(?:public|sign)\/payment-screenshots\/[^?\s]+(?:\?[^\s]+)?$/
const MAX_PROOF_URL_LEN = 2048

const MAX_UPLOAD_FILENAME_LEN = 120
const ALLOWED_UPLOAD_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'])
const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif',
}

function validateProof(proof: unknown): string {
  if (proof === undefined || proof === null || proof === '') return ''
  if (typeof proof !== 'string') throw new Error('Invalid proof')
  const trimmed = proof.trim()
  if (!trimmed) return ''
  // New: storage URL (uploaded to payment-screenshots bucket).
  if (trimmed.startsWith('http')) {
    if (trimmed.length > MAX_PROOF_URL_LEN) throw new Error('Proof URL too long')
    if (!PROOF_STORAGE_URL_RE.test(trimmed)) throw new Error('Proof URL must point to the payment-screenshots bucket')
    return trimmed
  }
  // Legacy: data URL (kept for older submissions).
  if (trimmed.length > MAX_PROOF_B64_LEN) throw new Error('Proof image too large (max 800KB)')
  const m = PROOF_DATA_URL_RE.exec(trimmed)
  if (!m) throw new Error('Proof must be a PNG/JPEG/WEBP/GIF image data URL')
  // Approximate decoded size from base64 length.
  const b64 = m[2]
  const padding = (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0)
  const decoded = Math.floor((b64.length * 3) / 4) - padding
  if (decoded > MAX_PROOF_BYTES) throw new Error('Proof image too large (max 800KB)')
  return trimmed
}

/** Create a booking anonymously (public). Uses admin client server-side. */
export const createBooking = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => {
    const r = raw as Partial<BookingInput>
    if (!r || typeof r !== 'object') throw new Error('Invalid payload')
    for (const k of ['pkgId', 'stallId', 'eventName', 'payType', 'method', 'utr'] as const) {
      if (typeof r[k] !== 'string' || !(r[k] as string).trim()) throw new Error(`Missing ${k}`)
    }
    if (r.payType !== 'full' && r.payType !== 'advance') throw new Error('Bad payType')
    if (!r.business || typeof r.business !== 'object') throw new Error('Missing business')
    const biz = r.business as Record<string, string>
    for (const k of ['businessName', 'brandName', 'ownerName', 'phone', 'email']) {
      if (!biz[k] || !String(biz[k]).trim()) throw new Error(`Missing business.${k}`)
    }
    r.proof = validateProof(r.proof)
    return r as BookingInput
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    // The public CMS flag is the source of truth for whether new bookings are
    // accepted. Default to open if the legacy blob has no flag yet.
    const { data: cmsRow, error: cmsError } = await supabaseAdmin
      .from('site_content').select('data').eq('id', 'main').maybeSingle()
    if (cmsError) return fail('Booking status unavailable. Please try again.')
    const cmsData = (cmsRow?.data ?? {}) as { bookingOpen?: unknown }
    if (cmsData.bookingOpen === false) return fail('Booking is currently closed. Please check back later.')

    // Prevent double-booking: refuse if the stall isn't available.
    const { data: stallRow } = await supabaseAdmin
      .from('stalls').select('id, status, active').eq('id', data.stallId).maybeSingle()
    if (!stallRow || stallRow.active === false) return fail('Stall unavailable')
    if (stallRow.status !== 'available') return fail('Stall already booked')
    // Look up authoritative package price server-side; ignore client-supplied amounts.
    const { data: pkg, error: pkgErr } = await supabaseAdmin
      .from('packages').select('id, price').eq('id', data.pkgId).maybeSingle()
    if (pkgErr || !pkg) return fail('Invalid package')
    const subtotal = Number(pkg.price) || 0
    if (subtotal <= 0) return fail('Invalid package price')
    // Read GST settings so the effective rate/enabled flag is admin-configurable.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: gstCfg } = await (supabaseAdmin as any)
      .from('gst_settings').select('*').eq('id', 'main').maybeSingle()
    const cfgEnabled = gstCfg?.gst_enabled !== false
    const cfgRatePct = Number(gstCfg?.default_rate ?? 18)
    const cfgRate = cfgRatePct / 100
    const gstin = String(data.business.gst ?? '').trim().toUpperCase()
    const hasGst = GST_RE.test(gstin)
    const gstRate = cfgEnabled && hasGst ? cfgRate : 0
    const gstAmount = gstRate > 0 ? Math.round(subtotal * gstRate) : 0
    const total = subtotal + gstAmount
    const paid = data.payType === 'full' ? total : Math.round(total / 2)
    const balance = total - paid

    const { data: ev } = await supabaseAdmin.from('events').select('id').eq('is_active', true).limit(1).maybeSingle()
    // Issue an invoice number from the atomic RPC (respects prefix/format/reset_yearly).
    let issuedInvoice: string | null = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inv } = await (supabaseAdmin as any).rpc('issue_invoice_number')
      if (typeof inv === 'string' && inv.trim()) issuedInvoice = inv
    } catch { /* fall back to DB default */ }

    const insertPayload: Record<string, unknown> = {
      event_id: ev?.id ?? null,
      package_id: data.pkgId,
      stall_id: data.stallId,
      business_name: data.business.businessName,
      owner_name: data.business.ownerName,
      contact_phone: data.business.phone,
      contact_email: data.business.email,
      gstin: hasGst ? gstin : null,
      business: data.business,
      subtotal,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      total,
      amount_paid: paid,
      balance,
      pay_type: data.payType,
      method: data.method,
      utr: data.utr,
      txn_id: data.txnId || null,
      proof_url: data.proof || null,
      remarks: data.remarks || null,
      status: 'pending' as const,
      pay_status: 'pending' as const,
    }
    if (issuedInvoice) insertPayload.invoice_number = issuedInvoice
    const { data: row, error } = await supabaseAdmin
      .from('bookings')
      .insert(insertPayload)
      .select('id, invoice_number, created_at')
      .single()
    if (error || !row) return fail(error?.message || 'Insert failed')

    await supabaseAdmin
      .from('stalls')
      .update({ status: 'pending', customer_name: data.business.brandName || data.business.businessName })
      .eq('id', data.stallId)

    await supabaseAdmin.from('activity_log').insert({
      text: `New booking ${row.invoice_number} — ${data.business.brandName} · Stall ${data.stallId}`,
    })
    const snapshot = await loadInvoiceSnapshot(supabaseAdmin)
    return ok({
      dbId: row.id as string,
      invoiceNumber: row.invoice_number as string,
      createdAt: row.created_at as string,
      subtotal, gstRate, gstAmount, total, paid, balance,
      company: snapshot.company,
      gst: snapshot.gst,
    })
  })

/** Look up a booking by invoice number + last-10-digits of phone (public portal). */
export const findBooking = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => {
    const r = raw as { invoiceNumber?: string; phone?: string }
    if (!r?.invoiceNumber || !r?.phone) throw new Error('Missing lookup')
    const invoiceNumber = r.invoiceNumber.trim().toUpperCase()
    if (!INVOICE_RE.test(invoiceNumber)) throw new Error('Invalid invoice number')
    return { invoiceNumber, phone: r.phone.replace(/\D/g, '').slice(-10) }
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: row } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('invoice_number', data.invoiceNumber)
      .maybeSingle()
    if (!row) return fail('not_found')
    const rowPhone = String(row.contact_phone || '').replace(/\D/g, '').slice(-10)
    if (rowPhone !== data.phone) return fail('not_found')
    const snapshot = await loadInvoiceSnapshot(supabaseAdmin)
    return ok({ row, company: snapshot.company, gst: snapshot.gst })
  })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadInvoiceSnapshot(admin: any) {
  const [c, g] = await Promise.all([
    admin.from('company_profile').select('id, legal_name, business_name, address_line1, address_line2, city, state, state_code, pincode, country, gstin, pan, cin, email, mobile, website, logo_url, updated_at').eq('id', 'main').maybeSingle(),
    admin.from('gst_settings').select('*').eq('id', 'main').maybeSingle(),
  ])
  return { company: c.data ?? null, gst: g.data ?? null }
}

/** Submit balance payment (public, id+phone gated). */
export const submitBalancePayment = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => {
    const r = raw as { invoiceNumber?: string; phone?: string; utr?: string; proof?: string }
    if (!r?.invoiceNumber || !r?.phone || !r?.utr) throw new Error('Missing fields')
    const invoiceNumber = r.invoiceNumber.trim().toUpperCase()
    if (!INVOICE_RE.test(invoiceNumber)) throw new Error('Invalid invoice number')
    return {
      invoiceNumber,
      phone: r.phone.replace(/\D/g, '').slice(-10),
      utr: r.utr.trim(),
      proof: validateProof(r.proof),
    }
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: row } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('invoice_number', data.invoiceNumber)
      .maybeSingle()
    if (!row) return fail('not_found')
    const rowPhone = String(row.contact_phone || '').replace(/\D/g, '').slice(-10)
    if (rowPhone !== data.phone) return fail('not_found')
    const newRemarks = `${row.remarks ?? ''} | Balance paid UTR: ${data.utr}`.trim()
    const { data: updated, error } = await supabaseAdmin
      .from('bookings')
      .update({
        amount_paid: row.total,
        balance: 0,
        remarks: newRemarks,
        proof_url: data.proof || row.proof_url,
        pay_status: 'pending',
      })
      .eq('id', row.id)
      .select('*')
      .single()
    if (error || !updated) return fail(error?.message || 'Update failed')
    await supabaseAdmin.from('activity_log').insert({ text: `Balance payment uploaded for ${row.invoice_number}` })
    return ok(updated)
  })

/** List all bookings (admin only). */
export const listAllBookings = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  })

/** Public stall snapshot lives in `stallsPublic.functions.ts`. */

/** Update booking status (admin). Cascades stall status. */
export const updateBookingStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = raw as { dbId?: string; status?: string }
    if (!r?.dbId || !r?.status) throw new Error('Missing fields')
    if (!['pending', 'approved', 'rejected', 'cancelled'].includes(r.status)) throw new Error('Bad status')
    return { dbId: r.dbId, status: r.status as 'pending' | 'approved' | 'rejected' | 'cancelled' }
  })
  .handler(async ({ context, data }) => {
    const { data: row, error: rErr } = await context.supabase
      .from('bookings').select('*').eq('id', data.dbId).maybeSingle()
    if (rErr || !row) throw new Error(rErr?.message || 'Not found')

    const updatePayload = data.status === 'approved'
      ? { status: data.status, pay_status: (row.balance === 0 ? 'paid' : 'partial') as 'paid' | 'partial' }
      : { status: data.status }
    const { data: updated, error } = await context.supabase
      .from('bookings').update(updatePayload).eq('id', data.dbId).select('*').single()
    if (error) throw new Error(error.message)

    if (row.stall_id) {
      if (data.status === 'approved') {
        await context.supabase.from('stalls').update({
          status: 'booked',
          customer_name: (row.business as Record<string, string>)?.brandName || row.business_name || null,
        }).eq('id', row.stall_id)
      } else if (data.status === 'rejected' || data.status === 'cancelled') {
        await context.supabase.from('stalls').update({ status: 'available', customer_name: null }).eq('id', row.stall_id)
      }
    }
    await context.supabase.from('activity_log').insert({ text: `Booking ${row.invoice_number} → ${data.status}` })
    return updated
  })

/** Delete a booking after the UI has completed its two-step confirmation. */
export const deleteBooking = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => {
    const r = raw as { dbId?: string }
    if (!r?.dbId || typeof r.dbId !== 'string') throw new Error('Booking id required')
    return { dbId: r.dbId }
  })
  .handler(async ({ context, data }) => {
    const { data: roleRows, error: roleError } = await context.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', context.userId)
    if (roleError) throw new Error(roleError.message)
    const canDelete = (roleRows ?? []).some((r: { role: string }) => r.role === 'admin' || r.role === 'super_admin')
    if (!canDelete) throw new Error('Forbidden: admin role required')

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, invoice_number, stall_id, status, business_name, owner_name')
      .eq('id', data.dbId)
      .maybeSingle()
    if (bookingError) throw new Error(bookingError.message)
    if (!booking) throw new Error('Booking not found')

    if (booking.stall_id) {
      const { error: stallError } = await supabaseAdmin
        .from('stalls')
        .update({ status: 'available', customer_name: null })
        .eq('id', booking.stall_id)
      if (stallError) throw new Error(`Could not release stall: ${stallError.message}`)
    }

    const { error: deleteError } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', data.dbId)
    if (deleteError) throw new Error(deleteError.message)

    await supabaseAdmin.from('activity_log').insert({
      text: `Booking deleted ${booking.invoice_number} — ${booking.business_name || booking.owner_name || 'customer'}`,
      meta: { action: 'booking.delete', booking_id: booking.id, invoice_number: booking.invoice_number },
    })
    await (context.supabase as any).rpc('log_user_audit', {
      _target_id: booking.id,
      _target_email: null,
      _action: 'booking.delete',
      _from_role: null,
      _to_role: null,
      _metadata: { invoice_number: booking.invoice_number, stall_id: booking.stall_id },
    }).then(() => undefined, () => undefined)

    return { ok: true as const, dbId: booking.id, invoiceNumber: booking.invoice_number }
  })

/** Helper for both client screens: convert a DB row to the app's Booking shape. */
export type BookingRow = {
  id: string
  invoice_number: string
  package_id: string | null
  stall_id: string | null
  business: Record<string, string>
  subtotal: number
  gst_rate: number | string
  gst_amount: number
  total: number
  amount_paid: number
  balance: number
  pay_type: 'full' | 'advance'
  method: string | null
  utr: string | null
  txn_id: string | null
  proof_url: string | null
  remarks: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  pay_status: 'pending' | 'partial' | 'paid' | 'refunded'
  created_at: string
}

/** Upload a payment proof screenshot for an anonymous booking. */
export const uploadPaymentProof = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => {
    const r = raw as { filename?: string; contentType?: string; dataBase64?: string }
    if (!r || typeof r !== 'object') throw new Error('Invalid payload')
    const contentType = String(r.contentType || '').toLowerCase()
    if (!ALLOWED_UPLOAD_TYPES.has(contentType)) throw new Error('Unsupported image type')
    const filename = String(r.filename || 'upload').slice(0, MAX_UPLOAD_FILENAME_LEN)
    const dataBase64 = String(r.dataBase64 || '')
    if (!dataBase64 || !/^[A-Za-z0-9+/=]+$/.test(dataBase64)) throw new Error('Invalid image data')
    if (dataBase64.length > MAX_PROOF_B64_LEN) throw new Error('Proof image too large (max 800KB)')
    const padding = dataBase64.endsWith('==') ? 2 : dataBase64.endsWith('=') ? 1 : 0
    const decoded = Math.floor((dataBase64.length * 3) / 4) - padding
    if (decoded > MAX_PROOF_BYTES) throw new Error('Proof image too large (max 800KB)')
    return { filename, contentType, dataBase64 }
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const ext = EXT_BY_TYPE[data.contentType] || 'bin'
    const ts = Date.now().toString(36)
    const rand = Math.random().toString(36).slice(2, 8)
    const safe = data.filename.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || `proof.${ext}`
    const path = `booking/${ts}-${rand}-${safe.endsWith('.' + ext) ? safe : safe + '.' + ext}`
    const bytes = Buffer.from(data.dataBase64, 'base64')
    const { error: upErr } = await supabaseAdmin.storage
      .from('payment-screenshots')
      .upload(path, bytes, { contentType: data.contentType, upsert: false })
    if (upErr) return fail(upErr.message)
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from('payment-screenshots')
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10)
    if (signErr || !signed?.signedUrl) return fail(signErr?.message || 'Sign failed')
    return ok({ url: signed.signedUrl, path })
  })
