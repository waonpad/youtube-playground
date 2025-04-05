declare module "process" {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        GOOGLE_CLIENT_ID: string;
        GOOGLE_CLIENT_SECRET: string;
        GOOGLE_REDIRECT_URI: string;
        YOUTUBE_DATA_API_REFRESH_TOKEN: string;
      }
    }
  }
}
