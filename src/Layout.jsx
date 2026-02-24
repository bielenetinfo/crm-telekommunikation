import { Link, useLocation, Outlet } from "react-router-dom";
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
  Bell
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import CommandPalette from "@/components/search/CommandPalette";
import HeaderClock from "@/components/HeaderClock";
import { useAuth } from '@/lib/AuthContext';
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

const NavItem = ({ item, location, isCollapsed }) => {
  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

  const LinkContent = (
    <Link
      to={item.path}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold   group relative overflow-hidden",
        isActive
          ? "bg-primary text-primary-foreground shadow-lg shadow-[#FFC300]/10"
          : "text-muted-foreground hover:bg-white/5 hover:text-white",
        isCollapsed && "justify-center px-2"
      )}
    >
      <item.icon className={cn("h-5 w-5  shrink-0", isActive ? "scale-110" : "")} />
      {!isCollapsed && <span>{item.name}</span>}
      {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20" />}
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

const SidebarContent = ({ location, logout, isCollapsed, toggleCollapse, isMobile }) => (
  <div className={cn("flex flex-col h-full bg-[#0A0A0B] border-r border-white/5  ", isCollapsed ? "w-[80px]" : "w-full")}>
    {/* Logo */}
    <div className={cn("p-6 pb-2", isCollapsed && "p-4 pb-2")}>
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
    <ScrollArea className="flex-1 px-4 py-4">
      <TooltipProvider delayDuration={0}>
        <div className="space-y-6">
          {/* Core */}
          <div className="space-y-1">
            {!isCollapsed && <h4 className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2 fade-in">Hauptmenü</h4>}
            {isCollapsed && <div className="h-4" />} {/* Spacer for alignment */}
            <nav className="space-y-1">
              {navigation.core.map((item) => (
                <NavItem key={item.name} item={item} location={location} isCollapsed={isCollapsed} />
              ))}
            </nav>
          </div>

          {/* Admin */}
          <div className="space-y-1">
            {!isCollapsed && <h4 className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2 fade-in">Verwaltung</h4>}
            <nav className="space-y-1">
              {navigation.admin.map((item) => (
                <NavItem key={item.name} item={item} location={location} isCollapsed={isCollapsed} />
              ))}
            </nav>
          </div>
        </div>
      </TooltipProvider>
    </ScrollArea>

    {/* User Footer & Collapse Toggle */}
    <div className="p-4 border-t border-white/5 bg-white/2 space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className={cn("glass-card rounded-2xl p-3 flex items-center justify-between border-transparent bg-white/5 hover:bg-white/10  cursor-pointer group", isCollapsed && "justify-center p-2")}>
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
          </div>
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
        <Button
          variant="ghost"
          className={cn("w-full flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 h-8", isCollapsed && "h-auto py-2")}
          onClick={toggleCollapse}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      )}
    </div>
  </div>
);

export default function Layout() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background text-foreground overflow-hidden">

        {/* Desktop Sidebar */}
        <aside className={cn("hidden lg:flex flex-col fixed inset-y-0 z-50  ", isCollapsed ? "w-[80px]" : "w-[280px]")}>
          <SidebarContent location={location} logout={logout} isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} isMobile={false} />
        </aside>

        {/* Main Content Wrapper */}
        <div className={cn("flex flex-col flex-1 w-full min-h-screen  ", isCollapsed ? "lg:pl-[80px]" : "lg:pl-[280px]")}>

          {/* Header */}
          <header className="sticky top-0 z-40 h-16 glass border-b border-white/5 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground hover:text-foreground">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[300px] border-r border-white/10 bg-[#0A0A0B]">
                  <SidebarContent location={location} logout={logout} isCollapsed={false} isMobile={true} />
                </SheetContent>
              </Sheet>

              {/* Global Search Trigger */}
              <Button
                variant="outline"
                className="hidden md:flex items-center gap-2 bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 w-96 justify-start rounded-xl h-10  hover:w-[450px]"
                onClick={() => setCommandPaletteOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span className="text-xs font-medium">Globale Kundensuche...</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <HeaderClock className="hidden md:flex text-right" />
              <div className="h-8 w-[1px] bg-white/10 hidden md:block" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                  >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-bold">
                  {theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl block md:hidden"
                    onClick={() => setCommandPaletteOpen(true)}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-bold">
                  Globale Suche (⌘K)
                </TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Page Content */}
          <main className={cn(
            "flex-1   ease-in-out w-full",
            isMobile && "pb-20" // Add bottom padding on mobile for tab bar
          )}>
            <div className="h-full">
              <Outlet />
            </div>
          </main>

        </div>

        {/* Bottom Tab Bar for Mobile */}
        {isMobile && <BottomTabBar />}

        <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}