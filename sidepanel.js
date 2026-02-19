const baseUrl = "https://lrclib.net/api/get";

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

    console.log("API response:", data); // Debugging log

    // 5. Display the lyrics
    if (data.plainLyrics) {
      document.getElementById("lyrics").innerHTML = `<pre>${escapeHtml(data.plainLyrics)}</pre>`;
      document.getElementById("lyrics").setAttribute("style", "overflow-y: auto");
    } else if (data.syncedLyrics) {
      document.getElementById("lyrics").innerHTML = `<pre>${escapeHtml(data.syncedLyrics)}</pre>`;
    } else {
      document.getElementById("lyrics").innerHTML = `<p class="error">No lyrics available</p>`;
    }
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    document.getElementById("lyrics").innerHTML =
      `<p class="error">Failed to load lyrics. Please try again.</p>`;
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

function updateSidePanelWithPageData(data) {
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

  // starting loader in lyrics section until we implement fetching real lyrics
  document.getElementById("lyrics").innerHTML = `<div class="loader"></div>`;

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
});

// Called when side panel loads
getPageDOM();
