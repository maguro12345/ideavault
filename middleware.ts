 import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const basicAuth = request.headers.get('authorization')

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1]
      const [user, pwd] = atob(authValue).split(':')

      if (user === process.env.ADMIN_USER && pwd === process.env.ADMIN_PASSWORD) {
        return NextResponse.next()
      }
    }

    return new NextResponse('認証が必要です', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin"',
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
