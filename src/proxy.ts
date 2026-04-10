import { auth } from '@/lib/auth-config'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })

  const { pathname } = request.nextUrl
  const isPublic = pathname.startsWith('/sign-in')
  const isAuthApi = pathname.startsWith('/api/auth')
  const isCronApi = pathname.startsWith('/api/cron')
  if (!isPublic && !isAuthApi && !isCronApi && !session) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  if (pathname === '/sign-in' && session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next|.*\\..*).*)'] }
