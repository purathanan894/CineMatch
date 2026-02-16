import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Media = {
  id: number;
  movie_id?: number; 
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
  const [origLanguage, setOrigLanguage] = useState<string>(""); 
  
  const [items, setItems] = useState<Media[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCardId, setActiveCardId] = useState<number | null>(null);

  const decades = [
    { label: "Alle Zeit", value: "" },
    { label: "2020er", value: "2020" },
    { label: "2010er", value: "2010" },
    { label: "2000er", value: "2000" },
    { label: "90er", value: "1990" },
    { label: "80er", value: "1980" },
    { label: "70er", value: "1970" },
  ];

  const languages = [
    { label: "Alle Sprachen", value: "" },
    { label: "Englisch", value: "en" },
    { label: "Deutsch", value: "de" },
    { label: "Französisch", value: "fr" },
    { label: "Tamil", value: "ta" },
    { label: "Hindi", value: "hi" },
    { label: "Koreanisch", value: "ko" },
    { label: "Japanisch", value: "ja" },
  ];

  const fetchWithCache = async (mType: string, type: string, genre: number | null, dec: string, lang: string) => {
    const cacheKey = `top-${mType}-${genre || 'all'}-${dec || 'all'}-${lang || 'all'}`;

    const { data: cachedMovies } = await supabase.from('movie_cache').select('*').eq('cache_key', cacheKey);
    
    const isExpired = cachedMovies && cachedMovies.length > 0
      ? (new Date().getTime() - new Date(cachedMovies[0].updated_at).getTime() > 24 * 60 * 60 * 1000) 
      : true;

    if (cachedMovies && cachedMovies.length > 0 && !isExpired) return cachedMovies;

    const { data: apiResponse } = await supabase.functions.invoke('tmdb-proxy', {
      body: { mediaType: mType, type: "top_rated", genre, decade: dec, language: lang }
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
      const results = await fetchWithCache(mediaType, "top_rated", selectedGenre, decade, origLanguage);
      setItems(results.slice(0, 18));
    };
    loadData();
  }, [mediaType, selectedGenre, decade, origLanguage]);

  const addToWatchlist = async (item: Media) => {
    if (!user) { alert("Bitte einloggen!"); return; }
    const tmdbId = item.movie_id || item.id;
    const title = item.title || item.name;
    const { data: existing } = await supabase.from("watchlist").select("id").eq("user_id", user.id).eq("movie_id", tmdbId).maybeSingle();
    if (existing) { alert(`${title} bereits in Liste!`); return; }
    const { error } = await supabase.from("watchlist").insert({
      user_id: user.id, movie_id: tmdbId, title: title, poster_path: item.poster_path,
      vote_average: item.vote_average, overview: item.overview, release_date: item.release_date || item.first_air_date,
    });
    if (!error) alert(`${title} hinzugefügt!`);
  };

  return (
    <main className="mt-20 w-full max-w-7xl mx-auto p-4 sm:p-6 text-slate-900 overflow-x-hidden">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-8 border-b pb-6">
        <div>
           <h2 className="text-xl font-bold uppercase tracking-widest text-slate-800">
             Top 18 {mediaType === "movie" ? "Filme" : "Serien"}
           </h2>
           <p className="text-[10px] text-slate-500 font-medium">Sortiert nach besten Bewertungen</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-slate-100 p-1 rounded-xl items-center shadow-sm border border-slate-200">
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

            {/* Hier ist der Sprachfilter direkt im Bar-Layout */}
            <div className="flex items-center gap-2 ml-2 px-3 py-1 border-l border-slate-200">
              <span className="text-[9px] font-black uppercase text-slate-400">Sprache</span>
              <select 
                value={origLanguage} 
                onChange={(e) => { setOrigLanguage(e.target.value); setItems([]); }} 
                className="bg-transparent text-xs font-bold outline-none cursor-pointer py-1"
              >
                {languages.map(lang => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
              </select>
            </div>
          </div>

          {/* Jahrzehnt-Filter */}
          <select 
            value={decade}
            onChange={(e) => { setDecade(e.target.value); setItems([]); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer hover:bg-slate-50 shadow-sm"
          >
            {decades.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>

          <button onClick={() => setIsModalOpen(true)} className="bg-white border border-slate-200 text-black px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50">
             Genre {selectedGenre ? genres.find(g => g.id === selectedGenre)?.name : ""}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {items.length > 0 ? items.map((item) => {
          const id = item.movie_id || item.id;
          const isActive = activeCardId === id;
          return (
            <div key={id} onPointerUp={() => setActiveCardId(isActive ? null : id)} className="relative bg-black rounded-xl shadow-lg overflow-hidden aspect-[2/3] cursor-pointer border border-slate-800 group">
              <img src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/placeholder.jpg"} alt="Poster" className={`w-full h-full object-cover transition-all duration-500 ${isActive ? 'opacity-40 blur-sm scale-110' : 'opacity-100 group-hover:scale-105'}`} />
              <div className={`absolute inset-0 z-50 flex flex-col justify-end p-4 transition-all duration-300 ${isActive ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`} style={{ background: 'linear-gradient(to top, black 0%, rgba(0,0,0,0.8) 60%, transparent 100%)' }}>
                <div className="overflow-y-auto max-h-[70%] mb-3 no-scrollbar">
                   <h3 className={`text-sm font-black mb-1 leading-tight uppercase ${mediaType === 'movie' ? 'text-rose-500' : 'text-indigo-400'}`}>{item.title || item.name}</h3>
                   <div className="text-[10px] text-slate-300 mb-2 font-bold flex items-center gap-2"><span className="text-yellow-400">★</span> {item.vote_average.toFixed(1)} <span>|</span> {(item.release_date || item.first_air_date || "").split("-")[0]}</div>
                   <p className="text-[11px] text-white/90 leading-snug line-clamp-4 italic">{item.overview}</p>
                </div>
                <div className="flex flex-col gap-2 pt-3 border-t border-white/20">
                  <a href={`https://www.themoviedb.org/${mediaType}/${id}`} target="_blank" rel="noopener noreferrer" onPointerUp={(e) => e.stopPropagation()} className={`text-center text-white text-[10px] font-black py-3 rounded-lg uppercase tracking-wider ${mediaType === 'movie' ? 'bg-rose-600' : 'bg-indigo-600'}`}>Details</a>
                  <button onPointerUp={(e) => { e.stopPropagation(); addToWatchlist(item); }} className="bg-white/20 text-white text-[10px] font-black py-3 rounded-lg uppercase backdrop-blur-md transition-all hover:bg-white/30">+ Watchlist</button>
                </div>
              </div>
            </div>
          );
        }) : <div className="col-span-full py-20 text-center text-slate-400 font-bold animate-pulse">Lade Top-Titel...</div>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-black text-slate-800 mb-4 uppercase text-center">Genre wählen</h3>
            <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto no-scrollbar">
              <button onClick={() => { setSelectedGenre(null); setIsModalOpen(false); }} className={`p-3 text-left rounded-xl text-xs font-bold ${selectedGenre === null ? "bg-rose-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>Alle Genres</button>
              {genres.map(g => (
                <button key={g.id} onClick={() => { setSelectedGenre(g.id); setIsModalOpen(false); }} className={`p-3 text-left rounded-xl text-xs font-bold ${selectedGenre === g.id ? "bg-rose-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>{g.name}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}