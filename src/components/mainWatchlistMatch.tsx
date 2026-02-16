import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/ui/header";

type WatchlistMovie = {
  movie_id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  overview: string;
  release_date: string;
};

type ProfileSnippet = {
  username: string;
  id: string;
};

export default function WatchlistMatchPage() {
  const { user } = useAuth();
  const [myWatchlist, setMyWatchlist] = useState<WatchlistMovie[]>([]);
  const [matches, setMatches] = useState<WatchlistMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  
  // States für die Suche & Vorschläge
  const [targetUsername, setTargetUsername] = useState("");
  const [suggestions, setSuggestions] = useState<ProfileSnippet[]>([]);
  const [currentUsername, setCurrentUsername] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 1. Eigene Daten laden
  useEffect(() => {
    if (!user) return;
    const loadInitialData = async () => {
      const { data: list } = await supabase.from("watchlist").select("*").eq("user_id", user.id);
      if (list) setMyWatchlist(list as WatchlistMovie[]);

      const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
      if (profile) setCurrentUsername(profile.username);
    };
    loadInitialData();
  }, [user]);

  // 2. Live-Vorschläge laden, wenn sich die Eingabe ändert
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (targetUsername.length < 2) {
        setSuggestions([]);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", `${targetUsername}%`) // Findet Namen, die so beginnen
        .neq("id", user?.id) // Dich selbst ausschließen
        .limit(5);

      if (data) setSuggestions(data);
    };

    const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce, um API zu schonen
    return () => clearTimeout(timeoutId);
  }, [targetUsername, user]);

  // 3. Match-Logik
  const handleCompare = async (selectedId?: string, selectedName?: string) => {
    const searchId = selectedId;
    const searchName = selectedName || targetUsername;

    if (!searchId || !user) return;

    setLoading(true);
    setHasSearched(true);
    setErrorMessage("");
    setSuggestions([]); // Vorschläge schließen
    setTargetUsername(searchName); // Input auf den gewählten Namen setzen

    const { data: partnerMatches, error } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", searchId)
      .in("movie_id", myWatchlist.map(m => m.movie_id));

    if (!error && partnerMatches) {
      setMatches(partnerMatches as WatchlistMovie[]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-[#FF0800] p-4 sm:p-6 relative text-slate-900">
      <Header />

      <main className="mt-12 max-w-7xl mx-auto bg-white/90 backdrop-blur-md rounded-[2.5rem] p-8 shadow-2xl min-h-[70vh]">
        
        <div className="max-w-xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-black uppercase text-slate-800 tracking-tighter mb-2">
            Cine <span className="text-[#FF0800] italic">Match</span>
          </h1>
          <p className="text-slate-500 text-sm mb-8">Finde heraus, was ihr gemeinsam schauen könnt</p>
          
          <div className="relative">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Freund suchen..." 
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                className="w-full bg-slate-100 border-2 border-transparent focus:border-[#FF0800] focus:bg-white px-6 py-4 rounded-2xl outline-none text-sm font-bold transition-all shadow-inner"
              />
            </div>

            {/* VORSCHLÄGE DROPDOWN */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleCompare(s.id, s.username)}
                    className="w-full px-6 py-3 text-left hover:bg-rose-50 flex justify-between items-center transition-colors border-b last:border-0 border-slate-50"
                  >
                    <span className="font-bold text-slate-700">{s.username}</span>
                    <span className="text-[10px] text-[#FF0800] font-black uppercase tracking-tighter">Match finden →</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center items-center gap-2 text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-widest">Dein Username:</span>
            <span className="bg-slate-100 px-3 py-1 rounded-md text-[10px] font-mono text-slate-800 font-bold">{currentUsername}</span>
          </div>
        </div>

        {/* ERGEBNIS GRID (Bleibt gleich wie vorher) */}
        {hasSearched && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-4 mb-8">
               <div className="h-px flex-1 bg-slate-200"></div>
               <h2 className="font-black text-slate-800 uppercase tracking-widest text-xs">
                 {matches.length} Matches gefunden
               </h2>
               <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            {matches.length === 0 && !loading ? (
              <div className="text-center py-16 bg-white/50 rounded-[3rem] border-4 border-dashed border-slate-100 italic text-slate-400 text-sm">
                Keine gemeinsamen Filme gefunden.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {matches.map((movie) => {
                  const isActive = activeCardId === movie.movie_id;
                  return (
                    <div 
                      key={movie.movie_id} 
                      className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 md:hover:scale-[1.05] cursor-pointer"
                      onMouseEnter={() => setActiveCardId(movie.movie_id)}
                      onMouseLeave={() => setActiveCardId(null)}
                      onClick={() => setActiveCardId(isActive ? null : movie.movie_id)}
                    >
                      <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} className="w-full h-full object-cover" />
                      <div className={`absolute inset-0 bg-slate-900/95 p-4 flex flex-col justify-between transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0 invisible"}`}>
                        <h3 className="text-[#FF0800] font-black text-xs uppercase">{movie.title}</h3>
                        <p className="text-[10px] text-slate-300 line-clamp-6">{movie.overview}</p>
                        <a href={`https://www.themoviedb.org/movie/${movie.movie_id}`} target="_blank" className="bg-white text-black text-center text-[9px] font-black py-2 rounded-lg uppercase">Info</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}