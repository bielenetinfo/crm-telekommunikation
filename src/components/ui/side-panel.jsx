import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Side Panel - Desktop/tablet slide-in panel
 * Slides in from the right side
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the panel is open
 * @param {function} props.onClose - Close handler
 * @param {React.Node} props.children - Panel content
 * @param {string} props.title - Panel title
 * @param {string} props.width - Panel width (default: 480px)
 */
export function SidePanel({ open, onClose, children, title, width = '480px', className }) {
    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            />

            {/* Panel */}
            <div
                className={cn(
                    'fixed top-0 right-0 bottom-0 z-50',
                    'glass-card border-l border-border',
                    'overflow-hidden flex flex-col transition-transform',
                    className
                )}
                style={{ width }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <h2 className="text-xl font-bold text-foreground">{title}</h2>
                    <button
                        onClick={onClose}
                        className="h-9 w-9 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </>
    );
}
