import ghReservedNames from "github-reserved-names"

import api from "../../api.js"
import priv from "../../conf.priv.js"
import util from "../../util.js"

const { tabOpenLink, Front, Hints, Normal, RUNTIME } = api

const actions = {}

// Globally applicable actions
// ===========================
//
actions.moveTabNextToTab = (targetId, nextTo, leftOf = false) =>
  browser.tabs.move(targetId, {
    windowId: nextTo.windowId,
    index: nextTo.index - (leftOf ? 1 : 0),
  })

// TODO
// actions.cutTab = async () =>
//   browser.storage.local.set({
//     cutTabEvent: {
//       tabId:     (await browser.tabs.query({ currentWindow: true, active: true }))[0].id,
//       timestamp: new Date(),
//     },
//   })

// actions.pasteTab = async (leftOf = false) => {
//   const { cutTabEvent = null } = await browser.storage.local.get("cutTabEvent")
//   if (!cutTabEvent || (new Date() - cutTabEvent.timestamp) > 60000) return
//   const curTab = (await browser.tabs.query({ currentWindow: true, active: true }))[0]
//   await actions.moveTabNextToTab(cutTabEvent.tabId, curTab, leftOf)
// }

actions.getDOM = (url, callback) => {
  fetch(url)
    .then((res) => res.text())
    .then((data) => {
      const parser = new DOMParser()
      const htmlDocument = parser.parseFromString(data, "text/html")
      callback(null, htmlDocument)
    })
    .catch((error) => {
      callback(error, null)
    })
}
actions.dispatchEvents = (type, node, ...eventTypes) =>
  eventTypes.forEach((t) => {
    const e = document.createEvent(type)
    e.initEvent(t, true, true)
    node.dispatchEvent(e)
  })

actions.dispatchMouseEvents = actions.dispatchEvents.bind(undefined, [
  "MouseEvents",
])

actions.scrollToHash = (hash = null) => {
  const h = (hash || document.location.hash).replace("#", "")
  const e =
    document.getElementById(h) || document.querySelector(`[name="${h}"]`)
  if (!e) {
    return
  }
  e.scrollIntoView({ behavior: "smooth" })
}
actions.openUrlsInClipboardWithMpv = async () => {
  api.Clipboard.read(function (res) {
    const urls = res.data.split("\n")
    for (const url of urls) {
      if (url.includes("iwara")) {
        actions.iw.copyAndPlayVideo(
          url.match(/video\/.+(\/)?/)[0].replace(/video\/|\/.+/g, ""),
        )
      } else if (url.includes("erommdtube") || url.includes("oreno3d")) {
        actions.getDOM(url, function (err, htmlDocument) {
          if (err) {
            console.log(err)
            return
          }
          const urlIw = htmlDocument.querySelector('[href*="iwara.tv"]')
          const id = actions.iw.getIdIwara(urlIw.href)
          actions.iw.copyAndPlayVideo(id)
        })
      } else {
        util.playWithMpv(url)
      }
    }
  })
}

// URL Manipulation/querying
// -------------------------
actions.vimEditURL = () =>
  Front.showEditor(
    window.location.href,
    (url) => {
      actions.openLink(url)
    },
    "url",
  )

actions.getOrgLink = () => `[[${window.location.href}][${document.title}]]`

actions.getMarkdownLink = ({
  title = document.title,
  href = window.location.href,
} = {}) => `[${title}](${href})`

// Site/Page Information
// ---------------------

const ddossierUrl = "http://centralops.net/co/DomainDossier.aspx"

actions.getWhoisUrl = ({ hostname = window.location.hostname } = {}) =>
  `${ddossierUrl}?dom_whois=true&addr=${hostname}`

actions.getDnsInfoUrl = ({
  hostname = window.location.hostname,
  all = false,
} = {}) =>
  `${ddossierUrl}?dom_dns=true&addr=${hostname}${
    all
      ? "?dom_whois=true&dom_dns=true&traceroute=true&net_whois=true&svc_scan=true"
      : ""
  }`

actions.getGoogleCacheUrl = ({ href = window.location.href } = {}) =>
  `https://webcache.googleusercontent.com/search?q=cache:${href}`

actions.getWaybackUrl = ({ href = window.location.href } = {}) =>
  `https://web.archive.org/web/*/${href}`

actions.getOutlineUrl = ({ href = window.location.href } = {}) =>
  `https://outline.com/${href}`

actions.getAlexaUrl = ({ hostname = window.location.hostname } = {}) =>
  `https://www.alexa.com/siteinfo/${hostname}`

actions.getBuiltWithUrl = ({ href = window.location.href } = {}) =>
  `https://www.builtwith.com/?${href}`

actions.getWappalyzerUrl = ({ hostname = window.location.hostname } = {}) =>
  `https://www.wappalyzer.com/lookup/${hostname}`

actions.getDiscussionsUrl = ({ href = window.location.href } = {}) =>
  `https://discussions.xojoc.pw/?${new URLSearchParams({ url: href })}`

// // Custom Omnibar interfaces
// // ------------------------
// actions.omnibar = {}
//
// // AWS Services
// actions.omnibar.aws = () => {
//   // const services = [
//   //   {
//   //     title: "EC2",
//   //     url:   "https://cn-northwest-1.console.amazonaws.cn/ec2/v2/home?region=cn-northwest-1",
//   //   },
//   //   {
//   //     title: "Elastic Beanstalk",
//   //     url:   "https://cn-northwest-1.console.amazonaws.cn/elasticbeanstalk/home?region=cn-northwest-1",
//   //   },
//   //   {
//   //     title: "Batch",
//   //     url:   "https://cn-northwest-1.console.amazonaws.cn/batch/home?region=cn-northwest-1",
//   //   },
//   // ]
//   // Front.openOmnibar({ type: "UserURLs", extra: services })
//   Front.openOmnibar({
//     type:  "Custom",
//     extra: {
//       prompt:  "AWS",
//       onInput: console.log,
//     },
//   })
// }

// Surfingkeys-specific actions
// ----------------------------
actions.openAnchor =
  ({ newTab = false, active = true, prop = "href" } = {}) =>
  (a) =>
    actions.openLink(a[prop], { newTab, active })

actions.openLink = (url, { newTab = false, active = true } = {}) => {
  if (newTab) {
    RUNTIME("openLink", {
      tab: { tabbed: true, active },
      url: url instanceof URL ? url.href : url,
    })
    return
  }
  window.location.assign(url)
}

actions.editSettings = () =>
  tabOpenLink(chrome.extension.getURL("/pages/options.html"))

actions.togglePdfViewer = () =>
  chrome.storage.local.get("noPdfViewer", (resp) => {
    if (!resp.noPdfViewer) {
      chrome.storage.local.set({ noPdfViewer: 1 }, () => {
        Front.showBanner("PDF viewer disabled.")
      })
    } else {
      chrome.storage.local.remove("noPdfViewer", () => {
        Front.showBanner("PDF viewer enabled.")
      })
    }
  })

actions.previewLink = () =>
  util.createHints("a[href]", (a) =>
    Front.showEditor(a.href, (url) => actions.openLink(url), "url"),
  )

actions.scrollElement = (el, dir) => {
  actions.dispatchMouseEvents(el, "mousedown")
  Normal.scroll(dir)
}

// FakeSpot
// --------
actions.fakeSpot = (url = window.location.href) =>
  actions.openLink(`https://fakespot.com/analyze?ra=true&url=${url}`, {
    newTab: true,
    active: false,
  })

export default actions
