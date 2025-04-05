import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import type { ArtistFull, SongFull } from "ytmusic-api";
import type YTMusic from "ytmusic-api";

// データの取得処理とか
// TODO: 適当に書いてるので整理する

const dir = "data/songs";
const filepath = `${dir}/songs.json`;
const artistFilePath = `${dir}/artists.json`;

/**
 * ファイルに保存された楽曲情報を取得する
 */
const getCachedSongs = () => {
  if (!existsSync(filepath)) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filepath, JSON.stringify([], null, 2));
  }

  return JSON.parse(readFileSync(filepath, "utf-8")) as SongFull[];
};

/**
 * ファイルに楽曲情報を保存する
 */
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

/**
 * YouTube MusicのAPIを使用して楽曲情報を取得する
 */
export const getSong = async (videoId: string, { ytmusic }: { ytmusic: YTMusic }) => {
  const cachedSongs = getCachedSongs();
  const cached = cachedSongs.find((s) => s.videoId === videoId);
  if (cached) return cached;

  const song = await ytmusic.getSong(videoId);

  cacheSong(song);

  return song;
};

/**
 * ファイルに保存されたアーティスト情報を取得する
 */
const getCachedArtists = () => {
  if (!existsSync(artistFilePath)) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(artistFilePath, JSON.stringify([], null, 2));
  }

  return JSON.parse(readFileSync(artistFilePath, "utf-8")) as ArtistFull[];
};

/**
 * ファイルにアーティスト情報を保存する
 */
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

/**
 * YouTube MusicのAPIを使用してアーティスト情報を取得する
 */
export const getArtist = async (artistId: string, { ytmusic }: { ytmusic: YTMusic }) => {
  const cachedArtists = getCachedArtists();
  const cached = cachedArtists.find((a) => a.artistId === artistId);
  if (cached) return cached;

  const artist = await ytmusic.getArtist(artistId);

  cacheArtist(artist);

  return artist;
};
