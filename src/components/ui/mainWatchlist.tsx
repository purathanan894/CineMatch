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
  
  // NEU: State für die aktive Karte (für Mobile-Support)
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
    <main className="mt-24 w-full max-w-7xl mx-auto p-4 sm:p-6 text-slate-900">
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
                className="relative bg-white rounded-xl shadow-sm overflow-hidden aspect-[2/3] 
                           transition-all duration-300 md:hover:scale-[1.05] 
                           active:scale-95 touch-manipulation cursor-pointer"
                onMouseEnter={() => setActiveCardId(movie.movie_id)}
                onMouseLeave={() => setActiveCardId(null)}
                onClick={() => setActiveCardId(isActive ? null : movie.movie_id)}
              >
                <img
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "/placeholder.jpg"
                  }
                  alt={movie.title}
                  className={`w-full h-full object-cover transition-transform duration-500 ${isActive ? 'scale-110' : 'scale-100'}`}
                />

                {/* Overlay via State gesteuert */}
                <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-900/40 
                                p-4 flex flex-col justify-end text-white transition-opacity duration-300
                                ${isActive ? "opacity-100 visible" : "opacity-0 invisible"}`}>
                  
                  <div className="overflow-y-auto max-h-[70%] mb-3 custom-scrollbar">
                    <h3 className="text-sm font-bold mb-1 text-rose-500 leading-tight">
                        {movie.title}
                    </h3>
                    <div className="text-[10px] text-slate-300 mb-2">
                      ★ {movie.vote_average.toFixed(1)} | {movie.release_date?.split("-")[0]}
                    </div>
                    <p className="text-[11px] text-slate-200 leading-snug line-clamp-4 sm:line-clamp-6">
                        {movie.overview}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWatchlist(movie.movie_id);
                      }}
                      className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-[10px] font-bold py-2 rounded-lg uppercase tracking-wider transition-all"
                    >
                      Entfernen
                    </button>

                    <a
                      href={`https://www.themoviedb.org/movie/${movie.movie_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold py-2 rounded-lg text-center uppercase tracking-wider"
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