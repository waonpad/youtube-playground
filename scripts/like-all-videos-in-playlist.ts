import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { type Youtube, setupYoutube } from "@/youtube";
import type { youtube_v3 } from "googleapis";

export const getAllPlaylistItems = async (youtube: Youtube, { playlistId }: { playlistId: string }) => {
  const items = [];

  let pageToken = "";

  for (;;) {
    const pItems = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId,
      maxResults: 50,
      pageToken,
    });

    items.push(...(pItems.data.items || []));

    if (pItems.data.nextPageToken) {
      pageToken = pItems.data.nextPageToken;
    } else {
      break;
    }
  }

  return items;
};

const likeAllVideos = async (youtube: Youtube, { videoIds }: { videoIds: string[] }) => {
  console.log("全て高評価にする対象の動画数: ", videoIds.length);

  // idは一度に50個までしか指定できないので、50個ずつに分割して取得する
  const currentRates: youtube_v3.Schema$VideoGetRatingResponse["items"] = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    const rates = await youtube.videos.getRating({
      id: videoIds.slice(i, i + 50),
    });

    const items = rates.data.items || [];

    currentRates.push(...items);
  }

  const notLikedVideoIds = currentRates
    .filter((rate) => rate.rating !== "like")
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    .map((rate) => rate.videoId!);

  console.log("未高評価の動画ID: ", notLikedVideoIds);
  console.log("未高評価の動画数: ", notLikedVideoIds.length);

  if (notLikedVideoIds.length === 0) {
    return;
  }

  for (const id of notLikedVideoIds) {
    await youtube.videos.rate({
      id,
      rating: "like",
    });
  }
};

const main = async () => {
  // コマンドライン引数で指定したプレイリストの動画を全て高評価にする
  const playlistIds = process.argv[2].split(",");

  const options = {
    // オプションで--cleanを指定すると、既存のデータを削除して再取得する
    clean: process.argv.includes("--clean"),
    // オプションで--no-saveを指定すると、取得したデータをファイルに保存しない (GitHub Actions等では不要なため)
    noSave: process.argv.includes("--no-save"),
  };

  const youtube = await setupYoutube();

  const dir = "data/playlist-items";

  for (const playlistId of playlistIds) {
    console.log("プレイリストID: ", playlistId);

    const filepath = `${dir}/${playlistId}.json`;

    const pItems = await (async () => {
      // ファイルが存在しないか、--cleanオプションが指定されている場合はAPIから取得する
      if (!existsSync(filepath) || options.clean) {
        console.log("動画をAPIから取得します");

        const res = await getAllPlaylistItems(youtube, { playlistId });

        if (options.noSave) {
          return res;
        }

        if (!existsSync(dir)) {
          console.log("動画情報の保存先ディレクトリが存在しないため作成します");

          mkdirSync(dir, { recursive: true });
        }

        console.log("取得した動画情報をファイルに保存します");

        writeFileSync(filepath, JSON.stringify(res, null, 2));

        return res;
      }

      console.log("動画をファイルから取得します");

      return JSON.parse(readFileSync(filepath, "utf-8")) as youtube_v3.Schema$PlaylistItem[];
    })();

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const videoIds = pItems.map((item) => item.contentDetails?.videoId!);

    await likeAllVideos(youtube, { videoIds });
  }
};

main();
