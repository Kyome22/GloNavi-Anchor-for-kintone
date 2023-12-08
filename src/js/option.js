(() => {
  "use strict";

  const localize = chrome.i18n.getMessage;

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
      ul.classList.add("hidden");
      noAnchorP.classList.remove("hidden");
    } else {
      ul.classList.remove("hidden");
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
    chrome.storage.local.get({ anchors: [] }, function (options) {
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
    chrome.storage.local.set({ anchors: anchors }, function () {
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
      const size = 48;
      const image = new Image();
      image.onload = () => {
        let w = image.width;
        let h = image.height;
        if (w < h) {
          w = (size * w) / h;
          h = size;
        } else {
          h = (size * h) / w;
          w = size;
        }
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        context.imageSmoothingQuality = "high";
        context.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
        // グレーで塗り潰し
        context.globalCompositeOperation = "source-in";
        context.fillStyle = "#888888";
        context.fillRect(0, 0, size, size);
        context.canvas.toBlob((blob) => {
          resolve(blob);
        });
      };
      image.src = blobURL;
    });
  };

  // Export/Import Settings File
  const exportSettingsFile = async () => {
    const noAnchorP = document.querySelector(".no-anchor-p");
    if (noAnchorP.classList.contains("hidden") === false) {
      throw new Error(localize("error6"));
    }
    const anchors = currentAnchors();
    const json = JSON.stringify(anchors, null, 2);
    const options = {
      types: [
        {
          description: "GloNavi Anchor Settings File (JSON)",
          accept: {
            "application/json": [".json"],
          },
        },
      ],
      suggestedName: "glonavi_settings",
    };
    const fileHandle = await window.showSaveFilePicker(options);
    const writable = await fileHandle.createWritable();
    await writable.write(json);
    await writable.close();
  };

  const importSettingsFile = async () => {
    const options = {
      types: [
        {
          description: "GloNavi Anchor Settings File (JSON)",
          accept: {
            "application/json": [".json"],
          },
        },
      ],
      excludeAcceptAllOption: true,
      multiple: false,
    };
    const [fileHandle] = await window.showOpenFilePicker(options);
    const file = await fileHandle.getFile();
    const content = await file.text();
    const json = JSON.parse(content);
    if (!jsonValidation(json)) {
      throw new Error(localize("error7", [file.name]));
    }
    json.forEach((anchor) => {
      ul.appendChild(makeAnchorItem(anchor));
    });
    saveAnchors();
  };

  function isString(obj) {
    return typeof obj === "string" || obj instanceof String;
  }

  const jsonValidation = (json) => {
    if (!Array.isArray(json)) {
      return false;
    }
    for (let obj of json) {
      const keyCheck =
        "emoji" in obj &&
        "image" in obj &&
        "url" in obj &&
        "tooltip" in obj &&
        "newtab" in obj;
      if (!keyCheck) {
        return false;
      }
      const emojiCheck = isString(obj["emoji"]);
      const imageCheck = isString(obj["image"]);
      if ((emojiCheck && imageCheck) || (!emojiCheck && !imageCheck)) {
        return false;
      }
      if (!isString(obj["url"]) || !isString(obj["tooltip"])) {
        return false;
      }
      if (!(typeof obj["newtab"] === "boolean")) {
        return false;
      }
    }
    return true;
  };

  document.addEventListener("DOMContentLoaded", () => {
    initialLocalizeHTML();
    restoreAnchors();
    observeSymbolRadio();
    observeEmojiInput();
    observeImageInput();
    document.querySelector(".append-button").addEventListener("click", () => {
      addAnchorItem().catch((error) => {
        window.alert(error.message);
      });
    });
    document.querySelector(".export-button").addEventListener("click", () => {
      exportSettingsFile().catch((error) => {
        window.alert(`Export Error ${error.message}`);
      });
    });
    document.querySelector(".import-button").addEventListener("click", () => {
      importSettingsFile().catch((error) => {
        window.alert(`Import Error ${error.message}`);
      });
    });
  });
})();
