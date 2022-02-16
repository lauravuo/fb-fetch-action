module.exports = async ({ startYear, dataFolder, pageId, token }) => {
  const FB = require("fb");
  const fs = require("fs");
  const http = require("https");

  const initialFetchDone = fs.existsSync(dataFolder);

  FB.setAccessToken(token);

  const fetchUrl = async (url, path) =>
    new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(path);
      http
        .request(url, function (res) {
          res.pipe(fileStream);
          res.on("end", resolve);
          res.on("error", reject);
        })
        .end();
    });

  const formatMonth = (month) => {
    const yearMonth = month + 1;
    return yearMonth < 10 ? "0" + yearMonth : yearMonth;
  };

  const fetchFB = (year, monthIndex) => {
    const lastMonth = monthIndex === 11;
    const fromTs = Math.floor(new Date(year, monthIndex, 1).getTime() / 1000);
    const toTs = Math.floor(
      new Date(
        lastMonth ? year + 1 : year,
        lastMonth ? 1 : monthIndex + 1,
        1
      ).getTime() / 1000
    );

    const month = formatMonth(monthIndex);
    const currentTime = Math.floor(new Date().getTime() / 1000);
    if (fromTs >= currentTime) {
      console.log("Skipping future timestamp", fromTs);
      return;
    }
    const untilTs = toTs > currentTime ? currentTime : toTs;
    FB.api(
      `/${pageId}/feed?fields=full_picture,attachments,message,created_time,id&since=${fromTs}&until=${untilTs}`,
      (response) => {
        if (!response || response.error) {
          console.log(!response ? "error occurred" : response.error);
          return;
        }
        if (response.data.length > 0) {
          const fromDate = new Date(fromTs * 1000);
          console.log(
            `Fetched ${
              response.data.length
            } posts for ${fromDate.getFullYear()}-${month}`
          );
          const path = `${dataFolder}${year}/${month}`;
          fs.mkdirSync(path, { recursive: true });
          fs.writeFileSync(
            `${path}/${year}-${month}.json`,
            JSON.stringify(response.data)
          );
          response.data.forEach(async (post) => {
            if (post.full_picture) {
              await fetchUrl(post.full_picture, `${path}/${post.id}.jpg`);
            }
          });
        }
      }
    );
  };

  const currentYear = new Date().getFullYear();
  if (!initialFetchDone) {
    const fromYear = parseInt(startYear);
    const years = Array.from(
      { length: currentYear - fromYear + 1 },
      (_, i) => fromYear + i
    );
    years.forEach((year) => {
      fs.mkdirSync(`${dataFolder}${year}`, { recursive: true });
      Array.from(Array(12).keys()).forEach((month) => {
        fetchFB(year, month);
      });
    });
  } else {
    const currentMonth = new Date().getMonth();
    const formattedMonth = formatMonth(currentMonth);
    const yearPath = `${dataFolder}${currentYear}`;
    const monthPath = `${dataFolder}${currentYear}/${formattedMonth}`;
    if (!fs.existsSync(monthPath)) {
      fs.mkdirSync(monthPath, { recursive: true });
    }
    fs.rmSync(monthPath, { force: true, recursive: true });
    fetchFB(currentYear, currentMonth);
  }
};
