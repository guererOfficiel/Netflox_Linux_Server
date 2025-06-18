import axios from 'axios'

const TMDB_API_KEY = 'e5e51a3745fc18231f2b073764372e26'
const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

export const tmdb = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
    language: 'fr-FR',
    region: 'FR'
  },
})

export const getImageUrl = (path: string, size: 'w500' | 'original' = 'w500') =>
  path ? `${IMAGE_BASE_URL}/${size}${path}` : null

export async function createRequestToken() {
  const { data } = await tmdb.get('/authentication/token/new')
  return data.request_token
}

export async function createSession(requestToken: string) {
  const { data } = await tmdb.post('/authentication/session/new', {
    request_token: requestToken
  })
  return data.session_id
}

export async function getAccountDetails(sessionId: string) {
  const { data } = await tmdb.get('/account', {
    params: { session_id: sessionId }
  })
  return data
}

export async function getTrending() {
  const { data } = await tmdb.get('/trending/movie/week')
  return data.results
}

export async function getMovieDetails(id: string) {
  const { data } = await tmdb.get(`/movie/${id}`)
  return data
}

export async function searchMovies(query: string) {
  const { data } = await tmdb.get('/search/movie', {
    params: { query }
  })
  return data.results
}

export async function getPopular() {
  const { data } = await tmdb.get('/movie/popular')
  return data.results
}

export async function getTopRated() {
  const { data } = await tmdb.get('/movie/top_rated')
  return data.results
}

export async function addToList(movieId: number, sessionId: string, accountId: number) {
  const { data } = await tmdb.post(`/account/${accountId}/watchlist`, {
    media_type: 'movie',
    media_id: movieId,
    watchlist: true
  }, {
    params: {
      session_id: sessionId
    }
  })
  return data
}

export async function getWatchlist(sessionId: string, accountId: number) {
  const { data } = await tmdb.get(`/account/${accountId}/watchlist/movies`, {
    params: {
      session_id: sessionId
    }
  })
  return data.results
}