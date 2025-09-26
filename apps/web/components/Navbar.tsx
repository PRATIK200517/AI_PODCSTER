"use client"

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { Menu, X, Search, Mic } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavbarProps {
  onSearch?: (query: string) => void;
}
const BACKEND_URL=process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
console.log(BACKEND_URL);
export default function Navbar({ onSearch }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, isLoaded } = useUser()
  const pathname = usePathname()

  // Automatically create user profile when user signs in
  useEffect(() => {
    const createUserProfile = async () => {
      if (user && isLoaded) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/profile/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              username: user.username || user.fullName || user.emailAddresses[0]?.emailAddress,
              email: user.emailAddresses[0]?.emailAddress,
              bio: "Welcome to my podcast profile!",
              avatar_url: user.imageUrl,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to create user profile')
          }

          const data = await response.json()
          console.log('User profile created/updated:', data)
        } catch (error) {
          console.error('Error creating user profile:', error)
        }
      }
    }

    createUserProfile()
  }, [user, isLoaded])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const navItems = [
    { name: 'Home', href: '/', active: true },
    { name: 'Discover', href: '/discover' },
    { name: 'Create', href: '/create' },
    { name: 'Profile', href: '/profile' }
  ];

  return (
    <nav className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Mic className="h-8 w-8 text-purple-500" />
              <Link href="/" className="ml-2 text-xl font-bold text-white">PodcastAI</Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          {
            // pathname=="/" &&
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${pathname === item.href
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          }

          {/* Search Bar */}
          {
            pathname == "/" &&
            <div className="hidden md:block flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search podcasts, creators, topics..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </form>
            </div>
          }

          {/* Auth Buttons */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <SignedOut>
                <div className="flex gap-3">
                  <SignInButton>
                    <button className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-500 transition">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
              <SignedIn>
                <Link href="/profile">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "h-8 w-8 cursor-pointer",
                      }
                    }}
                  />
                </Link>
              </SignedIn>

            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            >
              {menuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${pathname === item.href
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile Search */}
          <div className="px-4 pb-3">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search podcasts..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </form>
          </div>

          {/* Mobile Auth */}
          <div className="pt-4 pb-3 border-t border-gray-700 px-4">
            <SignedOut>
              <div className="flex flex-col gap-3">
                <SignInButton>
                  <button className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-purple-600 text-white hover:bg-purple-500">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="flex justify-center">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-10 w-10",
                    }
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </nav>
  )
}