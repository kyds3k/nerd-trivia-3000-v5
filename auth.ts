import NextAuth from "next-auth"
import Spotify from "next-auth/providers/spotify"
 
const spotScopes = "streaming user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-modify-private user-read-playback-position user-read-email";
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"

// Extend the token type to include accessToken
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }

  interface JWT {
    accessToken?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Spotify({ authorization: {
        url: SPOTIFY_AUTH_URL,
        clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
        clientSecret: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET,        
        params: {
          scope: spotScopes
        },
      },
    }),
  ],
  secret: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET,
  callbacks: {
    async jwt({ token, account }: { token: any; account?: any }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = Date.now() + account.expires_in * 1000;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.expiresAt = token.expiresAt as number;
      return session;
    },
  }
})