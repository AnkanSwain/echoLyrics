# EchoLyrics - Lyrics Chrome Extension

## Project Overview

**Lyrics** is a Chrome extension that displays song lyrics directly in a side panel while you're listening to music on **YouTube Music**. The extension automatically detects the currently playing song and fetches its lyrics from the [lrclib.net](https://lrclib.net/) API, displaying song title, artist, album information, and the corresponding lyrics.

### Key Features

- **YouTube Music Integration**: Works seamlessly with YouTube Music
- **Side Panel Display**: View lyrics in a convenient side panel without leaving the music player
- **Song Information**: Displays song title, artist, album name, and release year
- **Automatic Detection**: Automatically extracts and displays lyrics for the currently playing song
- **Keyboard Shortcut**: Quick access via `Ctrl+B` (or `Cmd+B` on Mac)

## Installation & Setup

### Prerequisites

- Google Chrome browser (version 114 or later for side panel support)

### Installation Steps

#### Method 1: Load from Developer Mode (Recommended for Development)

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/` in your Chrome browser, or
   - Navigate via menu: **Chrome Menu** → **Settings** → **Extensions**

2. **Enable Developer Mode**
   - Toggle the **Developer mode** switch in the top-right corner

3. **Load the Extension**
   - Click the **Load unpacked** button
   - Navigate to and select the extension folder (the folder containing `manifest.json`)
   - Click **Select Folder**

4. **Verify Installation**
   - The extension should now appear in your extensions list
   - You should see the extension icon in your toolbar

### Usage

1. **Open a YouTube Music Tab**
   - Navigate to [YouTube Music](https://music.youtube.com)
   - Play a song

2. **Access the Lyrics Panel**
   - Click the extension icon in your Chrome toolbar, or
   - Use the keyboard shortcut: `Ctrl+B` (Windows/Linux) or `Cmd+B` (Mac)

3. **View Lyrics**
   - The side panel will open automatically showing:
     - Song title
     - Artist name
     - Album and release year
     - Full lyrics (plain or synced format if available)

### Technical Details

- **Manifest Version**: 3 (Chrome's latest extension platform)
- **Permissions Used**:
  - `activeTab`: Access current tab information
  - `scripting`: Execute scripts on YouTube Music pages
  - `sidePanel`: Display side panel UI
  - `tabs`: Manage tab information
  - `storage`: Store extension data
- **Content Scripts**: Runs on `https://music.youtube.com/*`
- **API**: Uses lrclib.net API for lyrics data

### File Structure

```
lyrics/
├── manifest.json          # Extension configuration
├── content.js             # Content script (runs on YouTube Music)
├── service-worker.js      # Background service worker
├── sidepanel.html         # Side panel UI
├── sidepanel.js           # Side panel logic
├── sidepanel.css          # Side panel styling
└── images/                # Extension icons
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

## Troubleshooting

### Extension icon not appearing
- Ensure you're on `https://music.youtube.com`
- The side panel is intentionally disabled on other websites
- Refresh the page if needed

### Lyrics not loading
- Check your internet connection
- The song may not be available in the lrclib.net database
- Check the browser console for error messages (`F12` → Console tab)

### Side panel won't open
- Try refreshing the YouTube Music page
- Use the keyboard shortcut `Ctrl+B` (or `Cmd+B`)
- Ensure the extension is properly loaded

## Development

To modify or customize this extension:

1. Edit the relevant files (HTML, CSS, JavaScript)
2. Go to `chrome://extensions/`
3. Click the **Reload** button on the extension card
4. Test your changes on YouTube Music

## Upcoming Features (Roadmap)

The following features are planned for future releases:

- **Dynamic/Focused Lyrics**: Highlight current lyrics in real-time as the song plays, with automatic scrolling to keep the current line in view
- **Additional APIs as Fallback**: Integrate support for multiple lyrics APIs to improve success rate when primary source doesn't have the lyrics
- **Hindi Song Lyrics (Romanized)**: Support for Hindi and other Indian language songs with romanized transliterations
- **Logo and UI Enhancement**: Improved visual design, better styling, and custom logo for the extension
- **Other Applications**: Support for other music players such as Spotify and even YouTube

## License

This project is for personal use and development.

## Resources

- [YouTube Music](https://music.youtube.com)
- [lrclib.net API](https://lrclib.net/) - Lyrics database
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/sidePanel/)
