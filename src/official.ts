import type { youtube_v3 } from "googleapis";

import type YTMusic from "ytmusic-api";
import { getArtist, getSong } from "./music";

/**
 * 動画が公式のものであるかを判定する
 *
 * 動画タイトル、チャンネル名、サムネイル、アーティストの楽曲情報から判定する
 *
 * @param video 動画情報
 * @param ytmusic YTMusicインスタンス (APIアクセスが必要なため)
 */
export const isOfficialVideo = async (
  video: youtube_v3.Schema$PlaylistItem,
  { ytmusic }: { ytmusic: YTMusic },
): Promise<boolean> => {
  const channelTitle = video.snippet?.videoOwnerChannelTitle;
  if (channelTitle && isOfficialChannelTitle(channelTitle)) {
    return true;
  }

  const title = video.snippet?.title;
  if (title && isOfficialVideoTitle(title)) {
    return true;
  }

  const videoId = video.contentDetails?.videoId;
  const song = await (async () => {
    if (videoId) {
      try {
        return await getSong(videoId, { ytmusic });
      } catch (e) {
        console.error(e, video);
        return null;
      }
    }

    return null;
  })();

  const channelId = video.snippet?.videoOwnerChannelId;
  const artist = await (async () => {
    if (song && channelId) {
      try {
        return await getArtist(channelId, { ytmusic });
      } catch (e) {
        console.error(e, video);
        return null;
      }
    }

    return null;
  })();

  const topAlbumTumbnails = artist?.topAlbums?.flatMap((album) => album.thumbnails);
  if (topAlbumTumbnails?.some(isOfficialSongThumbnail)) {
    return true;
  }

  const topSingleTumbnails = artist?.topSingles?.flatMap((single) => single.thumbnails);
  if (topSingleTumbnails?.some(isOfficialSongThumbnail)) {
    return true;
  }

  return false;
};

/**
 * 動画タイトルが公式のものであるかを判定する
 *
 * この関数を使用しなくても他の方法で殆ど判定できるが、APIアクセスが必要無い方法なため便利かもしれない
 *
 * 非公式の動画タイトルがすり抜ける可能性もあるので注意
 *
 * @param title 動画タイトル
 */
export const isOfficialVideoTitle = (title: string): boolean => {
  return (
    title.includes("Official") ||
    title.includes("official") ||
    title.includes("OFFICIAL") ||
    title.includes("Music Video") ||
    title.includes("music video") ||
    title.includes("MUSIC VIDEO") ||
    (title.includes("公式") && !title.includes("非公式"))
  );
};

/**
 * チャンネル名が公式のものであるかを判定する
 *
 * ` - Topic` で終了しているものは確実に公式であるとAPIアクセス無しで判定できるため使用すると便利 \
 * 他の判定用文字列はすり抜けの可能性があるので注意
 *
 * @param channelTitle チャンネル名
 */
export const isOfficialChannelTitle = (channelTitle: string): boolean => {
  return (
    channelTitle.includes("Official") ||
    channelTitle.includes("official") ||
    channelTitle.includes("OFFICIAL") ||
    channelTitle.includes("オフィシャル") ||
    (channelTitle.includes("公式") && !channelTitle.includes("非公式")) ||
    channelTitle.endsWith(" - Topic")
  );
};

/**
 * サムネイルが公式の楽曲のものかを判定する
 *
 * サムネイルが正方形であればYouTubeによって生成された公式のサムネイルと判定する
 *
 * @param thumbnail サムネイルの情報
 *
 */
export const isOfficialSongThumbnail = (thumbnail: { width: number; height: number }): boolean => {
  return thumbnail.width === thumbnail.height;
};
