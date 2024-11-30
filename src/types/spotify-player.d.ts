declare global {
  namespace Spotify {
    interface Player {
      getCurrentState: () => Promise<{
        paused: boolean;
        position: number;
        duration: number;
        track_window: {
          current_track: {
            uri: string;
            name: string;
            artists: { name: string }[];
            album: { name: string };
          };
          next_tracks: any[];
          previous_tracks: any[];
        };
      } | null>;
      resume: () => Promise<void>;
      pause: () => Promise<void>;
    }
  }
}

// Required to ensure this file is treated as a module by TypeScript
export {};
