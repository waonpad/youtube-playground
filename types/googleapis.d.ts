import { GaxiosError as _GaxiosError } from "../node_modules/gaxios/build/src/common";

declare module "googleapis" {
  namespace Common {
    /**
     * [Google APIs - Global domain errors  |  YouTube Data API  |  Google for Developers](https://developers.google.com/youtube/v3/docs/core_errors)
     */
    export type ErrorInterface = {
      error: {
        code: number;
        message: string;
        errors: {
          domain: string;
          reason: string;
          message: string;
          location: string;
          locationType: string;
        }[];
      };
    };

    export class GaxiosError<T = ErrorInterface> extends _GaxiosError<T> {}
  }
}
