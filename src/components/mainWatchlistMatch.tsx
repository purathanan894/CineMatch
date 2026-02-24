import { useEffect, useState, useRef } from "react";
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
  media_type?: string;
};

type ProfileSnippet = {
  username: string;
  id: string;
  hasMatchedBefore?: boolean;
};

type MatchHistoryEntry = {
  user_id: string;
  target_id: string;
  match_count: number;
  matched_at: string;
  profiles: { username: string };
};

export default function WatchlistMatchPage() {
  const { user } = useAuth();
  const [myWatchlist, setMyWatchlist] = useState<WatchlistMovie[]>([]);
  const [matches, setMatches] = useState<WatchlistMovie[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<WatchlistMovie[]>([]); 
  const [loading, setLoading] = useState(false);
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null); // State für das Entfernen-Overlay
  
  const [targetUsername, setTargetUsername] = useState("");
  const [suggestions, setSuggestions] = useState<ProfileSnippet[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastMatchedPartnerId, setLastMatchedPartnerId] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<MatchHistoryEntry[]>([]);
  const [historyMode, setHistoryMode] = useState<'incoming' | 'outgoing'>('incoming');

  const movieRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const loadMyInteractions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("match_history")
      .select(`user_id, target_id, matched_at, match_count, profiles:user_id (username)`)
      .or(`user_id.eq.${user.id},target_id.eq.${user.id}`)
      .order("matched_at", { ascending: false })
      .limit(10);

    if (data) {
      const formattedData = await Promise.all(data.map(async (entry) => {
        if (entry.user_id === user.id) {
          const { data: targetProfile } = await supabase.from("profiles").select("username").eq("id", entry.target_id).single();
          return { ...entry, profiles: { username: targetProfile?.username || "Unbekannt" } };
        }
        return entry;
      }));
      setNotifications(formattedData as unknown as MatchHistoryEntry[]);
    }
  };

  useEffect(() => {
    if (!user) return;
    const loadInitialData = async () => {
      const { data: list } = await supabase.from("watchlist").select("*").eq("user_id", user.id);
      if (list) setMyWatchlist(list as WatchlistMovie[]);
      loadMyInteractions();
    };
    loadInitialData();
  }, [user]);

  // Lädt dauerhaft gespeicherte Matches aus der DB
  useEffect(() => {
    const fetchPersistentMatches = async () => {
      if (!user || !lastMatchedPartnerId || matches.length === 0) return;

      const { data, error } = await supabase
        .from("selected_for_today")
        .select("movie_id")
        .or(`and(user_id.eq.${user.id},target_id.eq.${lastMatchedPartnerId}),and(user_id.eq.${lastMatchedPartnerId},target_id.eq.${user.id})`);

      if (!error && data) {
        const storedIds = data.map((d) => d.movie_id);
        const persistentSelection = matches.filter((m) => storedIds.includes(m.movie_id));
        setSelectedMatches(persistentSelection);
      }
    };
    fetchPersistentMatches();
  }, [matches, user, lastMatchedPartnerId]);

  useEffect(() => {
    if (!user) return;
    const fetchSuggestions = async () => {
      if (targetUsername.length < 2) {
        setSuggestions([]);
        return;
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", `${targetUsername}%`)
        .neq("id", user.id)
        .limit(5);

      if (profiles) {
        const profileIds = profiles.map(p => p.id);
        const { data: history } = await supabase
          .from("match_history")
          .select("target_id, user_id")
          .or(`user_id.in.(${profileIds.join(',')}),target_id.in.(${profileIds.join(',')})`);

        const enrichedProfiles = profiles.map(p => ({
          ...p,
          hasMatchedBefore: history?.some(h => h.target_id === p.id || h.user_id === p.id)
        }));
        setSuggestions(enrichedProfiles);
      }
    };
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [targetUsername, user]);

  const handleCompare = async (selectedId?: string, selectedName?: string) => {
    const searchId = selectedId;
    const searchName = selectedName || targetUsername;
    if (!searchId || !user || searchId === user.id) return;

    setLoading(true);
    setHasSearched(true);
    setSuggestions([]);
    setTargetUsername(searchName);
    setLastMatchedPartnerId(searchId);
    setSelectedMatches([]); 

    const { data: partnerMatches, error } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", searchId)
      .in("movie_id", myWatchlist.map(m => m.movie_id));

    if (!error && partnerMatches) {
      setMatches(partnerMatches as WatchlistMovie[]);
      await supabase.from("match_history").upsert({
        user_id: user.id,
        target_id: searchId,
        match_count: partnerMatches.length,
        matched_at: new Date().toISOString()
      }, { onConflict: 'user_id,target_id' });
      loadMyInteractions();
    }
    setLoading(false);
  };

  const toggleSelection = async (movie: WatchlistMovie) => {
    if (!user || !lastMatchedPartnerId) return;
    const isAlreadySelected = selectedMatches.find(m => m.movie_id === movie.movie_id);

    if (isAlreadySelected) {
      await supabase
        .from("selected_for_today")
        .delete()
        .eq("movie_id", movie.movie_id)
        .or(`and(user_id.eq.${user.id},target_id.eq.${lastMatchedPartnerId}),and(user_id.eq.${lastMatchedPartnerId},target_id.eq.${user.id})`);

      setSelectedMatches(prev => prev.filter(m => m.movie_id !== movie.movie_id));
    } else {
      await supabase.from("selected_for_today").insert({
        user_id: user.id,
        target_id: lastMatchedPartnerId,
        movie_id: movie.movie_id,
        title: movie.title,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        overview: movie.overview,
        release_date: movie.release_date
      });
      setSelectedMatches(prev => [movie, ...prev]);
    }
  };

  const pickRandomMovie = async () => {
    if (matches.length === 0 || !user || !lastMatchedPartnerId) return;
    const randomIndex = Math.floor(Math.random() * matches.length);
    const randomMovie = matches[randomIndex];
    
    if (!selectedMatches.find(m => m.movie_id === randomMovie.movie_id)) {
        await toggleSelection(randomMovie);
    }
    setActiveCardId(randomMovie.movie_id);
    
    setTimeout(() => {
      movieRefs.current[randomMovie.movie_id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#FF0800] p-4 sm:p-6 relative text-slate-900 overflow-x-hidden">
      <Header />

      <main className="mt-12 max-w-7xl mx-auto bg-white/90 backdrop-blur-md rounded-[2.5rem] p-4 sm:p-8 shadow-2xl min-h-[70vh]">
        
        {/* MATCH HISTORY */}
        {notifications.length > 0 && !hasSearched && (
          <div className="max-w-2xl mx-auto mb-10 animate-in fade-in">
             <div className="flex justify-center gap-6 mb-4">
                <button onClick={() => setHistoryMode('incoming')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${historyMode === 'incoming' ? 'border-[#FF0800] text-slate-800' : 'border-transparent text-slate-400'}`}>Besucher</button>
                <button onClick={() => setHistoryMode('outgoing')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${historyMode === 'outgoing' ? 'border-[#FF0800] text-slate-800' : 'border-transparent text-slate-400'}`}>Meine Matches</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {notifications.filter(n => historyMode === 'incoming' ? n.target_id === user?.id : n.user_id === user?.id).map((note, idx) => (
                <div key={idx} className="bg-white/50 border border-white p-3 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF0800]"></div>
                   <div className="flex items-center gap-3 ml-2">
                    <span className="text-lg">🔥</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{note.profiles.username}</span>
                      <span className="text-[10px] text-slate-400">{note.match_count} Matches</span>
                    </div>
                  </div>
                  <button onClick={() => handleCompare(historyMode === 'incoming' ? note.user_id : note.target_id, note.profiles.username)} className="text-[10px] font-black uppercase text-[#FF0800]">Check →</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH */}
        <div className="max-w-xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-black uppercase mb-2">Cine <span className="text-[#FF0800] italic">Match</span></h1>
          <div className="relative">
            <input type="text" placeholder="Freund suchen..." value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)} className="w-full bg-slate-100 border-2 border-transparent focus:border-[#FF0800] focus:bg-white px-6 py-4 rounded-2xl outline-none font-bold transition-all shadow-inner" />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[60]">
                {suggestions.map((s) => (
                  <button key={s.id} onPointerUp={() => handleCompare(s.id, s.username)} className="w-full px-6 py-3 text-left hover:bg-rose-50 flex justify-between items-center border-b last:border-0 border-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">{s.username}</span>
                      {s.hasMatchedBefore && <span className="bg-orange-100 text-orange-600 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Bereits gematcht</span>}
                    </div>
                    <span className="text-[10px] text-[#FF0800] font-black uppercase tracking-tighter">Match finden →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RESULTS AREA */}
        {hasSearched && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
             
             {/* AUSWAHL FÜR HEUTE */}
             <div className="flex flex-col items-center gap-6 mb-12 py-8 bg-slate-50/80 rounded-[2.5rem] border-2 border-dashed border-slate-200">
               <div className="px-6 py-2 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">
                  {loading ? "Suche..." : "🍿 Eure Auswahl für heute"}
               </div>

               {selectedMatches.length > 0 ? (
                 <div className="flex flex-wrap justify-center gap-6 px-4">
                    {selectedMatches.map(m => {
                        const isRemoving = removingId === m.movie_id;
                        return (
                          <div key={m.movie_id} className="flex flex-col items-center animate-in zoom-in-75 relative">
                              <div 
                                onPointerUp={() => setRemovingId(isRemoving ? null : m.movie_id)}
                                className="w-24 h-36 rounded-2xl overflow-hidden shadow-2xl border-4 border-green-400 relative cursor-pointer"
                              >
                                  <img 
                                    src={`https://image.tmdb.org/t/p/w200${m.poster_path}`} 
                                    className={`w-full h-full object-cover transition-all duration-300 ${isRemoving ? 'blur-sm scale-110 opacity-50' : ''}`} 
                                  />
                                  
                                  <div className={`absolute inset-0 bg-black/70 flex items-center justify-center p-2 transition-all duration-300 ${isRemoving ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                                      <button 
                                        onPointerUp={(e) => { 
                                          e.stopPropagation(); 
                                          toggleSelection(m); 
                                          setRemovingId(null);
                                        }} 
                                        className="bg-rose-600 text-white text-[9px] font-black uppercase py-2 px-3 rounded-lg shadow-lg active:scale-95"
                                      >
                                        Entfernen
                                      </button>
                                  </div>
                              </div>
                              <span className="text-[9px] font-black uppercase mt-3 text-slate-700 max-w-[90px] text-center truncate">{m.title}</span>
                          </div>
                        );
                    })}
                 </div>
               ) : (
                 <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Wähle Filme aus der Liste</p>
               )}

               {!loading && matches.length > 0 && (
                 <button onClick={pickRandomMovie} className="bg-[#FF0800] hover:bg-black text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95">
                   <span>🎲</span> Zufälliger Pick
                 </button>
               )}
            </div>

            {/* GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {matches.map((movie) => {
                  const isActive = activeCardId === movie.movie_id;
                  const isSelected = selectedMatches.some(sm => sm.movie_id === movie.movie_id);

                  return (
                    <div 
                      key={movie.movie_id}
                      ref={(el) => { movieRefs.current[movie.movie_id] = el; }}
                      onPointerUp={() => setActiveCardId(isActive ? null : movie.movie_id)}
                      className={`relative bg-black rounded-xl shadow-lg overflow-hidden aspect-[2/3] transition-all duration-300 md:hover:scale-[1.05] cursor-pointer border ${isSelected ? 'border-green-400 shadow-2xl shadow-green-400/20' : 'border-slate-800'}`}
                    >
                      <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} className={`w-full h-full object-cover transition-all duration-500 ${isActive ? 'opacity-40 blur-sm scale-110' : 'opacity-100 scale-100'}`} alt={movie.title} />
                      
                      <div className={`absolute inset-0 z-50 flex flex-col justify-end p-4 transition-all duration-300 ${isActive ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`} style={{ background: 'linear-gradient(to top, black 0%, rgba(0,0,0,0.8) 60%, transparent 100%)' }}>
                        
                        <div className="overflow-y-auto max-h-[70%] mb-3 no-scrollbar">
                          <h3 className="text-sm font-black mb-1 text-rose-500 leading-tight uppercase">{movie.title}</h3>
                          <div className="text-[10px] text-slate-300 mb-2 font-bold flex items-center gap-2">
                            <span className="text-yellow-400">★</span> {movie.vote_average.toFixed(1)} <span>|</span> {movie.release_date?.split("-")[0]}
                          </div>
                          <p className="text-[11px] text-white/90 leading-snug line-clamp-5 italic">{movie.overview}</p>
                        </div>

                        <div className="flex flex-col gap-2 pt-3 border-t border-white/20">
                          <button 
                            onPointerUp={(e) => { e.stopPropagation(); toggleSelection(movie); }} 
                            className={`text-[10px] font-black py-3 rounded-lg uppercase transition-all shadow-xl active:scale-95 ${isSelected ? 'bg-green-500 text-white' : 'bg-rose-600 text-white'}`}
                          >
                            {isSelected ? '✓ Gematcht' : 'Match'}
                          </button>
                          <a href={`https://www.themoviedb.org/movie/${movie.movie_id}`} target="_blank" rel="noopener noreferrer" onPointerUp={(e) => e.stopPropagation()} className="bg-white/20 text-white text-[10px] font-black py-3 rounded-lg text-center uppercase backdrop-blur-md transition-all active:bg-white/40">Details</a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
        )}
      </main>
    </div>
  );
}