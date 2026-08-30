import { BadgeCheck, RotateCcw, XCircle } from "lucide-react";
import { ACard, Stat } from "./ui";
import { inr, useCms } from "@/lib/store";
import type { Booking } from "@/lib/store";
import { BadgeIndianRupee, Clock, Wallet } from "lucide-react";

const payLabels: Record<string, string> = {
  pending: "Pending",
  partial: "Partially Paid",
  paid: "Paid",
  refunded: "Refunded",
};

export default function Payments() {
  const { bookings, upsertBooking, log } = useCms();
  const collected = bookings.reduce((a, b) => a + b.paid, 0);
  const outstanding = bookings
    .filter((b) => b.status === "approved" || b.status === "pending")
    .reduce((a, b) => a + b.balance, 0);
  const pendingVer = bookings.filter((b) => b.payStatus === "pending").length;

  const setPay = (b: Booking, payStatus: Booking["payStatus"]) => {
    upsertBooking({ ...b, payStatus });
    log(`Payment ${b.id} → ${payLabels[payStatus]}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium sm:text-3xl">
          Payment Manager
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Verify UTRs, approve or reject payments, track advances and process
          refunds.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Collected"
          value={inr(collected)}
          icon={BadgeIndianRupee}
        />
        <Stat
          label="Outstanding"
          value={inr(outstanding)}
          sub="Balances due"
          icon={Wallet}
        />
        <Stat
          label="Pending Verification"
          value={String(pendingVer)}
          icon={Clock}
        />
      </div>

      <ACard
        title="Payments"
        sub="Advance, full, pending, partial, paid & refunded"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-xs uppercase tracking-wider text-[var(--ink-soft)]">
                <th className="py-3 pr-4">Booking</th>
                <th className="py-3 pr-4">UTR / Txn</th>
                <th className="py-3 pr-4">Plan</th>
                <th className="py-3 pr-4">Paid / Total</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-[var(--ink-soft)]"
                  >
                    No payments yet.
                  </td>
                </tr>
              )}
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-[var(--line)] last:border-0"
                >
                  <td className="py-3.5 pr-4">
                    <div className="font-semibold">{b.id}</div>
                    <div className="text-xs text-[var(--ink-soft)]">
                      {b.business.brandName}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <div className="text-xs">{b.utr}</div>
                    <div className="text-[10px] text-[var(--ink-soft)]">
                      {b.txnId || "—"}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-xs">
                    {b.payType === "full" ? "Full Payment" : "50% Advance"}
                  </td>
                  <td className="py-3.5 pr-4">
                    {inr(b.paid)}{" "}
                    <span className="text-xs text-[var(--ink-soft)]">
                      / {inr(b.total)}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${b.payStatus === "paid" ? "bg-green-500/10 text-green-600" : b.payStatus === "partial" ? "bg-blue-500/10 text-blue-500" : b.payStatus === "refunded" ? "bg-purple-500/10 text-purple-500" : "bg-amber-500/10 text-amber-600"}`}
                    >
                      {payLabels[b.payStatus]}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        title="Approve payment"
                        onClick={() =>
                          setPay(b, b.balance === 0 ? "paid" : "partial")
                        }
                        className="rounded-lg border border-[var(--line)] p-2 text-green-600 hover:border-green-400"
                      >
                        <BadgeCheck size={13} />
                      </button>
                      <button
                        title="Reject payment"
                        onClick={() => setPay(b, "pending")}
                        className="rounded-lg border border-[var(--line)] p-2 text-red-500 hover:border-red-400"
                      >
                        <XCircle size={13} />
                      </button>
                      <button
                        title="Refund"
                        onClick={() => setPay(b, "refunded")}
                        className="rounded-lg border border-[var(--line)] p-2 text-purple-500 hover:border-purple-400"
                      >
                        <RotateCcw size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ACard>
    </div>
  );
}
