// src/lib/appleMusic.ts

export interface AppleMusicTrack {
  id: string; // This will be the trackId from iTunes API
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  previewUrl: string;
  durationMs: number;
  url: string; // Apple Music URL
}

/**
 * Search for tracks using the iTunes Search API
 * @param query Search query (song name, artist, etc.)
 * @param limit Number of results to return (default 10)
 */
export const searchAppleMusic = async (query: string, limit: number = 10): Promise<AppleMusicTrack[]> => {
  if (!query) return [];

  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`/api/apple-music?term=${encodedQuery}&limit=${limit}`);

    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status}`);
    }

    const data = await response.json();

    return data.results.map((item: any) => ({
      id: item.trackId.toString(),
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      artworkUrl: item.artworkUrl100?.replace('100x100', '600x600'), // Get higher res image
      previewUrl: item.previewUrl,
      durationMs: item.trackTimeMillis,
      url: item.trackViewUrl,
    }));
  } catch (error) {
    console.error("Error searching Apple Music:", error);
    return [];
  }
};

/**
 * Get track details by Apple Music ID (iTunes Track ID)
 * @param id The Apple Music Track ID
 */
export const getAppleMusicTrack = async (id: string): Promise<AppleMusicTrack | null> => {
  if (!id) return null;

  try {
    const response = await fetch(`/api/apple-music?id=${id}`);

    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.resultCount === 0) return null;

    const item = data.results[0];
    return {
      id: item.trackId.toString(),
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      artworkUrl: item.artworkUrl100?.replace('100x100', '600x600'),
      previewUrl: item.previewUrl,
      durationMs: item.trackTimeMillis,
      url: item.trackViewUrl,
    };
  } catch (error) {
    console.error("Error fetching Apple Music track:", error);
    return null;
  }
};

/**
 * Extract Apple Music ID from a URL
 * Supports formats like: https://music.apple.com/us/album/song-name/123456?i=789012
 * The ID we want is usually the 'i' param for songs in albums, or the last path segment.
 */
export const extractAppleMusicId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);

    // Check for 'i' parameter (common for songs in albums)
    const iParam = urlObj.searchParams.get('i');
    if (iParam) return iParam;

    // Fallback: Check last path segment if it looks like an ID
    const pathSegments = urlObj.pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];

    if (/^\d+$/.test(lastSegment)) {
      return lastSegment;
    }

    return null;
  } catch (e) {
    return null;
  }
};
