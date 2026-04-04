import { readFileSync } from "node:fs";
import type { youtube_v3 } from "googleapis";
import { isCoverOrRemixVideo } from "@/cover-remix";
import { computeAnonymousPlaylistUrl } from "@/playlist";
import { splitArray } from "@/utils/array";

const main = async () => {
  const dir = "data/playlist-items";
  const playlistId = process.argv[2];
  const filepath = `${dir}/${playlistId}.json`;

  const _videos = JSON.parse(readFileSync(filepath, "utf-8")) as youtube_v3.Schema$PlaylistItem[];
  const videos = _videos.filter((item) => item.contentDetails?.videoPublishedAt);

  console.log("対象動画数: ", videos.length);

  const coverRemixVideos = videos.filter(isCoverOrRemixVideo);

  console.log("カバー・リミックス動画数: ", coverRemixVideos.length);

  if (coverRemixVideos.length === 0) {
    console.log("カバー・リミックス動画は見つかりませんでした");
    return;
  }

  coverRemixVideos.forEach((video) => {
    console.log(`- ${video.snippet?.title}`);
  });

  const videoIds = coverRemixVideos.map((item) => item.contentDetails?.videoId).filter((id) => typeof id === "string");

  const playlistUrls = splitArray(videoIds, 50).map((ids) => computeAnonymousPlaylistUrl(ids));

  console.log("\nカバー・リミックス動画を集めた一時的なプレイリストのURL");
  console.log(playlistUrls.join("\n\n"));
};

main();
