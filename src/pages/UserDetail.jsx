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
import { validatePassword } from "@/lib/validators";
import { useAuth } from '@/lib/AuthContext';
import { canAccessAction, ACTION_PERMISSIONS, ROLES } from '@/lib/security';

export default function UserDetail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: ROLES.AGENT,
    password: ""
  });

  const { data: userData } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.id === userId);
    },
    enabled: !!userId && !isNew
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        full_name: userData.full_name || "",
        email: userData.email || "",
        role: userData.role || ROLES.AGENT
      });
    }
  }, [userData]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.auth.createUser(data.email, data.password, data.role, data.full_name),
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
    if (!canAccessAction(user, ACTION_PERMISSIONS.userManagement)) {
      alert('Keine Berechtigung für Benutzerverwaltung');
      return;
    }

    if ((isNew || formData.role !== (userData?.role || ROLES.AGENT)) && !canAccessAction(user, ACTION_PERMISSIONS.roleChange)) {
      alert('Keine Berechtigung für Rollenänderungen');
      return;
    }
    if (isNew) {
      if (!validatePassword(formData.password || "")) {
        alert("Passwort: min. 8 Zeichen, 1 Zahl, 1 Sonderzeichen");
        return;
      }
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  return (
    <div className="app-page-shell">
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
          <h1 className="app-page-title">
            {isNew ? "Neuer Benutzer" : userData?.full_name}
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {isNew ? "Benutzer einladen" : "Benutzerdetails"}
          </p>
        </div>
        {!isNew && (
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending || !canAccessAction(user, ACTION_PERMISSIONS.userManagement)}
            className="btn-premium bg-primary text-primary-foreground font-bold h-12 px-8 rounded-xl shadow-lg shadow-primary/20 text-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        )}
      </div>

      <Card className="app-form-panel p-6">
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

          {isNew && (
            <div>
              <Label className="text-[#EAECEF]">Passwort</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                placeholder="Mind. 8 Zeichen, 1 Zahl, 1 Sonderzeichen"
              />
            </div>
          )}

          <div>
            <Label className="text-[#EAECEF]">Rolle</Label>
            <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
              <SelectTrigger className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                <SelectItem value={ROLES.VIEWER} className="text-[#EAECEF]">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Viewer
                  </div>
                </SelectItem>
                <SelectItem value={ROLES.AGENT} className="text-[#EAECEF]">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Agent
                  </div>
                </SelectItem>
                <SelectItem value={ROLES.MANAGER} className="text-[#EAECEF]">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Manager
                  </div>
                </SelectItem>
                <SelectItem value={ROLES.ADMIN} className="text-[#EAECEF]">
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
