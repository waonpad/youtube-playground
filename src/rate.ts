import { Octokit } from "@octokit/rest";
import type { youtube_v3 } from "googleapis";
import { Common } from "googleapis";
import { computeAnonymousPlaylistUrl, getWorkflowRunUrl, isRunOnGitHubActions, splitArray } from "./utils";

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

  const ratingDisabledVideoIds: string[] = [];

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
            ratingDisabledVideoIds.push(id);
            continue;
          }
        }

        // 対応不可能なエラーは再スローする
        throw e;
      }
    }
  } finally {
    if (ratingDisabledVideoIds.length) {
      console.log("評価が無効な動画ID: ", ratingDisabledVideoIds);

      const ratingDisabledVideoPlaylistUrls = splitArray(ratingDisabledVideoIds, 50).map((ids) =>
        computeAnonymousPlaylistUrl(ids),
      );

      console.log("評価が無効な動画を集めた一時的なプレイリストのURL", ratingDisabledVideoPlaylistUrls.join("\n\n"));

      // GitHub Actions上で実行されている場合は、GitHub Issuesに通知する
      if (isRunOnGitHubActions()) {
        const octokit = new Octokit({
          auth: process.env.GITHUB_TOKEN,
        });

        await octokit.rest.issues.create({
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          owner: process.env.GITHUB_REPOSITORY!.split("/")[0],
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          repo: process.env.GITHUB_REPOSITORY!.split("/")[1],
          title: "手動での評価が必要な動画が検出されました",
          body: `実行URL: ${getWorkflowRunUrl()}\n\n評価が無効な動画ID: ${ratingDisabledVideoIds.join(", ")}\n\n以下のリンクから手動で評価を行ってください。\n\n${ratingDisabledVideoPlaylistUrls.join("\n")}`,
        });
      }
    }
  }

  const newRatedVideoIds = notRatedVideoIds.filter((id) => !ratingDisabledVideoIds.includes(id));

  return {
    newRatedVideoIds,
    ratingDisabledVideoIds,
  };
};
