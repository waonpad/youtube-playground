import { readFileSync } from "node:fs";
import { isOfficialVideo } from "@/utils";
import type { youtube_v3 } from "googleapis";
import YTMusic from "ytmusic-api";

const main = async () => {
  const dir = "data/playlist-items";
  const playlistId = process.argv[2];
  const filepath = `${dir}/${playlistId}.json`;

  const _videos = JSON.parse(readFileSync(filepath, "utf-8")) as youtube_v3.Schema$PlaylistItem[];
  const videos = _videos.filter((item) => item.contentDetails?.videoPublishedAt);

  console.log(videos.length);

  const ytmusic = new YTMusic();
  await ytmusic.initialize();

  const officials: youtube_v3.Schema$PlaylistItem[] = [];

  for (const video of videos) {
    const official = await isOfficialVideo(video, { ytmusic });

    if (official) {
      officials.push(video);
    }
  }

  console.log(officials.length);

  // TODO: できれば非公式を公式に置換したいが難しそうな気がする
  // 手であれこれするために非公式だけのプレイリストのリンクを作成したい
};

main();
