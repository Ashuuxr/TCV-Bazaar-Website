import { Download, FileSpreadsheet } from "lucide-react";
import { ACard } from "./ui";
import { inr, useCms } from "@/lib/store";

export default function Reports() {
  const { bookings, packages, stalls } = useCms();

  const exportCsv = (name: string, rows: string[][]) => {
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = name;
    a.click();
  };

  const cards = [
    {
      t: "Bookings Report",
      d: `${bookings.length} bookings with customer, stall & payment status`,
      fn: () =>
        exportCsv("tcv-bookings.csv", [
          [
            "Booking ID",
            "Date",
            "Brand",
            "Owner",
            "Phone",
            "Stall",
            "Package",
            "Total",
            "Paid",
            "Balance",
            "Status",
            "Payment",
          ],
          ...bookings.map((b) => [
            b.id,
            new Date(b.createdAt).toLocaleDateString("en-IN"),
            b.business.brandName ?? "",
            b.business.ownerName ?? "",
            b.business.phone ?? "",
            b.stallId,
            packages.find((p) => p.id === b.pkgId)?.name ?? "",
            String(b.total),
            String(b.paid),
            String(b.balance),
            b.status,
            b.payStatus,
          ]),
        ]),
    },
    {
      t: "Stall Inventory Report",
      d: `${stalls.length} stalls across all zones with status`,
      fn: () =>
        exportCsv("tcv-stalls.csv", [
          ["Stall", "Zone", "Package", "Status", "Customer"],
          ...stalls.map((s) => [
            s.label,
            s.zone,
            packages.find((p) => p.id === s.pkgId)?.name ?? "",
            s.status,
            s.customer ?? "",
          ]),
        ]),
    },
    {
      t: "Revenue Report",
      d: `${inr(bookings.reduce((a, b) => a + b.paid, 0))} collected so far`,
      fn: () =>
        exportCsv("tcv-revenue.csv", [
          ["Package", "Bookings", "Collected", "Outstanding"],
          ...packages.map((p) => {
            const bs = bookings.filter((b) => b.pkgId === p.id);
            return [
              p.name,
              String(bs.length),
              String(bs.reduce((a, b) => a + b.paid, 0)),
              String(bs.reduce((a, b) => a + b.balance, 0)),
            ];
          }),
        ]),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium sm:text-3xl">
          Reports
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          One-click exports for accounts, ops and sponsors.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((c) => (
          <ACard key={c.t}>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-gold">
              <FileSpreadsheet size={20} />
            </span>
            <h3 className="font-display mt-4 text-lg font-medium">{c.t}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ink-soft)]">
              {c.d}
            </p>
            <button
              onClick={c.fn}
              className="btn-gold mt-5 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold"
            >
              <Download size={13} /> Export CSV (Excel)
            </button>
          </ACard>
        ))}
      </div>
    </div>
  );
}
