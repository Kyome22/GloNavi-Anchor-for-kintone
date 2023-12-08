(() => {
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "update" && details.previousVersion === "1.4.0") {
      console.log("migrating from 1.4.0");
      chrome.storage.sync.get({ anchors: [] }, function (options) {
        chrome.storage.local.set({ anchors: options.anchors }, function () {
          console.log("migration done");
        });
      });
    }
  });
})();
