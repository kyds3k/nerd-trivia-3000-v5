import { signIn } from "next-auth/react"

export const refreshSpotifyToken = async (
  setSpotifyToken: React.Dispatch<React.SetStateAction<string | null>>,
  retryCount: number = 0
) => {
  console.log("refreshSpotifyAuth called");

  // Limit retries to avoid infinite recursion
  const MAX_RETRIES = 3;

  if (retryCount > MAX_RETRIES) {
    console.error("Exceeded maximum retry attempts. Redirecting to sign-in.");
    localStorage.removeItem("spotifyAuthToken");
    localStorage.removeItem("spotifyRefreshTokenExpiry");
    localStorage.removeItem("spotifyRefreshToken");
    signIn("spotify"); // Redirect to OAuth flow
    return;
  }

  const savedToken = localStorage.getItem("spotifyAuthToken");
  const refreshTokenExpiry = localStorage.getItem("spotifyRefreshTokenExpiry");
  const savedRefreshToken = localStorage.getItem("spotifyRefreshToken");

  if (savedToken && refreshTokenExpiry && savedRefreshToken) {
    const expiry = parseInt(refreshTokenExpiry, 10);
    const now = Date.now();

    if (expiry < now) {
      console.log("Token expired. Attempting to refresh...");
      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(
              `${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET}`
            )}`,
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: savedRefreshToken,
            client_id: `${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}`,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("spotifyAuthToken", data.access_token);
          setSpotifyToken(data.access_token);
          localStorage.setItem(
            "spotifyRefreshTokenExpiry",
            (Date.now() + data.expires_in * 1000).toString()
          );
          localStorage.setItem("spotifyRefreshToken", data.refresh_token);
          console.log("Refreshed Spotify token successfully:", data.access_token);
        } else {
          console.error("Failed to refresh Spotify token:", await response.json());
          console.log("Retrying refreshSpotifyAuth...");
          await refreshSpotifyToken(setSpotifyToken, retryCount + 1);
        }
      } catch (error) {
        console.error("Error refreshing Spotify token:", error);

        if (error?.toString().includes("revoked")) {
          console.log("Token was revoked, clearing local storage");
          localStorage.removeItem("spotifyAuthToken");
          localStorage.removeItem("spotifyRefreshTokenExpiry");
          localStorage.removeItem("spotifyRefreshToken");
        }

        console.log("Retrying refreshSpotifyAuth...");
        await refreshSpotifyToken(setSpotifyToken, retryCount + 1);
      }
    } else {
      console.log("Token is still valid");
      setSpotifyToken(savedToken);
    }
  } else {
    console.log("No valid token found. Redirecting to sign-in.");
    signIn("spotify"); // Redirect to OAuth flow
  }
};
