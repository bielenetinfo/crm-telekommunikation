import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Shield, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UserDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "user"
  });

  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.id === userId);
    },
    enabled: !!userId && !isNew
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        role: user.role || "user"
      });
    }
  }, [user]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.auth.createUser(data.email, "temp-password-123", data.role, data.full_name),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate(createPageUrl("Users"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleSubmit = () => {
    if (isNew) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-3 px-4 md:px-8 pt-3 md:pt-4 pb-24 w-full text-foreground">
      {/* Header - Dashboard Pattern */}
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(createPageUrl('Users'))}
          className="h-12 w-12 rounded-2xl bg-secondary/50 border border-secondary hover:bg-secondary"
        >
          <ArrowLeft className="h-6 w-6 text-muted-foreground" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient">
            {isNew ? "Neuer Benutzer" : user?.full_name}
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {isNew ? "Benutzer einladen" : "Benutzerdetails"}
          </p>
        </div>
        {!isNew && (
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="btn-premium bg-primary text-primary-foreground font-bold h-12 px-8 rounded-xl shadow-lg shadow-primary/20 text-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        )}
      </div>

      <Card className="p-6 bg-[#181B21] border-[#2D3139]">
        <div className="space-y-6">
          <div>
            <Label className="text-[#EAECEF]">Name</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
              placeholder="Max Mustermann"
            />
          </div>

          <div>
            <Label className="text-[#EAECEF]">E-Mail</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
              placeholder="max@beispiel.de"
              disabled={!isNew}
            />
          </div>

          <div>
            <Label className="text-[#EAECEF]">Rolle</Label>
            <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
              <SelectTrigger className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                <SelectItem value="user" className="text-[#EAECEF]">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Benutzer
                  </div>
                </SelectItem>
                <SelectItem value="admin" className="text-[#EAECEF]">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Administrator
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );
}