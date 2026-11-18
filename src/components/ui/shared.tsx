import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

/* ─── Modern Spinner ─── */
export const Spinner: React.FC<{ className?: string; size?: number }> = ({
  className,
  size = 20,
}) => (
  <Loader2
    size={size}
    className={cn("animate-spin text-blue-600", className)}
  />
);

/* ─── Premium Loading Placeholder ─── */
export const LoadingBlock: React.FC<{ text?: string }> = ({
  text = "Loading clinical records…",
}) => (
  <div className="flex flex-col items-center justify-center gap-3.5 p-16 text-slate-400 bg-white/70 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs">
    <div className="p-3 bg-blue-50/80 rounded-2xl">
      <Spinner size={26} />
    </div>
    <span className="text-xs font-semibold text-slate-600 tracking-tight">
      {text}
    </span>
  </div>
);

/* ─── Empty State ─── */
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-2.5 p-14 text-center bg-white rounded-2xl border border-slate-200/80 border-dashed shadow-2xs">
    {icon && (
      <div className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 shadow-3xs mb-1">
        {icon}
      </div>
    )}
    <h4 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h4>
    {description && (
      <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
        {description}
      </p>
    )}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

/* ─── Modern Status Badges ─── */
const badgeVariants: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-3xs",
  warning: "bg-amber-50 text-amber-700 border-amber-200/80 shadow-3xs",
  danger: "bg-rose-50 text-rose-700 border-rose-200/80 shadow-3xs",
  info: "bg-blue-50 text-blue-700 border-blue-200/80 shadow-3xs",
  neutral: "bg-slate-100/80 text-slate-600 border-slate-200/70 shadow-3xs",
};

export const Badge: React.FC<{
  variant?: keyof typeof badgeVariants;
  children: React.ReactNode;
  className?: string;
}> = ({ variant = "neutral", children, className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all",
      badgeVariants[variant],
      className,
    )}
  >
    {children}
  </span>
);

/* ─── Page Header with Breadcrumbs & Action Area ─── */
export const PageHeader: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
}> = ({ title, description, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-slate-200/60">
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight font-sans">
        {title}
      </h2>
      {description && (
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          {description}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex items-center gap-2.5 shrink-0">{actions}</div>
    )}
  </div>
);

/* ─── Stat Card for Clinical Dashboards ─── */
export const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
  onClick?: () => void;
}> = ({
  title,
  value,
  icon,
  trend,
  trendUp,
  colorClass = "text-blue-600 bg-blue-50",
  onClick,
}) => (
  <div
    onClick={onClick}
    className={cn(
      "p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group",
      onClick && "cursor-pointer active:scale-98",
    )}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500 tracking-tight">
        {title}
      </span>
      <div
        className={cn(
          "p-2.5 rounded-xl transition-all group-hover:scale-105",
          colorClass,
        )}
      >
        {icon}
      </div>
    </div>
    <div className="mt-4">
      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
        {value}
      </h3>
      {trend && (
        <p
          className={cn(
            "text-[11px] font-medium mt-1 flex items-center gap-1",
            trendUp ? "text-emerald-600" : "text-slate-400",
          )}
        >
          {trend}
        </p>
      )}
    </div>
  </div>
);
