import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('admin@bielenet.de');
    const [password, setPassword] = useState('admin');
    const [code, setCode] = useState('');
    const [step, setStep] = useState('login'); // login | 2fa
    const [tempUserId, setTempUserId] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, verify2FA } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const res = await login(email, password);
            if (res === true) {
                navigate('/');
            } else if (res.require2FA) {
                setStep('2fa');
                setTempUserId(res.userId);
            }
        } catch (err) {
            setError('Ungültige Zugangsdaten');
        } finally {
            setIsLoading(false);
        }
    };

    const handle2FA = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await verify2FA(tempUserId, code);
            navigate('/');
        } catch (err) {
            setError('Ungültiger Bestätigungscode');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#0F1115] text-white font-sans selection:bg-[#FFD24D]/30 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#FFD24D]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Login Container */}
            <div className="w-full max-w-md m-auto p-8 relative z-10">
                <div className="text-center mb-10 space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFD24D] to-orange-500 shadow-2xl shadow-orange-500/20 mb-6">
                        <span className="text-3xl font-bold text-black">B</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Willkommen zurück</h1>
                    <p className="text-gray-400">Melden Sie sich bei CRM-BIELENET an</p>
                </div>

                <div className="bg-[#181B21]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl">
                    {step === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Adresse</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FFD24D] transition-colors" size={18} />
                                    <Input
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="pl-10 h-12 bg-[#0F1115] border-white/10 text-white placeholder:text-gray-600 focus:border-[#FFD24D]/50 focus:ring-1 focus:ring-[#FFD24D]/50 transition-all rounded-xl"
                                        placeholder="name@firma.de"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Passwort</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FFD24D] transition-colors" size={18} />
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="pl-10 h-12 bg-[#0F1115] border-white/10 text-white placeholder:text-gray-600 focus:border-[#FFD24D]/50 focus:ring-1 focus:ring-[#FFD24D]/50 transition-all rounded-xl"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-in fade-in slide-in-from-top-1">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-[#FFD24D] to-[#FFA500] hover:to-[#FFD24D] text-black font-bold rounded-xl text-md shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <span className="flex items-center gap-2">Anmelden <ArrowRight size={18} /></span>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handle2FA} className="space-y-6">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFD24D]/10 text-[#FFD24D] mb-3">
                                    <ShieldCheck size={24} />
                                </div>
                                <h3 className="text-lg font-medium text-white">2-Faktor Authentifizierung</h3>
                                <p className="text-sm text-gray-400">Bitte geben Sie den Code aus Ihrer Authenticator App ein.</p>
                            </div>

                            <div className="space-y-2">
                                <div className="relative group">
                                    <Input
                                        value={code}
                                        onChange={e => setCode(e.target.value)}
                                        className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-[#0F1115] border-white/10 text-white focus:border-[#FFD24D]/50 focus:ring-1 focus:ring-[#FFD24D]/50 transition-all rounded-xl"
                                        maxLength={6}
                                        placeholder="000000"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-[#FFD24D] to-[#FFA500] text-black font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Verifiziere...' : 'Bestätigen'}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setStep('login')}
                                className="w-full text-sm text-gray-500 hover:text-white transition-colors"
                            >
                                Zurück zum Login
                            </button>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-600">
                        &copy; 2026 CRM-BIELENET System. <br />Made for efficiency.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
