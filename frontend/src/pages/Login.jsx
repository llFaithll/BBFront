import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BG = "https://images.unsplash.com/photo-1613618948931-efbc3e6f9775?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwbW9kZXJuJTIwYmVkJTIwYnJlYWtmYXN0JTIwaW50ZXJpb3J8ZW58MHx8fHwxNzgzNzcyMTk4fDA&ixlib=rb-4.1.0&q=85";

export default function Login() {
  const { login, register, error } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const isLogin = mode === "login";
    const ok = isLogin ? await login(email, password) : await register(email, password, name);
    setBusy(false);
    if (!ok) return;
    toast.success(isLogin ? "Bentornato!" : "Registrazione completata");
  };

  const heading = mode === "login" ? "Bentornato." : "Benvenuto.";
  const modeLabel = mode === "login" ? "Accesso" : "Registrazione";
  const submitLabel = mode === "login" ? "Entra" : "Crea account";
  const toggleLabel = mode === "login" ? "Non hai un account? Registrati" : "Hai già un account? Accedi";

  let submitText;
  if (busy) submitText = "Attendere…";
  else submitText = submitLabel;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={BG} alt="B&B interior" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
          <div>
            <div className="overline text-white/70">Villa · Gestionale</div>
            <div className="font-serif text-6xl mt-2 leading-none">Casa<span className="text-accent">.</span></div>
          </div>
          <div>
            <div className="font-serif text-4xl leading-tight max-w-md">
              "Gestisci il tuo B&amp;B con la stessa cura con cui accogli i tuoi ospiti."
            </div>
            <div className="mt-6 text-sm text-white/70">Dashboard · Calendario · Ospiti · Alloggiati Web</div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8 bg-background">
        <form onSubmit={submit} className="w-full max-w-md" data-testid="auth-form">
          <div className="overline">{modeLabel}</div>
          <h1 className="font-serif text-5xl mt-2 mb-8 leading-none">{heading}</h1>
          {mode === "register" && (
            <div className="mb-4">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" data-testid="input-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="mb-4">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" data-testid="input-email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-6">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" data-testid="input-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="mb-4 text-sm text-destructive" data-testid="auth-error">{error}</div>}
          <Button type="submit" data-testid="auth-submit" disabled={busy} className="w-full rounded-md h-11">
            {submitText}
          </Button>
          <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="mt-4 text-sm text-muted-foreground hover:text-foreground" data-testid="toggle-auth-mode">
            {toggleLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
