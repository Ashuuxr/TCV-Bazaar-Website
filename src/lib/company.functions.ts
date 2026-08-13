import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export interface CompanyProfile {
  id: string
  legal_name: string
  business_name: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  state_code: string
  pincode: string
  country: string
  gstin: string
  pan: string
  cin: string
  email: string
  mobile: string
  website: string
  logo_url: string
  signature_url: string
  stamp_url: string
  updated_at: string
}

export type TaxMode = 'cgst_sgst' | 'igst'
export interface GstSettings {
  id: string
  gst_enabled: boolean
  default_rate: number
  tax_mode: TaxMode
  home_state_code: string
  auto_calculate: boolean
  updated_at: string
}

export interface InvoiceSettings {
  id: string
  prefix: string
  format: string
  seq_padding: number
  reset_yearly: boolean
  updated_at: string
}

export interface InvoiceContext {
  company: CompanyProfile
  gst: GstSettings
  invoice: InvoiceSettings
  nextInvoicePreview: string
}

/* eslint-disable @typescript-eslint/no-explicit-any */

async function assertBilling(context: any) {
  const { data, error } = await context.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', context.userId)
  if (error) throw new Error(error.message)
  const roles = ((data ?? []) as any[]).map((r) => r.role as string)
  const ok = roles.some((r) => r === 'super_admin' || r === 'admin' || r === 'finance')
  if (!ok) throw new Error('Forbidden — billing access required')
  return roles
}

async function logAudit(context: any, action: string, metadata: Record<string, unknown>) {
  try {
    await (context.supabase.rpc as any)('log_user_audit', {
      _target_id: context.userId,
      _target_email: null,
      _action: action,
      _from_role: null,
      _to_role: null,
      _metadata: metadata,
    })
  } catch {
    /* audit is best-effort */
  }
}

/** Billing-only: save company profile. */
export const saveCompanyProfile = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => (raw ?? {}) as Partial<CompanyProfile>)
  .handler(async ({ context, data }) => {
    await assertBilling(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const payload = { ...data, id: 'main', updated_by: context.userId, updated_at: new Date().toISOString() }
    const { error } = await supabaseAdmin.from('company_profile' as any).upsert(payload).eq('id', 'main')
    if (error) throw new Error(error.message)
    await logAudit(context, 'company_update', { fields: Object.keys(data) })
    return { ok: true }
  })

/** Billing-only: save GST settings. */
export const saveGstSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => {
    const r = (raw ?? {}) as Partial<GstSettings>
    if (r.default_rate != null && ![0, 5, 12, 18, 28].includes(Number(r.default_rate))) {
      throw new Error('Rate must be 0, 5, 12, 18, or 28')
    }
    if (r.tax_mode && r.tax_mode !== 'cgst_sgst' && r.tax_mode !== 'igst') {
      throw new Error('Invalid tax mode')
    }
    return r
  })
  .handler(async ({ context, data }) => {
    await assertBilling(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const payload = { ...data, id: 'main', updated_by: context.userId, updated_at: new Date().toISOString() }
    const { error } = await supabaseAdmin.from('gst_settings' as any).upsert(payload).eq('id', 'main')
    if (error) throw new Error(error.message)
    await logAudit(context, 'gst_update', { fields: Object.keys(data) })
    return { ok: true }
  })

/** Billing-only: save invoice settings. */
export const saveInvoiceSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => {
    const r = (raw ?? {}) as Partial<InvoiceSettings>
    if (r.prefix != null && !/^[A-Z0-9_-]{1,10}$/i.test(String(r.prefix))) {
      throw new Error('Prefix must be 1-10 letters/digits')
    }
    if (r.format != null && !String(r.format).includes('{SEQ}')) {
      throw new Error('Format must include {SEQ}')
    }
    if (r.seq_padding != null && (Number(r.seq_padding) < 1 || Number(r.seq_padding) > 10)) {
      throw new Error('Padding must be between 1 and 10')
    }
    return r
  })
  .handler(async ({ context, data }) => {
    await assertBilling(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const payload = { ...data, id: 'main', updated_by: context.userId, updated_at: new Date().toISOString() }
    const { error } = await supabaseAdmin.from('invoice_settings' as any).upsert(payload).eq('id', 'main')
    if (error) throw new Error(error.message)
    await logAudit(context, 'invoice_settings_update', { fields: Object.keys(data) })
    return { ok: true }
  })

/** Billing-only: reset invoice series for a given FY (defaults to current). */
export const resetInvoiceSeries = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => (raw ?? {}) as { fy?: string })
  .handler(async ({ context, data }) => {
    await assertBilling(context)
    // Use the authenticated session client here: reset_invoice_series checks
    // auth.uid() and billing access inside the SECURITY DEFINER function.
    const { error } = await (context.supabase.rpc as any)('reset_invoice_series', { _fy: data.fy ?? null })
    if (error) throw new Error(error.message)
    await logAudit(context, 'invoice_reset', { fy: data.fy ?? 'current' })
    return { ok: true }
  })

/** Billing-only: upload company asset. Returns signed upload URL for the client to PUT to. */
export const createCompanyAssetUploadUrl = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => {
    const r = (raw ?? {}) as { kind?: string; ext?: string }
    if (!r.kind || !['logo', 'signature', 'stamp'].includes(r.kind)) throw new Error('Invalid asset kind')
    const ext = String(r.ext || 'png').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5)
    if (!ext) throw new Error('Invalid extension')
    return { kind: r.kind as 'logo' | 'signature' | 'stamp', ext }
  })
  .handler(async ({ context, data }) => {
    await assertBilling(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const path = `${data.kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${data.ext}`
    const { data: signed, error } = await supabaseAdmin.storage
      .from('company-assets')
      .createSignedUploadUrl(path)
    if (error || !signed) throw new Error(error?.message || 'Upload URL failed')
    // Public-ish read URL via signed 10y URL — bucket is private but any signed-in user (admin/public via signed link) can read.
    const { data: readSigned } = await supabaseAdmin.storage
      .from('company-assets')
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5)
    return {
      uploadUrl: signed.signedUrl,
      token: signed.token,
      path,
      readUrl: readSigned?.signedUrl ?? '',
    }
  })

/** Billing-only: preview the next invoice number without incrementing. */
export const previewNextInvoiceNumber = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertBilling(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data, error } = await (supabaseAdmin.rpc as any)('preview_next_invoice_number')
    if (error) throw new Error(error.message)
    return (data as string) ?? ''
  })

/** Any signed-in user: check whether the caller has billing access. */
export const getBillingAccess = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', context.userId)
    const roles = ((data ?? []) as any[]).map((r) => r.role as string)
    return {
      hasBillingAccess: roles.some((r) => r === 'super_admin' || r === 'admin' || r === 'finance'),
      roles,
    }
  })

/** Billing-only: load full company_profile row (includes PII hidden from public SELECT). */
export const getCompanyProfileFull = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertBilling(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data, error } = await supabaseAdmin
      .from('company_profile' as any).select('*').eq('id', 'main').maybeSingle()
    if (error) throw new Error(error.message)
    return (data ?? null) as CompanyProfile | null
  })

/** Billing-only: mint a short-lived signed URL for a company asset (signature/stamp/logo preview). */
export const getCompanyAssetSignedUrl = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => {
    const r = (raw ?? {}) as { path?: string }
    if (!r.path || typeof r.path !== 'string') throw new Error('path required')
    if (r.path.includes('..')) throw new Error('invalid path')
    return { path: r.path }
  })
  .handler(async ({ context, data }) => {
    await assertBilling(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: signed, error } = await supabaseAdmin.storage
      .from('company-assets').createSignedUrl(data.path, 60 * 10)
    if (error || !signed) throw new Error(error?.message || 'Sign failed')
    return { url: signed.signedUrl }
  })