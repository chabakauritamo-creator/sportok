import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcryptjs from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { redirect } from 'next/navigation';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    role?: string;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email });
        if (!user) return null;
        const valid = await bcryptjs.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;
        return { id: user._id.toString(), email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? 'user';
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  pages: {
    signIn: '/ka/login',
  },
});

export async function requireAuth(locale: string) {
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);
  return session;
}

export async function requireAdmin(locale: string) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') redirect(`/${locale}/login`);
  return session;
}
