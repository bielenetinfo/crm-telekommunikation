import { cn } from '@/lib/utils';

/**
 * Individual tab item for bottom navigation
 */
export function TabBarItem({ tab, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 px-1 relative transition-colors',
                'min-h-[56px] active:scale-95 transition-transform',
                isActive ? 'text-primary' : 'text-muted-foreground'
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
