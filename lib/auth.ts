import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { image: true, role: true },
          });
          if (dbUser) {
            session.user.image = dbUser.image;
            (session.user as any).role = dbUser.role;
          } else {
            (session.user as any).role = token.role;
          }
        } catch {
          // DB unavailable — fall back to JWT values so session stays valid
          (session.user as any).role = token.role;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
