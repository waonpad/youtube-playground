import { readFileSync } from "node:fs";
import { computeAnonymousPlaylistUrl, isOfficialVideo } from "@/utils";
import type { youtube_v3 } from "googleapis";
import YTMusic from "ytmusic-api";

const main = async () => {
  const dir = "data/playlist-items";
  const playlistId = process.argv[2];
  const filepath = `${dir}/${playlistId}.json`;

  const _videos = JSON.parse(readFileSync(filepath, "utf-8")) as youtube_v3.Schema$PlaylistItem[];
  const videos = _videos.filter((item) => item.contentDetails?.videoPublishedAt);

  console.log("対象動画数: ", videos.length);

  const ytmusic = new YTMusic();
  await ytmusic.initialize();

  const officials: youtube_v3.Schema$PlaylistItem[] = [];
  const unofficials: youtube_v3.Schema$PlaylistItem[] = [];

  for (const video of videos) {
    const official = await isOfficialVideo(video, { ytmusic });

    if (official) {
      officials.push(video);
      continue;
    }

    unofficials.push(video);
  }

  console.log("公式動画数: ", officials.length);
  console.log("非公式動画数: ", unofficials.length);

  const unofficialVideoIds = unofficials
    .map((item) => item.contentDetails?.videoId)
    .filter((id) => typeof id === "string");

  const unofficialVideoPlaylistUrls = splitArray(unofficialVideoIds, 50).map((ids) => computeAnonymousPlaylistUrl(ids));

  console.log("非公式動画を集めた一時的なプレイリストのURL \n", unofficialVideoPlaylistUrls.join("\n\n"));
};

main();

const splitArray = <T>(arr: T[], size: number) => {
  return arr.reduce<T[][]>((acc, _, i) => {
    if (i % size === 0) {
      acc.push([]);
    }

    acc[acc.length - 1].push(arr[i]);

    return acc;
  }, []);
};
