/**
 * ============================================================================
 * DIVINE MIDDLEWARE - Authentication & Route Protection
 * ============================================================================
 * Protège les routes (app) et laisse passer les routes publiques (auth, marketing)
 * ============================================================================
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes publiques qui ne nécessitent PAS d'authentification
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  // Marketing pages (landing, pricing, etc.)
  '/',
]

// Routes qui nécessitent une authentification
const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/analytics',
  '/calls',
  '/assistants',
  '/settings',
  '/onboarding',
  '/ava-profile',
]

/**
 * Normalise le chemin en retirant le préfixe locale (/fr, /en, /he)
 * tout en conservant un slash unique (évite //login → casse les règles).
 */
function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/[a-z]{2}(\/.*)?$/)
  if (!match) {
    return pathname
  }

  return match[1] ?? '/'
}

/**
 * Vérifie si la route est publique
 */
function isPublicRoute(pathname: string): boolean {
  const normalizedPath = stripLocale(pathname)
  
  return PUBLIC_ROUTES.some(route => 
    normalizedPath === route || normalizedPath.startsWith(`${route}/`)
  )
}

/**
 * Vérifie si la route nécessite une authentification
 */
function isProtectedRoute(pathname: string): boolean {
  const normalizedPath = stripLocale(pathname)
  
  return PROTECTED_ROUTE_PREFIXES.some(prefix => 
    normalizedPath.startsWith(prefix)
  )
}

/**
 * Extrait le token d'authentification des cookies
 */
function getAuthToken(request: NextRequest): string | null {
  // Try cookie first (server-side)
  const cookieToken = request.cookies.get('access_token')?.value
  if (cookieToken) return cookieToken
  
  // Fallback: check Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  return null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for:
  // - API routes (handled by API route auth)
  // - Static files
  // - Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // Check if route is public
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }
  
  // Check if route needs protection
  if (isProtectedRoute(pathname)) {
    const token = getAuthToken(request)
    
    if (!token) {
      // No token → redirect to login with return URL
      const locale = pathname.match(/^\/([a-z]{2})\//)?.[1] || 'en'
      const loginUrl = new URL(`/${locale}/login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      
      return NextResponse.redirect(loginUrl)
    }
    
    // Token exists → allow access
    // Note: Token validation is done by API routes, not middleware
    // to avoid unnecessary backend calls on every request
    return NextResponse.next()
  }
  
  // Default: allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
