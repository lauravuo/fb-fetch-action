const core = require("@actions/core");
const fetchFbPosts = require("./fb");

try {
  const startYear = core.getInput("start-year");
  const dataFolder = core.getInput("data-folder");
  const pageId = core.getInput("page-id");
  const token = core.getInput("page-token");

  core.setSecret(token);
  core.setSecret(pageId);

  fetchFbPosts({
    startYear,
    dataFolder,
    pageId,
    token
  });
} catch (error) {
  core.setFailed(error.message);
}
