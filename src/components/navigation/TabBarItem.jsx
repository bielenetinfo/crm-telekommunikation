import { cn } from '@/lib/utils';

/**
 * Individual tab item for bottom navigation
 */
export function TabBarItem({ tab, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 px-1.5 relative rounded-2xl',
                'min-h-[58px] active:scale-95 transition-transform motion-reduce:transition-none motion-reduce:active:scale-100',
                isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
        >
            {/* Icon */}
            <tab.icon className={cn(
                'h-6 w-6 mb-1',
                isActive && 'scale-110'
            )} />

            {/* Label */}
            <span className={cn(
                'text-[10px] font-semibold leading-none',
                isActive && 'text-primary'
            )}>
                {tab.label}
            </span>

            {/* Active indicator */}
            {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-12 bg-primary rounded-full" />
            )}

            {/* Badge (optional - for notifications) */}
            {tab.badge && tab.badge > 0 && (
                <div className="absolute top-1 right-2 h-4 w-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                </div>
            )}
        </button>
    );
}
