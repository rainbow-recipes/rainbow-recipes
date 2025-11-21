/* eslint-disable import/prefer-default-export */
/* eslint-disable no-param-reassign */

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient, Role } from '@prisma/client';
import { compare } from 'bcrypt';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        // Expose role and merchant flags to JWT/session
        return {
          id: user.id,
          email: user.email,
          name:
            user.name
            ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          role: user.role ?? Role.USER,
          isMerchant: user.isMerchant,
          merchantApproved: user.merchantApproved,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.isMerchant = (user as any).isMerchant;
        token.merchantApproved = (user as any).merchantApproved;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).isMerchant = token.isMerchant;
        (session.user as any).merchantApproved = token.merchantApproved;
      }
      return session;
    },
  },
};
