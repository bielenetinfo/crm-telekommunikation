import { useState, useEffect } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function HeaderClock() {
    // Initialize with null to match server/client hydration, then set in effect
    const [mounted, setMounted] = useState(false);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        setMounted(true);
        // Update every 250ms to ensure "fluent" second changes without jitter or missing a second
        const timer = setInterval(() => {
            setTime(new Date());
        }, 250);
        return () => clearInterval(timer);
    }, []);

    if (!mounted) {
        // Render a static placeholder or basic time to avoid layout shift, 
        // but suppressWarning to allow hydration mismatch if needed.
        // Ideally empty until mounted for perfect match, or static.
        return (
            <div className="flex flex-col items-end leading-tight opacity-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lade...</span>
                <span className="text-sm font-black text-primary tabular-nums tracking-tight font-mono">--:--:--</span>
            </div>
        );
    }

    const dateStr = format(time, 'EEEE, dd.MM.yyyy', { locale: de });
    const timeStr = format(time, 'HH:mm:ss');

    return (
        <div className="flex items-center gap-4 leading-none fade-in">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{dateStr}</span>
            <span className="text-xl font-black text-primary tabular-nums tracking-tight font-mono bg-clip-text text-transparent bg-gradient-to-r from-[#FFD24D] to-[#FFA500] drop-shadow-sm">
                {timeStr}
            </span>
        </div>
    );
}
