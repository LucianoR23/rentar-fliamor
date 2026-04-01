import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          }),
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = pathname.startsWith('/sign-in')
  const isProtectedApi =
    pathname.startsWith('/api') && !pathname.startsWith('/api/indices')

  if ((!isPublic || isProtectedApi) && !user) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  if (pathname === '/sign-in' && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = { matcher: ['/((?!_next|.*\\..*).*)'] }
