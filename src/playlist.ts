/**
 * 実際にはプレイリストを作成せず、一時的なプレイリストのURLを生成する
 *
 * @param videoIds 動画IDの配列(50個までしか匿名プレイリストに含められない)
 */
export const computeAnonymousPlaylistUrl = (videoIds: string[]): string => {
  if (videoIds.length > 50) {
    throw new Error("YouTubeの匿名プレイリストには50個までしか動画を追加できません");
  }

  return `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(",")}`;
};
