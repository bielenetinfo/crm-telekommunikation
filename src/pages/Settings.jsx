import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import TwoFactorSetup from '@/components/TwoFactorSetup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, User, Shield, Pencil, Save, X, Key, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { validatePassword } from '@/lib/validators';

const Settings = () => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [isEditingName, setIsEditingName] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newName, setNewName] = useState(user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const permissionLabels = {
        manage_users: 'Benutzerverwaltung',
        delete_contract: 'Vertragslöschung',
        export_data: 'Datenexport',
        import_data: 'Datenimport',
        reset_system: 'System-Reset'
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSaveName = async () => {
        if (!newName.trim()) {
            toast.error('Name darf nicht leer sein');
            return;
        }
        try {
            await base44.entities.User.update(user.id, { name: newName });
            toast.success('Name erfolgreich geändert');
            setIsEditingName(false);
            if (refreshUser) refreshUser();
        } catch (e) {
            toast.error('Fehler beim Speichern');
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Passwörter stimmen nicht überein');
            return;
        }
        if (!validatePassword(newPassword)) {
            toast.error('Passwort: min. 8 Zeichen, 1 Zahl, 1 Sonderzeichen');
            return;
        }
        try {
            await base44.entities.User.update(user.id, { password: newPassword });
            toast.success('Passwort erfolgreich geändert');
            setIsChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (e) {
            toast.error('Fehler beim Ändern des Passworts');
        }
    };

    return (
        <div className="app-page-shell">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="app-page-title">
                        Einstellungen
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium mt-0.5">
                        Profil und Sicherheit
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                {/* Profile Card */}
                <Card className="glass-card card-premium overflow-hidden border-transparent hover:border-primary/20 group">
                    <div className="h-1.5 bg-gradient-to-r from-primary to-orange-400"></div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl font-black tracking-tight">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <User className="h-5 w-5" />
                            </div>
                            Mein Profil
                        </CardTitle>
                        <CardDescription className="text-muted-foreground font-medium text-xs">
                            Persönliche Daten und Kontoinformationen.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-5 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-primary-foreground font-black text-2xl shadow-lg shadow-primary/20">
                                {user?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="h-10 bg-secondary border-border"
                                            placeholder="Neuer Name"
                                        />
                                        <Button size="icon" variant="ghost" onClick={handleSaveName} className="text-emerald-500 hover:bg-emerald-500/10">
                                            <Save className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)} className="text-muted-foreground">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-foreground">{user?.name}</h3>
                                        <Button size="icon" variant="ghost" onClick={() => { setNewName(user?.name || ''); setIsEditingName(true); }} className="h-7 w-7 text-muted-foreground hover:text-primary">
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <p className="text-sm font-medium text-muted-foreground">{user?.email}</p>
                                <Badge className={cn(
                                    "mt-2 text-[9px] uppercase tracking-widest font-black border-none px-2 py-0.5",
                                    user?.role === 'admin' ? "bg-primary/20 text-primary" : "bg-blue-500/20 text-blue-500"
                                )}>
                                    {user?.role || 'User'}
                                </Badge>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {(user?.permissions || []).length > 0 ? (
                                        user.permissions.map((permission) => (
                                            <Badge key={permission} variant="outline" className="text-[9px] uppercase tracking-widest font-black">
                                                {permissionLabels[permission] || permission}
                                            </Badge>
                                        ))
                                    ) : (
                                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-black text-muted-foreground">
                                            Keine erweiterten Rechte
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Password Change */}
                        {isChangingPassword ? (
                            <div className="space-y-3 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Key className="h-4 w-4 text-primary" /> Passwort ändern
                                </h4>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Neues Passwort"
                                    className="bg-secondary border-border"
                                />
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Passwort bestätigen"
                                    className="bg-secondary border-border"
                                />
                                <div className="flex gap-2">
                                    <Button onClick={handleChangePassword} className="flex-1 h-10 bg-primary text-primary-foreground font-bold">
                                        Speichern
                                    </Button>
                                    <Button variant="outline" onClick={() => setIsChangingPassword(false)} className="h-10">
                                        Abbrechen
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setIsChangingPassword(true)}
                                className="w-full h-10 rounded-xl font-bold text-xs border-border hover:border-primary/30 hover:text-primary"
                            >
                                <Key className="h-4 w-4 mr-2" /> Passwort ändern
                            </Button>
                        )}

                        <Button
                            variant="destructive"
                            onClick={handleLogout}
                            className="w-full h-12 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-rose-500/10 hover:bg-rose-600 transition-all hover:scale-[1.02]"
                        >
                            <LogOut className="h-4 w-4 mr-2" /> Abmelden
                        </Button>

                        {user?.permissions?.includes('export_data') && (
                            <Button
                                variant="outline"
                                onClick={() => navigate('/backup')}
                                className="w-full h-10 rounded-xl font-bold text-xs border-border hover:border-primary/30 hover:text-primary"
                            >
                                <Download className="h-4 w-4 mr-2" /> Export & Backup öffnen
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Security Card */}
                <Card className="glass-card card-premium overflow-hidden border-transparent hover:border-blue-500/20 group">
                    <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl font-black tracking-tight">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                <Shield className="h-5 w-5" />
                            </div>
                            Sicherheit
                        </CardTitle>
                        <CardDescription className="text-muted-foreground font-medium text-xs">
                            Zweifaktor-Authentifizierung (2FA) und Zugriffsschutz.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TwoFactorSetup />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
