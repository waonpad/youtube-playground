import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { setupYoutube } from "@/youtube";
import type { youtube_v3 } from "googleapis";
import { getAllPlaylistItems } from "./playlist-items";
import { rateAllVideos } from "./rate";

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

        const res = await getAllPlaylistItems(youtube, { playlistId, part: ["contentDetails"] });

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

    const videoIds = pItems
      .filter((item) => item.contentDetails?.videoPublishedAt)
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      .map((item) => item.contentDetails?.videoId!);

    console.log("プレイリスト内の動画数: ", pItems.length);
    console.log("削除または非公開の動画数: ", pItems.length - videoIds.length);
    console.log("評価可能な動画数: ", videoIds.length);

    const { newRatedVideoIds } = await rateAllVideos(youtube, { videoIds, rating: "like" });

    console.log("新たに評価した動画数: ", newRatedVideoIds.length);
  }
};

main();
