(() => {
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "update" && details.previousVersion === "1.4.0") {
      console.log("migrating from 1.4.0");
      chrome.storage.sync.get({ anchors: [] }, (options) => {
        chrome.storage.local.set({ anchors: options.anchors }, () => {
          console.log("migration done");
        });
      });
    }
  });
})();
