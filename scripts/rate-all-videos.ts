import {} from "node:fs";
import { parseArgs } from "node:util";
import { rateAllVideos } from "@/rate";
import { setupYoutube } from "@/youtube";

const main = async () => {
  const args = (() => {
    const { values } = parseArgs({
      options: {
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

    if (!values.ids) throw new Error("動画IDが指定されていません");

    if (!values.rating) throw new Error("評価が指定されていません");

    if (!["like", "dislike", "none"].some((r) => r === values.rating)) {
      throw new Error("評価はlike, dislike, noneのいずれかで指定してください");
    }

    return {
      ids: values.ids?.split(","),
      rating: values.rating as "like" | "dislike" | "none",
    };
  })();

  console.log("実行時引数: ", args);

  const youtube = await setupYoutube();

  const { newRatedVideoIds } = await rateAllVideos(youtube, { videoIds: args.ids, rating: args.rating });

  console.log("新たに評価した動画数: ", newRatedVideoIds.length);
};

main();
