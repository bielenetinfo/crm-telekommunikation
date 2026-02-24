import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, User, Plus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Branches() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => base44.entities.Branch.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Branch.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({ title: "Erfolg", description: "Filiale wurde gelöscht." });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4 md:px-8 pt-3 md:pt-4 pb-24 w-full text-foreground">
      {/* Header - Dashboard Pattern */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient">
            Filialen
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {branches.length} BIELENET Standorte
          </p>
        </div>
        <Button
          onClick={() => navigate(`${createPageUrl('BranchDetail')}?new=true`)}
          className="btn-premium bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 h-12 shadow-lg shadow-primary/20 text-sm rounded-xl"
        >
          <Plus className="h-4 w-4 mr-2" /> Neue Filiale
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {branches.map((b) => (
          <Card key={b.id} className="glass-card card-premium transition-all overflow-hidden border-transparent hover:border-primary/20 group relative">
            <div className="h-1.5 bg-gradient-to-r from-primary via-orange-400 to-primary/50"></div>

            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`${createPageUrl('BranchDetail')}?id=${b.id}`)}
                className="h-8 w-8 rounded-lg bg-secondary/50 hover:bg-primary/20 hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-secondary/50 hover:bg-rose-500/20 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#181B21] border-[#2D3139]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Filiale löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Möchten Sie die Filiale "{b.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-secondary">Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate(b.id)}
                      className="bg-rose-600 hover:bg-rose-700"
                    >
                      Löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5  transition-transform duration-500">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-foreground font-black tracking-tight">{b.name}</CardTitle>
                    <span className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-wider">ID: {b.id}</span>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 text-[9px] uppercase tracking-widest font-black shadow-sm h-fit">
                  Aktiv
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm font-medium text-foreground/80">
                    <p>{b.street || 'Musterstraße 123'}</p>
                    <p>{b.postal_code || '33602'} {b.city || 'Bielefeld'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-2">
                  <User className="h-4 w-4 text-primary opacity-70" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filialleiter: <span className="text-foreground">{b.manager || 'Nicht zugewiesen'}</span></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div className="text-center p-3 bg-secondary/50 rounded-2xl border border-border/50">
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1">Mitarbeiter</p>
                  <p className="text-xl font-black text-foreground">{b.employee_count || 0}</p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-2xl border border-border/50">
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1">Kunden</p>
                  <p className="text-xl font-black text-foreground">---</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}