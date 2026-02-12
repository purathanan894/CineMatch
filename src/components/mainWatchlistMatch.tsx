import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/ui/header";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-white to-[#FF0800] p-4 sm:p-6 flex items-center justify-center">
        <p className="text-white font-black animate-pulse uppercase tracking-widest">Lade Watchlist...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-[#FF0800] p-4 sm:p-6 relative text-slate-900">
      <Header />

      <main className="mt-12 max-w-7xl mx-auto bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 shadow-2xl min-h-[70vh]">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black uppercase text-slate-800 tracking-tighter">
            Cine <span className="text-[#FF0800] italic">Match</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {watchlist.length} {watchlist.length === 1 ? 'Film gespeichert' : 'Filme gespeichert'}
          </p>
        </div>

        {watchlist.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-[3rem] border-4 border-dashed border-[#FF0800]/10">
            <div className="text-4xl mb-4">🎬</div>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Deine Liste ist noch leer.</p>
            <a href="/finder" className="inline-block mt-6 bg-[#FF0800] text-white px-6 py-2 rounded-full font-bold text-xs uppercase hover:scale-105 transition-all">
              Jetzt Filme entdecken
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {watchlist.map((movie) => (
              <div 
                key={movie.id} 
                className="relative bg-white rounded-xl shadow-sm overflow-hidden group h-[320px] transition-transform duration-300 hover:scale-[1.03] border border-slate-100"
              >
                <img 
                  src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "/placeholder.jpg"} 
                  alt={movie.title} 
                  className="w-full h-full object-cover" 
                />
                
                {/* Hover Overlay - Identisch mit Discovery/MatchPage */}
                <div className="absolute inset-0 bg-slate-900/95 opacity-0 group-hover:opacity-100 transition-all duration-300 text-white p-4 flex flex-col justify-between">
                  <div className="overflow-y-auto pr-1">
                    <h3 className="text-sm font-bold mb-1 text-[#FF0800] leading-tight">
                      {movie.title}
                    </h3>
                    <div className="text-[10px] font-bold text-slate-400 mb-2">
                      ★ {movie.vote_average?.toFixed(1)} Rating | {movie.release_date?.split("-")[0]}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug line-clamp-6">
                      {movie.overview || "Keine Beschreibung verfügbar."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                    <a 
                      href={`https://www.themoviedb.org/movie/${movie.movie_id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-center bg-[#FF0800] text-white text-[10px] font-bold py-2 rounded-lg uppercase tracking-wider hover:bg-[#C80815] transition-colors"
                    >
                      Details
                    </a>
                    <button 
                      onClick={() => removeFromWatchlist(movie.movie_id)} 
                      className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold py-2 rounded-lg uppercase tracking-wider transition-all"
                    >
                      Entfernen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}