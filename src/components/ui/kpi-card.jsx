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
 * @param {function} [props.onClick] - Optional click handler
 */
export function KpiCard({
    icon: Icon,
    value,
    label,
    color = "blue",
    trend,
    className,
    onClick
}) {
    const colorConfigs = {
        blue: {
            text: "text-blue-500",
            iconText: "text-blue-400",
            bg: "from-blue-500/20 to-blue-500/5",
            border: "border-blue-500/20",
            shadow: "group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
        },
        green: {
            text: "text-emerald-500",
            iconText: "text-emerald-400",
            bg: "from-emerald-500/20 to-emerald-500/5",
            border: "border-emerald-500/20",
            shadow: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        },
        yellow: {
            text: "text-amber-500",
            iconText: "text-amber-400",
            bg: "from-amber-500/20 to-amber-500/5",
            border: "border-amber-500/20",
            shadow: "group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
        },
        purple: {
            text: "text-purple-500",
            iconText: "text-purple-400",
            bg: "from-purple-500/20 to-purple-500/5",
            border: "border-purple-500/20",
            shadow: "group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
        },
        rose: {
            text: "text-rose-500",
            iconText: "text-rose-400",
            bg: "from-rose-500/20 to-rose-500/5",
            border: "border-rose-500/20",
            shadow: "group-hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]"
        },
        cyan: {
            text: "text-cyan-500",
            iconText: "text-cyan-400",
            bg: "from-cyan-500/20 to-cyan-500/5",
            border: "border-cyan-500/20",
            shadow: "group-hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
        },
        orange: {
            text: "text-orange-500",
            iconText: "text-orange-400",
            bg: "from-orange-500/20 to-orange-500/5",
            border: "border-orange-500/20",
            shadow: "group-hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]"
        },
        primary: {
            text: "text-primary",
            iconText: "text-primary",
            bg: "from-primary/20 to-primary/5",
            border: "border-primary/20",
            shadow: "group-hover:shadow-[0_0_20px_rgba(255,195,0,0.2)]"
        }
    };

    const theme = colorConfigs[color] || colorConfigs.blue;

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
        <Card className={cn(
            "glass-card card-premium p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl group transition-all duration-300 border-white/5 relative overflow-hidden flex flex-col justify-between h-full min-h-[128px] md:min-h-[140px]",
            onClick && "cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-white/10 motion-reduce:transform-none",
            className
        )} onClick={onClick}>
            {/* Top: Icon */}
            <div className={cn(
                "w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-inner border transition-shadow mb-3 md:mb-4",
                theme.bg,
                theme.iconText,
                theme.border,
                onClick && theme.shadow
            )}>
                <Icon className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>

            {/* Bottom: Value & Label */}
            <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-foreground leading-none break-all sm:break-normal">
                        {value}
                    </span>
                    {trend && (
                        <span className={cn(
                            "text-xs font-bold",
                            trendColorClasses[getTrendColor(trend)]
                        )}>
                            {trend}
                        </span>
                    )}
                </div>
                <span className="text-[11px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider opacity-60">
                    {label}
                </span>
            </div>
        </Card>
    );
}
