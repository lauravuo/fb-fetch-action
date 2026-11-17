const fetchFbPosts = require("./fb");

const run = async () => {
  let core;
  try {
    core = await import("@actions/core");
    const startYear = core.getInput("start-year");
    const dataFolder = core.getInput("data-folder");
    const pageId = core.getInput("page-id");
    const token = core.getInput("page-token");

    core.setSecret(token);
    core.setSecret(pageId);

    await fetchFbPosts({
      startYear,
      dataFolder,
      pageId,
      token
    });
  } catch (error) {
    if (core) {
      core.setFailed(error instanceof Error ? error.message : String(error));
    } else {
      throw error;
    }
  }
};

run();
