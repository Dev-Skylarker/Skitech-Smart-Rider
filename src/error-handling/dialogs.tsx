/**
 * Centralized themed dialog/popup components for error handling and user interactions.
 * All dialogs use the AppDialog base for consistent theming.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AppDialog, ConfirmChangesDialog } from "@/components/ui/AppDialog";

// Re-export ConfirmChangesDialog so it can be imported from this central file
export { ConfirmChangesDialog };
import { Flag } from "lucide-react";
import { sendRiderReport } from "@/lib/emailjs";
import { toast } from "sonner";

// ─── Duplicate Email Dialog ─────────────────────────────────────────────────

interface DuplicateEmailDialogProps {
  open: boolean;
  onClose: () => void;
  onEnterNewEmail: () => void;
  email: string;
}

export function DuplicateEmailDialog({
  open,
  onClose,
  onEnterNewEmail,
  email,
}: DuplicateEmailDialogProps) {
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      variant="warning"
      title="Email Already Registered"
      message={`The email "${email}" is already associated with an account. What would you like to do?`}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕ Close
          </Button>
          <Button variant="outline" size="sm" onClick={onEnterNewEmail}>
            Use Different Email
          </Button>
          <Link to="/login">
            <Button size="sm">Log In Instead</Button>
          </Link>
        </>
      }
    />
  );
}

// ─── Generic Error Dialog ────────────────────────────────────────────────────

interface GenericErrorDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function GenericErrorDialog({
  open,
  onClose,
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
}: GenericErrorDialogProps) {
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      variant="error"
      title={title}
      message={message}
      actions={
        <Button onClick={onClose}>Got it</Button>
      }
    />
  );
}

// ─── Payment Confirmation Dialog ─────────────────────────────────────────────

interface PaymentConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  amount?: number;
}

export function PaymentConfirmDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
  amount = 100,
}: PaymentConfirmDialogProps) {
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      variant="confirm"
      title="Confirm Profile Activation"
    >
      <div className="rounded-xl border bg-muted/40 p-4 mb-2">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-muted-foreground">Profile activation fee</div>
            <div className="text-2xl font-black text-primary">KES {amount}</div>
          </div>
          <div className="text-xs text-muted-foreground text-right max-w-[160px]">
            One-time payment to activate your public profile
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Your profile details will be saved and marked as pending activation.
        The admin will confirm payment and activate your profile.
      </p>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
          Back
        </Button>
        <Button className="flex-1" onClick={onConfirm} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Saving…
            </span>
          ) : (
            `Confirm & Pay KES ${amount}`
          )}
        </Button>
      </div>
    </AppDialog>
  );
}

// ─── Report Rider Dialog ─────────────────────────────────────────────────────

interface ReportRiderDialogProps {
  open: boolean;
  onClose: () => void;
  riderName: string;
  riderPlate: string;
  riderPhone: string;
}

export function ReportRiderDialog({
  open,
  onClose,
  riderName,
  riderPlate,
  riderPhone,
}: ReportRiderDialogProps) {
  const [remarks, setRemarks] = useState("");
  const [sending, setSending] = useState(false);

  async function handleReport() {
    setSending(true);
    const result = await sendRiderReport({
      riderName,
      riderPlate,
      riderPhone,
      remarks,
    });
    setSending(false);
    if (result.success) {
      toast.success("Report submitted. Thank you for keeping riders accountable.");
      setRemarks("");
      onClose();
    } else {
      toast.error("Failed to send report. Please try again.");
    }
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      variant="warning"
      title="Report Rider"
      showClose={true}
    >
      {/* Auto-filled rider info */}
      <div className="rounded-xl border bg-muted/30 p-3 mb-4 text-sm">
        <div className="font-semibold text-foreground mb-1">Rider being reported:</div>
        <div className="text-muted-foreground">
          {riderName} · {riderPlate} · {riderPhone}
        </div>
      </div>

      {/* Remarks input */}
      <div className="mb-1">
        <label className="text-sm font-medium text-foreground block mb-1">
          Remarks / Comments <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={4}
          placeholder="Describe what happened..."
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          maxLength={500}
        />
        <div className="text-xs text-muted-foreground text-right mt-1">
          {remarks.length}/500
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        This report will be sent to Skitech Smart Rider admin. Your identity will be kept anonymous.
      </p>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={handleReport}
          disabled={sending}
          variant="destructive"
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
              Sending…
            </span>
          ) : (
            <>
              <Flag className="h-4 w-4" />
              Report Rider
            </>
          )}
        </Button>
      </div>
    </AppDialog>
  );
}
