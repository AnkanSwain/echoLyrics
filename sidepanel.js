const baseUrl = "https://lrclib.net/api/get";

let plainLyricsMode = true;
let songdata = null;
let syncedLyricsEntries = [];
let currentPlaybackTime = 0;
let activeSyncedLineIndex = -1;
let syncedLineElements = [];

let plainlyriccontent = ``;
let syncedlyriccontent = ``;
let errorcontent = `<p class="error">No lyrics available</p>`;

// THEME
// dark mode initialization
function initDarkMode() {
  // Check localStorage for saved preference
  const savedTheme = localStorage.getItem("theme") || "light";

  const toggledark = document.querySelector(
    '#darkModeToggle input[type="checkbox"]',
  );

  // If no saved preference, check system preference
  if (!localStorage.getItem("theme")) {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const prefTheme = prefersDark ? "dark" : "light";
    if (toggledark) {
      toggledark.checked = prefTheme === "dark";
      toggledark.dispatchEvent(new Event("click"));
    }
    applyTheme(prefTheme);
  } else {
    if (toggledark) {
      toggledark.checked = savedTheme === "dark";
      toggledark.dispatchEvent(new Event("click"));
    }
    applyTheme(savedTheme);
  }
}
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
  localStorage.setItem("theme", theme);
}
// theme toggle handler
document.addEventListener("DOMContentLoaded", () => {
  initDarkMode();

  const toggledark = document.querySelector(
    '#darkModeToggle input[type="checkbox"]',
  );
  if (toggledark) {
    toggledark.addEventListener("click", () => {
      const isDark = document.body.classList.contains("dark-mode");
      applyTheme(isDark ? "light" : "dark");
    });
  }
});

// TOGGLE
const toggleCheckbox = document.querySelector(
  '#toggleWrapper input[type="checkbox"]',
);
toggleCheckbox.addEventListener("change", function () {
  plainLyricsMode = !this.checked;
  displayLyrics(songdata);
});

// API CALL
async function getSongLyrics(songTitle, artist, album = "") {
  try {
    // 1. Build the API endpoint URL with query parameters
    const params = new URLSearchParams({
      track_name: songTitle,
      artist_name: artist,
    });

    if (album && album !== "Unknown Album") {
      params.append("album_name", album);
    }

    const apiUrl = `${baseUrl}?${params.toString()}`;

    // 2. Make the API request
    const response = await fetch(apiUrl);

    // 3. Check if request was successful
    if (!response.ok) {
      if (response.status === 404) {
        document.getElementById("lyrics").innerHTML =
          `<p class="error">Lyrics not found for "${songTitle}" by ${artist}</p>`;
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 4. Parse the JSON response
    const data = await response.json();
    songdata = data; // storing song data in global variable to use when toggling between synced and plain lyrics without making another API call

    // 5. Display the lyrics
    prepareLyrics(data);
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    document.getElementById("lyrics").innerHTML =
      `<p class="error">Failed to load lyrics. Please try again.</p>`;
  }
}

function sendPlaybackTimeToPage(playbackTime) {
  // Checking if extension context is still valid
  if (!chrome.runtime?.id) {
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs?.[0]?.id;
    if (!tabId) {
      return;
    }

    try {
      chrome.tabs.sendMessage(
        tabId,
        {
          action: "setPlaybackTime",
          data: {
            playbackTime,
          },
        },
        () => {
          // Content script may not be available; ignore errors
          if (chrome.runtime.lastError) {
            return;
          }
        },
      );
    } catch (error) {
      console.debug("Failed to send playback time set:", error.message);
    }
  });
}

// handle synced lyrics line click
function handleLineClick(index) {
  if (index >= 0 && index < syncedLyricsEntries.length) {
    const seconds = syncedLyricsEntries[index].seconds;
    sendPlaybackTimeToPage(seconds);
  }
}

// PREPARE LYRICS FOR DISPLAY
function prepareLyrics(data) {
  // for plain lyrics
  if (data.plainLyrics) {
    plainlyriccontent = `<pre>${escapeHtml(data.plainLyrics)}</pre>`;
  } else if (data.syncedLyrics) {
    let syncedLyricsText = data.syncedLyrics.replace(/\[.*?\]/g, ""); // Remove timestamps
    plainlyriccontent = `<pre>${escapeHtml(syncedLyricsText)}</pre>`;
  } else {
    plainlyriccontent = ``;
  }

  // for synced lyrics
  if (data.syncedLyrics) {
    syncedLyricsEntries = [];
    const lines = data.syncedLyrics.split("\n");
    for (let line of lines) {
      if (line.trim() === "") continue; // skip empty lines
      let timeStamp = line.slice(line.indexOf("[") + 1, line.indexOf("]"));
      let lyricText = line.slice(line.indexOf("]") + 1).trim();

      const seconds = parseTimestampToSeconds(timeStamp);
      if (Number.isFinite(seconds)) {
        syncedLyricsEntries.push({
          seconds,
          text: lyricText,
        });
      }
    }

    syncedLyricsEntries.sort((a, b) => a.seconds - b.seconds);
    syncedlyriccontent = `<pre>${escapeHtml(data.syncedLyrics)}</pre>`;
  } else {
    syncedLyricsEntries = [];
    syncedlyriccontent = ``;
  }

  activeSyncedLineIndex = -1;
  syncedLineElements = [];

  // enabling toggle switch after lyrics are loaded and syncedLyrics are available
  if (
    document.getElementById("toggleWrapper").classList.contains("disabled") &&
    data.syncedLyrics
  ) {
    document.getElementById("toggleWrapper").classList.remove("disabled");
  }

  displayLyrics(data);
}

function displayLyrics(data) {

  // for plain lyrics
  if (plainLyricsMode) {
    if (data.plainLyrics) {
      document.getElementById("lyrics").innerHTML = plainlyriccontent;
      document
        .getElementById("lyrics")
        .setAttribute("style", "overflow-y: auto");
    } else {
      document.getElementById("lyrics").innerHTML = errorcontent;
    }
  }
  // for synced lyrics
  else {
    if (data.syncedLyrics) {
      renderSyncedLyricsList();
      updateActiveSyncedLine(currentPlaybackTime);
    } else if (data.plainLyrics) {
      document.getElementById("lyrics").innerHTML = plainlyriccontent;
      document
        .getElementById("lyrics")
        .setAttribute("style", "overflow-y: auto");
      // to toggle button to plain position
      toggleCheckbox.checked = false;
      plainLyricsMode = true;
      toggleCheckbox.dispatchEvent(new Event("change"));
    } else {
      document.getElementById("lyrics").innerHTML = errorcontent;
    }
  }
}

/**
 * Parses timestamp from format MM:SS.MS to seconds
 * @param {string} timeStamp - Timestamp in format "00:13.42"
 * @returns {number} Total seconds with decimal precision
 */
function parseTimestampToSeconds(timeStamp) {
  const parts = timeStamp.split(":");

  if (parts.length !== 2) {
    return NaN;
  }

  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return NaN;
  }

  return minutes * 60 + seconds;
}

function findSyncedLineIndex(playbackTime) {
  let lineIndex = -1;

  for (let i = 0; i < syncedLyricsEntries.length; i++) {
    if (syncedLyricsEntries[i].seconds <= playbackTime) {
      lineIndex = i;
    } else {
      break;
    }
  }

  return lineIndex;
}

function renderSyncedLyricsList() {
  if (!syncedLyricsEntries.length) {
    document.getElementById("lyrics").innerHTML = errorcontent;
    return;
  }

  const lyricsContainer = document.getElementById("lyrics");
  lyricsContainer.innerHTML = "";
  lyricsContainer.setAttribute("style", "overflow-y: auto");
  
  const listDiv = document.createElement("div");
  listDiv.className = "synced-lyrics-list";
  
  syncedLineElements = [];
  
  syncedLyricsEntries.forEach((entry, index) => {
    const lineDiv = document.createElement("div");
    lineDiv.className = "synced-line";
    lineDiv.textContent = entry.text;
    lineDiv.dataset.index = index;
    lineDiv.addEventListener("click", () => handleLineClick(index));
    
    listDiv.appendChild(lineDiv);
    syncedLineElements.push(lineDiv);
  });
  
  lyricsContainer.appendChild(listDiv);
}

function updateActiveSyncedLine(playbackTime) {
  if (!syncedLineElements.length) {
    return;
  }

  const lineIndex = findSyncedLineIndex(playbackTime);

  if (lineIndex === activeSyncedLineIndex) {
    return;
  }

  // Remove active class from previous line
  if (activeSyncedLineIndex >= 0 && syncedLineElements[activeSyncedLineIndex]) {
    syncedLineElements[activeSyncedLineIndex].classList.remove("active");
  }

  activeSyncedLineIndex = lineIndex;

  // Add active class to new line
  if (lineIndex >= 0 && syncedLineElements[lineIndex]) {
    syncedLineElements[lineIndex].classList.add("active");
    
    // Auto-scroll to active line (smooth, centered)
    syncedLineElements[lineIndex].scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}

/**
 * Escapes HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// SIDEBAR
function updateSidePanelWithPageData(data) {
  currentPlaybackTime = 0;
  activeSyncedLineIndex = -1;

  let songTitleText = data?.songTitle ? data.songTitle.trim() : "Unknown Title";
  let artistText = data?.artist ? data.artist.trim() : "Unknown Artist";
  let albumText = data?.album ? data.album.trim() : "Unknown Album";
  let releaseYearText = data?.releaseYear
    ? data.releaseYear.trim()
    : "Unknown Year";

  document.getElementById("title").innerHTML = songTitleText;
  document.getElementById("artist").innerHTML = artistText;
  if (albumText !== "Unknown Album") {
    document.getElementById("album").innerHTML = albumText;
    document.getElementById("release-year").innerHTML = `(${releaseYearText})`;
  } else {
    document.getElementById("album").innerHTML = "";
    document.getElementById("release-year").innerHTML = "";
  }

  // starting loader in lyrics section until we implement fetching real lyrics and disabling toggle switch
  document.getElementById("lyrics").innerHTML = `<div class="loader"></div>`;
  document.getElementById("toggleWrapper").classList.add("disabled");

  getSongLyrics(songTitleText, artistText, albumText);
}

async function getPageDOM() {
  // Getting the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    console.log("No active tab found");
    return;
  }

  // Sending message to content script running on that tab
  chrome.tabs.sendMessage(tab.id, { action: "getDOMElement" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error:", chrome.runtime.lastError.message);
      return;
    } else if (response?.elementExists) {
      updateSidePanelWithPageData(response);
    } else {
      console.log("Element not found on page");
    }
  });
}

// Listening for updates from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "domUpdate") {
    updateSidePanelWithPageData(request.data);
  }

  if (request.action === "playbackTimeUpdate") {
    currentPlaybackTime = Number(request?.data?.playbackTime ?? 0);

    if (!plainLyricsMode && songdata?.syncedLyrics) {
      updateActiveSyncedLine(currentPlaybackTime);
    }
  }
});

// Called when side panel loads
getPageDOM();
