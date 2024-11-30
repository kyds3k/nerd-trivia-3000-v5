declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}
