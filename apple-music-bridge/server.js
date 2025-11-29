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
      headless: false, // User needs to see it to log in
      defaultViewport: null, // Use full window size
      userDataDir: path.join(__dirname, 'user_data'), // Save login session
      args: [
        '--window-size=1280,800',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const pages = await browser.pages();
    musicPage = pages[0];

    // Navigate to Apple Music if not already there
    if (!musicPage.url().includes('music.apple.com')) {
      await musicPage.goto('https://music.apple.com/us/browse', { waitUntil: 'networkidle2' });
    }

    // Pipe browser console logs to our terminal with better formatting
    musicPage.on('console', async msg => {
      const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
      console.log('BROWSER LOG:', ...args);
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

// ... (rest of file) ...

// Jump to Track
app.post('/jump-to-track', async (req, res) => {
  const { appleMusicId } = req.body;
  if (!appleMusicId) return res.status(400).json({ error: 'Missing appleMusicId' });

  try {
    console.log(`SERVER: Attempting to jump to track: ${appleMusicId}`);
    
    if (!musicPage) {
        if (!browser) await initBrowser();
        if (!musicPage) throw new Error("Browser not open");
    }

    await musicPage.evaluate(async (songId) => {
        console.log(`BROWSER: Starting jump-to-track for ${songId}`);
        
        if (!window.MusicKit) throw new Error("MusicKit not found");
        const mk = window.MusicKit.getInstance();
        if (!mk) throw new Error("MusicKit instance not found");
        
        console.log("BROWSER: Auth status:", mk.isAuthorized);
        
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

    console.log("SERVER: Jump to track completed successfully.");
    res.json({ success: true });
  } catch (e) {
    console.error("SERVER: Jump to track failed:", e);
    res.status(500).json({ error: e.message });
  }
});

// Now Playing
app.get('/now-playing', async (req, res) => {
  try {
    if (!musicPage) {
      return res.json({ isPlaying: false, error: "Browser closed" });
    }

    const data = await musicPage.evaluate(() => {
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
