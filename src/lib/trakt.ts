import axios from 'axios'

const TRAKT_CLIENT_ID = '3c8380367bb7da29faf83437eab175afa31d998c4c7067e41b3dcbd7222fc6cd'
const TRAKT_REDIRECT_URI = 'http://localhost:5173/callback'

const trakt = axios.create({
  baseURL: 'https://api.trakt.tv',
  headers: {
    'Content-Type': 'application/json',
    'trakt-api-version': '2',
    'trakt-api-key': TRAKT_CLIENT_ID,
  },
})

export const getTraktAuthUrl = () => {
  return `https://trakt.tv/oauth/authorize?response_type=code&client_id=${TRAKT_CLIENT_ID}&redirect_uri=${TRAKT_REDIRECT_URI}`
}

export const addToWatchlist = async (movieId: number, accessToken: string) => {
  try {
    await trakt.post(
      '/sync/watchlist',
      {
        movies: [
          {
            ids: {
              tmdb: movieId,
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    return true
  } catch (error) {
    console.error('Failed to add to watchlist:', error)
    return false
  }
}