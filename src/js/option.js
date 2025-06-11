(async () => {
  "use strict";

  const localize = chrome.i18n.getMessage;

  class AnchorManager {
    constructor(ul) {
      this.ul = ul;
      this.noAnchorP = document.querySelector(".no-anchor-p");
      this.dragDropManager = new DragDropManager(ul, this);
      this.imageProcessor = new ImageProcessor();
    }

    updateHidden(anchors) {
      if (anchors.length === 0) {
        this.ul.classList.add("hidden");
        this.noAnchorP.classList.remove("hidden");
      } else {
        this.ul.classList.remove("hidden");
        this.noAnchorP.classList.add("hidden");
      }
    }

    currentAnchors() {
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
    }

    async restore() {
      const { anchors } = await chrome.storage.local.get({ anchors: [] });
      this.updateHidden(anchors);
      while (this.ul.firstChild) {
        this.ul.removeChild(this.ul.firstChild);
      }
      anchors.forEach((anchor) => {
        this.appendAnchorItem(anchor);
      });
    }

    async save() {
      const anchors = this.currentAnchors();
      await chrome.storage.local.set({ anchors: anchors });
      this.updateHidden(anchors);
    }

    appendAnchorItem(anchor) {
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
      this.dragDropManager.setupGraspArea(imgGrasp);
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
      btnDelete.addEventListener("click", async (event) => {
        const li = event.target.parentElement;
        li.remove();
        await this.save();
      });
      li.appendChild(btnDelete);

      this.ul.appendChild(li);
    }

    async collectAnchorInfo() {
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
        image = await this.imageProcessor.processImage(inputImage.files[0]);
      }

      const inputURL = document.querySelector(".input-url");
      if (inputURL.value === "") {
        throw new Error(localize("error4"));
      } else if (inputURL.value.match(/^https?:\/\/[^\/\.]+.*/i) == null) {
        throw new Error(localize("error5"));
      }

      const inputTooltip = document.querySelector(".input-tooltip");
      const inputNewTab = document.querySelector(".newtab-radio");
      return {
        emoji: emoji,
        image: image,
        url: inputURL.value,
        tooltip: inputTooltip.value,
        newtab: inputNewTab.checked,
      };
    }

    async createNewAnchorItem() {
      const anchor = await this.collectAnchorInfo();
      this.appendAnchorItem(anchor);
      await this.save();
    }
  }

  class DragDropManager {
    constructor(ul, anchorManager) {
      this.ul = ul;
      this.anchorManager = anchorManager;
      this.sortData = {
        li: null,
        diffY: 0,
      };
    }

    liIndex(li) {
      const items = Array.from(document.querySelectorAll(".anchor-item"));
      return items.findIndex((item) => item === li);
    }

    mouseDown(event) {
      event.preventDefault();
      const li = event.target.parentElement;
      this.sortData.li = li;
      const ulTop = this.ul.getBoundingClientRect().top;
      const liTop = li.getBoundingClientRect().top;
      this.sortData.diffY = event.pageY + ulTop - liTop;

      const clone = li.cloneNode(true);
      clone.classList.add("anchor-clone");

      li.style.width = `${li.offsetWidth}px`;
      li.classList.add("anchor-grasp");
      li.insertAdjacentElement("afterend", clone);

      window.addEventListener("mousemove", this.mouseMove.bind(this));
      window.addEventListener("mouseup", this.mouseUp.bind(this));
    }

    mouseMove(event) {
      const newTop = event.pageY - this.sortData.diffY;
      this.sortData.li.style.top = `${newTop}px`;

      const index = this.liIndex(this.sortData.li);
      const clone = document.querySelector(".anchor-clone");
      const pattern = ".anchor-item:not(.anchor-grasp):not(.anchor-clone)";
      let items = Array.from(document.querySelectorAll(pattern));

      for (let i = 0; i < items.length; i++) {
        const liRectTop = this.sortData.li.getBoundingClientRect().top;
        const liRectBottom = liRectTop + this.sortData.li.offsetHeight;
        const itemRectTop = items[i].getBoundingClientRect().top;
        const itemCenterY = itemRectTop + 0.5 * items[i].offsetHeight;
        if (liRectTop <= itemCenterY && itemCenterY <= liRectBottom) {
          if (i < index) {
            this.ul.insertBefore(items[i], clone.nextSibling);
          } else {
            this.ul.insertBefore(items[i], this.sortData.li);
          }
          break;
        }
      }
    }

    async mouseUp() {
      document.querySelector(".anchor-clone").remove();

      this.sortData.li.removeAttribute("style");
      this.sortData.li.classList.remove("anchor-grasp");
      this.sortData.li = null;

      await this.anchorManager.save();

      window.removeEventListener("mousemove", this.mouseMove.bind(this));
      window.removeEventListener("mouseup", this.mouseUp.bind(this));
    }

    setupGraspArea(imgGrasp) {
      imgGrasp.addEventListener("mousedown", this.mouseDown.bind(this));
    }
  }

  class ImageProcessor {
    constructor() {
      this.size = 48;
    }

    readAsDataURL(blob) {
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
    }

    resize(blobURL) {
      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
          let w = image.width;
          let h = image.height;
          if (w < h) {
            w = (this.size * w) / h;
            h = this.size;
          } else {
            h = (this.size * h) / w;
            w = this.size;
          }
          const canvas = document.createElement("canvas");
          canvas.width = this.size;
          canvas.height = this.size;
          const context = canvas.getContext("2d");
          context.imageSmoothingQuality = "high";
          context.drawImage(image, (this.size - w) / 2, (this.size - h) / 2, w, h);
          // グレーで塗り潰し
          context.globalCompositeOperation = "source-in";
          context.fillStyle = "#888888";
          context.fillRect(0, 0, this.size, this.size);
          context.canvas.toBlob((blob) => {
            resolve(blob);
          });
        };
        image.src = blobURL;
      });
    }

    async processImage(file) {
      const blobURL = URL.createObjectURL(file);
      const resizedBlob = await this.resize(blobURL);
      return await this.readAsDataURL(resizedBlob);
    }
  }

  class SettingsManager {
    constructor(anchorManager) {
      this.anchorManager = anchorManager;
    }

    isString(obj) {
      return typeof obj === "string" || obj instanceof String;
    }

    validateJson(json) {
      if (!Array.isArray(json)) {
        return false;
      }
      for (let obj of json) {
        const keyCheck = ["emoji", "image", "url", "tooltip", "newtab"].every((key) => key in obj);
        if (!keyCheck) {
          return false;
        }
        const emojiCheck = this.isString(obj["emoji"]);
        const imageCheck = this.isString(obj["image"]);
        if ((emojiCheck && imageCheck) || (!emojiCheck && !imageCheck)) {
          return false;
        }
        if (!this.isString(obj["url"]) || !this.isString(obj["tooltip"])) {
          return false;
        }
        if (!(typeof obj["newtab"] === "boolean")) {
          return false;
        }
      }
      return true;
    }

    async exportSettings() {
      const noAnchorP = document.querySelector(".no-anchor-p");
      if (noAnchorP.classList.contains("hidden") === false) {
        throw new Error(localize("error6"));
      }
      const anchors = this.anchorManager.currentAnchors();
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
    }

    async importSettings() {
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
      if (!this.validateJson(json)) {
        throw new Error(localize("error7", [file.name]));
      }
      json.forEach((anchor) => {
        this.anchorManager.appendAnchorItem(anchor);
      });
      await this.anchorManager.save();
    }
  }

  class InitialUIEventSetupAgent {
    constructor(anchorManager, settingsManager) {
      this.anchorManager = anchorManager;
      this.settingsManager = settingsManager;
    }

    setup() {
      this.setupAppendButton();
      this.setupExportButton();
      this.setupImportButton();
      this.setupSymbolRadio();
      this.setupEmojiInput();
      this.setupImageInput();
    }

    setupAppendButton() {
      document.querySelector(".append-button").addEventListener("click", () => {
        this.anchorManager.createNewAnchorItem().catch((error) => {
          window.alert(error.message);
        });
      });
    }

    setupExportButton() {
      document.querySelector(".export-button").addEventListener("click", () => {
        this.settingsManager.exportSettings().catch((error) => {
          window.alert(`Export Error: ${error.message}`);
        });
      });
    }

    setupImportButton() {
      document.querySelector(".import-button").addEventListener("click", () => {
        this.settingsManager.importSettings().catch((error) => {
          window.alert(`Import Error: ${error.message}`);
        });
      });
    }

    setupSymbolRadio() {
      document.querySelector(".image-div").style.display = "none";
      const radios = document.getElementsByName("anchor-symbol");
      for (const radio of radios) {
        radio.addEventListener("change", (event) => {
          const emojiDisplay = event.target.value == "emoji" ? "" : "none";
          const imageDisplay = event.target.value == "image" ? "" : "none";
          document.querySelector(".emoji-div").style.display = emojiDisplay;
          document.querySelector(".image-div").style.display = imageDisplay;
        });
      }
    }

    setupEmojiInput() {
      const emojiPreview = document.querySelector(".emoji-preview");
      const inputEmoji = document.querySelector(".input-emoji");
      inputEmoji.addEventListener("input", () => {
        if (0 < inputEmoji.value.length && inputEmoji.scrollWidth <= inputEmoji.clientWidth) {
          emojiPreview.innerText = inputEmoji.value;
        } else {
          emojiPreview.innerText = "?";
        }
      });
    }

    setupImageInput() {
      document.querySelector(".input-image").addEventListener("change", (event) => {
        if (0 < event.target.files.length) {
          const blobURL = URL.createObjectURL(event.target.files[0]);
          document.querySelector(".image-preview").src = blobURL;
        } else {
          document.querySelector(".image-preview").src = "images/question.png";
        }
      });
    }
  }

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

  document.addEventListener("DOMContentLoaded", async () => {
    initialLocalizeHTML();
    const ul = document.querySelector(".anchor-list");
    const anchorManager = new AnchorManager(ul);
    const settingsManager = new SettingsManager(anchorManager);
    const initialUIEventSetupAgent = new InitialUIEventSetupAgent(anchorManager, settingsManager);
    initialUIEventSetupAgent.setup();
    await anchorManager.restore();
  });
})();
