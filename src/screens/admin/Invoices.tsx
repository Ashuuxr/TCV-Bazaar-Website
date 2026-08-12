import { Download, FileText, Receipt } from 'lucide-react'
import { ACard } from './ui'
import { inr, useCms } from '@/lib/store'
import type { Booking } from '@/lib/store'
import { generateBookingPdf, type DocKind } from '@/lib/pdfDocs'
import { useInvoiceContext } from '@/hooks/useInvoiceContext'

export default function Invoices() {
  const { bookings, packages, event, site } = useCms()
  const { company, gst } = useInvoiceContext()

  const download = (b: Booking, kind: DocKind) =>
    generateBookingPdf(b, kind, { packages, event, site, company, gst })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium sm:text-3xl">Invoice Manager</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">Generate invoices, GST invoices and receipts for any booking.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bookings.length === 0 && <ACard><p className="py-10 text-center text-sm text-[var(--ink-soft)]">Invoices appear once bookings come in.</p></ACard>}
        {bookings.map((b) => (
          <ACard key={b.id}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-lg font-medium">{b.id}</div>
                <div className="text-xs text-[var(--ink-soft)]">{b.business.brandName} · {inr(b.total)}</div>
                {b.business.gst && <div className="mt-1 rounded-full bg-[var(--bg-soft)] px-2.5 py-0.5 text-[10px] font-semibold text-gold inline-block">GST: {b.business.gst}</div>}
              </div>
              <FileText size={22} className="text-gold" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button onClick={() => download(b, 'invoice')} className="btn-outline-gold flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[10px] font-semibold"><Download size={11} /> Invoice</button>
              <button onClick={() => download(b, 'gst')} className="btn-outline-gold flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[10px] font-semibold"><Download size={11} /> GST</button>
              <button onClick={() => download(b, 'receipt')} className="btn-outline-gold flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[10px] font-semibold"><Receipt size={11} /> Receipt</button>
            </div>
          </ACard>
        ))}
      </div>
    </div>
  )
}
