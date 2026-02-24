import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

/**
 * Floating Action Button (FAB)
 * Context-sensitive quick action button
 * 
 * @param {Object} props
 * @param {Array} props.actions - Array of action objects { icon, label, onClick }
 * @param {string} props.className - Additional classes
 */
export function FloatingActionButton({ actions = [], className }) {
    const [isOpen, setIsOpen] = useState(false);
    const isMobile = useIsMobile();

    if (!actions || actions.length === 0) {
        return null;
    }

    // Single action: Direct button
    if (actions.length === 1) {
        const Icon = actions[0].icon;
        return (
            <button
                onClick={actions[0].onClick}
                className={cn(
                    'fixed z-40 h-14 w-14 rounded-2xl',
                    'bg-gradient-to-br from-primary to-primary/80',
                    'text-primary-foreground shadow-2xl shadow-primary/30',
                    'flex items-center justify-center',
                    'hover:scale-105 active:scale-95 transition-transform',
                    isMobile ? 'bottom-20 right-4' : 'bottom-8 right-8',
                    className
                )}
            >
                <Icon className="h-6 w-6" />
            </button>
        );
    }

    // Multiple actions: Expandable menu
    return (
        <div className={cn('fixed z-40', isMobile ? 'bottom-20 right-4' : 'bottom-8 right-8', className)}>
            {/* Action Menu */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 space-y-3">
                    {actions.map((action, index) => {
                        const ActionIcon = action.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    action.onClick();
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl',
                                    'glass-card border border-border',
                                    'hover:border-primary hover:bg-primary/10',
                                    'transition-all group whitespace-nowrap'
                                )}
                            >
                                <ActionIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-sm font-semibold text-foreground">{action.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Main FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'h-14 w-14 rounded-2xl',
                    'bg-gradient-to-br from-primary to-primary/80',
                    'text-primary-foreground shadow-2xl shadow-primary/30',
                    'flex items-center justify-center',
                    'hover:scale-105 active:scale-95 transition-all',
                    isOpen && 'rotate-45'
                )}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </button>
        </div>
    );
}
