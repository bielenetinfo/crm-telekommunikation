import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Smartphone, Router, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/ui/kpi-card";
import { toast } from "sonner";
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

export default function Hardware() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [deleteId, setDeleteId] = useState(null);

    const { data: hardware = [], isLoading } = useQuery({
        queryKey: ['hardware'],
        queryFn: () => base44.entities.Hardware.list()
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Hardware.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hardware'] });
            toast.success("Gerät gelöscht");
            setDeleteId(null);
        }
    });

    const filteredHardware = hardware.filter(item => {
        if (!search) return true;
        const term = search.toLowerCase();
        return item.name?.toLowerCase().includes(term) || item.category?.toLowerCase().includes(term);
    });

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Router': return <Router className="h-8 w-8" />;
            case 'Smartphone': return <Smartphone className="h-8 w-8" />;
            default: return <Package className="h-8 w-8" />;
        }
    };

    const handleCreateHardware = () => {
        const name = window.prompt("Gerätename:");
        if (name) {
            const category = window.prompt("Kategorie (Router, Smartphone, SIM, Sonstiges):", "Sonstiges");
            const price = parseFloat(window.prompt("Preis (€):", "0") || "0");
            const stock = parseInt(window.prompt("Lagerbestand:", "1") || "1", 10);
            base44.entities.Hardware.create({
                name,
                category: category || 'Sonstiges',
                price,
                stock,
                created_at: new Date().toISOString()
            }).then(() => {
                queryClient.invalidateQueries({ queryKey: ['hardware'] });
                toast.success("Gerät hinzugefügt");
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="app-page-shell">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="app-page-title">
                        Hardware
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium mt-0.5">
                        {hardware.length} Geräte im Inventar
                    </p>
                </div>
                <Button
                    onClick={handleCreateHardware}
                    disabled={!canAccessAction(user, ACTION_PERMISSIONS.delete)}
                    className="btn-premium bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 h-12 shadow-lg shadow-primary/20 text-sm rounded-xl"
                >
                    <Plus className="h-4 w-4 mr-2" /> Neues Gerät
                </Button>
            </div>

            {/* KPI Cards */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6"
            >
                <motion.div variants={itemVariants}>
                    <KpiCard icon={Package} value={hardware.length} label="Gesamt Geräte" color="blue" />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <KpiCard icon={Smartphone} value={hardware.filter(h => h.category === 'Smartphone').length} label="Smartphones" color="purple" />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <KpiCard icon={Router} value={hardware.filter(h => h.category === 'Router').length} label="Router" color="green" />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <KpiCard icon={Package} value={hardware.reduce((sum, h) => sum + (h.stock || 0), 0)} label="Lagerbestand" color="amber" />
                </motion.div>
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
                className="glass-card card-premium p-4 rounded-3xl"
            >
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    <Input
                        placeholder="Gerät suchen..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-11 h-11 bg-secondary/50 border-transparent focus:bg-background focus:border-primary/50 text-foreground rounded-xl font-medium placeholder:text-muted-foreground/50"
                    />
                </div>
            </motion.div>

            {/* Hardware Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6"
            >
                {filteredHardware.length === 0 ? (
                    <div className="col-span-full p-12 text-center text-muted-foreground bg-secondary/10 rounded-3xl border border-dashed border-border/50">
                        Keine Geräte gefunden
                    </div>
                ) : (
                    filteredHardware.map((item) => (
                        <motion.div variants={itemVariants} key={item.id}>
                            <Card className="glass-card card-premium overflow-hidden group hover:-translate-y-1 relative transition-all duration-300 border-white/5 hover:border-primary/50">
                                <div className="p-6">
                                    <div className="h-24 bg-secondary/30 rounded-2xl flex items-center justify-center mb-4 text-muted-foreground group-hover:text-primary transition-colors border border-border group-hover:bg-primary/10 group-hover:border-primary/20 shadow-sm">
                                        {getCategoryIcon(item.category)}
                                    </div>
                                    <h3 className="font-bold text-foreground text-lg truncate">{item.name}</h3>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">{item.category}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-black text-foreground">€{item.price?.toFixed(2)}</span>
                                        <Badge className={cn(
                                            "text-xs font-bold",
                                            item.stock > 5
                                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                : item.stock > 0
                                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                        )}>
                                            {item.stock} Stück
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-9 text-xs"
                                            onClick={() => {
                                                const newStock = parseInt(window.prompt("Neuer Lagerbestand:", item.stock) || item.stock, 10);
                                                base44.entities.Hardware.update(item.id, { stock: newStock }).then(() => {
                                                    queryClient.invalidateQueries({ queryKey: ['hardware'] });
                                                    toast.success("Bestand aktualisiert");
                                                });
                                            }}
                                        >
                                            <Pencil className="h-3 w-3 mr-1" /> Bestand
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 text-xs text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                                            onClick={() => canAccessAction(user, ACTION_PERMISSIONS.delete) && setDeleteId(item.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))
                )}
            </motion.div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Gerät löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Dieses Gerät wird dauerhaft aus dem Inventar entfernt.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(deleteId)}
                            className="bg-rose-500 hover:bg-rose-600"
                        >
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
