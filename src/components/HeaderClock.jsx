import { useState, useEffect } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function HeaderClock({ className, inline = true }) {
    // Initialize with null to match server/client hydration, then set in effect
    const [mounted, setMounted] = useState(false);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        setMounted(true);
        let intervalId;
        const syncClock = () => {
            setTime(new Date());
            intervalId = setInterval(() => setTime(new Date()), 1000);
        };

        const msUntilNextSecond = 1000 - (Date.now() % 1000);
        const timeoutId = setTimeout(syncClock, msUntilNextSecond);

        return () => {
            clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    if (!mounted) {
        return (
            <div className={cn("opacity-0", inline ? "w-full flex justify-end" : "flex flex-col items-end leading-tight", className)}>
                {inline ? (
                    <div className="flex flex-col items-end rounded-2xl border border-primary/10 bg-gradient-to-b from-white/5 to-white/[0.02] px-3 py-2 leading-none">
                        <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">Wochentag · 00.00.0000</span>
                        <span className="mt-1 text-base font-black text-primary tabular-nums tracking-tight font-mono whitespace-nowrap">--:--:--</span>
                    </div>
                ) : (
                    <>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lade...</span>
                        <span className="text-sm font-black text-primary tabular-nums tracking-tight font-mono">--:--:--</span>
                    </>
                )}
            </div>
        );
    }

    const weekdayStr = format(time, 'EEEE', { locale: de });
    const dateStr = format(time, 'dd.MM.yyyy', { locale: de });
    const timeStr = format(time, 'HH:mm:ss');

    if (inline) {
        return (
            <div className={cn("w-full flex justify-end fade-in select-none", className)}>
                <div className="inline-flex flex-col items-end rounded-2xl border border-primary/15 bg-gradient-to-b from-white/5 to-white/[0.02] px-3 py-2 lg:px-3.5 lg:py-2.5 text-right shadow-inner">
                    <span className="text-[10px] lg:text-[11px] font-semibold text-muted-foreground whitespace-nowrap capitalize">
                        {weekdayStr} · {dateStr}
                    </span>
                    <span className="mt-1 text-base lg:text-lg font-black text-primary tabular-nums tracking-tight font-mono whitespace-nowrap drop-shadow-[0_0_10px_rgba(255,195,0,0.12)]">
                        {timeStr}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col items-end leading-none fade-in select-none", className)}>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 whitespace-nowrap">{weekdayStr}, {dateStr}</span>
            <span className="text-sm font-semibold text-muted-foreground tabular-nums tracking-tight font-mono whitespace-nowrap">
                {timeStr}
            </span>
        </div>
    );
}
