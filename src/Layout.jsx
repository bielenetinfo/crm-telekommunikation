import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  RefreshCw,
  Layers,
  CheckSquare,
  Database,
  Building2,
  UserCog,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Search,
  Calendar,
  Bell,
  Plus
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import CommandPalette from "@/components/search/CommandPalette";
import QuickCreateCustomerModal from "@/components/search/QuickCreateCustomerModal";
import HeaderClock from "@/components/HeaderClock";
import { useAuth } from '@/lib/AuthContext';
import { canAccessAction, filterNavigationItems, ACTION_PERMISSIONS } from '@/lib/security';
import { useTheme } from '@/lib/ThemeContext';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { Toaster } from '@/components/ui/toaster';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const SIDEBAR_COLLAPSE_KEY = "bielenet_sidebar_collapsed";

const navigation = {
  core: [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Kunden", icon: Users, path: "/customers" },
    { name: "Verträge", icon: FileText, path: "/contracts" },
    { name: "VVL", icon: RefreshCw, path: "/vvl" },
    { name: "Aufgaben", icon: CheckSquare, path: "/tasks" },
    { name: "Kalender", icon: Calendar, path: "/calendar" },
    { name: "Erinnerungen", icon: Bell, path: "/reminders" },
  ],
  admin: [
    { name: "Provider", icon: Layers, path: "/providers" },
    { name: "Hardware", icon: Database, path: "/hardware" },
    { name: "Backup", icon: Database, path: "/backup" },
    { name: "Filialen", icon: Building2, path: "/branches" },
    { name: "Benutzer", icon: UserCog, path: "/users" },
    { name: "Einstellungen", icon: Settings, path: "/settings" }
  ]
};

import { motion } from "framer-motion";

const NavItem = ({ item, location, isCollapsed }) => {
  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

  const LinkContent = (
    <Link
      to={item.path}
      className={cn(
        "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold group relative overflow-hidden transition-all duration-300 motion-reduce:transition-none min-h-[46px]",
        isActive
          ? "bg-primary text-primary-foreground shadow-lg shadow-[#FFC300]/10"
          : "text-muted-foreground hover:bg-white/5 hover:text-white",
        isCollapsed && "justify-center px-2"
      )}
    >
      {/* Animated active background layoutId */}
      {isActive && (
        <motion.div
          layoutId="activeNavIndicator"
          className="absolute inset-0 bg-primary z-0"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      {/* Icon and Text go above the background */}
      <div className="relative z-10 flex items-center gap-3 w-full">
        <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
        {!isCollapsed && <span>{item.name}</span>}
      </div>

      {/* Right accent line */}
      {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 z-10" />}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {LinkContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="font-bold bg-[#0A0A0B] border-white/10 text-white">
          {item.name}
        </TooltipContent>
      </Tooltip>
    );
  }

  return LinkContent;
};

const SidebarContent = ({ location, logout, isCollapsed, toggleCollapse, isMobile, user }) => (
  <div className={cn("flex flex-col h-full bg-[#0A0A0B] border-r border-white/5", isCollapsed ? "w-[80px]" : "w-full")}>
    {/* Logo */}
    <div className={cn("p-5 lg:p-6 pb-2", isCollapsed && "p-4 pb-2")}>
      <div className={cn("flex items-center gap-3 px-2  ", isCollapsed && "justify-center px-0")}>
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[#FFC300] to-[#FF9500] flex items-center justify-center font-black text-[#0A0A0B] text-xl shadow-lg shadow-[#FFC300]/20">
          B
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-black text-white tracking-tight uppercase truncate">BIELENET</span>
            <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase truncate">CRM System</span>
          </div>
        )}
      </div>
    </div>

    {/* Scrollable Nav */}
    <ScrollArea className="flex-1 px-3 lg:px-4 py-3 lg:py-4">
      <TooltipProvider delayDuration={0}>
        <div className="space-y-6">
          {/* Core */}
          <div className="space-y-1">
            {!isCollapsed && <h4 className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2 fade-in">Hauptmenü</h4>}
            {isCollapsed && <div className="h-4" />} {/* Spacer for alignment */}
            <nav className="space-y-1">
              {filterNavigationItems(navigation.core, user).map((item) => (
                <NavItem key={item.name} item={item} location={location} isCollapsed={isCollapsed} />
              ))}
            </nav>
          </div>

          {/* Admin */}
          <div className="space-y-1">
            {!isCollapsed && <h4 className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2 fade-in">Verwaltung</h4>}
            <nav className="space-y-1">
              {filterNavigationItems(navigation.admin, user).map((item) => (
                <NavItem key={item.name} item={item} location={location} isCollapsed={isCollapsed} />
              ))}
            </nav>
          </div>
        </div>
      </TooltipProvider>
    </ScrollArea>

    {/* User Footer & Collapse Toggle */}
    <div className="p-3 lg:p-4 border-t border-white/5 bg-white/2 space-y-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn("w-full glass-card rounded-2xl p-3 flex items-center justify-between border-transparent bg-white/5 hover:bg-white/10 cursor-pointer group text-left", isCollapsed && "justify-center p-2")}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                <UserCog className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 text-left">
                  <p className="text-xs font-black text-white truncate uppercase tracking-widest">Admin</p>
                  <p className="text-[10px] text-emerald-500 font-bold truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 " />
                    Online
                  </p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-white" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side={isCollapsed ? "right" : "top"} align="end" className="w-56 bg-[#0A0A0B] border-white/10 text-white font-medium" sideOffset={10}>
          <Link to="/settings">
            <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white">
              <UserCog className="mr-2 h-4 w-4" />
              <span>Mein Profil</span>
            </DropdownMenuItem>
          </Link>
          <Link to="/settings">
            <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white">
              <Settings className="mr-2 h-4 w-4" />
              <span>Einstellungen</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem className="cursor-pointer text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10 hover:text-rose-400 focus:text-rose-400" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Abmelden</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {!isMobile && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn("w-full flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 h-8", isCollapsed && "h-auto py-2")}
              onClick={toggleCollapse}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-bold bg-[#0A0A0B] border-white/10 text-white">
            {isCollapsed ? 'Menü ausklappen' : 'Menü einklappen'}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  </div>
);

export default function Layout() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickCreateCustomerOpen, setQuickCreateCustomerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, isCollapsed ? "1" : "0");
  }, [isCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) !== null) return;
    const handleResize = () => {
      if (window.innerWidth >= 1024 && window.innerWidth < 1280) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background text-foreground overflow-hidden">

        {/* Desktop Sidebar */}
        <aside className={cn("hidden lg:flex flex-col fixed inset-y-0 z-50 transition-[width] duration-300 motion-reduce:transition-none", isCollapsed ? "w-[80px]" : "w-[280px]")}>
          <SidebarContent location={location} logout={logout} isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} isMobile={false} user={user} />
        </aside>

        {/* Main Content Wrapper */}
        <div className={cn("flex flex-col flex-1 w-full min-h-screen transition-[padding] duration-300 motion-reduce:transition-none", isCollapsed ? "lg:pl-[80px]" : "lg:pl-[280px]")}>

          {/* Header */}
          <header className="sticky top-0 z-40 glass border-b border-white/5 px-3 sm:px-4 md:px-6 lg:px-8 py-3 min-h-[72px]">
            <div className="w-full max-w-[1480px] 2xl:max-w-[1520px] mx-auto flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground hover:text-foreground -ml-1 rounded-xl shrink-0" aria-label="Menü öffnen">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-[min(92vw,360px)] border-r border-white/10 bg-[#0A0A0B]">
                    <SidebarContent location={location} logout={logout} isCollapsed={false} isMobile={true} user={user} />
                  </SheetContent>
                </Sheet>

                {/* Global Search Trigger */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="hidden md:flex items-center gap-2 bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 justify-start rounded-2xl h-10 lg:h-11 transition-all motion-reduce:transition-none min-w-0 w-[clamp(12rem,30vw,18rem)] lg:w-[clamp(13rem,23vw,19rem)] xl:w-[clamp(15rem,24vw,22rem)] 2xl:w-[clamp(16rem,26vw,26rem)]"
                      onClick={() => setCommandPaletteOpen(true)}
                    >
                      <Search className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium truncate">
                        Globale Suche
                        <span className="hidden 2xl:inline text-muted-foreground/80">, Kunden, Verträge, Aktionen…</span>
                      </span>
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 hidden 2xl:inline">⌘K</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-bold flex items-center gap-2">
                    Suchen
                    <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white/70">
                      ⌘K
                    </kbd>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 shrink-0 ml-auto min-w-0">
                <div className="flex items-center gap-1 p-1 rounded-2xl border border-white/5 bg-white/[0.02] shadow-inner">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl block md:hidden h-9 w-9"
                        onClick={() => setCommandPaletteOpen(true)}
                        aria-label="Suche öffnen"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-bold">
                      Globale Suche (⌘K)
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl h-9 w-9"
                        aria-label={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
                      >
                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-bold">
                      {theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Primary CTA (Level 2) - Unified Create Component */}
                {!isMobile && (
                  <div className="hidden md:flex items-center gap-1 p-1 rounded-2xl border border-white/5 bg-white/[0.02] shadow-inner">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="btn-premium bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-3 xl:px-4 h-9 lg:h-10 shadow-lg shadow-primary/20 text-sm rounded-xl"
                        >
                          <Plus className="h-4 w-4 xl:mr-2" />
                          <span className="hidden xl:inline">Neu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-[#0A0A0B] border-white/10 text-foreground font-medium" sideOffset={8}>
                        <DropdownMenuItem onClick={() => navigate('/customers?new=true')} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 py-3">
                          <Users className="mr-2 h-4 w-4 text-blue-400" />
                          <span>Neuer Kunde</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/contracts?new=true')} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 py-3">
                          <FileText className="mr-2 h-4 w-4 text-primary" />
                          <span>Neuer Vertrag</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/tasks')} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 py-3">
                          <CheckSquare className="mr-2 h-4 w-4 text-rose-400" />
                          <span>Neue Aufgabe</span>
                        </DropdownMenuItem>
                        {canAccessAction(user, ACTION_PERMISSIONS.userManagement) && (
                          <DropdownMenuItem onClick={() => navigate('/users/detail?new=true')} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 py-3">
                            <UserCog className="mr-2 h-4 w-4 text-blue-400" />
                            <span>Neuer Benutzer</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                <div className="hidden lg:flex items-center justify-end min-w-[220px] xl:min-w-[250px] 2xl:min-w-[280px] text-right">
                  <HeaderClock inline className="w-full" />
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className={cn(
            "app-shell-main flex-1 ease-in-out w-full",
            isMobile && "pb-20" // Add bottom padding on mobile for tab bar
          )}>
            <div className="app-page-wrap h-full w-full max-w-[1480px] 2xl:max-w-[1520px] mx-auto">
              <Outlet />
            </div>
          </main>

        </div>

        {/* Bottom Tab Bar for Mobile */}
        {isMobile && <BottomTabBar />}

        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
          onOpenQuickCreateCustomer={() => setQuickCreateCustomerOpen(true)}
        />
        <QuickCreateCustomerModal
          open={quickCreateCustomerOpen}
          onOpenChange={setQuickCreateCustomerOpen}
          onSuccess={(customer) => {
            navigate(`/customers/${customer.id}`);
            setQuickCreateCustomerOpen(false);
          }}
        />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
