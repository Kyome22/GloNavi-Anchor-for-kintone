(() => {
  "use strict";

  const CLASS_NAMES = {
    EMOJI_BUTTON: "glonavi-emoji-button",
    IMAGE_BUTTON: "glonavi-image-button",
    SYMBOL_ANCHOR: "glonavi-symbol-anchor",
  };

  const GENERATIONS = {
    REACT: "react",
    GAIA: "gaia",
  };

  const createEmojiElement = (anchor) => {
    const span = document.createElement("span");
    span.className = CLASS_NAMES.EMOJI_BUTTON;
    span.innerText = anchor.emoji;
    span.title = anchor.tooltip;
    return span;
  };

  const createImageElement = (anchor) => {
    const img = document.createElement("img");
    img.className = CLASS_NAMES.IMAGE_BUTTON;
    img.src = anchor.image;
    img.title = anchor.tooltip;
    return img;
  };

  const createAnchorElement = (anchor, generation) => {
    const a = document.createElement("a");
    a.className = `${CLASS_NAMES.SYMBOL_ANCHOR}-${generation}`;
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
      return { generation: GENERATIONS.REACT, globalNavigation: reactGlobalNavigation };
    }

    // Gaia版のヘッダーを探す
    const gaiaGlobalNavigation = document.querySelector(".gaia-header-toolbar-menu")?.getElementsByTagName("ul")[0];

    if (gaiaGlobalNavigation) {
      return { generation: GENERATIONS.GAIA, globalNavigation: gaiaGlobalNavigation };
    }

    throw new Error("ヘッダーメニューが見つかりませんでした");
  };

  const setButtons = () => {
    try {
      const { generation, globalNavigation } = findGlobalNavigation();

      chrome.storage.local.get({ anchors: [] }, (options) => {
        options.anchors.forEach((anchor) => {
          const button = makeButton(anchor, generation);
          globalNavigation.appendChild(button);
        });
      });
    } catch (error) {
      console.error("ボタンの設定中にエラーが発生しました:", error);
    }
  };

  setButtons();
})();
