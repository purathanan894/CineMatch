import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type WatchlistMovie = {
  id: number;        // DB Row ID
  movie_id: number;  // TMDB Movie ID
  title: string;
  poster_path: string;
  vote_average: number;
  overview: string;
  release_date: string;
};

export default function WatchlistPage() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistMovie[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State für die aktive Karte (Mobile-Support & Desktop)
  const [activeCardId, setActiveCardId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadWatchlist = async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user.id);

      if (!error && data) {
        setWatchlist(data as WatchlistMovie[]);
      }

      setLoading(false);
    };

    loadWatchlist();
  }, [user]);

  const removeFromWatchlist = async (movieId: number) => {
    if (!user) return;

    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("user_id", user.id)
      .eq("movie_id", movieId);

    if (!error) {
      setWatchlist((prev) => prev.filter((m) => m.movie_id !== movieId));
    }
  };

  if (loading) return <p className="text-center mt-20 font-bold animate-pulse text-slate-500">Lade Watchlist…</p>;

  return (
    <main className="mt-24 w-full max-w-7xl mx-auto p-4 sm:p-6 text-slate-900 overflow-x-hidden">
      <div className="border-b pb-6 mb-8">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-800">Meine Watchlist</h2>
        <p className="text-[10px] text-slate-500 font-medium">Deine persönlich gespeicherten Favoriten</p>
      </div>

      {watchlist.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 mb-4 font-medium">Deine Watchlist ist noch leer.</p>
          <a href="/discovery" className="text-rose-600 font-bold text-sm hover:underline">
            Jetzt Filme entdecken →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {watchlist.map((movie) => {
            const isActive = activeCardId === movie.movie_id;

            return (
              <div
                key={movie.id}
                // FIX: onPointerUp für sofortige Reaktion am Handy
                onPointerUp={() => setActiveCardId(isActive ? null : movie.movie_id)}
                className="relative bg-black rounded-xl shadow-lg overflow-hidden aspect-[2/3] 
                           transition-all duration-300 md:hover:scale-[1.05] cursor-pointer border border-slate-800"
              >
                <img
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "/placeholder.jpg"
                  }
                  alt={movie.title}
                  className={`w-full h-full object-cover transition-all duration-500 ${isActive ? 'opacity-40 blur-sm scale-110' : 'opacity-100 scale-100'}`}
                />

                {/* Overlay mit Translate-Animation */}
                <div 
                  className={`absolute inset-0 z-50 flex flex-col justify-end p-4 transition-all duration-300 ${
                    isActive ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                  }`}
                  style={{ background: 'linear-gradient(to top, black 0%, rgba(0,0,0,0.8) 60%, transparent 100%)' }}
                >
                  
                  <div className="overflow-y-auto max-h-[70%] mb-3 no-scrollbar">
                    <h3 className="text-sm font-black mb-1 text-rose-500 leading-tight uppercase">
                        {movie.title}
                    </h3>
                    <div className="text-[10px] text-slate-300 mb-2 font-bold flex items-center gap-2">
                      <span className="text-yellow-400">★</span> {movie.vote_average.toFixed(1)} 
                      <span>|</span> 
                      {movie.release_date?.split("-")[0]}
                    </div>
                    <p className="text-[11px] text-white/90 leading-snug line-clamp-5 italic">
                        {movie.overview}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-white/20">
                    <button
                      onPointerUp={(e) => {
                        e.stopPropagation();
                        removeFromWatchlist(movie.movie_id);
                      }}
                      className="bg-white/20 text-white text-[10px] font-black py-3 rounded-lg uppercase backdrop-blur-md transition-all active:bg-white/40"
                    >
                      Entfernen
                    </button>

                    <a
                      href={`https://www.themoviedb.org/movie/${movie.movie_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onPointerUp={(e) => e.stopPropagation()}
                      className="bg-rose-600 text-white text-[10px] font-black py-3 rounded-lg text-center uppercase shadow-xl"
                    >
                      Details
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}