const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = 17171;

app.use(cors());
app.use(bodyParser.json());

let browser = null;
let musicPage = null;

// Initialize Puppeteer
const initBrowser = async () => {
  try {
    console.log("Launching controlled browser...");
    browser = await puppeteer.launch({
      channel: 'chrome', // Use the system-installed Google Chrome (no bundled Chromium download)
      headless: false, // User needs to see it to log in
      defaultViewport: null, // Use full window size
      userDataDir: path.join(__dirname, 'user_data'), // Save login session
      args: [
        '--window-size=1280,800',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // Allow MusicKit's programmatic mk.play() to actually emit audio.
        // Without this, Chrome loads the track but blocks playback because
        // there was no real user gesture (autoplay policy).
        '--autoplay-policy=no-user-gesture-required'
      ]
    });

    const pages = await browser.pages();
    musicPage = pages[0];

    // Navigate to Apple Music if not already there.
    // Use 'domcontentloaded' — music.apple.com streams audio and keeps
    // connections open, so 'networkidle2' never settles and times out.
    if (!musicPage.url().includes('music.apple.com')) {
      await musicPage.goto('https://music.apple.com/us/browse', { waitUntil: 'domcontentloaded' });
    }

    // Pipe ONLY our own intentional logs (prefixed "BROWSER:") to the terminal.
    // Apple Music spams its own console (e.g. "eventQueue overflow"), which we skip.
    musicPage.on('console', async msg => {
      const text = msg.text();
      if (!text.startsWith('BROWSER:')) return;
      try {
        const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
        console.log('BROWSER LOG:', ...args);
      } catch (_) {
        console.log('BROWSER LOG:', text);
      }
    });

    console.log("Browser launched. Waiting for user to log in...");

    // Handle browser closing
    browser.on('disconnected', () => {
      console.log("Browser closed. Restarting...");
      browser = null;
      musicPage = null;
    });

  } catch (e) {
    console.error("Failed to launch browser:", e);
  }
};

// Always return a LIVE page pointed at Apple Music. Re-acquires from the
// browser if the cached reference was detached (the SPA navigated, the tab was
// reloaded, etc.) — which is the usual cause of "detached Frame" errors.
const getMusicPage = async () => {
  if (!browser || !browser.connected) {
    await initBrowser();
  }
  if (!browser) throw new Error("Browser not open");

  const pages = await browser.pages();
  let page = null;
  for (const p of pages) {
    try {
      if (p.url().includes('music.apple.com')) { page = p; break; }
    } catch (_) {
      // detached/closed page — skip it
    }
  }
  if (!page) {
    page = pages[0] || (await browser.newPage());
    if (!page.url().includes('music.apple.com')) {
      await page.goto('https://music.apple.com/us/browse', { waitUntil: 'domcontentloaded' });
    }
  }
  musicPage = page;
  return page;
};

// ... (rest of file) ...

// Jump to Track
app.post('/jump-to-track', async (req, res) => {
  const { appleMusicId } = req.body;
  if (!appleMusicId) return res.status(400).json({ error: 'Missing appleMusicId' });

  try {
    console.log(`SERVER: Attempting to jump to track: ${appleMusicId}`);

    const evaluateJump = (page) => page.evaluate(async (songId) => {
        console.log(`BROWSER: Starting jump-to-track for ${songId}`);

        if (!window.MusicKit) throw new Error("MusicKit not found");
        const mk = window.MusicKit.getInstance();
        if (!mk) throw new Error("MusicKit instance not found");

        console.log("BROWSER: Auth status:", mk.isAuthorized);
        if (!mk.isAuthorized) throw new Error("Not signed in to Apple Music in the controlled browser");

        try {
          console.log("BROWSER: Stopping playback first...");
          await mk.stop(); // Clear state

          // Wait a bit for state to clear
          await new Promise(r => setTimeout(r, 500));

          console.log("BROWSER: Setting queue...");
          await mk.setQueue({ song: songId });
          console.log("BROWSER: Queue set. Queue length:", mk.queue.items.length);

          if (mk.queue.items.length > 0) {
              console.log("BROWSER: First item:", mk.queue.items[0].title);
              console.log("BROWSER: Playing...");
              await mk.play();
              console.log("BROWSER: Play command sent.");
          } else {
              console.error("BROWSER: Queue is empty after setQueue!");
          }
        } catch (err) {
          console.error("BROWSER: Error in jump-to-track:", err.toString(), err);
          throw err;
        }
    }, appleMusicId);

    let page = await getMusicPage();
    try {
      await evaluateJump(page);
    } catch (err) {
      const msg = String((err && err.message) || err);
      // If the page reference went stale (navigation/reload), re-acquire and retry once.
      if (/detached|Promise was collected|Target closed|Execution context|Session closed/i.test(msg)) {
        console.warn("SERVER: Page reference was stale, re-acquiring and retrying once...");
        page = await getMusicPage();
        await evaluateJump(page);
      } else {
        throw err;
      }
    }

    console.log("SERVER: Jump to track completed successfully.");
    res.json({ success: true });
  } catch (e) {
    console.error("SERVER: Jump to track failed:", e);
    res.status(500).json({ error: e.message });
  }
});

// Run a simple MusicKit transport command (play/pause/next/previous) against
// the live page, with the same re-acquire-on-detach retry as jump-to-track.
const runMusicKitCommand = async (commandName) => {
  const evaluateCommand = (page) => page.evaluate(async (cmd) => {
    if (!window.MusicKit) throw new Error("MusicKit not found");
    const mk = window.MusicKit.getInstance();
    if (!mk) throw new Error("MusicKit instance not found");
    switch (cmd) {
      case 'play': await mk.play(); break;
      case 'pause': await mk.pause(); break;
      case 'next': await mk.skipToNextItem(); break;
      case 'previous': await mk.skipToPreviousItem(); break;
      default: throw new Error("Unknown command: " + cmd);
    }
    console.log("BROWSER: MusicKit command sent:", cmd);
    return true;
  }, commandName);

  let page = await getMusicPage();
  try {
    await evaluateCommand(page);
  } catch (err) {
    const msg = String((err && err.message) || err);
    if (/detached|Promise was collected|Target closed|Execution context|Session closed/i.test(msg)) {
      console.warn(`SERVER: stale page on '${commandName}', re-acquiring and retrying once...`);
      page = await getMusicPage();
      await evaluateCommand(page);
    } else {
      throw err;
    }
  }
};

const makeCommandRoute = (commandName) => async (req, res) => {
  try {
    console.log(`SERVER: ${commandName} command received`);
    await runMusicKitCommand(commandName);
    res.json({ success: true });
  } catch (e) {
    console.error(`SERVER: ${commandName} failed:`, e);
    res.status(500).json({ error: e.message });
  }
};

app.post('/play', makeCommandRoute('play'));
app.post('/pause', makeCommandRoute('pause'));
app.post('/next', makeCommandRoute('next'));
app.post('/previous', makeCommandRoute('previous'));

// Now Playing
app.get('/now-playing', async (req, res) => {
  try {
    if (!browser || !browser.connected) {
      return res.json({ isPlaying: false, error: "Browser closed" });
    }

    const page = await getMusicPage();
    const data = await page.evaluate(() => {
      try {
        const mk = window.MusicKit?.getInstance();
        if (!mk) return { isPlaying: false, error: "MusicKit not found" };

        const item = mk.nowPlayingItem;
        if (!item) return { isPlaying: false };

        return {
          isPlaying: mk.isPlaying,
          name: item.title,
          artist: item.artistName,
          album: item.albumName,
          duration: item.playbackDuration / 1000,
          position: mk.currentPlaybackTime
        };
      } catch (e) {
        return { isPlaying: false, error: e.toString() };
      }
    });

    res.json(data);
  } catch (e) {
    res.json({ isPlaying: false, error: e.message });
  }
});

// Start the server and the browser
app.listen(PORT, () => {
  console.log(`Puppeteer Bridge running on http://localhost:${PORT}`);
  initBrowser();
});
