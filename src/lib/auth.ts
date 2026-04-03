import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const start = Date.now();
        try {
          await connectDB();
          const email = credentials.email.toLowerCase().trim();
          const user = await User.findOne({ email });

          if (!user) {
            console.warn(`[authorize] No user found: ${email}`);
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password as string
          );

          if (!isValid) {
            console.warn(`[authorize] Invalid password for: ${email}`);
            return null;
          }

          console.log(`[authorize] Success for: ${email} (${Date.now() - start}ms)`);
          return {
            id:    user._id.toString(),
            email: user.email,
            role:  user.role,
          };
        } catch (err: any) {
          const duration = Date.now() - start;
          console.error("[authorize] FATAL ERROR", {
            message:    err.message,
            durationMs: duration,
            email:      credentials?.email,
          });
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { id: string; role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id   = token.id   as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};