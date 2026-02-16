import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { mediaType, genre, decade, action, type, language } = await req.json()
    const API_KEY = Deno.env.get('TMDB_API_KEY')
    let url = ""

    const dateKey = mediaType === "movie" ? "primary_release_date" : "first_air_date"

    // FALL A: Genres laden
    if (action === "get_genres") {
      url = `https://api.themoviedb.org/3/genre/${mediaType}/list?api_key=${API_KEY}&language=de-DE`
    } 
    // FALL B: Top-Bewertete
    else if (type === "top_rated") {
      // Wenn Filter (Genre, Jahrzehnt oder Sprache) aktiv sind, MÜSSEN wir 'discover' nutzen
      if (genre || decade || language) {
        url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${API_KEY}&language=de-DE&sort_by=vote_average.desc&vote_count.gte=500`
      } else {
        url = `https://api.themoviedb.org/3/${mediaType}/top_rated?api_key=${API_KEY}&language=de-DE&page=1`
      }
    }
    // FALL C: Neuerscheinungen (Standard)
    else {
      const today = new Date().toISOString().split('T')[0]
      url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${API_KEY}&language=de-DE&sort_by=${dateKey}.desc&${dateKey}.lte=${today}&vote_count.gte=50`
    }

    // --- FILTER ANHÄNGEN (Nur bei Discover-URLs möglich) ---
    if (url.includes("discover")) {
      // 1. Genre Filter
      if (genre) url += `&with_genres=${genre}`
      
      // 2. Original-Sprache Filter (Der entscheidende Teil!)
      // 'language' enthält hier den ISO-Code wie 'ko', 'en', 'de'
      if (language) url += `&with_original_language=${language}`

      // 3. Jahrzehnt Filter
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