import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { youtube_v3 } from "googleapis";

import type { ArtistFull, SongFull } from "ytmusic-api";
import type YTMusic from "ytmusic-api";

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

export const isOfficialVideo = async (
  video: youtube_v3.Schema$PlaylistItem,
  { ytmusic }: { ytmusic: YTMusic },
): Promise<boolean> => {
  const channelTitle = video.snippet?.videoOwnerChannelTitle;

  if (channelTitle && isOfficialChannelTitle(channelTitle)) {
    // console.log("公式のチャンネル名: ", channelTitle);
    return true;
  }

  const title = video.snippet?.title;

  if (title && isOfficialVideoTitle(title)) {
    // console.log("公式の動画タイトル: ", title);
    return true;
  }

  const videoId = video.contentDetails?.videoId;

  const song = await (async () => {
    if (videoId) {
      const cachedSongs = getCachedSongs();
      const cached = cachedSongs.find((s) => s.videoId === videoId);
      if (cached) return cached;

      const song = await ytmusic.getSong(videoId);

      cacheSong(song);

      return song;
    }

    return null;
  })();

  const artist = await (async () => {
    if (song && video.snippet?.videoOwnerChannelId) {
      const cachedArtists = getCachedArtists();
      const cached = cachedArtists.find((a) => a.artistId === song.artist?.artistId);
      if (cached) return cached;

      const artist = await ytmusic.getArtist(video.snippet?.videoOwnerChannelId);

      cacheArtist(artist);

      return artist;
    }

    return null;
  })();

  const topAlbumTumbnails = artist?.topAlbums?.flatMap((album) => album.thumbnails);
  const topSingleTumbnails = artist?.topSingles?.flatMap((single) => single.thumbnails);

  if (topAlbumTumbnails && hasOfficialSongThumbnail(topAlbumTumbnails)) {
    // console.log("公式のアルバムサムネイルがありました: ", channelTitle);
    return true;
  }

  if (topSingleTumbnails && hasOfficialSongThumbnail(topSingleTumbnails)) {
    // console.log("公式のシングルサムネイルがありました: ", channelTitle);
    return true;
  }

  console.log("公式の動画ではないかも: ", title, channelTitle);

  return false;
};

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

export const hasOfficialSongThumbnail = (thumbnails: { width: number; height: number }[]): boolean => {
  return thumbnails.some((thumbnail) => thumbnail.width === thumbnail.height);
};
