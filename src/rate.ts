import type { youtube_v3 } from "googleapis";

/**
 * @see [Videos: rate  |  YouTube Data API  |  Google for Developers](https://developers.google.com/youtube/v3/docs/videos/rate?hl=ja)
 */
export const rateAllVideos = async (
  youtube: youtube_v3.Youtube,
  { videoIds, rating }: { videoIds: string[]; rating: "like" | "none" | "dislike" },
) => {
  // idは一度に50個までしか指定できないので、50個ずつに分割して取得する
  const currentRates: youtube_v3.Schema$VideoGetRatingResponse["items"] = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    const rates = await youtube.videos.getRating({
      id: videoIds.slice(i, i + 50),
    });

    const items = rates.data.items || [];

    currentRates.push(...items);
  }

  // 対象の評価と異なる評価の動画IDを取得する
  const notRatedVideoIds = currentRates
    .filter((rate) => rate.rating !== rating)
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    .map((rate) => rate.videoId!);

  for (const id of notRatedVideoIds) {
    await youtube.videos.rate({ id, rating });
  }

  return {
    newRatedVideoIds: notRatedVideoIds,
  };
};
