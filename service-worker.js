const ORIGIN = 'https://music.youtube.com';

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Checks the URL of the active tab and enables/disables the side panel accordingly
async function applySidePanelForTab(tabId, tabUrl) {
  if (!tabUrl) return;
  const url = new URL(tabUrl);

  if (url.origin === ORIGIN) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'sidepanel.html',
      enabled: true
    });
  } else {
    // Disables the side panel on all other sites
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false
    });
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  await applySidePanelForTab(tabId, tab.url);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  await applySidePanelForTab(tabId, tab.url);
});

chrome.runtime.onStartup.addListener(async () => {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => applySidePanelForTab(tab.id, tab.url)));
});

chrome.runtime.onInstalled.addListener(async () => {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => applySidePanelForTab(tab.id, tab.url)));
});