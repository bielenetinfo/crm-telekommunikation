import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

const TwoFactorSetup = () => {
    const [qr, setQr] = useState('');
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [status, setStatus] = useState('init'); // init, confirming, success

    const startSetup = async () => {
        try {
            const res = await base44.auth.setup2FA();
            setQr(res.qr);
            setSecret(res.secret);
            setStatus('confirming');
        } catch (err) {
            console.error(err);
        }
    };

    const confirmSetup = async () => {
        try {
            await base44.auth.confirm2FA(secret, code);
            setStatus('success');
        } catch (err) {
            alert('Code ist falsch');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck size={20} /> 2-Faktor Authentifizierung</CardTitle>
                <CardDescription>Sichern Sie Ihren Account mit Google Authenticator.</CardDescription>
            </CardHeader>
            <CardContent>
                {status === 'init' && (
                    <Button onClick={startSetup}>2FA Einrichten</Button>
                )}

                {status === 'confirming' && (
                    <div className="space-y-4">
                        <div className="flex flex-col items-center p-4 bg-white rounded border border-border">
                            <img src={qr} alt="2FA QR Code" className="w-48 h-48" />
                        </div>
                        <p className="text-sm text-muted-foreground">Scannen Sie den QR-Code mit Ihrer Authenticator App (Google/Microsoft) und geben Sie den Bestätigungscode ein.</p>
                        <div className="flex gap-2">
                            <Input placeholder="123456" value={code} onChange={e => setCode(e.target.value)} maxLength={6} />
                            <Button onClick={confirmSetup}>Aktivieren</Button>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-success font-medium flex items-center gap-2">
                        <ShieldCheck size={18} /> 2FA ist erfolgreich aktiviert!
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TwoFactorSetup;
