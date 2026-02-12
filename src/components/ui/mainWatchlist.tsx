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

  if (loading) return <p className="text-center mt-10">Lade Watchlist…</p>;

  return (
    <main className="mt-24 sm:mt-16 w-full max-w-5xl mx-auto p-6 sm:p-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Meine Watchlist</h2>

      {watchlist.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-500 mb-4">Deine Watchlist ist noch leer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {watchlist.map((movie) => (
            <div
              key={movie.id}
              className="relative bg-white rounded-xl shadow-md overflow-hidden group"
            >
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : "/placeholder.jpg"
                }
                alt={movie.title}
                className="w-full h-64 object-cover"
              />

              <div className="absolute inset-0 bg-black bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-white p-4 flex flex-col justify-center">
                <h3 className="text-lg font-bold mb-1">{movie.title}</h3>
                <p className="text-sm mb-1">Rating: {movie.vote_average}</p>
                <p className="text-xs mb-4 line-clamp-3">{movie.overview}</p>

                <button
                  onClick={() => removeFromWatchlist(movie.movie_id)}
                  className="mt-auto bg-gray-200 hover:bg-white text-black text-xs font-bold py-2 px-3 rounded mb-2"
                >
                  Entfernen
                </button>

                <a
                  href={`https://www.themoviedb.org/movie/${movie.movie_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-3 rounded text-center"
                >
                  Details
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
