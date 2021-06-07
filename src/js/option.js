(() => {
  "use strict";

  let sortData = {
    li: null,
    diffY: 0,
  };
  const ul = document.querySelector(".anchor-list");

  const liIndex = (li) => {
    const items = Array.from(document.querySelectorAll(".anchor-item"));
    return items.findIndex((item) => item === li);
  };

  const updateHidden = (anchors) => {
    const noAnchorP = document.querySelector(".no-anchor-p");
    if (anchors.length === 0) {
      noAnchorP.classList.remove("hidden");
    } else {
      noAnchorP.classList.add("hidden");
    }
  };

  const currentAnchors = () => {
    let items = Array.from(document.querySelectorAll(".anchor-item"));
    return items.map((item) => {
      return {
        emoji: item.querySelector(".anchor-emoji").innerText,
        url: item.querySelector(".anchor-url").innerText,
        tooltip: item.querySelector(".anchor-emoji").title,
        newtab: item.classList.contains("newtab"),
      };
    });
  };

  const restoreAnchors = () => {
    chrome.storage.sync.get({ anchors: [] }, function (options) {
      console.log(options.anchors);
      updateHidden(options.anchors);
      while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
      }
      options.anchors.forEach((anchor) => {
        ul.appendChild(makeAnchorItem(anchor));
      });
    });
  };

  const saveAnchors = () => {
    const anchors = currentAnchors();
    chrome.storage.sync.set({ anchors: anchors }, function () {
      updateHidden(anchors);
    });
  };

  function removeAnchorItem(e) {
    const li = e.target.parentElement;
    li.remove();
    saveAnchors();
  }

  const makeAnchorItem = (anchor) => {
    const imgGrasp = document.createElement("img");
    imgGrasp.className = "grasp-area";
    imgGrasp.src = "images/grasp.svg";
    imgGrasp.addEventListener("mousedown", mouseDown);

    const pEmoji = document.createElement("p");
    pEmoji.className = "anchor-emoji";
    pEmoji.innerText = anchor.emoji;
    pEmoji.title = anchor.tooltip;

    const pUrl = document.createElement("p");
    pUrl.className = "anchor-url";
    pUrl.innerText = anchor.url;

    const btnDelete = document.createElement("button");
    btnDelete.className = "delete-button";
    btnDelete.innerText = "削除";
    btnDelete.addEventListener("click", removeAnchorItem);

    const li = document.createElement("li");
    li.className = "anchor-item";
    li.appendChild(imgGrasp);
    li.appendChild(pEmoji);
    li.appendChild(pUrl);
    li.appendChild(btnDelete);
    if (anchor.newtab) {
      li.classList.add("newtab");
    }

    return li;
  };

  const addAnchorItem = () => {
    const inputEmoji = document.querySelector(".input-emoji");
    const inputUrl = document.querySelector(".input-url");
    const inputTooltip = document.querySelector(".input-tooltip");
    const inputSwitch = document.querySelector(".switch-input");
    if (inputEmoji.value === "" || inputUrl.value === "") {
      window.alert("絵文字とURLは必須です。");
      return;
    }
    if (inputEmoji.clientWidth < inputEmoji.scrollWidth) {
      window.alert("絵文字は一文字にしてください。");
      return;
    }
    if (inputUrl.value.match(/^https?:\/\/[^\/\.]+.*/i) == null) {
      window.alert(`${inputUrl.value}\nはURLとして不正です。`);
      return;
    }
    const anchor = {
      emoji: inputEmoji.value,
      url: inputUrl.value,
      tooltip: inputTooltip.value,
      newtab: inputSwitch.checked,
    };
    ul.appendChild(makeAnchorItem(anchor));
    saveAnchors();
  };

  // Drag & Drop Sort
  const mouseDown = (e) => {
    e.preventDefault();
    const li = e.target.parentElement;
    sortData.li = li;
    sortData.diffY = e.pageY - li.getBoundingClientRect().top;

    const clone = li.cloneNode(true);
    clone.classList.add("anchor-clone");

    li.style.width = `${li.offsetWidth}px`;
    li.classList.add("anchor-grasp");
    li.insertAdjacentElement("afterend", clone);

    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", mouseUp);
  };

  const mouseMove = (e) => {
    const newTop = e.pageY - sortData.diffY;
    sortData.li.style.top = `${newTop}px`;

    const index = liIndex(sortData.li);
    const clone = document.querySelector(".anchor-clone");
    const pattern = ".anchor-item:not(.anchor-grasp):not(.anchor-clone)";
    let items = Array.from(document.querySelectorAll(pattern));

    for (let i = 0; i < items.length; i++) {
      const liRectTop = sortData.li.getBoundingClientRect().top;
      const liRectBottom = liRectTop + sortData.li.offsetHeight;
      const itemRectTop = items[i].getBoundingClientRect().top;
      const itemCenterY = itemRectTop + 0.5 * items[i].offsetHeight;
      if (liRectTop <= itemCenterY && itemCenterY <= liRectBottom) {
        if (i < index) {
          ul.insertBefore(items[i], clone.nextSibling);
        } else {
          ul.insertBefore(items[i], sortData.li);
        }
        break;
      }
    }
  };

  const mouseUp = () => {
    document.querySelector(".anchor-clone").remove();

    sortData.li.removeAttribute("style");
    sortData.li.classList.remove("anchor-grasp");
    sortData.li = null;

    saveAnchors();

    window.removeEventListener("mousemove", mouseMove);
    window.removeEventListener("mouseup", mouseUp);
  };

  document.addEventListener("DOMContentLoaded", restoreAnchors);
  document
    .querySelector(".add-button")
    .addEventListener("click", addAnchorItem);
})();
