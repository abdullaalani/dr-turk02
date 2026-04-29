import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login
     * - /api/auth (NextAuth routes)
     * - /api/seed
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico
     * - /public files (uploads, logo, etc.)
     */
    '/((?!login|api/auth|api/seed|_next/static|_next/image|favicon\\.ico|logo\\.svg|uploads).*)',
  ],
};
