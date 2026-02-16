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

export default function DiscoveryPage() {
  const { user } = useAuth();
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [decade, setDecade] = useState<string>(""); 
  const [items, setItems] = useState<Media[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State für die aktive Karte
  const [activeCardId, setActiveCardId] = useState<number | null>(null);

  // ... (Die fetchWithCache und useEffect Logik bleibt exakt wie in deinem Code)

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
      const results = await fetchWithCache(mediaType, "newest", selectedGenre, decade);
      setItems(results.slice(0, 18));
    };
    loadData();
  }, [mediaType, selectedGenre, decade]);

  const addToWatchlist = async (item: Media) => {
    if (!user) { alert("Bitte einloggen!"); return; }
    const actualMovieId = item.movie_id || item.id;
    const { data: existing } = await supabase.from("watchlist").select("id").eq("user_id", user.id).eq("movie_id", actualMovieId).maybeSingle();
    if (existing) { alert("Bereits in der Liste!"); return; }

    await supabase.from("watchlist").insert({
      user_id: user.id,
      movie_id: actualMovieId,
      title: item.title || item.name,
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      overview: item.overview,
      release_date: item.release_date || item.first_air_date,
    });
    alert("Hinzugefügt!");
  };

  return (
    <main className="mt-20 w-full max-w-7xl mx-auto p-4 sm:p-6 text-slate-900">
      
      {/* Header Bereich (bleibt gleich) */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-8 border-b pb-6">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-slate-800">
            Die neuesten {mediaType === "movie" ? "Filme" : "Serien"}
          </h2>
          <p className="text-[10px] text-slate-500 font-medium">Frisch aus dem Kino & TV</p>
        </div>
        {/* ... Buttons und Select ... */}
      </div>

      {/* Movie Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {items.map((item) => {
          const id = item.movie_id || item.id;
          const isActive = activeCardId === id;

          return (
            <div 
              key={id} 
              // touch-action: manipulation verhindert das 300ms Delay auf Handys
              style={{ touchAction: 'manipulation' }}
              className="relative bg-white rounded-xl shadow-sm overflow-hidden aspect-[2/3] transition-all duration-300 md:hover:scale-[1.05] cursor-pointer border border-slate-100"
              onMouseEnter={() => setActiveCardId(id)} 
              onMouseLeave={() => setActiveCardId(null)}    
              onClick={() => setActiveCardId(isActive ? null : id)} 
            >
              <img 
                src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/placeholder.jpg"} 
                alt="Poster" 
                // pointer-events-none ist kritisch, damit das Bild den Klick nicht "schluckt"
                className={`w-full h-full object-cover pointer-events-none transition-transform duration-500 ${isActive ? 'scale-110 blur-[1px]' : 'scale-100'}`} 
              />

              {/* Overlay */}
              <div 
                className={`absolute inset-0 z-20 bg-gradient-to-t from-slate-950 via-slate-900/95 to-slate-900/40 p-4 flex flex-col justify-end text-white transition-all duration-300 ${
                  isActive ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-4"
                }`}
              >
                {/* Schließen-Icon nur für Mobile sichtbar */}
                <div className="absolute top-2 right-2 md:hidden">
                    <span className="bg-white/20 p-1 rounded-full text-[10px]">✕</span>
                </div>

                <div className="overflow-y-auto max-h-[70%] mb-3">
                  <h3 className="text-sm font-bold mb-1 text-rose-500 leading-tight">{item.title || item.name}</h3>
                  <div className="text-[10px] text-slate-300 mb-2 font-bold">★ {item.vote_average.toFixed(1)}</div>
                  <p className="text-[11px] text-slate-200 leading-snug line-clamp-4 italic">{item.overview}</p>
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                  <a 
                    href={`https://www.themoviedb.org/${mediaType}/${id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    // e.stopPropagation verhindert, dass die Karte sich schließt beim Klick auf den Link
                    onClick={(e) => e.stopPropagation()}
                    className="text-center bg-rose-600 text-[10px] font-bold py-2.5 rounded-lg uppercase"
                  >
                    Details
                  </a>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      addToWatchlist(item);
                    }} 
                    className="bg-white/10 text-[10px] font-bold py-2.5 rounded-lg uppercase"
                  >
                    + Watchlist
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* ... Genre Modal ... */}
    </main>
  );
}