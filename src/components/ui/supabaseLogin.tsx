import { useState, useEffect, type ReactNode, type FormEvent } from "react";
import {
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
  LogOut,
  AlertCircle,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";

const Card = ({ children }: { children: ReactNode }) => (
  <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-10 space-y-6 justify-items-center">
    {children}
  </div>
);

export default function AuthPage() {
  const [claims, setClaims] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const { profile } = useProfile(claims);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setClaims(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setClaims(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setAuthError(null);

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: username } },
      });
      if (error) setAuthError(error.message);
      else alert("Registrierung erfolgreich! Bitte check deine E-Mails.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setAuthError(error.message);
    }

    setLoading(false);
  };

  if (claims)
    return (
      <Card>
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">
            Willkommen, {profile?.username || claims.email}!
          </h1>
          <p className="text-slate-500 text-sm">
            Du bist erfolgreich eingeloggt.
          </p>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login");
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut size={18} /> Abmelden
          </button>
        </div>
      </Card>
    );

  return (
    <Card>
      <div className="text-center mb-2">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isRegistering ? "Account erstellen" : "Willkommen zurück"}
        </h1>
        <p className="text-slate-500 mt-2">
          {isRegistering
            ? "Gib deine Daten ein, um loszulegen."
            : "Logge dich mit deinen Daten ein."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegistering && (
          <div className="relative">
            <UserIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              required={isRegistering}
            />
          </div>
        )}

        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="email"
            placeholder="E-Mail Adresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        <button
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : isRegistering ? (
            "Registrieren"
          ) : (
            "Einloggen"
          )}
        </button>
      </form>

      {authError && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
          <AlertCircle size={16} /> <span>{authError}</span>
        </div>
      )}

      <div className="text-center pt-2">
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          {isRegistering
            ? "Bereits ein Konto? Hier einloggen"
            : "Noch kein Konto? Hier registrieren"}
        </button>
      </div>
    </Card>
  );
}
