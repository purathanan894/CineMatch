import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { mediaType, genre, decade, action, type } = await req.json()
    const API_KEY = Deno.env.get('TMDB_API_KEY')
    let url = ""

    const dateKey = mediaType === "movie" ? "primary_release_date" : "first_air_date"

    // FALL A: Genres laden
    if (action === "get_genres") {
      url = `https://api.themoviedb.org/3/genre/${mediaType}/list?api_key=${API_KEY}&language=de-DE`
    } 
    // FALL B: Top-Bewertete (Discovery Seite)
    else if (type === "top_rated") {
      // WICHTIG: Wir nutzen hier den speziellen 'top_rated' Endpunkt von TMDB, 
      // da dieser bereits gewichtete Algorithmen für die "besten Filme" nutzt.
      url = `https://api.themoviedb.org/3/${mediaType}/top_rated?api_key=${API_KEY}&language=de-DE&page=1`
    }
    // FALL C: Neuerscheinungen (Main Seite)
    else {
      const today = new Date().toISOString().split('T')[0]
      url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${API_KEY}&language=de-DE&sort_by=${dateKey}.desc&${dateKey}.lte=${today}&vote_count.gte=50`
    }

    // Filter für Genre und Jahrzehnt anhängen
    // Hinweis: Bei dem direkten /top_rated Endpunkt funktionieren Filter wie 'decade' 
    // manchmal anders. Falls du strikte Filter brauchst, nutzen wir wieder 'discover':
    if (type === "top_rated" && (genre || decade)) {
       url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${API_KEY}&language=de-DE&sort_by=vote_average.desc&vote_count.gte=1000`
       if (genre) url += `&with_genres=${genre}`
       if (decade) {
          const start = `${decade}-01-01`
          const end = `${parseInt(decade) + 9}-12-31`
          url += `&${dateKey}.gte=${start}&${dateKey}.lte=${end}`
       }
    }

    const response = await fetch(url)
    const data = await response.json()

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