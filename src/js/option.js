(() => {
  "use strict";

  const localize = chrome.i18n.getMessage;

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
      const aEmoji = item.querySelector(".anchor-emoji");
      const emoji = aEmoji == null ? null : aEmoji.innerText;

      const aImage = item.querySelector(".anchor-image");
      const image = aImage == null ? null : aImage.src;

      return {
        emoji: emoji,
        image: image,
        url: item.querySelector(".anchor-url").innerText,
        tooltip: item.getAttribute("tooltip"),
        newtab: item.classList.contains("newtab"),
      };
    });
  };

  const restoreAnchors = () => {
    chrome.storage.sync.get({ anchors: [] }, function (options) {
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
    const li = document.createElement("li");
    li.className = "anchor-item";
    let note = anchor.tooltip;
    if (anchor.newtab) {
      li.classList.add("newtab");
      note += localize("new_tab_paren");
    }
    li.setAttribute("tooltip", anchor.tooltip);

    const imgGrasp = document.createElement("img");
    imgGrasp.className = "grasp-area";
    imgGrasp.src = "images/grasp.svg";
    imgGrasp.addEventListener("mousedown", mouseDown);
    li.appendChild(imgGrasp);

    if (anchor.emoji) {
      const spanEmoji = document.createElement("span");
      spanEmoji.className = "anchor-emoji";
      spanEmoji.innerText = anchor.emoji;
      spanEmoji.title = note;
      li.appendChild(spanEmoji);
    }

    if (anchor.image) {
      const imgImage = document.createElement("img");
      imgImage.className = "anchor-image";
      imgImage.src = anchor.image;
      imgImage.title = note;
      li.appendChild(imgImage);
    }

    const pURL = document.createElement("p");
    pURL.className = "anchor-url";
    pURL.innerText = anchor.url;
    li.appendChild(pURL);

    const btnDelete = document.createElement("button");
    btnDelete.className = "delete-button";
    btnDelete.innerText = localize("delete");
    btnDelete.addEventListener("click", removeAnchorItem);
    li.appendChild(btnDelete);

    return li;
  };

  const readAsDataURL = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsDataURL(blob);
    });
  };

  const addAnchorItem = async () => {
    const emojiDiv = document.querySelector(".emoji-div");
    const inputEmoji = document.querySelector(".input-emoji");
    let emoji = null;
    if (emojiDiv.style.display == "") {
      if (inputEmoji.value === "") {
        throw new Error(localize("error1"));
      } else if (inputEmoji.clientWidth < inputEmoji.scrollWidth) {
        throw new Error(localize("error2"));
      }
      emoji = inputEmoji.value;
    }

    const imageDiv = document.querySelector(".image-div");
    const inputImage = document.querySelector(".input-image");
    let image = null;
    if (imageDiv.style.display == "") {
      if (inputImage.files.length == 0) {
        throw new Error(localize("error3"));
      }
      const blobURL = URL.createObjectURL(inputImage.files[0]);
      const resizedBlob = await resize(blobURL);
      image = await readAsDataURL(resizedBlob);
    }

    const inputURL = document.querySelector(".input-url");
    if (inputURL.value === "") {
      throw new Error(localize("error4"));
    } else if (inputURL.value.match(/^https?:\/\/[^\/\.]+.*/i) == null) {
      throw new Error(localize("error5"));
    }

    const inputTooltip = document.querySelector(".input-tooltip");
    const inputNewTab = document.querySelector(".newtab-radio");
    const anchor = {
      emoji: emoji,
      image: image,
      url: inputURL.value,
      tooltip: inputTooltip.value,
      newtab: inputNewTab.checked,
    };
    ul.appendChild(makeAnchorItem(anchor));
    saveAnchors();
  };

  const observeSymbolRadio = () => {
    document.querySelector(".image-div").style.display = "none";
    const radios = document.getElementsByName("anchor-symbol");
    for (const radio of radios) {
      radio.addEventListener("change", function (e) {
        const emojiDisplay = e.target.value == "emoji" ? "" : "none";
        const imageDisplay = e.target.value == "image" ? "" : "none";
        document.querySelector(".emoji-div").style.display = emojiDisplay;
        document.querySelector(".image-div").style.display = imageDisplay;
      });
    }
  };

  const observeEmojiInput = () => {
    const emojiPreview = document.querySelector(".emoji-preview");
    const inputEmoji = document.querySelector(".input-emoji");
    inputEmoji.addEventListener("input", () => {
      if (
        0 < inputEmoji.value.length &&
        inputEmoji.scrollWidth <= inputEmoji.clientWidth
      ) {
        emojiPreview.innerText = inputEmoji.value;
      } else {
        emojiPreview.innerText = "?";
      }
    });
  };

  const observeImageInput = () => {
    document
      .querySelector(".input-image")
      .addEventListener("change", function (e) {
        if (0 < e.target.files.length) {
          const blobURL = URL.createObjectURL(e.target.files[0]);
          document.querySelector(".image-preview").src = blobURL;
        } else {
          document.querySelector(".image-preview").src = "images/question.png";
        }
      });
  };

  // Drag & Drop Sort
  const mouseDown = (e) => {
    e.preventDefault();
    const li = e.target.parentElement;
    sortData.li = li;
    const ulTop = ul.getBoundingClientRect().top;
    const liTop = li.getBoundingClientRect().top;
    sortData.diffY = e.pageY + ulTop - liTop;

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

  // resize image
  const resize = (blobURL) => {
    return new Promise(function (resolve) {
      const image = new Image();
      image.onload = () => {
        let w = image.width;
        let h = image.height;
        if (w < h) {
          w = (24 * w) / h;
          h = 24;
        } else {
          h = (24 * h) / w;
          w = 24;
        }
        const canvas = document.createElement("canvas");
        canvas.width = 24;
        canvas.height = 24;
        let context = canvas.getContext("2d");
        context.drawImage(image, (24 - w) / 2, (24 - h) / 2, w, h);
        context.canvas.toBlob((blob) => {
          resolve(blob);
        });
      };
      image.src = blobURL;
    });
  };

  const initialLocalizeHTML = () => {
    document.querySelectorAll("[data-i18n-text]").forEach((element) => {
      const key = element.getAttribute("data-i18n-text");
      element.textContent = localize(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      element.placeholder = localize(key);
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    initialLocalizeHTML();
    restoreAnchors();
    document.querySelector(".append-button").addEventListener("click", () => {
      addAnchorItem().catch((error) => {
        window.alert(error);
      });
    });
    observeSymbolRadio();
    observeEmojiInput();
    observeImageInput();
  });
})();
