(() => {
  "use strict";

  const makeButton = (anchor, generation) => {
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

    a.className = `glonavi-symbol-anchor-${generation}`;
    a.href = anchor.url;
    if (anchor.newtab) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }

    li.appendChild(a);
    return li;
  };

  const setButtons = () => {
    console.log(document.getElementById("header-global-navigation-root"));

    let generation = "react";
    let headerToolbarMenuUl = document
      ?.getElementById("header-global-navigation-root")
      ?.getElementsByTagName("div")[0]
      ?.getElementsByTagName("nav")[0]
      ?.getElementsByTagName("div")[0]
      ?.getElementsByTagName("ul")[0];

    if (!headerToolbarMenuUl) {
      generation = "gaia";
      headerToolbarMenuUl = document
        .querySelector(".gaia-header-toolbar-menu")
        .getElementsByTagName("ul")[0];
    }

    chrome.storage.sync.get({ anchors: [] }, function (options) {
      options.anchors.forEach((anchor) => {
        const button = makeButton(anchor, generation);
        headerToolbarMenuUl.appendChild(button);
      });
    });
  };

  setButtons();
})();
