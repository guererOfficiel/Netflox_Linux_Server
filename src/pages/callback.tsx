import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { createSession, getAccountDetails } from '../lib/tmdb'

export function Callback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setSessionId, setAccountId } = useAuthStore()

  useEffect(() => {
    const requestToken = searchParams.get('request_token')
    
    async function handleAuth() {
      if (requestToken) {
        try {
          // Créer une session avec le request token
          const sessionId = await createSession(requestToken)
          setSessionId(sessionId)

          // Récupérer les détails du compte
          const accountDetails = await getAccountDetails(sessionId)
          setAccountId(accountDetails.id)

          navigate('/')
        } catch (error) {
          console.error('Erreur d\'authentification:', error)
          navigate('/login')
        }
      }
    }

    handleAuth()
  }, [searchParams, setSessionId, setAccountId, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-xl">Authentification en cours...</div>
    </div>
  )
}