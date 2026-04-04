/**
 * GitHub Actions上で実行されているかを判定する
 */
export const isRunOnGitHubActions = () => {
  return !!process.env.GITHUB_ACTIONS;
};

/**
 * GitHub ActionsのワークフローのURLを取得する
 *
 * ローカルでは動作しない
 */
export const getWorkflowRunUrl = () => {
  if (!isRunOnGitHubActions()) {
    throw new Error("This function can only be run in GitHub Actions");
  }

  // biome-ignore lint/style/noNonNullAssertion: GitHub Actions上で実行されている場合、これらの環境変数は必ず存在するはずなので非nullアサーションを使用
  return `${process.env.GITHUB_SERVER_URL!}/${process.env.GITHUB_REPOSITORY!}/actions/runs/${process.env.GITHUB_RUN_ID!}` as const;
};
