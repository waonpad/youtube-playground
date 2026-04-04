import type { youtube_v3 } from "googleapis";

/**
 * 動画がカバーまたはリミックスであるかをタイトルから判定する
 *
 * @param title 動画タイトル
 */
export const isCoverOrRemixVideoTitle = (title: string): boolean => {
  const lower = title.toLowerCase();

  return ["cover", "remix", "カバー", "リミックス", "歌ってみた"].some((keyword) => lower.includes(keyword));
};

/**
 * 動画がカバーまたはリミックスであるかを判定する
 *
 * @param video 動画情報
 */
export const isCoverOrRemixVideo = (video: youtube_v3.Schema$PlaylistItem): boolean => {
  const title = video.snippet?.title;

  if (title && isCoverOrRemixVideoTitle(title)) {
    return true;
  }

  return false;
};
