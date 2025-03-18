import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // 拦截所有与Vercel相关的请求
  if (
    pathname.includes('/vercel') ||
    pathname.includes('/_vercel') ||
    pathname.includes('/api/webhook') ||
    pathname.includes('/__vercel')
  ) {
    // 返回404或重定向到首页
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 拦截特定的Vercel API请求
  if (request.headers.get('referer')?.includes('vercel.app') || 
      request.headers.get('origin')?.includes('vercel.app')) {
    const contentType = request.headers.get('content-type') || '';
    
    // 检查是否为Vercel API请求
    if (contentType.includes('application/json') && 
        (pathname.includes('/api/') || pathname === '/')) {
      return new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }

  return NextResponse.next();
}

// 配置中间件仅应用于特定路径
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 