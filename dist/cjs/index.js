var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/index.js
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_video = __toESM(require("video.js"));
var import_videojs_contrib_ads = require("videojs-contrib-ads");
var import_vast_client2 = require("@dailymotion/vast-client");

// src/lib/injectScriptTag.js
function injectScriptTag(src, onLoadCallback, onErrorCallback) {
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = src;
  script.async = true;
  script.onload = onLoadCallback;
  script.onerror = onErrorCallback;
  document.body.appendChild(script);
}

// src/lib/utils.js
var isNumeric = (str) => {
  if (typeof str === "number") {
    return true;
  }
  return !Number.isNaN(str) && !Number.isNaN(parseFloat(str));
};
var getLocalISOString = (date) => {
  const offset = date.getTimezoneOffset();
  const offsetAbs = Math.abs(offset);
  const isoString = new Date(date.getTime() - offset * 60 * 1e3).toISOString();
  return `${isoString.slice(0, -1)}${offset > 0 ? "-" : "+"}${String(Math.floor(offsetAbs / 60)).padStart(2, "0")}`;
};
var convertTimeOffsetToSeconds = (timecode, duration = null) => {
  if (duration && timecode.includes("%")) {
    const percent = timecode.replace("%", "");
    return duration / 100 * percent;
  }
  if (timecode.includes("#")) {
    return timecode.replace("#", "");
  }
  const [time, ms] = timecode.split(".");
  const [hours, minutes, seconds] = time.split(":");
  return Number(`${parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseInt(seconds, 10)}.${ms}`);
};

// src/vmap/adsource.js
var VMAPAdSource = class {
  constructor(xml) {
    this.id = xml.getAttribute("id");
    this.allowMultipleAds = xml.getAttribute("allowMultipleAds");
    this.followRedirects = xml.getAttribute("followRedirects");
    this.vastAdData = null;
    this.adTagURI = null;
    this.customData = null;
    for (const nodeKey in xml.childNodes) {
      const node = xml.childNodes[nodeKey];
      switch (node.localName) {
        case "AdTagURI":
          this.adTagURI = {
            templateType: node.getAttribute("templateType"),
            uri: (node.textContent || node.text || "").trim()
          };
          break;
        case "VASTAdData":
          this.vastAdData = node.firstChild;
          while (this.vastAdData && this.vastAdData.nodeType !== 1) {
            this.vastAdData = this.vastAdData.nextSibling;
          }
          break;
        case "CustomAdData":
          this.customData = node;
          break;
      }
    }
  }
};
var adsource_default = VMAPAdSource;

// src/vmap/parser_utils.js
function childrenByName(node, name) {
  const children = [];
  for (const childKey in node.childNodes) {
    const child = node.childNodes[childKey];
    if (child.nodeName === name || name === `vmap:${child.nodeName}` || child.nodeName === `vmap:${name}`) {
      children.push(child);
    }
  }
  return children;
}
function parseNodeValue(node) {
  if (!node || !node.childNodes) {
    return {};
  }
  const childNodes = node.childNodes;
  const cdatas = [];
  for (const childKey in childNodes) {
    const childNode = childNodes[childKey];
    if (childNode.nodeName === "#cdata-section") {
      cdatas.push(childNode);
    }
  }
  if (cdatas && cdatas.length > 0) {
    try {
      return JSON.parse(cdatas[0].data);
    } catch (e) {
    }
  }
  let nodeText = "";
  for (const childKey in childNodes) {
    const childNode = childNodes[childKey];
    switch (childNode.nodeName) {
      case "#text":
        nodeText += childNode.textContent.trim();
        break;
      case "#cdata-section":
        nodeText += childNode.data;
        break;
    }
  }
  return nodeText;
}
function parseXMLNode(node) {
  const parsedNode = {
    attributes: {},
    children: {},
    value: {}
  };
  parsedNode.value = parseNodeValue(node);
  const attributes = node.attributes;
  if (attributes) {
    for (const attrKey in attributes) {
      const nodeAttr = attributes[attrKey];
      if (nodeAttr.nodeName && nodeAttr.nodeValue !== void 0 && nodeAttr.nodeValue !== null) {
        parsedNode.attributes[nodeAttr.nodeName] = nodeAttr.nodeValue;
      }
    }
  }
  const childNodes = node.childNodes;
  if (childNodes) {
    for (const childKey in childNodes) {
      const childNode = childNodes[childKey];
      if (childNode.nodeName && childNode.nodeName.substring(0, 1) !== "#") {
        parsedNode.children[childNode.nodeName] = parseXMLNode(childNode);
      }
    }
  }
  return parsedNode;
}

// src/vmap/adbreak.js
var VMAPAdBreak = class {
  constructor(xml) {
    this.timeOffset = xml.getAttribute("timeOffset");
    this.breakType = xml.getAttribute("breakType");
    this.breakId = xml.getAttribute("breakId");
    this.repeatAfter = xml.getAttribute("repeatAfter");
    this.adSource = null;
    this.trackingEvents = [];
    this.extensions = [];
    for (const nodeKey in xml.childNodes) {
      const node = xml.childNodes[nodeKey];
      switch (node.localName) {
        case "AdSource":
          this.adSource = new adsource_default(node);
          break;
        case "TrackingEvents":
          for (const subnodeKey in node.childNodes) {
            const subnode = node.childNodes[subnodeKey];
            if (subnode.localName === "Tracking") {
              this.trackingEvents.push({
                event: subnode.getAttribute("event"),
                uri: (subnode.textContent || subnode.text || "").trim()
              });
            }
          }
          break;
        case "Extensions":
          this.extensions = childrenByName(node, "Extension").map(
            (extension) => parseXMLNode(extension)
          );
          break;
      }
    }
  }
  track(event, errorCode) {
    for (const trackerKey in this.trackingEvents) {
      const tracker = this.trackingEvents[trackerKey];
      if (tracker.event === event) {
        let { uri } = tracker;
        if (tracker.event === "error") {
          uri = uri.replace("[ERRORCODE]", errorCode);
        }
        this.tracker(uri);
      }
    }
  }
  // Easy to overwrite tracker client for unit testing
  tracker(uri) {
    if (typeof window !== "undefined" && window !== null) {
      const i = new Image();
      i.src = uri;
    }
  }
};
var adbreak_default = VMAPAdBreak;

// src/vmap/vmap.js
var VMAP = class {
  constructor(xml) {
    if (!xml || !xml.documentElement || xml.documentElement.localName !== "VMAP") {
      throw new Error("Not a VMAP document");
    }
    this.version = xml.documentElement.getAttribute("version");
    this.adBreaks = [];
    this.extensions = [];
    for (const nodeKey in xml.documentElement.childNodes) {
      const node = xml.documentElement.childNodes[nodeKey];
      switch (node.localName) {
        case "AdBreak":
          this.adBreaks.push(new adbreak_default(node));
          break;
        case "Extensions":
          this.extensions = childrenByName(node, "Extension").map(
            (extension) => parseXMLNode(extension)
          );
          break;
      }
    }
  }
};
var vmap_default = VMAP;

// src/vmap/index.js
var vmap_default2 = vmap_default;

// src/lib/fetchVmapUrl.js
var fetchVmapUrl = (url) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.send();
  xhr.onreadystatechange = () => {
    try {
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status === 200) {
          const vmap = new vmap_default2(xhr.responseXML);
          resolve(vmap);
        }
      }
    } catch (error) {
      reject(error);
    }
  };
});

// src/modes/linear.js
function playLinearAd(creative) {
  this.debug("playLinearAd", creative);
  const mediaFile = src_default.getBestMediaFile(creative.mediaFiles);
  if (!this.player.ads.inAdBreak()) {
    this.player.ads.startLinearAdMode();
  }
  this.player.trigger("vast.playAttempt");
  this.player.src(mediaFile.fileURL);
  this.setMacros({
    ASSETURI: mediaFile.fileURL,
    ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.player.currentTime()),
    CONTENTPLAYHEAD: this.linearVastTracker.convertToTimecode(this.player.currentTime())
  });
}

// src/modes/nonlinear.js
function playNonLinearAd(creative) {
  creative.variations.map((variation) => {
    this.nonLinearVastTracker.trackImpression(this.macros);
    if (variation.htmlResource) {
      const ressourceContainer = document.createElement("div");
      this.domElements.push(ressourceContainer);
      ressourceContainer.addEventListener("click", () => {
        window.open(variation.nonlinearClickThroughURLTemplate, "_blank");
        this.nonLinearVastTracker.click(null, this.macros);
      });
      ressourceContainer.style.maxWidth = variation.expandedWidth;
      ressourceContainer.style.maxHeight = variation.expandedHeight;
      ressourceContainer.innerHTML = variation.htmlResource;
      if (variation.adSlotID) {
        document.querySelector(`#${variation.adSlotID}`).appendChild(ressourceContainer);
      } else {
        this.player.el().appendChild(ressourceContainer);
      }
      if (variation.minSuggestedDuration) {
        setTimeout(() => {
          ressourceContainer.remove();
        }, variation.minSuggestedDuration * 1e3);
      }
    }
    if (variation.iframeResource) {
      const ressourceContainer = document.createElement("iframe");
      this.domElements.push(ressourceContainer);
      ressourceContainer.addEventListener("click", () => {
        window.open(variation.nonlinearClickThroughURLTemplate, "_blank");
        this.nonLinearVastTracker.click(null, this.macros);
      });
      ressourceContainer.style.maxWidth = variation.expandedWidth;
      ressourceContainer.style.maxHeight = variation.expandedHeight;
      ressourceContainer.src = variation.iframeResource;
      if (variation.adSlotID) {
        document.querySelector(`#${variation.adSlotID}`).appendChild(ressourceContainer);
      } else {
        this.player.el().appendChild(ressourceContainer);
      }
      if (variation.minSuggestedDuration) {
        setTimeout(() => {
          ressourceContainer.remove();
        }, variation.minSuggestedDuration * 1e3);
      }
    }
    return variation;
  });
}

// src/modes/companions.js
function playCompanionAd(creative) {
  creative.variations.map((variation) => {
    this.companionVastTracker.trackImpression(this.macros);
    if (variation.staticResources && variation.staticResources.length > 0) {
    }
    if (variation.htmlResources) {
      variation.htmlResources.map((htmlResource) => {
        const ressourceContainer = document.createElement("div");
        this.domElements.push(ressourceContainer);
        ressourceContainer.width = variation.htmlResources.width;
        ressourceContainer.height = variation.htmlResources.height;
        ressourceContainer.style.maxWidth = variation.htmlResources.expandedWidth;
        ressourceContainer.style.maxHeight = variation.htmlResources.expandedHeight;
        ressourceContainer.addEventListener("click", () => {
          window.open(variation.companionClickThroughURLTemplate, "_blank");
          this.companionVastTracker.click(null, this.macros);
        });
        ressourceContainer.innerHTML = htmlResource;
        if (variation.adSlotID) {
          document.querySelector(`#${variation.adSlotID}`).appendChild(ressourceContainer);
        } else {
          this.player.el().appendChild(ressourceContainer);
        }
        return htmlResource;
      });
    }
    if (variation.iframeResources) {
      variation.iframeResources.map((iframeResource) => {
        const ressourceContainer = document.createElement("div");
        this.domElements.push(ressourceContainer);
        ressourceContainer.width = variation.iframeResources.width;
        ressourceContainer.height = variation.iframeResources.height;
        ressourceContainer.style.maxWidth = variation.iframeResources.expandedWidth;
        ressourceContainer.style.maxHeight = variation.iframeResources.expandedHeight;
        ressourceContainer.addEventListener("click", () => {
          window.open(variation.companionClickThroughURLTemplate, "_blank");
          this.companionVastTracker.click(null, this.macros);
        });
        ressourceContainer.src = iframeResource;
        if (variation.adSlotID) {
          document.querySelector(`#${variation.adSlotID}`).appendChild(ressourceContainer);
        } else {
          this.player.el().appendChild(ressourceContainer);
        }
        return iframeResource;
      });
    }
    return variation;
  });
}

// src/features/icons.js
function addIcons(ad) {
  const { icons } = ad.linearCreative();
  if (icons && icons.length > 0) {
    icons.forEach((icon) => {
      const {
        height,
        width,
        staticResource,
        htmlResource,
        iframeResource,
        xPosition,
        yPosition,
        iconClickThroughURLTemplate,
        duration
      } = icon;
      let iconContainer = null;
      if (staticResource) {
        iconContainer = document.createElement("img");
        iconContainer.src = staticResource;
        iconContainer.height = height > 0 ? height : 100;
        iconContainer.width = width > 0 ? width : 100;
      } else if (htmlResource) {
        iconContainer = document.createElement("div");
        iconContainer.innerHTML = icon.htmlResource;
      } else if (iframeResource) {
        iconContainer = document.createElement("iframe");
        iconContainer.src = iframeResource;
        iconContainer.height = height > 0 ? height : 100;
        iconContainer.width = width > 0 ? width : 100;
      }
      iconContainer.style.zIndex = "1";
      iconContainer.style.position = "absolute";
      if (isNumeric(yPosition)) {
        iconContainer.style.top = `${yPosition}px`;
      } else {
        iconContainer.style[["top", "bottom"].includes(yPosition) ? yPosition : "top"] = "3em";
      }
      if (isNumeric(xPosition)) {
        iconContainer.style.left = `${xPosition}px`;
      } else {
        iconContainer.style[["right", "left"].includes(xPosition) ? xPosition : "left"] = 0;
      }
      if (iconClickThroughURLTemplate) {
        iconContainer.style.cursor = "pointer";
        iconContainer.addEventListener("click", () => {
          window.open(iconClickThroughURLTemplate, "_blank");
          this.linearVastTracker.click(iconClickThroughURLTemplate, this.macros);
        });
      }
      this.domElements.push(iconContainer);
      this.player.el().appendChild(iconContainer);
      if (duration !== -1) {
        const durationInSeconds = duration.split(":").reverse().reduce((prev, curr, i) => prev + curr * 60 ** i, 0);
        setTimeout(() => {
          this.player.el().removeChild(iconContainer);
        }, durationInSeconds * 1e3);
      }
    });
  }
}

// src/features/vmap.js
var import_vast_client = require("@dailymotion/vast-client");
function parseInlineVastData(vastAdData, adType) {
  const xmlString = new XMLSerializer().serializeToString(vastAdData);
  const vastXml = new window.DOMParser().parseFromString(xmlString, "text/xml");
  const vastParser = new import_vast_client.VASTParser();
  vastParser.parseVAST(vastXml).then((parsedVAST) => {
    if (adType === "postroll") {
      this.postRollData = parsedVAST.ads ?? [];
    } else if (adType === "preroll") {
      this.adsArray = parsedVAST.ads ?? [];
      this.player.trigger("adsready");
    } else if (adType === "midroll") {
      this.adsArray = parsedVAST.ads ?? [];
      this.readAd();
    }
  }).catch((err) => {
    console.log("error", err);
    if (adType === "postroll" || adType === "midroll") {
      this.disablePostroll();
    } else if (adType === "preroll") {
      this.player.ads.skipLinearAdMode();
    }
  });
}
async function handleVmapXml(vmap) {
  try {
    if (vmap.adBreaks && vmap.adBreaks.length > 0) {
      this.addEventsListeners();
      const preroll = src_default.getPreroll(vmap.adBreaks);
      if (!preroll) {
        this.disablePreroll();
      } else if (preroll.adSource?.adTagURI?.uri) {
        await this.handleVAST(preroll.adSource.adTagURI.uri);
        this.player.trigger("adsready");
      } else if (preroll.adSource.vastAdData) {
        this.parseInlineVastData(preroll.adSource?.vastAdData, "preroll");
      }
      const postroll = src_default.getPostroll(vmap.adBreaks);
      if (!postroll) {
        this.disablePostroll();
      } else if (postroll.adSource?.adTagURI?.uri) {
        this.postRollUrl = postroll.adSource.adTagURI.uri;
      } else if (postroll.adSource?.vastAdData) {
        this.parseInlineVastData(postroll.adSource?.vastAdData, "postroll");
      }
      this.watchForProgress = src_default.getMidrolls(vmap.adBreaks);
      if (this.watchForProgress.length > 0) {
        this.player.on("timeupdate", this.onProgress);
      }
    }
  } catch (err) {
    console.error("ERR", err);
  }
}
async function handleVMAP(vmapUrl) {
  try {
    const vmap = await fetchVmapUrl(vmapUrl);
    if (vmap.adBreaks && vmap.adBreaks.length > 0) {
      this.addEventsListeners();
      const preroll = src_default.getPreroll(vmap.adBreaks);
      if (!preroll) {
        this.disablePreroll();
      } else if (preroll.adSource?.adTagURI?.uri) {
        await this.handleVAST(preroll.adSource.adTagURI.uri);
        this.player.trigger("adsready");
      } else if (preroll.adSource.vastAdData) {
        this.parseInlineVastData(preroll.adSource?.vastAdData, "preroll");
      }
      const postroll = src_default.getPostroll(vmap.adBreaks);
      if (!postroll) {
        this.disablePostroll();
      } else if (postroll.adSource?.adTagURI?.uri) {
        this.postRollUrl = postroll.adSource.adTagURI.uri;
      } else if (postroll.adSource?.vastAdData) {
        this.parseInlineVastData(postroll.adSource?.vastAdData, "postroll");
      }
      this.watchForProgress = src_default.getMidrolls(vmap.adBreaks);
      if (this.watchForProgress.length > 0) {
        this.player.on("timeupdate", this.onProgress);
      }
    }
  } catch (err) {
    console.error("ERR", err);
  }
}

// src/lib/fetchAdUrl.js
var fetchAdUrl = (url) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.send();
  xhr.onreadystatechange = () => {
    try {
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status === 200) {
          if (xhr.responseXML.documentElement.tagName.toLowerCase().includes("vmap")) {
            const vmap = new vmap_default2(xhr.responseXML);
            resolve({ adType: "vmap", vmap });
          }
          resolve({ xml: xhr.responseXML, adType: "vast" });
        }
      }
    } catch (error) {
      reject(error);
    }
  };
  return [xhr, "xhr"];
});

// src/index.js
var Plugin = import_video.default.getPlugin("plugin");
var _Vast = class extends Plugin {
  constructor(player, options) {
    super(player, options);
    this.player = player;
    const timeout = options && (options["adUrl"] || options["vastUrl"] || options["vmapUrl"]) ? 5e3 : 0;
    const defaultOptions = {
      vastUrl: false,
      vmapUrl: false,
      adUrl: false,
      verificationTimeout: 2e3,
      addCtaClickZone: true,
      addSkipButton: true,
      debug: false,
      timeout: timeout || 5e3,
      isLimitedTracking: false,
      customUserMacros: null
    };
    this.options = Object.assign(defaultOptions, options);
    this.setMacros();
    this.adsArray = [];
    this.domElements = [];
    this.iconContainers = [];
    const videojsContribAdsOptions = {
      debug: this.options.debug,
      timeout: this.options.timeout
    };
    if (!this.player.ads)
      return;
    const contrib = this.player.ads;
    if (typeof contrib === "function") {
      try {
        this.player.ads(videojsContribAdsOptions);
      } catch (e) {
        console.error(e);
      }
    }
    this.debug("Plugin Initialised");
    player.scheduleAdBreak = (vastVjsOptions) => {
      this.scheduleAdBreak(vastVjsOptions);
    };
    this.scheduleAdBreak(options);
  }
  async scheduleAdBreak(options) {
    if (!this.player)
      return;
    this.options = { ...this.options, timeout: 5e3, ...options };
    if (this.options.adUrl) {
      const response = await fetchAdUrl(this.options.adUrl);
      if (response.adType === "vmap") {
        this.handleVmapXml(response.vmap);
      } else if (response.adType === "vast") {
        this.vastXMLHandler(response.xml);
      }
    } else if (this.options.vmapUrl) {
      this.handleVMAP(this.options.vmapUrl);
    } else if (this.options.vastUrl) {
      this.vastHandler(this.options);
    }
  }
  vastXMLHandler(xml) {
    this.disablePostroll();
    (async () => {
      await this.handleVASTXml(xml, () => {
        this.disablePreroll();
      });
      if (this.adsArray.length > 0) {
        this.addEventsListeners();
        this.player?.trigger("adsready");
      }
    })();
  }
  vastHandler(options) {
    this.disablePostroll();
    (async () => {
      await this.handleVAST(options.vastUrl, () => {
        this.disablePreroll();
      });
      if (this.adsArray.length > 0) {
        this.addEventsListeners();
        this.player?.trigger("adsready");
      }
    })();
  }
  disablePreroll() {
    this.player?.trigger("nopreroll");
  }
  disablePostroll() {
    if (!this.player)
      return;
    this.player.on("readyforpostroll", () => {
      this.player?.trigger("nopostroll");
    });
  }
  setMacros(newMacros = void 0) {
    const { options } = this;
    if (!newMacros) {
      const cacheBuster = parseInt(Date.now().toString().slice(-8), 10);
      const ts = getLocalISOString(/* @__PURE__ */ new Date());
      this.macros = {
        CACHEBUSTING: cacheBuster,
        TIMESTAMP: ts,
        PAGEURL: window.location !== window.parent.location ? document.referrer : document.location.href,
        // PODSEQUENCE: '',
        // UNIVERSALADID: '',
        // ADTYPE: '',
        // ADSERVINGID: '',
        // ADCATEGORIES: '',
        LIMITADTRACKING: options.isLimitedTracking
      };
    } else {
      this.macros = {
        ...this.macros,
        ...newMacros
      };
    }
  }
  macroReplacement(url, customMacros) {
    return this.player.ads.adMacroReplacement(url, true, customMacros);
  }
  async handleVAST(vastUrl, onError = null) {
    this.vastClient = new import_vast_client2.VASTClient();
    console.log(this.options.customUserMacros);
    if (this.options.customUserMacros !== null) {
      vastUrl = this.macroReplacement(vastUrl, this.options.customUserMacros);
      console.log(`vastUrl: ${vastUrl}`);
    }
    try {
      const response = await this.vastClient.get(vastUrl, {
        allowMultipleAds: true,
        resolveAll: true
      });
      this.adsArray = response.ads ?? [];
      if (this.adsArray.length === 0) {
        onError?.();
        const message = "VastVjs: Empty VAST XML";
        this.player.trigger("vast.error", {
          message,
          tag: vastUrl
        });
      }
    } catch (err) {
      console.error(err);
      onError?.();
      const message = "VastVjs: Error while fetching VAST XML";
      this.player.trigger("vast.error", {
        message,
        tag: vastUrl
      });
    }
  }
  async handleVASTXml(vast, onError = null) {
    this.vastClient = new import_vast_client2.VASTClient();
    console.log("calling handleVASTXml in postroll");
    this.vastParser = new import_vast_client2.VASTParser();
    try {
      const response = await this.vastParser.parseVAST(vast, {
        allowMultipleAds: true,
        resolveAll: true,
        url: this.options.adUrl
      });
      this.adsArray = response.ads ?? [];
      if (this.adsArray.length === 0) {
        onError?.();
        const message = "VastVjs: Empty VAST XML";
        this.player.trigger("vast.error", {
          message,
          tag: this.options.adUrl
        });
      }
    } catch (err) {
      console.error(err);
      onError?.();
      const message = "VastVjs: Error while fetching VAST XML";
      this.player.trigger("vast.error", {
        message,
        tag: this.options.adUrl
      });
    }
  }
  removeDomElements() {
    this.domElements.forEach((domElement) => {
      domElement.remove();
    });
  }
  readAd() {
    const currentAd = this.getNextAd();
    if (!currentAd)
      return;
    this.ctaUrl = _Vast.getBestCtaUrl(currentAd?.linearCreative());
    this.debug("ctaUrl", this.ctaUrl);
    if (currentAd.hasLinearCreative()) {
      this.linearVastTracker = new import_vast_client2.VASTTracker(
        this.vastClient,
        currentAd.ad,
        currentAd.linearCreative()
      );
      this.linearVastTracker.on("firstQuartile", () => {
        this.debug("firstQuartile");
      });
      this.linearVastTracker.on("midpoint", () => {
        this.debug("midpoint");
      });
      this.addIcons(currentAd);
      this.addSkipButton(currentAd.linearCreative());
      if ("adVerifications" in currentAd.ad && currentAd.ad.adVerifications.length > 0) {
        const verificationTimeout = setTimeout(() => {
          this.playLinearAd(currentAd.linearCreative());
        }, this.options.verificationTimeout);
        let index = 0;
        this.setMacros({
          OMIDPARTNER: `${currentAd.ad.adVerifications[index].vendor ?? "unknown"}`
        });
        const scriptTagCallback = () => {
          index += 1;
          if (index < currentAd.ad.adVerifications.length) {
            injectScriptTag(
              currentAd.ad.adVerifications[index].resource,
              scriptTagCallback,
              // eslint-disable-next-line no-use-before-define
              scriptTagErrorCallback
            );
          } else {
            clearTimeout(verificationTimeout);
            this.playLinearAd(currentAd.linearCreative());
          }
        };
        const scriptTagErrorCallback = () => {
          this.linearVastTracker.verificationNotExecuted(
            currentAd.ad.adVerifications[index].vendor,
            { REASON: 3 }
          );
          scriptTagCallback();
        };
        injectScriptTag(
          currentAd.ad.adVerifications[index].resource,
          scriptTagCallback,
          scriptTagErrorCallback
        );
      } else {
        this.playLinearAd(currentAd.linearCreative());
      }
    } else {
      this.player.ads.skipLinearAdMode();
    }
    if (currentAd.hasNonlinearCreative()) {
      this.player.one(currentAd.hasLinearCreative() ? "adplaying" : "playing", () => {
        this.nonLinearVastTracker = new import_vast_client2.VASTTracker(this.vastClient, currentAd.ad, currentAd.nonlinearCreative(), "NonLinearAd");
        this.playNonLinearAd(currentAd.nonlinearCreative());
      });
    }
    if (currentAd.hasCompanionCreative()) {
      this.player.one(currentAd.hasLinearCreative() ? "adplaying" : "playing", () => {
        this.companionVastTracker = new import_vast_client2.VASTTracker(this.vastClient, currentAd.ad, currentAd.companionCreative(), "CompanionAd");
        this.playCompanionAd(currentAd.companionCreative());
      });
    }
  }
  /*
  * This method is responsible for retrieving the next ad to play from all the ads present in the
  * VAST manifest.
  * Please be aware that a single ad can have multple types of creatives.
  * A linear add for example can come with a companion ad and both can should be displayed.
  */
  getNextAd() {
    if (this.adsArray.length === 0) {
      return null;
    }
    const nextAd = this.adsArray.shift();
    return {
      ad: nextAd,
      hasLinearCreative: () => {
        const linear = nextAd.creatives.find((creative) => creative.type === "linear") !== void 0 && nextAd.creatives.filter((creative) => creative.type === "linear")[0];
        const hasMediaFile = linear.mediaFiles.length > 0 && linear.mediaFiles.some((mediaFile) => mediaFile.fileURL !== "");
        return linear && hasMediaFile;
      },
      linearCreative: () => nextAd.creatives.filter((creative) => creative.type === "linear")[0],
      hasCompanionCreative: () => nextAd.creatives.find((creative) => creative.type === "companion") !== void 0,
      companionCreative: () => nextAd.creatives.filter((creative) => creative.type === "companion")[0],
      hasNonlinearCreative: () => nextAd.creatives.find((creative) => creative.type === "nonlinear") !== void 0,
      nonlinearCreative: () => nextAd.creatives.filter((creative) => creative.type === "nonlinear")[0]
    };
  }
  onAdPlay = () => {
    this.debug("adplay");
    if (parseInt(this.player.currentTime(), 10) > 0) {
      this.linearVastTracker.setPaused(false, {
        ...this.macros,
        ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.player.currentTime())
      });
    }
  };
  onAdPause = () => {
    this.debug("adpause");
    if (this.player.duration() - this.player.currentTime() > 0.2) {
      this.linearVastTracker.setPaused(true, {
        ...this.macros,
        ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.player.currentTime())
      });
    }
  };
  // Track timeupdate-related events
  onAdTimeUpdate = () => {
    this.linearVastTracker.setProgress(this.player.currentTime(), this.macros);
    this.player?.trigger("vast.time", { position: this.player.currentTime(), currentTime: this.player.currentTime(), duration: this.player.duration() });
  };
  // track on regular content progress
  onProgress = async () => {
    if (this.watchForProgress && this.watchForProgress.length > 0) {
      const { timeOffset } = this.watchForProgress[0];
      const timeOffsetInSeconds = convertTimeOffsetToSeconds(timeOffset, this.player.duration());
      if (this.player.currentTime() > timeOffsetInSeconds) {
        const nextAd = this.watchForProgress.shift();
        if (nextAd.vastUrl) {
          await this.handleVAST(nextAd.vastUrl);
          this.readAd();
        } else if (nextAd.vastData) {
          this.parseInlineVastData(nextAd.vastData, "midroll");
        }
      }
    }
  };
  onFirstPlay = () => {
    this.debug("first play");
  };
  onAdVolumeChange = () => {
    this.debug("volume");
    if (!this.linearVastTracker) {
      return false;
    }
    this.linearVastTracker.setMuted(this.player.muted(), {
      ...this.macros,
      ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.player.currentTime())
    });
    return true;
  };
  onAdFullScreen = (evt, data) => {
    this.debug("fullscreen");
    if (!this.linearVastTracker) {
      return false;
    }
    this.linearVastTracker.setFullscreen(data.state);
    return true;
  };
  // Track when user closes the video
  onUnload = () => {
    if (!this.linearVastTracker) {
      return false;
    }
    this.linearVastTracker.close({
      ...this.macros,
      ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.player.currentTime())
    });
    this.removeEventsListeners();
    return null;
  };
  // Notify the player if we reach a timeout while trying to load the ad
  onAdTimeout = () => {
    this.debug("adtimeout");
    if (this.linearVastTracker) {
      this.linearVastTracker.error({
        ...this.macros,
        ERRORCODE: 301
        // timeout of VAST URI
      });
    }
    console.error("VastVjs: Timeout");
    this.player?.trigger("vast.error", {
      message: "VastVjs: Timeout"
    });
    this.removeEventsListeners();
  };
  // send event when ad is playing to remove loading spinner
  onAdStart = () => {
    this.debug("adstart");
    this.player?.trigger("vast.play", {
      ctaUrl: this.ctaUrl,
      skipDelay: this.linearVastTracker.skipDelay,
      adClickCallback: this.ctaUrl ? () => this.adClickCallback(this.ctaUrl) : false
    });
    this.linearVastTracker.load({
      ...this.macros,
      ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.player.currentTime())
    });
    this.linearVastTracker.trackImpression({
      ...this.macros,
      ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.player.currentTime())
    });
    this.linearVastTracker.overlayViewDuration(
      this.linearVastTracker.convertToTimecode(this.player.currentTime()),
      this.macros
    );
    this.player.controlBar.progressControl.disable();
    if (this.options.addCtaClickZone) {
      const ctaDiv = document.createElement("div");
      ctaDiv.style.cssText = "position: absolute; bottom:3em; left: 0; right: 0;top: 0;";
      ctaDiv.addEventListener("click", () => {
        this.player.pause();
        this.adClickCallback(this.ctaUrl);
      });
      this.domElements.push(ctaDiv);
      this.player.el().appendChild(ctaDiv);
    }
  };
  addSkipButton(creative) {
    this.debug("addSkipButton");
    if (this.options.addSkipButton && creative.skipDelay > 0) {
      const { skipDelay } = creative;
      let skipRemainingTime = Math.round(skipDelay - this.player.currentTime());
      let isSkippable = skipRemainingTime < 1;
      const skipButtonDiv = document.createElement("button");
      skipButtonDiv.id = "videojs-vast-skipButton";
      skipButtonDiv.style.cssText = "bottom: 90px; cursor: default; padding: 15px; position: absolute; right: 0; z-index: 3; background: rgba(0, 0, 0, 0.8); min-width: 30px; pointer-events: none;";
      skipButtonDiv.innerHTML = isSkippable ? "skip >>" : skipRemainingTime.toFixed();
      this.domElements.push(skipButtonDiv);
      this.player.el().appendChild(skipButtonDiv);
      const interval = setInterval(() => {
        skipRemainingTime = Math.round(skipDelay - this.player.currentTime());
        isSkippable = skipRemainingTime < 1;
        if (isSkippable) {
          skipButtonDiv.style.cursor = "pointer";
          skipButtonDiv.style.pointerEvents = "auto";
          skipButtonDiv.addEventListener("click", () => {
            this.player?.trigger("skip");
          });
          clearInterval(interval);
        }
        skipButtonDiv.innerHTML = isSkippable ? "skip >>" : skipRemainingTime.toFixed();
      }, 1e3);
    }
  }
  onAdError = (evt) => {
    this.debug("aderror");
    this.linearVastTracker.error({
      ...this.macros,
      ERRORCODE: 900
      // undefined error, to be improved
    });
    this.player?.trigger("vast.error", {
      message: evt,
      tag: this.options.vastUrl
    });
    if (this.adsArray.length === 0) {
      this.resetPlayer();
    } else {
      this.readAd();
    }
  };
  onReadyForPreroll = () => {
    this.debug("readyforpreroll");
    this.readAd();
  };
  onReadyForPostroll = async () => {
    this.debug("readyforpostroll");
    if (this.postRollUrl) {
      await this.handleVAST(this.postRollUrl);
      this.readAd();
    } else if (this.postRollData) {
      this.adsArray = this.postRollData;
      this.readAd();
    }
  };
  onEnded = () => {
    this.removeEventsListeners();
  };
  onSkip = () => {
    this.debug("skip");
    this.player?.trigger("vast.skip");
    this.linearVastTracker.skip({
      ...this.macros,
      ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.player.currentTime())
    });
    this.removeDomElements();
    if (this.adsArray.length === 0) {
      this.resetPlayer();
    } else {
      this.readAd();
    }
  };
  onAdEnded = () => {
    this.debug("adended");
    this.linearVastTracker.complete({
      ...this.macros,
      ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.player.currentTime())
    });
    this.removeDomElements();
    if (this.adsArray.length === 0) {
      this.resetPlayer();
    } else {
      this.readAd();
    }
  };
  resetPlayer() {
    this.player.ads.endLinearAdMode();
    this.player?.trigger("vast.complete");
    this.player.controlBar.progressControl.enable();
  }
  addEventsListeners() {
    if (!this.player)
      return;
    this.player.one("adplaying", this.onFirstPlay);
    this.player.on("adplaying", this.onAdPlay);
    this.player.on("adpause", this.onAdPause);
    this.player.on("adtimeupdate", this.onAdTimeUpdate);
    this.player.on("advolumechange", this.onAdVolumeChange);
    this.player.on("adfullscreen", this.onAdFullScreen);
    this.player.on("adtimeout", this.onAdTimeout);
    this.player.on("adstart", this.onAdStart);
    this.player.on("aderror", this.onAdError);
    this.player.on("readyforpreroll", this.onReadyForPreroll);
    this.player.on("readyforpostroll", this.onReadyForPostroll);
    this.player.on("skip", this.onSkip);
    this.player.on("adended", this.onAdEnded);
    this.player.on("ended", this.onEnded);
    window.addEventListener("beforeunload", this.onUnload);
  }
  removeEventsListeners() {
    this.debug("removeEventsListeners");
    this.player.off("adplaying", this.onAdPlay);
    this.player.off("adplaying", this.onFirstPlay);
    this.player.off("adpause", this.onAdPause);
    this.player.off("adtimeupdate", this.onAdTimeUpdate);
    this.player.off("advolumechange", this.onAdVolumeChange);
    this.player.off("adfullscreen", this.onAdFullScreen);
    this.player.off("adtimeout", this.onAdTimeout);
    this.player.off("adstart", this.onAdStart);
    this.player.off("aderror", this.onAdError);
    this.player.off("timeupdate", this.onProgress);
    this.player.off("readyforpreroll", this.onReadyForPreroll);
    this.player.off("readyforpostroll", this.onReadyForPostroll);
    this.player.off("skip", this.onSkip);
    this.player.off("adended", this.onAdEnded);
    this.player.off("ended", this.onEnded);
    window.removeEventListener("beforeunload", this.onUnload);
  }
  /*
  * This method is responsible for dealing with the click on the ad
  */
  adClickCallback = (ctaUrl) => {
    this.player?.trigger("vast.click");
    window.open(ctaUrl, "_blank");
    this.linearVastTracker.click(null, {
      ...this.macros,
      ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.player.currentTime())
    });
  };
  static getCloseButton(clickCallback) {
    const closeButton = document.createElement("button");
    closeButton.addEventListener("click", clickCallback);
    closeButton.style.width = "20px";
    closeButton.style.height = "20px";
    closeButton.style.position = "absolute";
    closeButton.style.right = "5px";
    closeButton.style.top = "5px";
    closeButton.style.zIndex = "3";
    closeButton.style.background = "#CCC";
    closeButton.style.color = "#000";
    closeButton.style.fontSize = "12px";
    closeButton.style.cursor = "pointer";
    closeButton.textContent = "X";
    return closeButton;
  }
  static applyNonLinearCommonDomStyle(domElement) {
    domElement.style.cursor = "pointer";
    domElement.style.left = "50%";
    domElement.style.position = "absolute";
    domElement.style.transform = "translateX(-50%)";
    domElement.style.bottom = "80px";
    domElement.style.display = "block";
    domElement.style.zIndex = "2";
  }
  debug(msg, data = void 0) {
    if (!this.options.debug) {
      return;
    }
    console.info("videojs-vast ---", msg, data ?? "");
  }
  /*
  * This method is responsible disposing the plugin once it is not needed anymore
  */
  dispose() {
    this.debug("dispose");
    this.removeEventsListeners();
    super.dispose();
  }
};
var Vast = _Vast;
/*
* This method is responsible for choosing the best media file to play according to the user's
* screen resolution and internet connection speed
*/
__publicField(Vast, "getBestMediaFile", (mediaFilesAvailable) => {
  const videojsVhs = localStorage.getItem("videojs-vhs");
  const bandwidth = videojsVhs ? JSON.parse(videojsVhs).bandwidth : void 0;
  let bestMediaFile = mediaFilesAvailable[0];
  if (mediaFilesAvailable && bandwidth) {
    const { height } = window.screen;
    const { width } = window.screen;
    const result = mediaFilesAvailable.sort((a, b) => Math.abs(a.bitrate - bandwidth) - Math.abs(b.bitrate - bandwidth) || Math.abs(a.width - width) - Math.abs(b.width - width) || Math.abs(a.height - height) - Math.abs(b.height - height));
    [bestMediaFile] = result;
  }
  return bestMediaFile;
});
/*
* This method is responsible for choosing the best URl to redirect the user to when he clicks
* on the ad
*/
__publicField(Vast, "getBestCtaUrl", (creative) => {
  if (creative && creative.videoClickThroughURLTemplate && creative.videoClickThroughURLTemplate.url) {
    return creative.videoClickThroughURLTemplate.url;
  }
  return false;
});
__publicField(Vast, "getMidrolls", (adBreaks) => {
  const midrolls = [];
  if (adBreaks) {
    return adBreaks.filter((adBreak) => !["start", "0%", "00:00:00", "end", "100%"].includes(adBreak.timeOffset)).reduce((prev, current) => [
      ...prev,
      {
        timeOffset: current.timeOffset,
        vastUrl: current.adSource.adTagURI?.uri,
        vastData: current.adSource.vastAdData
      }
    ], []);
  }
  return midrolls;
});
__publicField(Vast, "getPreroll", (adBreaks) => {
  if (adBreaks) {
    return adBreaks.filter((adBreak) => ["start", "0%", "00:00:00"].includes(adBreak.timeOffset))[0];
  }
  return false;
});
__publicField(Vast, "getPostroll", (adBreaks) => {
  if (adBreaks) {
    return adBreaks.filter((adBreak) => ["end", "100%"].includes(adBreak.timeOffset))[0];
  }
  return false;
});
Vast.prototype.playLinearAd = playLinearAd;
Vast.prototype.playNonLinearAd = playNonLinearAd;
Vast.prototype.playCompanionAd = playCompanionAd;
Vast.prototype.addIcons = addIcons;
Vast.prototype.handleVMAP = handleVMAP;
Vast.prototype.handleVmapXml = handleVmapXml;
Vast.prototype.parseInlineVastData = parseInlineVastData;
var src_default = Vast;
var registerPlugin = import_video.default.registerPlugin || import_video.default.plugin;
registerPlugin("vast", Vast);
//# sourceMappingURL=index.js.map
