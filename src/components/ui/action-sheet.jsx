import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Action Sheet - Bottom sheet for mobile actions
 * Slides up from bottom with backdrop
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the sheet is open
 * @param {function} props.onClose - Close handler
 * @param {React.Node} props.children - Sheet content
 * @param {string} props.title - Optional title
 */
export function ActionSheet({ open, onClose, children, title, className }) {
    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            />

            {/* Sheet */}
            <div
                className={cn(
                    'fixed bottom-0 left-0 right-0 z-50',
                    'glass-card rounded-t-3xl border-t border-border',
                    'max-h-[85vh] overflow-hidden',
                    'pb-safe transition-transform',
                    className
                )}
                style={{
                    paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
                }}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
                </div>

                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 py-3 border-b border-border">
                        <h3 className="text-lg font-bold text-foreground">{title}</h3>
                        <button
                            onClick={onClose}
                            className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
                        >
                            <X className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
                    {children}
                </div>
            </div>
        </>
    );
}
