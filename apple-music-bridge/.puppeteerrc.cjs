// Don't download puppeteer's bundled Chromium during install.
// The bridge launches your already-installed Google Chrome instead
// (see `channel: 'chrome'` in server.js). This keeps `npm/pnpm install`
// small and avoids a large, flaky download.
module.exports = {
  skipDownload: true,
};
