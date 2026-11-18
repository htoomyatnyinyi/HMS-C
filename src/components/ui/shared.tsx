import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

/* ─── Spinner ─── */
export const Spinner: React.FC<{ className?: string; size?: number }> = ({
  className,
  size = 20,
}) => (
  <Loader2 size={size} className={cn("animate-spin text-blue-600", className)} />
);

/* ─── Full-area Loading Placeholder ─── */
export const LoadingBlock: React.FC<{ text?: string }> = ({ text = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center gap-3 p-16 text-slate-400 bg-white rounded-xl border border-slate-200">
    <Spinner size={28} />
    <span className="text-xs font-medium">{text}</span>
  </div>
);

/* ─── Empty State ─── */
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-2 p-16 text-center bg-white rounded-xl border border-slate-200 border-dashed">
    {icon && <div className="text-slate-300">{icon}</div>}
    <h4 className="text-sm font-semibold text-slate-600">{title}</h4>
    {description && <p className="text-xs text-slate-400 max-w-xs">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

/* ─── Status Badge ─── */
const badgeVariants: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

export const Badge: React.FC<{
  variant?: keyof typeof badgeVariants;
  children: React.ReactNode;
  className?: string;
}> = ({ variant = "neutral", children, className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
      badgeVariants[variant],
      className,
    )}
  >
    {children}
  </span>
);

/* ─── Page Header ─── */
export const PageHeader: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
}> = ({ title, description, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <div>
      <h2 className="text-lg md:text-xl font-bold text-slate-900">{title}</h2>
      {description && (
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
