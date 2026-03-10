import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Shield, UserPlus, MoreHorizontal, CheckCircle2, Users as UsersIcon, User } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { KpiCard } from "@/components/ui/kpi-card";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Users() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="app-page-shell">
      {/* Header - Dashboard Pattern */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="app-page-title">
            Benutzer
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {users.length} Teammitglieder
          </p>
        </div>

        {/* Desktop: Button - Mobile: FAB */}
        {!isMobile && (
          <Button
            onClick={() => navigate(`${createPageUrl('UserDetail')}?new=true`)}
            className="btn-premium bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 h-12 shadow-lg shadow-primary/20 text-sm rounded-xl"
          >
            <UserPlus className="h-4 w-4 mr-2" /> Neuer Benutzer
          </Button>
        )}
      </div>

      {/* KPI Cards Row - Right after header like other pages */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <motion.div variants={itemVariants}>
          <KpiCard
            icon={UsersIcon}
            value={users.length}
            label="Team-Mitglieder"
            color="blue"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            icon={Shield}
            value={users.filter(u => u.role === 'admin').length}
            label="Administratoren"
            color="purple"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            icon={User}
            value={users.filter(u => u.role === 'user').length}
            label="Benutzer"
            color="cyan"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            icon={UserPlus}
            value="-"
            label="Einladungen offen"
            color="green"
          />
        </motion.div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 2xl:grid-cols-2 gap-3"
      >
        {users.map((u) => (
          <motion.div variants={itemVariants} key={u.id}>
            <Card className="glass-card card-premium transition-all group border-transparent hover:border-primary/20">
              <CardContent className="p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                  <div className="h-14 w-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground font-black text-xl shadow-sm group-hover:scale-105 transition-transform duration-500 relative">
                    {u.name?.charAt(0) || u.email?.charAt(0).toUpperCase()}
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-card"></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-black text-foreground tracking-tight">{u.name || 'Benutzer'}</h3>
                      <Badge className={cn(
                        "text-[9px] px-2 py-0.5 uppercase tracking-widest font-black border-none shadow-sm",
                        u.role === 'admin'
                          ? "bg-primary/10 text-primary"
                          : "bg-blue-500/10 text-blue-500"
                      )}>
                        {u.role || 'user'}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1.5 hover:text-foreground transition-colors"><Mail className="h-3.5 w-3.5 opacity-70" /> {u.email}</span>
                      <span className="hidden sm:inline text-border">•</span>
                      <span className="flex items-center gap-1.5 text-emerald-500"><CheckCircle2 className="h-3.5 w-3.5" /> Aktiv</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6 pl-[4.5rem] sm:pl-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Beigetreten</p>
                    <p className="text-xs font-mono font-bold text-foreground">{u.created_at ? format(new Date(u.created_at), 'dd.MM.yyyy', { locale: de }) : '---'}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/20 flex gap-4 mt-8"
      >
        <div className="p-3 bg-blue-500/10 rounded-2xl h-fit">
          <Shield className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h4 className="text-blue-600 dark:text-blue-400 font-black text-sm mb-1 uppercase tracking-wide">Rollen & Rechte System</h4>
          <p className="text-xs font-medium text-muted-foreground max-w-3xl leading-relaxed">
            <strong className="text-foreground">Administratoren</strong> haben Vollzugriff auf alle Filialen, Backups und Systemeinstellungen. <br />
            <strong className="text-foreground">Standard-Benutzer</strong> sehen ausschließlich Kunden und Verträge ihrer zugewiesenen Filiale sowie ihre persönlichen Aufgaben und Wiedervorlagen.
          </p>
        </div>
      </motion.div>

      {/* Mobile: FAB */}
      {isMobile && (
        <FloatingActionButton
          actions={[
            {
              icon: UserPlus,
              label: 'Benutzer einladen',
              onClick: () => { } // Add invite logic
            }
          ]}
        />
      )}
    </div>
  );
}