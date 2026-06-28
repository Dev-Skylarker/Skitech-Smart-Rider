import { X, AlertTriangle, CheckCircle2, Info, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DialogVariant = "error" | "success" | "confirm" | "info" | "warning";

interface AppDialogProps {
  open: boolean;
  onClose: () => void;
  variant?: DialogVariant;
  title: string;
  message?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  showClose?: boolean;
}

const variantConfig: Record<
  DialogVariant,
  { icon: React.FC<{ className?: string }>; bg: string; iconColor: string; titleColor: string }
> = {
  error: {
    icon: AlertTriangle,
    bg: "bg-red-50 dark:bg-red-950/30",
    iconColor: "text-red-500",
    titleColor: "text-red-700 dark:text-red-400",
  },
  success: {
    icon: CheckCircle2,
    bg: "bg-green-50 dark:bg-green-950/30",
    iconColor: "text-green-500",
    titleColor: "text-green-700 dark:text-green-400",
  },
  confirm: {
    icon: HelpCircle,
    bg: "bg-primary/5",
    iconColor: "text-primary",
    titleColor: "text-foreground",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-500",
    titleColor: "text-blue-700 dark:text-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-500",
    titleColor: "text-amber-700 dark:text-amber-400",
  },
};

export function AppDialog({
  open,
  onClose,
  variant = "info",
  title,
  message,
  children,
  actions,
  showClose = true,
}: AppDialogProps) {
  if (!open) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-md rounded-2xl border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200`}
        style={{ maxWidth: "min(440px, calc(100vw - 2rem))" }}
      >
        {/* Accent top bar */}
        <div className={`h-1 w-full ${
          variant === 'error' ? 'bg-red-500' :
          variant === 'success' ? 'bg-green-500' :
          variant === 'warning' ? 'bg-amber-500' :
          variant === 'confirm' ? 'bg-primary' :
          'bg-blue-500'
        }`} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="dialog-title"
                className={`font-bold text-lg leading-tight ${config.titleColor}`}
              >
                {title}
              </h2>
              {message && (
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {message}
                </p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="flex-shrink-0 rounded-lg p-1 hover:bg-muted transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Custom content */}
          {children && <div className="mb-4">{children}</div>}

          {/* Actions */}
          {actions && <div className="flex flex-wrap gap-2 justify-end">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Preset Dialogs ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmChangesDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirm Changes",
  message = "Are you sure you want to save these changes?",
  confirmLabel = "Confirm Changes",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      variant="confirm"
      title={title}
      message={message}
      actions={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </>
      }
    />
  );
}
