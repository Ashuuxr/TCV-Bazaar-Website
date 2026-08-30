import { useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

export function BookingDeleteDialog({
  bookingId,
  customerName,
  busy,
  onClose,
  onConfirm,
}: {
  bookingId: string;
  customerName?: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [typed, setTyped] = useState("");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-booking-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-red-200 bg-[var(--card-bg)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-red-50 p-3 text-red-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2
                id="delete-booking-title"
                className="font-display text-xl font-medium"
              >
                Delete booking?
              </h2>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                {customerName ? `${customerName} · ` : ""}
                {bookingId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-full p-2 text-[var(--ink-soft)] hover:bg-[var(--bg-soft)] disabled:opacity-50"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {step === 1 ? (
          <>
            <p className="mt-5 text-sm leading-relaxed">
              This permanently deletes the booking, removes its uploaded booking
              files through the database cascade, and releases its stall. This
              cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onClose}
                disabled={busy}
                className="rounded-full border border-[var(--line)] px-4 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={busy}
                className="rounded-full bg-red-600 px-4 py-2.5 text-xs font-semibold text-white"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-5 text-sm leading-relaxed">
              Second confirmation: type the complete Booking ID below to enable
              permanent deletion.
            </p>
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={bookingId}
              className="input-lux mt-4"
              autoComplete="off"
              spellCheck={false}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setStep(1)}
                disabled={busy}
                className="rounded-full border border-[var(--line)] px-4 py-2.5 text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => void onConfirm()}
                disabled={busy || typed.trim() !== bookingId}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                {busy ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
