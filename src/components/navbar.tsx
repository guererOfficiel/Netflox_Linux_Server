import { Link, useLocation } from 'react-router-dom'
import { Film, Search, BookmarkPlus, User } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/auth'

const navigation = [
  { name: 'Parcourir', href: '/', icon: Film },
  { name: 'Rechercher', href: '/search', icon: Search },
  { name: 'Ma Liste', href: '/my-list', icon: BookmarkPlus },
]

export function Navbar() {
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Film className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Net-Flox</span>
            </Link>
            <div className="ml-10 flex items-center space-x-4">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium',
                      location.pathname === item.href
                        ? 'bg-primary text-white'
                        : 'text-gray-300 hover:bg-primary/10 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          <div>
            {isAuthenticated ? (
              <Link
                to="/profile"
                className={cn(
                  'flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium',
                  location.pathname === '/profile'
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-primary/10 hover:text-white'
                )}
              >
                <User className="h-4 w-4" />
                <span>Profil</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}