import { NextResponse } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware((auth, req) => {
  const url = req.nextUrl;
  const ref = url.searchParams.get('ref');
  const pathname = url.pathname;

  // Pretty URL rewrite: /studio/* → /dashboard/* (internal only, browser URL stays /studio)
  if (pathname === '/studio' || pathname.startsWith('/studio/')) {
    const dest = pathname === '/studio' ? '/dashboard' : `/dashboard${pathname.slice('/studio'.length)}`;
    const rewriteUrl = new URL(dest, req.url);
    rewriteUrl.search = url.search.toString();
    return NextResponse.rewrite(rewriteUrl);
  }

  if (ref) {
    const res = NextResponse.next();
    // Store referral code for up to 30 days
    res.cookies.set('ref', ref, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!.+\\..+$|_next).*)',
    '/(api|trpc)(.*)',
  ],
};