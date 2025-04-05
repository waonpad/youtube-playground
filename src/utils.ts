import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { youtube_v3 } from "googleapis";

import type { ArtistFull, SongFull } from "ytmusic-api";
import type YTMusic from "ytmusic-api";

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

// データの取得処理とか
// TODO: 適当に書いてるので整理する

const dir = "data/songs";
const filepath = `${dir}/songs.json`;

const getCachedSongs = () => {
  if (!existsSync(filepath)) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filepath, JSON.stringify([], null, 2));
  }

  return JSON.parse(readFileSync(filepath, "utf-8")) as SongFull[];
};

const cacheSong = (song: SongFull) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const cachedSongs = getCachedSongs();

  song.formats = [];
  song.adaptiveFormats = [];

  if (!cachedSongs.find((s) => s.videoId === song.videoId)) {
    cachedSongs.push(song);
  }

  writeFileSync(filepath, JSON.stringify(cachedSongs, null, 2));
};

const getSong = async (videoId: string, { ytmusic }: { ytmusic: YTMusic }) => {
  const cachedSongs = getCachedSongs();
  const cached = cachedSongs.find((s) => s.videoId === videoId);
  if (cached) return cached;

  const song = await ytmusic.getSong(videoId);

  cacheSong(song);

  return song;
};

const artistFilePath = `${dir}/artists.json`;

const getCachedArtists = () => {
  if (!existsSync(artistFilePath)) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(artistFilePath, JSON.stringify([], null, 2));
  }

  return JSON.parse(readFileSync(artistFilePath, "utf-8")) as ArtistFull[];
};

const cacheArtist = (artist: ArtistFull) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const cachedArtists = getCachedArtists();

  if (!cachedArtists.find((a) => a.artistId === artist.artistId)) {
    cachedArtists.push(artist);
  }

  writeFileSync(artistFilePath, JSON.stringify(cachedArtists, null, 2));
};

const getArtist = async (artistId: string, { ytmusic }: { ytmusic: YTMusic }) => {
  const cachedArtists = getCachedArtists();
  const cached = cachedArtists.find((a) => a.artistId === artistId);
  if (cached) return cached;

  const artist = await ytmusic.getArtist(artistId);

  cacheArtist(artist);

  return artist;
};

/**
 * GitHub ActionsのワークフローのURLを取得する
 *
 * ローカルでは動作しない
 */
export const getWorkflowRunUrl = () => {
  if (!isRunOnGitHubActions()) {
    throw new Error("This function can only be run in GitHub Actions");
  }

  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  return `${process.env.GITHUB_SERVER_URL!}/${process.env.GITHUB_REPOSITORY!}/actions/runs/${process.env.GITHUB_RUN_ID!}` as const;
};

/**
 * GitHub Actions上で実行されているかを判定する
 */
export const isRunOnGitHubActions = () => {
  return !!process.env.GITHUB_ACTIONS;
};

export const splitArray = <T>(arr: T[], size: number) => {
  return arr.reduce<T[][]>((acc, _, i) => {
    if (i % size === 0) {
      acc.push([]);
    }

    acc[acc.length - 1].push(arr[i]);

    return acc;
  }, []);
};
