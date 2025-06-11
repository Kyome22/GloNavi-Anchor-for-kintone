(async () => {
  "use strict";

  const BUTTON_TYPE = {
    EMOJI: "glonavi-emoji-button",
    IMAGE: "glonavi-image-button",
  };

  const GENERATION = {
    REACT: "react",
    GAIA: "gaia",
  };

  const createEmojiElement = (anchor) => {
    const span = document.createElement("span");
    span.className = BUTTON_TYPE.EMOJI;
    span.innerText = anchor.emoji;
    span.title = anchor.tooltip;
    return span;
  };

  const createImageElement = (anchor) => {
    const img = document.createElement("img");
    img.className = BUTTON_TYPE.IMAGE;
    img.src = anchor.image;
    img.title = anchor.tooltip;
    return img;
  };

  const createAnchorElement = (anchor, generation) => {
    const a = document.createElement("a");
    a.className = `glonavi-symbol-anchor-${generation}`;
    a.href = anchor.url;

    if (anchor.newtab) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }

    if (anchor.emoji) {
      a.appendChild(createEmojiElement(anchor));
    }

    if (anchor.image) {
      a.appendChild(createImageElement(anchor));
    }

    return a;
  };

  const makeButton = (anchor, generation) => {
    const li = document.createElement("li");
    const a = createAnchorElement(anchor, generation);
    li.appendChild(a);
    return li;
  };

  const findGlobalNavigation = () => {
    // React版のヘッダーを探す
    const reactGlobalNavigation = document
      .getElementById("header-global-navigation-root")
      ?.getElementsByTagName("div")[0]
      ?.getElementsByTagName("nav")[0]
      ?.getElementsByTagName("div")[0]
      ?.getElementsByTagName("ul")[0];

    if (reactGlobalNavigation) {
      return { generation: GENERATION.REACT, globalNavigation: reactGlobalNavigation };
    }

    // Gaia版のヘッダーを探す
    const gaiaGlobalNavigation = document.querySelector(".gaia-header-toolbar-menu")?.getElementsByTagName("ul")[0];

    if (gaiaGlobalNavigation) {
      return { generation: GENERATION.GAIA, globalNavigation: gaiaGlobalNavigation };
    }

    throw new Error("グローバルナビゲーションが見つかりませんでした。");
  };

  const setButtons = async () => {
    try {
      const { generation, globalNavigation } = findGlobalNavigation();

      const { anchors } = await chrome.storage.local.get({ anchors: [] });
      anchors.forEach((anchor) => {
        const button = makeButton(anchor, generation);
        globalNavigation.appendChild(button);
      });
    } catch (error) {
      console.error("ボタンの設定中にエラーが発生しました。Error:", error);
    }
  };

  await setButtons();
})();
