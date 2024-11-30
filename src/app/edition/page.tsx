import { getSpotifyOAuthUrl } from "@/lib/spotifyAuth";

const initiateSpotifyOAuth = () => {
  const spotifyOAuthUrl = getSpotifyOAuthUrl();
  window.location.href = spotifyOAuthUrl;
};
