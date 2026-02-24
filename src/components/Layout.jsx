import { Link, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import {
    LayoutDashboard, Users, FileText,
    RefreshCw, CheckSquare, Server, Database, Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Input } from './ui/input';

const NavItem = ({ to, icon: Icon, label, disabled }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:bg-card-hover hover:text-text-main",
                disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
        >
            <Icon size={18} className={cn(" transition-transform", isActive && "text-primary")} />
            <span>{label}</span>
            {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-primary" />}
        </Link>
    );
};

const Layout = () => {
    return (
        <div className="flex min-h-screen bg-background text-text-main font-sans selection:bg-primary/30">
            {/* Sidebar */}
            <aside className="w-[260px] fixed h-screen border-r border-border bg-card flex flex-col z-50">

                {/* Brand */}
                <div className="h-[70px] flex items-center px-6 border-b border-border gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-black font-bold text-lg">
                        B
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg leading-none tracking-tight">BIELENET</span>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">System</span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 py-6 px-3 overflow-y-auto space-y-6 scrollbar-hide">

                    <div>
                        <div className="px-4 text-[10px] uppercase tracking-widest text-text-dim font-bold mb-2">Main Menu</div>
                        <div className="space-y-1">
                            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                            <NavItem to="/customers" icon={Users} label="Kunden" />
                            <NavItem to="/contracts" icon={FileText} label="Verträge" />
                            <NavItem to="/vvl" icon={RefreshCw} label="VVL Pipeline" />
                        </div>
                    </div>

                    <div>
                        <div className="px-4 text-[10px] uppercase tracking-widest text-text-dim font-bold mb-2">System</div>
                        <div className="space-y-1">
                            <NavItem to="/tasks" icon={CheckSquare} label="Aufgaben" />
                            <NavItem to="/providers" icon={Server} label="Provider" />
                            <NavItem to="/backup" icon={Database} label="Backup" />
                        </div>
                    </div>

                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-card-hover cursor-pointer transition-colors">
                        <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-primary font-bold">
                            CA
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold truncate">Can Arslan</span>
                            <span className="text-xs text-text-dim">Admin</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-[260px] flex flex-col min-h-screen">

                {/* Header */}
                <header className="h-[70px] sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4 w-1/3">
                        <div className="relative w-full max-w-md group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                            <Input
                                placeholder="Suche (cmd+k)..."
                                className="pl-10 bg-card/50 border-input-border text-sm"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-card px-1.5 font-mono text-[10px] font-medium text-text-muted opacity-100">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-xs font-mono text-text-dim px-3 py-1 bg-card rounded border border-border">
                            {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-8 flex-1 overflow-x-hidden">
                    <Outlet />
                </div>

            </main>
        </div>
    );
};

export default Layout;
