(() => {
  "use strict";

  const makeButton = (anchor) => {
    const p = document.createElement("sppan");
    p.className = "emoji-button";
    p.innerText = anchor.emoji;
    p.title = anchor.tooltip;

    const a = document.createElement("a");
    a.className = "gaia-header-img emoji-anchor";
    a.href = anchor.url;
    a.appendChild(p);
    if (anchor.newtab) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }

    const li = document.createElement("li");
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
