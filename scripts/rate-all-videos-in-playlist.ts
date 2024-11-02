import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { setupYoutube } from "@/youtube";
import type { youtube_v3 } from "googleapis";
import { getAllPlaylistItems } from "./playlist-items";
import { rateAllVideos } from "./rate";

// TODO: コマンドライン引数をいい感じにパースする
const main = async () => {
  const args = (() => {
    const { values } = parseArgs({
      options: {
        clean: {
          type: "boolean",
        },
        "no-save": {
          type: "boolean",
        },
        ids: {
          type: "string",
          short: "i",
        },
        rating: {
          type: "string",
          short: "r",
        },
      },
    });

    if (!values.ids) throw new Error("プレイリストIDが指定されていません");

    if (!values.rating) throw new Error("評価が指定されていません");

    if (!["like", "dislike", "none"].some((r) => r === values.rating)) {
      throw new Error("評価はlike, dislike, noneのいずれかで指定してください");
    }

    return {
      clean: values.clean as true | undefined,
      noSave: values["no-save"] as true | undefined,
      ids: values.ids?.split(","),
      rating: values.rating as "like" | "dislike" | "none",
    };
  })();

  console.log("実行時引数: ", args);

  const youtube = await setupYoutube();

  const dir = "data/playlist-items";

  for (const playlistId of args.ids) {
    console.log("プレイリストID: ", playlistId);

    const filepath = `${dir}/${playlistId}.json`;

    const pItems = await (async () => {
      // ファイルが存在しないか、--cleanオプションが指定されている場合はAPIから取得する
      if (!existsSync(filepath) || args.clean) {
        console.log("動画をAPIから取得します");

        const res = await getAllPlaylistItems(youtube, { playlistId, part: ["contentDetails"] });

        if (!args.noSave) {
          if (!existsSync(dir)) {
            console.log("動画情報の保存先ディレクトリが存在しないため作成します");

            mkdirSync(dir, { recursive: true });
          }

          console.log("取得した動画情報をファイルに保存します");

          writeFileSync(filepath, JSON.stringify(res, null, 2));
        }

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

    const { newRatedVideoIds } = await rateAllVideos(youtube, { videoIds, rating: args.rating });

    console.log("新たに評価した動画数: ", newRatedVideoIds.length);
  }
};

main();
