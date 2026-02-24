import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * KPI Card Component - Dashboard-style stat display
 * 
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {string|number} props.value - Main stat value to display
 * @param {string} props.label - Label for the stat
 * @param {string} [props.color="blue"] - Color theme (blue, green, yellow, purple, rose, etc.)
 * @param {string} [props.trend] - Optional trend indicator (+12%, -5%, etc.)
 * @param {string} [props.className] - Additional CSS classes
 */
export function KpiCard({
    icon: Icon,
    value,
    label,
    color = "blue",
    trend,
    className
}) {
    const colorClasses = {
        blue: "bg-blue-500/10 text-blue-500",
        green: "bg-emerald-500/10 text-emerald-500",
        yellow: "bg-amber-500/10 text-amber-500",
        purple: "bg-purple-500/10 text-purple-500",
        rose: "bg-rose-500/10 text-rose-500",
        cyan: "bg-cyan-500/10 text-cyan-500",
        orange: "bg-orange-500/10 text-orange-500",
        primary: "bg-primary/10 text-primary"
    };

    const trendColorClasses = {
        positive: "text-emerald-500",
        negative: "text-rose-500",
        neutral: "text-muted-foreground"
    };

    const getTrendColor = (trendValue) => {
        if (!trendValue) return "neutral";
        const isPositive = trendValue.startsWith('+') || (!trendValue.startsWith('-') && parseFloat(trendValue) > 0);
        return isPositive ? "positive" : "negative";
    };

    return (
        <Card className={cn("glass-card card-premium p-4 rounded-3xl", className)}>
            <div className="flex items-center gap-3">
                <div className={cn(
                    "p-3 rounded-2xl flex-shrink-0 opacity-70",
                    colorClasses[color] || colorClasses.blue
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-black text-foreground leading-none">
                            {value}
                        </div>
                        {trend && (
                            <div className={cn(
                                "text-xs font-bold",
                                trendColorClasses[getTrendColor(trend)]
                            )}>
                                {trend}
                            </div>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground/70 font-semibold mt-1">
                        {label}
                    </div>
                </div>
            </div>
        </Card>
    );
}
