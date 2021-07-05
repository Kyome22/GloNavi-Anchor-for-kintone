(() => {
  "use strict";

  const makeButton = (anchor) => {
    const li = document.createElement("li");
    const a = document.createElement("a");

    if (anchor.emoji) {
      const span = document.createElement("span");
      span.className = "glonavi-emoji-button";
      span.innerText = anchor.emoji;
      span.title = anchor.tooltip;
      a.appendChild(span);
    }

    if (anchor.image) {
      const img = document.createElement("img");
      img.className = "glonavi-image-button";
      img.src = anchor.image;
      img.title = anchor.tooltip;
      a.appendChild(img);
    }

    a.className = "gaia-header-img glonavi-symbol-anchor";
    a.href = anchor.url;
    if (anchor.newtab) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }

    li.appendChild(a);
    return li;
  };

  const setButtons = () => {
    const headerToolbarMenuUl = document
      .querySelector(".gaia-header-toolbar-menu")
      .getElementsByTagName("ul")[0];

    chrome.storage.sync.get({ anchors: [] }, function (options) {
      options.anchors.forEach((anchor) => {
        const button = makeButton(anchor);
        headerToolbarMenuUl.appendChild(button);
      });
    });
  };

  setButtons();
})();
