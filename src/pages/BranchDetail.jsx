import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Building2, MapPin, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";

export default function BranchDetail() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const urlParams = new URLSearchParams(window.location.search);
    const branchId = urlParams.get('id');
    const isNew = urlParams.get('new') === 'true';

    const [formData, setFormData] = useState({
        name: "",
        street: "",
        postal_code: "",
        city: "",
        manager: "",
        employee_count: 0
    });

    const { data: branch } = useQuery({
        queryKey: ['branch', branchId],
        queryFn: async () => {
            const branches = await base44.entities.Branch.list();
            return branches.find(b => b.id === branchId);
        },
        enabled: !!branchId && !isNew
    });

    useEffect(() => {
        if (branch) {
            setFormData({
                name: branch.name || "",
                street: branch.street || "",
                postal_code: branch.postal_code || "",
                city: branch.city || "",
                manager: branch.manager || "",
                employee_count: branch.employee_count || 0
            });
        }
    }, [branch]);

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Branch.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["branches"] });
            toast({ title: "Erfolg", description: "Filiale wurde angelegt." });
            navigate(createPageUrl('Branches'));
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data) => base44.entities.Branch.update(branchId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["branch", branchId] });
            queryClient.invalidateQueries({ queryKey: ["branches"] });
            toast({ title: "Erfolg", description: "Änderungen gespeichert." });
            navigate(createPageUrl('Branches'));
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isNew) {
            createMutation.mutate(formData);
        } else {
            updateMutation.mutate(formData);
        }
    };

    return (
        <div className="space-y-3 px-4 md:px-8 pt-3 md:pt-4 pb-24 w-full text-foreground">
            <div className="flex items-center gap-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(createPageUrl('Branches'))}
                    className="h-12 w-12 rounded-2xl bg-secondary/50 border border-secondary hover:bg-secondary"
                >
                    <ArrowLeft className="h-6 w-6 text-muted-foreground" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient">
                        {isNew ? "Neue Filiale" : formData.name}
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium mt-0.5">
                        {isNew ? "Filiale hinzufügen" : "Filialdetails bearbeiten"}
                    </p>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="btn-premium bg-primary text-primary-foreground font-bold h-12 px-8 rounded-xl shadow-lg shadow-primary/20 text-sm"
                >
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                </Button>
            </div>

            <Card className="p-6 bg-[#181B21] border-[#2D3139]">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Filialname</Label>
                            <div className="relative group">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="pl-10 bg-[#1F2228] border-[#2D3139]"
                                    placeholder="z.B. Filiale Bielefeld"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Filialleiter</Label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                <Input
                                    value={formData.manager}
                                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                                    className="pl-10 bg-[#1F2228] border-[#2D3139]"
                                    placeholder="Name des Filialleiters"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>Straße & Hausnummer</Label>
                            <div className="relative group">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                <Input
                                    value={formData.street}
                                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                    className="pl-10 bg-[#1F2228] border-[#2D3139]"
                                    placeholder="Musterstraße 123"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Postleitzahl</Label>
                            <Input
                                value={formData.postal_code}
                                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                className="bg-[#1F2228] border-[#2D3139]"
                                placeholder="33602"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Stadt</Label>
                            <Input
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="bg-[#1F2228] border-[#2D3139]"
                                placeholder="Bielefeld"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Anzahl Mitarbeiter</Label>
                            <Input
                                type="number"
                                value={formData.employee_count}
                                onChange={(e) => setFormData({ ...formData, employee_count: parseInt(e.target.value) || 0 })}
                                className="bg-[#1F2228] border-[#2D3139]"
                            />
                        </div>
                    </div>
                </form>
            </Card>
        </div>
    );
}
