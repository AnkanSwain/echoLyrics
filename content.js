// Content script - runs in the context of the YouTube Music page
// This script has access to the page's DOM

// Listening for messages from the side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDOMElement") {
    try {
      const playerBar = document.querySelector("ytmusic-player-bar[slot]");
      const contentInfo = playerBar?.querySelector(".content-info-wrapper");
      const songTitle = contentInfo?.querySelector(".title");
      const bylineData = contentInfo?.querySelector(".byline");
      const bylinehaschildren = bylineData?.children?.length > 0;

      if (songTitle && bylineData) {
        // Sending back the data (since you can't send DOM elements directly, only serializable data)
        sendResponse({
          success: true,
          elementExists: true,
          songTitle: songTitle.innerHTML,
          artist: bylinehaschildren
            ? bylineData.children[0].innerHTML
            : bylineData?.innerHTML,
          album: bylinehaschildren ? bylineData.children[2]?.innerHTML : null,
          releaseYear: bylinehaschildren
            ? bylineData.children[4]?.innerHTML
            : null,
        });
      } else {
        sendResponse({
          success: true,
          elementExists: false,
        });
      }
    } catch (error) {
      console.error("Error getting DOM elements:", error);
      sendResponse({
        success: false,
        error: error.message,
      });
    }
  }

  return true; // Required for async response
});

// You can also proactively send updates to the side panel
function sendUpdateToSidePanel(data) {
  // Checking if extension context is still valid
  if (!chrome.runtime?.id) {
    console.debug(
      "Extension context invalidated - content script needs refresh",
    );
    return;
  }

  try {
    chrome.runtime.sendMessage(
      {
        action: "domUpdate",
        data: data,
      },
      (response) => {
        // Checking for errors (like when the side panel is closed)
        if (chrome.runtime.lastError) {
          // Silently ignore - side panel is likely closed
          console.debug(
            "Side panel not available:",
            chrome.runtime.lastError.message,
          );
          return;
        }
      },
    );
  } catch (error) {
    // Extension context was invalidated mid-execution
    console.debug("Failed to send message:", error.message);
  }
}

// Debounce helper to limit update frequency
let debounceTimer;
function debounce(func, delay = 500) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(func, delay);
}

// Watch for changes in the player bar specifically
let lastSentData = null;

const observer = new MutationObserver((mutations) => {
  // Filter: only react if mutations affect the player bar or its descendants
  const relevantMutation = mutations.some((mutation) => {
    const target = mutation.target;
    // Check if mutation is within or is the player bar
    return target.closest && target.closest("ytmusic-player-bar[slot]");
  });

  if (!relevantMutation) return; // Ignore irrelevant changes

  debounce(() => {
    let songTitle = document
      .querySelector("ytmusic-player-bar[slot]")
      .querySelector(".content-info-wrapper")
      .querySelector(".title");
    let bylineData = document
      .querySelector("ytmusic-player-bar[slot]")
      .querySelector(".content-info-wrapper")
      .querySelector(".byline");
    let bylinehaschildren = bylineData?.children?.length > 0;
    if (songTitle && bylineData) {
      const currentData = {
        songTitle: songTitle.innerHTML,
        artist: bylinehaschildren
          ? bylineData.children[0].innerHTML
          : bylineData?.innerHTML,
        album: bylinehaschildren ? bylineData.children[2].innerHTML : null,
        releaseYear: bylinehaschildren
          ? bylineData.children[4].innerHTML
          : null,
        // Add other specific data you need
      };

      // Only send if data actually changed
      if (
        JSON.stringify(currentData?.songTitle) !== JSON.stringify(lastSentData?.songTitle) ||
        JSON.stringify(currentData?.artist) !== JSON.stringify(lastSentData?.artist)
      ) {
        lastSentData = currentData;
        sendUpdateToSidePanel(currentData);
      }
    }
  }, 300); // Wait 300ms after last change before sending
});

// Waiting for the player bar to exist, then observe it specifically
function startObserving() {
  const playerBar = document.querySelector("ytmusic-player-bar[slot]");

  if (playerBar) {
    // Observe only the player bar and its children, not the entire document
    observer.observe(playerBar, {
      childList: true, // Watch for added/removed children
      subtree: true, // Include all descendants
      characterData: true, // Watch for text changes
      attributes: true, // Watch for attribute changes
      attributeFilter: ["title", "aria-label"], // Only specific attributes
    });
    console.log("Observer started on player bar");
  } else {
    // If element doesn't exist yet, try again in 500ms
    setTimeout(startObserving, 500);
  }
}

// Start observing when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startObserving);
} else {
  startObserving();
}
