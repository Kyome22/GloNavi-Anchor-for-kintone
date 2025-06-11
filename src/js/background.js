(() => {
  "use strict";

  const LEGACY_VERSION = "1.4.0";

  const migrateAnchorsToLocalStorage = async () => {
    try {
      const { anchors } = await chrome.storage.sync.get({ anchors: [] });
      await chrome.storage.local.set({ anchors: anchors });
      console.log("マイグレーションが完了しました。");
    } catch (error) {
      console.error("マイグレーション中にエラーが発生しました。Error:", error);
    }
  };

  const handleInstall = (details) => {
    if (details.reason === "update" && details.previousVersion === LEGACY_VERSION) {
      console.log("マイグレーションを開始します。");
      migrateAnchorsToLocalStorage();
    }
  };

  chrome.runtime.onInstalled.addListener(handleInstall);
})();
