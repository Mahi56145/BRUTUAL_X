import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'engineering-os-secret-key-change-in-production-2024',
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        name: { label: 'Name', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.password) {
          console.warn('[Auth] Missing name or password in credentials')
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { name: credentials.name as string },
          })
          if (!user) {
            console.warn('[Auth] User not found:', credentials.name)
            return null
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          )
          if (!isValid) {
            console.warn('[Auth] Invalid password for user:', credentials.name)
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: null,
          }
        } catch (err) {
          console.error('[Auth] Error querying database during login:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
})
