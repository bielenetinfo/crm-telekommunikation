import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, icon: Icon, trend, trendValue, className, iconBg }) {
  return (
    <Card className={cn("relative overflow-hidden p-6 bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">{title}</p>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend === "up" ? "text-emerald-600" : "text-rose-600"
            )}>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-2xl", iconBg || "bg-slate-100")}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  );
}