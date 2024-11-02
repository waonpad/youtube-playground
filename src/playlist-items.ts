import type { Youtube } from "./youtube";

/**
 * @see [PlaylistItems: list  |  YouTube Data API  |  Google for Developers](https://developers.google.com/youtube/v3/docs/playlistItems/list?hl=ja)
 */
export const getAllPlaylistItems = async (
  youtube: Youtube,
  { playlistId, part }: { playlistId: string; part?: ("snippet" | "contentDetails" | "id" | "status")[] },
) => {
  const items = [];

  let pageToken = "";

  for (;;) {
    const pItems = await youtube.playlistItems.list({
      part: part || ["snippet", "contentDetails"],
      playlistId,
      maxResults: 50,
      pageToken,
    });

    items.push(...(pItems.data.items || []));

    if (pItems.data.nextPageToken) {
      pageToken = pItems.data.nextPageToken;
    } else {
      break;
    }
  }

  return items;
};
