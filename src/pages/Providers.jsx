import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Phone, Mail, User, Plus, Building2, CheckCircle2, XCircle, X, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { KpiCard } from "@/components/ui/kpi-card";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { canAccessAction, ACTION_PERMISSIONS } from '@/lib/security';
import { useAuth } from '@/lib/AuthContext';

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

const PROVIDER_CATEGORIES = [
  'MOBILFUNK',
  'GLASFASER',
  'DSL',
  'KABEL',
  'TV',
  'BUSINESS',
  'SONSTIGES'
];

export default function Providers() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Dialog State
  const [dialogMode, setDialogMode] = useState(null); // 'create' | 'edit' | null
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    categories: [],
    is_active: true,
    contact_person: '',
    phone: '',
    email: '',
    website: ''
  });

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: () => base44.entities.Provider.list()
  });

  const createProviderMutation = useMutation({
    mutationFn: (data) => base44.entities.Provider.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast({
        title: "Erfolg!",
        description: "Provider wurde erfolgreich erstellt.",
      });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Provider konnte nicht erstellt werden: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const updateProviderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Provider.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast({
        title: "Erfolg!",
        description: "Provider wurde erfolgreich aktualisiert.",
      });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Provider konnte nicht aktualisiert werden: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteProviderMutation = useMutation({
    mutationFn: (id) => base44.entities.Provider.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast({
        title: "Erfolg!",
        description: "Provider wurde erfolgreich gelöscht.",
      });
      setDeleteDialogOpen(null);
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Provider konnte nicht gelöscht werden: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      categories: [],
      is_active: true,
      contact_person: '',
      phone: '',
      email: '',
      website: ''
    });
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedProvider(null);
    resetForm();
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogMode('create');
  };

  const openEditDialog = (provider) => {
    setSelectedProvider(provider);
    setFormData({
      name: provider.name || '',
      categories: provider.categories || [],
      is_active: provider.is_active ?? true,
      contact_person: provider.contact_person || '',
      phone: provider.phone || '',
      email: provider.email || '',
      website: provider.website || ''
    });
    setDialogMode('edit');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Validierungsfehler",
        description: "Provider-Name ist erforderlich.",
        variant: "destructive"
      });
      return;
    }

    if (dialogMode === 'create') {
      createProviderMutation.mutate(formData);
    } else if (dialogMode === 'edit' && selectedProvider) {
      updateProviderMutation.mutate({ id: selectedProvider.id, data: formData });
    }
  };

  const handleDelete = (provider) => {
    setDeleteDialogOpen(provider);
  };

  const confirmDelete = () => {
    if (!canAccessAction(user, ACTION_PERMISSIONS.delete)) {
      toast({ title: 'Fehler', description: 'Keine Berechtigung zum Löschen.', variant: 'destructive' });
      return;
    }
    if (deleteDialogOpen) {
      deleteProviderMutation.mutate(deleteDialogOpen.id);
    }
  };

  const toggleCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const activeProviders = providers.filter(p => p.is_active).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isDialogOpen = dialogMode !== null;
  const isPending = createProviderMutation.isPending || updateProviderMutation.isPending;

  return (
    <div className="space-y-4 px-4 md:px-6 pt-3 md:pt-4 pb-24 w-full max-w-[1600px] text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="app-page-title">
            Provider
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {providers.length} Netzbetreiber & Partner
          </p>
        </div>

        {!isMobile && (
          <Button
            onClick={openCreateDialog}
            disabled={!canAccessAction(user, ACTION_PERMISSIONS.delete)}
            className="btn-premium bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 h-12 shadow-lg shadow-primary/20 text-sm rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Anbieter
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6"
      >
        <motion.div variants={itemVariants}>
          <KpiCard icon={Building2} value={providers.length} label="Gesamt Anbieter" color="blue" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard icon={CheckCircle2} value={activeProviders} label="Aktive Anbieter" color="green" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard icon={XCircle} value={providers.length - activeProviders} label="Inaktiv" color="rose" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard icon={Globe} value={providers.filter(p => p.website).length} label="Mit Webseite" color="cyan" />
        </motion.div>
      </motion.div>

      {/* Provider Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {providers.map((p) => (
          <motion.div variants={itemVariants} key={p.id}>
            <Card
              onClick={() => openEditDialog(p)}
              className="glass-card card-premium overflow-hidden group border-transparent hover:border-primary/20 relative cursor-pointer transition-all"
            >
              <div className="h-1.5 bg-gradient-to-r from-primary via-orange-400 to-primary/50"></div>

              {/* Edit Icon - top right */}
              <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Pencil className="h-4 w-4 text-primary" />
              </div>

              {/* Delete Icon - bottom right */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(p);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl text-foreground font-black tracking-tight group-hover:text-primary transition-colors">
                      {p.name}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1.5">
                      {p.categories?.map(cat => (
                        <Badge
                          key={cat}
                          variant="outline"
                          className="text-[9px] uppercase tracking-widest font-black border-border text-muted-foreground px-2 py-0"
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "text-[9px] uppercase tracking-widest font-black border-none px-2",
                      p.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}
                  >
                    {p.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-2 text-[13px] font-bold">
                  {p.contact_person && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-6 h-6 rounded bg-secondary/50 flex items-center justify-center">
                        <User className="h-3 w-3" />
                      </div>
                      <span>{p.contact_person}</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    {p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 text-xs bg-secondary/30 hover:bg-primary/10 hover:text-primary py-2 rounded-lg border border-transparent hover:border-primary/20 transition-all"
                      >
                        <Phone className="h-3.5 w-3.5" /> Anrufen
                      </a>
                    )}
                    {p.email && (
                      <a
                        href={`mailto:${p.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 text-xs bg-secondary/30 hover:bg-primary/10 hover:text-primary py-2 rounded-lg border border-transparent hover:border-primary/20 transition-all"
                      >
                        <Mail className="h-3.5 w-3.5" /> Email
                      </a>
                    )}
                    {p.website && (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="h-9 w-9 flex items-center justify-center bg-secondary/30 hover:bg-primary/10 hover:text-primary rounded-lg border border-transparent hover:border-primary/20 transition-all"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Mobile FAB */}
      {isMobile && (
        <FloatingActionButton
          actions={[
            {
              icon: Plus,
              label: "Neuer Anbieter",
              onClick: openCreateDialog
            }
          ]}
        />
      )}

      {/* Create/Edit Dialog - COMPACT LAYOUT */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card card-premium border-primary/20 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-gradient">
                {dialogMode === 'create' ? 'Neuer Anbieter' : 'Provider bearbeiten'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeDialog}
                className="rounded-xl hover:bg-rose-500/10 hover:text-rose-400"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name + Active Toggle - Single Row */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-bold">
                    Provider-Name <span className="text-rose-400">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="z.B. Telekom Deutschland"
                    className="bg-secondary/50 border-border focus:bg-background focus:border-primary/50 h-12"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border h-12">
                  <Label htmlFor="is_active" className="text-sm font-bold cursor-pointer whitespace-nowrap">
                    Aktiv
                  </Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>

              {/* Categories - Compact */}
              <div className="space-y-2">
                <Label className="text-sm font-bold">Kategorien</Label>
                <div className="flex flex-wrap gap-2">
                  {PROVIDER_CATEGORIES.map(cat => (
                    <Badge
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "cursor-pointer text-xs font-bold px-3 py-1.5 rounded-lg transition-all",
                        formData.categories.includes(cat)
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                          : "bg-secondary/30 text-muted-foreground border-border hover:bg-secondary/50"
                      )}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Contact Person */}
              <div className="space-y-2">
                <Label htmlFor="contact_person" className="text-sm font-bold">
                  Ansprechpartner
                </Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="z.B. Partner Sales Team"
                  className="bg-secondary/50 border-border focus:bg-background focus:border-primary/50 h-12"
                />
              </div>

              {/* Phone + Email - 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-bold">
                    Telefon
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+49 800 330 1000"
                    className="bg-secondary/50 border-border focus:bg-background focus:border-primary/50 h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold">
                    E-Mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="partner@provider.de"
                    className="bg-secondary/50 border-border focus:bg-background focus:border-primary/50 h-12"
                  />
                </div>
              </div>

              {/* Website - Full Width */}
              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-bold">
                  Webseite
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://www.provider.de"
                  className="bg-secondary/50 border-border focus:bg-background focus:border-primary/50 h-12"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  className="flex-1 h-12 rounded-xl font-bold"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 btn-premium bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                >
                  {isPending
                    ? 'Wird gespeichert...'
                    : dialogMode === 'create' ? 'Provider erstellen' : 'Änderungen speichern'
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen !== null} onOpenChange={() => setDeleteDialogOpen(null)}>
        <AlertDialogContent className="glass-card border-primary/20 rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">
              Provider löschen?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Möchten Sie <span className="font-bold text-foreground">"{deleteDialogOpen?.name}"</span> wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel
              onClick={() => setDeleteDialogOpen(null)}
              className="flex-1 h-12 rounded-xl font-bold"
            >
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteProviderMutation.isPending}
              className="flex-1 h-12 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white"
            >
              {deleteProviderMutation.isPending ? 'Wird gelöscht...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}