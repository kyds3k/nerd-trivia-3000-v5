declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

declare module 'twglow';