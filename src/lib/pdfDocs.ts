import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { OFFICIAL_LOGO_URL } from './store'
import type { Booking, Pkg, EventInfo, SiteContent, BrandAssets } from './store'
import { useCms } from './store'
import type { CompanyProfile, GstSettings } from './company.functions'

export type DocKind = 'invoice' | 'gst' | 'receipt'

interface Ctx {
  packages: Pkg[]
  event: EventInfo
  site: SiteContent
  /** Optional — falls back to the current CMS brand at generation time. */
  brand?: BrandAssets
  /** Optional — when present, overrides company/GST fields on the document. */
  company?: CompanyProfile
  gst?: GstSettings
}

const inr = (n: number) =>
  'Rs. ' + Math.round(n || 0).toLocaleString('en-IN')

const META: Record<DocKind, { title: string; prefix: string; file: string }> = {
  invoice: { title: 'TAX INVOICE', prefix: 'INV', file: 'Invoice' },
  gst: { title: 'GST INVOICE', prefix: 'GST', file: 'GST-Invoice' },
  receipt: { title: 'PAYMENT RECEIPT', prefix: 'RCP', file: 'Receipt' },
}

function invoiceNumber(b: Booking, kind: DocKind) {
  const created = new Date(b.createdAt)
  const y = created.getFullYear()
  const m = String(created.getMonth() + 1).padStart(2, '0')
  const idPart = b.id.replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase()
  return `${META[kind].prefix}/${y}${m}/${idPart}`
}

async function imageUrlToDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url
  const response = await fetch(url, { cache: 'force-cache' })
  if (!response.ok) throw new Error(`Logo request failed: ${response.status}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  const mime = response.headers.get('content-type') || 'image/png'
  return `data:${mime};base64,${btoa(binary)}`
}

async function drawQr(doc: jsPDF, value: string, x: number, y: number, size: number) {
  const dataUrl = await QRCode.toDataURL(value, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 512,
    color: { dark: '#17130c', light: '#ffffff' },
  })
  doc.addImage(dataUrl, 'PNG', x, y, size, size, undefined, 'FAST')
}

export async function generateBookingPdf(booking: Booking, kind: DocKind, ctx: Ctx) {
  // iOS Safari does not reliably honor jsPDF.save() after an awaited operation.
  // Open a user-initiated tab synchronously, then navigate it to the generated blob.
  const isIosSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const handoff = isIosSafari ? window.open('', '_blank') : null
  const { packages, event, site } = ctx
  const brand = ctx.brand ?? useCms.getState().brand
  const company = ctx.company
  const gstSettings = ctx.gst
  const pkg = packages.find((p) => p.id === booking.pkgId)
  const meta = META[kind]
  // Prefer the server-issued invoice number stored on the booking; fall back to derived.
  const bookingInvNo = (booking as unknown as { invoice_number?: string }).invoice_number
  const invNo = bookingInvNo || invoiceNumber(booking, kind)

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 40
  const GOLD: [number, number, number] = [185, 138, 47]
  const INK: [number, number, number] = [23, 19, 12]
  const SOFT: [number, number, number] = [92, 85, 74]
  const LINE: [number, number, number] = [231, 221, 204]

  // Header band
  doc.setFillColor(...INK)
  doc.rect(0, 0, W, 90, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(0, 90, W, 3, 'F')

  // Embed the exact official logo in the PDF. Remote CMS logos are fetched client-side
  // first; the supplied local asset remains the reliable fallback.
  const rawLogo = brand?.logoDark || brand?.logoLight || OFFICIAL_LOGO_URL
  let logoData = ''
  try {
    logoData = await imageUrlToDataUrl(rawLogo)
  } catch {
    try { logoData = await imageUrlToDataUrl(OFFICIAL_LOGO_URL) } catch { /* wordmark fallback */ }
  }
  if (logoData) {
    try {
      const match = /^data:image\/(png|jpe?g|webp)/i.exec(logoData)?.[1]?.toUpperCase()
      const fmt = match === 'JPG' ? 'JPEG' : (match || 'PNG')
      doc.addImage(logoData, fmt, M, 20, 52, 52, undefined, 'FAST')
    } catch { /* ignore malformed image */ }
  }
  const brandX = logoData ? M + 62 : M
  doc.setTextColor(...GOLD)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  const brandTitle = company?.business_name || company?.legal_name || site.name || 'TCV Bazaar'
  doc.text(brandTitle, brandX, 42)
  doc.setTextColor(240, 232, 214)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(site.tagline || 'A Curated Luxury Marketplace', brandX, 58)
  doc.setFontSize(8)
  const headerAddress = company
    ? [company.address_line1, company.city, company.state, company.pincode].filter(Boolean).join(', ')
    : (site.contact.address || '')
  doc.text(headerAddress, brandX, 72, { maxWidth: W / 2 - M - (logoData ? 62 : 0) })

  // Doc title
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(meta.title, W - M, 42, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`No: ${invNo}`, W - M, 58, { align: 'right' })
  const dateLabel = kind === 'receipt' ? 'Receipt Date' : 'Invoice Date'
  doc.text(`${dateLabel}: ${new Date().toLocaleDateString('en-IN')}`, W - M, 72, { align: 'right' })

  // Booking id strip
  let y = 115
  doc.setFillColor(250, 245, 232)
  doc.rect(M, y, W - M * 2, 46, 'F')
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.8)
  doc.rect(M, y, W - M * 2, 46)
  doc.setTextColor(...SOFT)
  doc.setFontSize(8)
  doc.text('BOOKING ID', M + 12, y + 16)
  doc.text('EVENT', M + 170, y + 16)
  doc.text('STATUS', W - M - 90, y + 16)
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(booking.id, M + 12, y + 34)
  doc.setFontSize(10)
  doc.text(booking.eventName || event.name, M + 170, y + 34, { maxWidth: 260 })
  doc.setTextColor(...GOLD)
  doc.text(String(booking.payStatus).toUpperCase(), W - M - 90, y + 34)

  // Two-column: Billed To / Event details
  y = 185
  doc.setTextColor(...GOLD)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('BILLED TO', M, y)
  doc.text('EVENT DETAILS', W / 2 + 10, y)

  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const b = booking.business
  const billed = [
    `${b.businessName || ''}${b.brandName ? ` (${b.brandName})` : ''}`,
    `Owner: ${b.ownerName || '-'}`,
    `Phone: ${b.phone || '-'}${b.altPhone ? ` / ${b.altPhone}` : ''}`,
    `Email: ${b.email || '-'}`,
    b.gst ? `GSTIN: ${b.gst}` : 'GSTIN: Not provided',
    `${b.address || ''}`,
    `${[b.city, b.state, b.pincode].filter(Boolean).join(', ')}`,
  ]
  let ly = y + 16
  billed.forEach((line) => {
    if (!line || line === ', ') return
    doc.text(line, M, ly, { maxWidth: W / 2 - M - 10 })
    ly += 13
  })

  const eventLines = [
    booking.eventName || event.name,
    `${event.datesLabel}`,
    `${event.venue}, ${event.city}`,
    `Stall: ${booking.stallId}`,
    `Package: ${pkg?.name || '-'}`,
    `Package Size: ${pkg?.size || '-'}`,
    `Payment: ${booking.payType === 'full' ? 'Full Payment' : '50% Advance'}`,
  ]
  let ry = y + 16
  eventLines.forEach((line) => {
    doc.text(line, W / 2 + 10, ry, { maxWidth: W / 2 - M - 10 })
    ry += 13
  })

  y = Math.max(ly, ry) + 14

  // Line items table
  doc.setFillColor(...INK)
  doc.rect(M, y, W - M * 2, 22, 'F')
  doc.setTextColor(...GOLD)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('DESCRIPTION', M + 10, y + 15)
  doc.text('AMOUNT (INR)', W - M - 10, y + 15, { align: 'right' })
  y += 22

  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  const subtotal = Number(booking.subtotal ?? booking.total) || 0
  const gstAmount = Number(booking.gstAmount) || 0
  const taxMode = gstSettings?.tax_mode ?? 'cgst_sgst'
  const gstRatePct = Math.round((booking.gstRate ?? gstSettings?.default_rate ?? 18) * (booking.gstRate && booking.gstRate < 1 ? 100 : 1))
  const showGstBreakdown = kind === 'gst'
  const cgst = gstAmount / 2
  const sgst = gstAmount / 2

  const row = (label: string, value: string, bold = false) => {
    doc.setDrawColor(...LINE)
    doc.line(M, y, W - M, y)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(label, M + 10, y + 16, { maxWidth: W - M * 2 - 130 })
    doc.text(value, W - M - 10, y + 16, { align: 'right' })
    y += 24
  }

  row(`${pkg?.name || 'Stall Package'} — Stall ${booking.stallId}`, inr(subtotal))
  if (showGstBreakdown) {
    if (gstAmount > 0) {
      if (taxMode === 'igst') {
        row(`IGST @ ${gstRatePct}%`, inr(gstAmount))
      } else {
        const half = gstRatePct / 2
        row(`CGST @ ${half}%`, inr(cgst))
        row(`SGST @ ${half}%`, inr(sgst))
      }
    } else {
      row(`GST @ ${gstRatePct}%`, inr(0))
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...SOFT)
      doc.text('GST not charged: a valid 15-character GSTIN was not recorded for this booking.', M + 10, y + 13, { maxWidth: W - M * 2 })
      y += 14
    }
  } else if (gstAmount > 0) {
    row(`GST @ ${gstRatePct}%${b.gst ? ` (GSTIN ${b.gst})` : ''}`, inr(gstAmount))
  }

  // Totals
  doc.setDrawColor(...INK)
  doc.setLineWidth(1)
  doc.line(M, y, W - M, y)
  y += 4
  doc.setFillColor(250, 245, 232)
  doc.rect(M, y, W - M * 2, 26, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text('TOTAL', M + 10, y + 17)
  doc.text(inr(booking.total), W - M - 10, y + 17, { align: 'right' })
  y += 34

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...SOFT)
  const paidLine = `Amount Paid (${booking.payType === 'full' ? 'Full' : 'Advance'})${booking.utr ? ` — UTR ${booking.utr}` : ''}`
  doc.text(paidLine, M + 10, y, { maxWidth: W - M * 2 - 130 })
  doc.setTextColor(0, 130, 60)
  doc.text(`- ${inr(booking.paid)}`, W - M - 10, y, { align: 'right' })
  y += 18
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...INK)
  doc.text('Balance Due', M + 10, y)
  doc.setTextColor(booking.balance > 0 ? 200 : 0, booking.balance > 0 ? 90 : 130, booking.balance > 0 ? 20 : 60)
  doc.text(inr(booking.balance), W - M - 10, y, { align: 'right' })
  y += 26

  // Payment meta
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...SOFT)
  const metaLines = [
    `Payment Method: ${booking.method?.toUpperCase() || '-'}`,
    `Payment Status: ${String(booking.payStatus).toUpperCase()}`,
    booking.utr ? `UTR / Transaction ID: ${booking.utr}` : '',
    booking.txnId ? `Reference: ${booking.txnId}` : '',
  ].filter(Boolean)
  metaLines.forEach((l) => { doc.text(l, M, y); y += 12 })
  y += 6

  // QR + organizer + signatory
  const qrSize = 90
  const qrY = Math.min(y, H - 200)
  const verificationUrl = new URL('/portal', window.location.origin)
  verificationUrl.searchParams.set('booking', booking.id)
  await drawQr(doc, verificationUrl.toString(), M, qrY, qrSize)
  doc.setFontSize(8)
  doc.setTextColor(...SOFT)
  doc.text('Scan to verify booking', M, qrY + qrSize + 12)

  const orgX = M + qrSize + 24
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...GOLD)
  doc.text('ORGANIZER', orgX, qrY + 12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...INK)
  doc.setFontSize(9)
  const orgLines = (company
    ? [
        company.legal_name || company.business_name,
        [company.address_line1, company.address_line2].filter(Boolean).join(', '),
        [company.city, company.state, company.pincode].filter(Boolean).join(', '),
        [company.mobile, company.email].filter(Boolean).join(' · '),
        company.gstin ? `GSTIN: ${company.gstin}` : '',
        company.pan ? `PAN: ${company.pan}` : '',
      ]
    : [
        site.name,
        site.contact.address,
        site.contact.phones.join(' · '),
        site.contact.email,
      ]
  ).filter(Boolean) as string[]
  let oy = qrY + 26
  orgLines.forEach((l) => { doc.text(l, orgX, oy, { maxWidth: W / 2 - 20 }); oy += 12 })

  // Signatory
  doc.setDrawColor(...INK)
  doc.setLineWidth(0.5)
  doc.line(W - M - 140, qrY + qrSize - 20, W - M, qrY + qrSize - 20)
  doc.setFontSize(9)
  doc.setTextColor(...SOFT)
  doc.text('Authorised Signatory', W - M - 70, qrY + qrSize - 6, { align: 'center' })

  // Footer: terms
  const termsY = H - 90
  doc.setDrawColor(...LINE)
  doc.line(M, termsY - 8, W - M, termsY - 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...GOLD)
  doc.text('TERMS & CONDITIONS', M, termsY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...SOFT)
  doc.setFontSize(7.5)
  const terms = [
    '1. Booking is confirmed only after payment verification by the organizer.',
    '2. Advance payments must be cleared before the event start date; otherwise the stall may be reallocated.',
    '3. Cancellation and refund are governed by the published Refund Policy on our website.',
    `4. GST is charged at ${gstRatePct}% as per current tax settings when applicable.`,
    '5. This is a computer-generated document and does not require a physical signature.',
  ]
  let ty = termsY + 12
  terms.forEach((t) => { doc.text(t, M, ty, { maxWidth: W - M * 2 }); ty += 10 })

  // Use a Blob URL instead of jsPDF.save(). This works in iOS Safari where
  // an async-generated anchor download is commonly ignored by the browser.
  const filename = `TCV-${meta.file}-${booking.id}.pdf`
  const blob = doc.output('blob')
  const blobUrl = URL.createObjectURL(blob)

  if (handoff && !handoff.closed) {
    handoff.document.title = filename
    handoff.location.href = blobUrl
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
    return
  }

  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
}