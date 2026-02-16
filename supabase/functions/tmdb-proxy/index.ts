// Du kannst den alten Import oben komplett löschen oder auskommentieren.
// Deno.serve ist in der Supabase-Umgebung global verfügbar.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // CORS Handling für Browser-Anfragen
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { mediaType, genre, decade, action, type, language } = await req.json()
    const API_KEY = Deno.env.get('TMDB_API_KEY')
    const today = new Date().toISOString().split('T')[0]
    
    // Basis-Parameter für TMDB
    const params = new URLSearchParams({
      api_key: API_KEY || "",
      language: "de-DE", // Die Texte (Titel/Beschreibung) immer auf Deutsch
      page: "1"
    });

    let endpoint = "";
    const dateKey = mediaType === "movie" ? "primary_release_date" : "first_air_date";

    // FALL A: Genres laden
    if (action === "get_genres") {
      endpoint = `genre/${mediaType}/list`;
    } 
    // FALL B: Top-Bewertete (Globaler Standard ohne Filter)
    else if (type === "top_rated" && !genre && !decade && !language) {
      endpoint = `${mediaType}/top_rated`;
    }
    // FALL C: Alles andere (Neuerscheinungen, Filter & Sprache) via Discover
    else {
      endpoint = `discover/${mediaType}`;
      
      // Sortierung: Entweder nach Wertung oder nach Datum
      params.append("sort_by", type === "top_rated" ? "vote_average.desc" : `${dateKey}.desc`);
      
      // Keine Filme anzeigen, die erst in der Zukunft erscheinen
      params.append(`${dateKey}.lte`, today);
      
      // --- VOTE-LIMIT LOGIK (Wichtig für Tamil/Regional) ---
      // Wir senken das Limit auf 10, wenn eine Sprache gewählt ist, 
      // damit Top-Filme aus Indien/Korea nicht weggefiltert werden.
      let minVotes = "5"; 
      if (type === "top_rated") {
        minVotes = language ? "10" : "500"; 
      }
      params.append("vote_count.gte", minVotes);

      if (genre) params.append("with_genres", genre.toString());
      if (language) params.append("with_original_language", language);
      
      if (decade) {
        const start = `${decade}-01-01`;
        const end = `${parseInt(decade) + 9}-12-31`;
        params.append(`${dateKey}.gte`, start);
        params.append(`${dateKey}.lte`, end);
      }
    }

    const finalUrl = `https://api.themoviedb.org/3/${endpoint}?${params.toString()}`;
    
    const response = await fetch(finalUrl);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})