import type { youtube_v3 } from "googleapis";
import { Common } from "googleapis";

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

  const ratinsDisabledVideoIds: string[] = [];

  try {
    for (const id of notRatedVideoIds) {
      try {
        await youtube.videos.rate({ id, rating });
      } catch (e) {
        if (e instanceof Common.GaxiosError) {
          // 型をつける
          const gaxiosError = e as Common.GaxiosError;

          /**
           * 以下リンクのError detailの部分
           *
           * https://developers.google.com/youtube/v3/docs/videos/rate#errors
           */
          const isvideoRatingDisabled = gaxiosError.response?.data.error.errors.some(
            ({ reason }) => reason === "videoRatingDisabled",
          );

          // 評価が無効な動画の場合、リストに追加してそのまま継続
          if (isvideoRatingDisabled) {
            ratinsDisabledVideoIds.push(id);
            continue;
          }
        }

        // 対応不可能なエラーは再スローする
        throw e;
      }
    }
  } finally {
    if (ratinsDisabledVideoIds.length) {
      // TODO: どこかに通知
      console.log("評価が無効な動画ID: ", ratinsDisabledVideoIds);
    }
  }

  return {
    newRatedVideoIds: notRatedVideoIds,
  };
};
