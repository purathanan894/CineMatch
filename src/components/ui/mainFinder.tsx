import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Media = {
  id: number;
  movie_id?: number; // Wichtig für Daten aus dem Cache
  title?: string;
  name?: string;
  poster_path: string;
  vote_average: number;
  overview: string;
  release_date?: string;
  first_air_date?: string;
};

type Genre = {
  id: number;
  name: string;
};

export default function TopMediaDiscovery() {
  const { user } = useAuth();
  
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [decade, setDecade] = useState<string>(""); 
  
  const [items, setItems] = useState<Media[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const decades = [
    { label: "Alle Zeit", value: "" },
    { label: "2020er", value: "2020" },
    { label: "2010er", value: "2010" },
    { label: "2000er", value: "2000" },
    { label: "90er", value: "1990" },
    { label: "80er", value: "1980" },
    { label: "70er", value: "1970" },
  ];

  // --- 1. Die Cache-Logik ---
  const fetchWithCache = async (mType: string, type: string, genre: number | null, dec: string) => {
    const cacheKey = `${type === 'top_rated' ? 'top' : 'new'}-${mType}-${genre || 'all'}-${dec || 'all'}`;

    const { data: cachedMovies } = await supabase
      .from('movie_cache')
      .select('*')
      .eq('cache_key', cacheKey);

    const isExpired = cachedMovies && cachedMovies.length > 0
      ? (new Date().getTime() - new Date(cachedMovies[0].updated_at).getTime() > 24 * 60 * 60 * 1000) 
      : true;

    if (cachedMovies && cachedMovies.length > 0 && !isExpired) {
      console.log("Nutze Einzelzeilen-Cache:", cacheKey);
      return cachedMovies;
    }

    const { data: apiResponse } = await supabase.functions.invoke('tmdb-proxy', {
      body: { mediaType: mType, type, genre, decade: dec }
    });

    if (apiResponse && apiResponse.results) {
      await supabase.from('movie_cache').delete().eq('cache_key', cacheKey);

      const moviesToStore = apiResponse.results.map((m: any) => ({
        cache_key: cacheKey,
        movie_id: m.id,
        title: m.title || m.name,
        poster_path: m.poster_path,
        vote_average: m.vote_average,
        overview: m.overview,
        release_date: m.release_date || m.first_air_date,
        media_type: mType,
        updated_at: new Date().toISOString()
      }));

      await supabase.from('movie_cache').insert(moviesToStore);
      return moviesToStore;
    }
    return [];
  };

  useEffect(() => {
    const loadGenres = async () => {
      const { data } = await supabase.functions.invoke('tmdb-proxy', {
        body: { action: "get_genres", mediaType }
      });
      if (data?.genres) setGenres(data.genres);
    };
    loadGenres();
  }, [mediaType]);

  useEffect(() => {
    const loadData = async () => {
      const results = await fetchWithCache(mediaType, "top_rated", selectedGenre, decade);
      setItems(results.slice(0, 18));
    };
    loadData();
  }, [mediaType, selectedGenre, decade]);

  // --- KORRIGIERTE addToWatchlist ---
  const addToWatchlist = async (item: Media) => {
    if (!user) { alert("Bitte einloggen!"); return; }

    // Bestimme die echte TMDB-ID (api: .id | cache: .movie_id)
    const tmdbId = item.movie_id || item.id;
    const finalTitle = item.title || item.name;
    const finalDate = item.release_date || item.first_air_date;

    const { data: existing } = await supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("movie_id", tmdbId)
      .maybeSingle();

    if (existing) {
      alert(`${finalTitle} ist bereits in der Watchlist!`);
      return;
    }

    const { error } = await supabase.from("watchlist").insert({
      user_id: user.id,
      movie_id: tmdbId,
      title: finalTitle,
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      overview: item.overview,
      release_date: finalDate,
    });
    
    if (error) {
      console.error("Fehler beim Speichern:", error.message);
      alert("Fehler beim Hinzufügen!");
    } else {
      alert(`${finalTitle} hinzugefügt!`);
    }
  };

  return (
    <main className="mt-20 w-full max-w-7xl mx-auto p-4 sm:p-6 text-slate-900">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-8 border-b pb-6">
        <div>
           <h2 className="text-xl font-bold uppercase tracking-widest text-slate-800">
             Top 18 {mediaType === "movie" ? "Filme" : "Serien"}
           </h2>
           <p className="text-[10px] text-slate-500 font-medium">Sortiert nach besten Bewertungen</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => { setMediaType("movie"); setSelectedGenre(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mediaType === "movie" ? "bg-white shadow-sm text-rose-600" : "text-slate-500"}`}
            >
              Filme
            </button>
            <button 
              onClick={() => { setMediaType("tv"); setSelectedGenre(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mediaType === "tv" ? "bg-white shadow-sm text-indigo-500" : "text-slate-500"}`}
            >
              Serien
            </button>
          </div>

          <select 
            value={decade}
            onChange={(e) => setDecade(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none hover:bg-slate-200 transition-colors"
          >
            {decades.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg hover:bg-slate-200 transition-all text-xs font-bold shadow-md"
          >
            Genre {selectedGenre ? genres.find(g => g.id === selectedGenre)?.name : ""}
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-bold">Kategorie wählen</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>
            <div className="p-6 max-h-[50vh] overflow-y-auto grid grid-cols-2 gap-2">
              <button 
                onClick={() => { setSelectedGenre(null); setIsModalOpen(false); }}
                className={`p-2 text-left text-sm rounded-lg ${selectedGenre === null ? "bg-rose-50 text-rose-600 font-bold" : "hover:bg-slate-50"}`}
              >
                Alle Genres
              </button>
              {genres.map(g => (
                <button 
                  key={g.id}
                  onClick={() => { setSelectedGenre(g.id); setIsModalOpen(false); }}
                  className={`p-2 text-left text-sm rounded-lg ${selectedGenre === g.id ? "bg-rose-50 text-rose-600 font-bold" : "hover:bg-slate-50"}`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {items.map((item) => (
          <div key={item.movie_id || item.id} className="relative bg-white rounded-xl shadow-sm overflow-hidden group h-80 transition-transform duration-300 hover:scale-[1.03]">
            <img 
              src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/placeholder.jpg"} 
              alt="Poster" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-slate-900/95 opacity-0 group-hover:opacity-100 transition-all duration-300 text-white p-4 flex flex-col justify-between">
              <div className="overflow-y-auto pr-1">
                <h3 className={`text-sm font-bold mb-1 leading-tight ${mediaType === 'movie' ? 'text-rose-500' : 'text-indigo-400'}`}>
                  {item.title || item.name}
                </h3>
                <div className="text-[10px] font-bold text-slate-400 mb-2">
                  ★ {item.vote_average.toFixed(1)} Rating | {(item.release_date || item.first_air_date || "").split("-")[0]}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug line-clamp-6">{item.overview || "Keine Beschreibung verfügbar."}</p>
              </div>
              <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                <a 
                  href={`https://www.themoviedb.org/${mediaType}/${item.movie_id || item.id}`} 
                  target="_blank" 
                  className={`text-center text-white text-[10px] font-bold py-2 rounded-lg uppercase tracking-wider ${mediaType === 'movie' ? 'bg-rose-600' : 'bg-indigo-600'}`}
                >
                  Details
                </a>
                <button 
                  onClick={() => addToWatchlist(item)} 
                  className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold py-2 rounded-lg uppercase tracking-wider transition-all"
                >
                  + Watchlist
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}