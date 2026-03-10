import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, AlertCircle, CheckCircle2, History, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function Backup() {
  const { hasPermission } = useAuth();
  const canExport = hasPermission('export_data');
  const canImport = hasPermission('import_data');
  const canReset = hasPermission('reset_system');
  const [isExporting, setIsExporting] = useState(false);
  const [lastBackup, setLastBackup] = useState(new Date().toISOString());

  const handleExport = () => {
    if (!canExport) return;
    setIsExporting(true);
    try {
      const db = base44.system.exportData();
      const blob = new Blob([db], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bielenet_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastBackup(new Date().toISOString());
      toast.success("Backup erfolgreich erstellt und heruntergeladen.");
    } catch (e) {
      toast.error("Backup-Fehler: " + e.message);
    }
    setIsExporting(false);
  };

  const handleImport = (e) => {
    if (!canImport) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ Achtung: Der Import überschreibt alle aktuellen Daten in diesem Browser. Fortfahren?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        base44.system.importData(data);
        toast.success("Daten erfolgreich importiert. System wird neu geladen...");
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast.error("Import fehlgeschlagen: Ungültiges Dateiformat.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 px-4 md:px-8 pt-3 md:pt-4 pb-24 w-full text-foreground">
      {/* Header - Dashboard Pattern */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="app-page-title">
            Backup
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            Datensicherung & Wiederherstellung
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        <Card className="glass-card card-premium border-transparent hover:border-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-orange-400 to-primary/50" />
          <CardHeader>
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" /> Export
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium text-xs">
              Kompletten Datenbestand als JSON sichern.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-secondary/50 rounded-2xl border border-border/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Letzte Sicherung</span>
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10 text-[9px] uppercase tracking-wider font-black">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Aktuell
                </Badge>
              </div>
              <p className="text-sm text-foreground font-mono font-bold">
                {format(new Date(lastBackup), 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr
              </p>
            </div>

            <Button
              onClick={handleExport}
              disabled={isExporting || !canExport}
              className="w-full btn-premium bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-14 rounded-2xl shadow-lg shadow-primary/20 text-sm uppercase tracking-wider transition-all hover:scale-[1.02]"
            >
              <Save className="h-5 w-5 mr-2" />
              Backup erstellen
            </Button>

            <p className="text-[10px] text-muted-foreground text-center font-medium opacity-70">
              Empfehlung: Tägliche Sicherung auf externem Laufwerk.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card card-premium border-transparent hover:border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardHeader>
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-500" /> Import
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium text-xs">
              Wiederherstellung aus Backup-Datei.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
                Warnung: Alle aktuellen Daten werden überschrieben! Dieser Vorgang kann nicht widerrufen werden.
              </p>
            </div>

            <div className="relative group cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={!canImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-border group-hover:border-primary/50 group-hover:bg-primary/5 rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center  transition-transform">
                  <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Backup-Datei auswählen</p>
                  <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mt-1">Drag & Drop oder Klicken</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* System Reset Card - Moved into Grid */}
        <Card className="glass-card border-rose-500/20 bg-rose-500/5 overflow-hidden relative flex flex-col">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 to-red-600" />
          <div className="p-4 border-b border-rose-500/10 bg-rose-500/10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20">
              <History className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                System-Reset
              </h3>
              <p className="text-[10px] font-bold text-rose-500/70">Wiederherstellung</p>
            </div>
          </div>
          <CardContent className="p-6 flex flex-col justify-between flex-1 gap-6">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Demo-Initialisierung</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Setzt die gesamte Datenbank auf den Standard-Zustand zurück. Alle manuell erstellten Daten gehen verloren.
              </p>
            </div>
            <Button
              variant="ghost"
              disabled={!canReset}
              className="w-full border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 font-bold"
              onClick={() => {
                if (confirm("⚠️ System komplett zurücksetzen? Alle Änderungen gehen verloren.")) {
                  base44.system.resetData();
                  window.location.reload();
                }
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Hard Reset
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
