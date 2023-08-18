import ghReservedNames from "github-reserved-names"

import api from "./api.js"
import priv from "./conf.priv.js"
import util from "./util.js"

const { tabOpenLink, Front, Hints, Normal, RUNTIME } = api

const actions = {}

// Globally applicable actions
// ===========================

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
    .then(res => res.text())
    .then(data => {
      const parser = new DOMParser();
      const htmlDocument = parser.parseFromString(data, 'text/html');
      callback(null, htmlDocument);
    })
    .catch(error => {
      callback(error, null);
    });
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

// URL Manipulation/querying
// -------------------------
actions.vimEditURL = () =>
  Front.showEditor(
    window.location.href,
    (url) => {
      actions.openLink(url)
    },
    "url"
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
  `${ddossierUrl}?dom_dns=true&addr=${hostname}${all
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
actions.openAnchor = ({
  newTab = false,
  active = true,
  prop = "href",
} = {}) => (a) => actions.openLink(a[prop], { newTab, active })

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
    Front.showEditor(a.href, (url) => actions.openLink(url), "url")
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

// Site-specific actions
// =====================

// Amazon
// -----
actions.az = {}
actions.az.viewProduct = () => {
  const reHost = /^([-\w]+[.])*amazon.\w+$/
  const rePath = /^(?:.*\/)*(?:dp|gp\/product)(?:\/(\w{10})).*/
  const elements = {}
  document.querySelectorAll("a[href]").forEach((a) => {
    const u = new URL(a.href)
    if (u.hash.length === 0 && reHost.test(u.hostname)) {
      const rePathRes = rePath.exec(u.pathname)
      if (rePathRes === null || rePathRes.length !== 2) {
        return
      }
      if (!util.isElementInViewport(a)) {
        return
      }

      const asin = rePathRes[1]

      if (elements[asin] !== undefined) {
        if (
          !(elements[asin].text.trim().length === 0 && a.text.trim().length > 0)
        ) {
          return
        }
      }

      elements[asin] = a
    }
  })
  Hints.create(Object.values(elements), Hints.dispatchMouseClick)
}

// Godoc
// -----
actions.viewGodoc = () =>
  actions.openLink(
    `https://godoc.org/${util.getURLPath({ count: 2, domain: true })}`,
    { newTab: true }
  )

// Google
actions.go = {}
actions.go.parseLocation = () => {
  const u = new URL(window.location.href)
  const q = u.searchParams.get("q")
  const p = u.pathname.split("/")

  const res = {
    type: "unknown",
    url: u,
    query: q,
  }

  if (u.hostname === "www.google.com") {
    if (p.length <= 1) {
      res.type = "home"
    } else if (p[1] === "search") {
      switch (u.searchParams.get("tbm")) {
        case "vid":
          res.type = "videos"
          break
        case "isch":
          res.type = "images"
          break
        case "nws":
          res.type = "news"
          break
        default:
          res.type = "web"
      }
    } else if (p[1] === "maps") {
      res.type = "maps"
      if (p[2] === "search" && p[3] !== undefined) {
        res.query = p[3] // eslint-disable-line prefer-destructuring
      } else if (p[2] !== undefined) {
        res.query = p[2] // eslint-disable-line prefer-destructuring
      }
    }
  }

  return res
}

actions.go.ddg = () => {
  const g = actions.go.parseLocation()

  const ddg = new URL("https://duckduckgo.com")
  if (g.query) {
    ddg.searchParams.set("q", g.query)
  }

  switch (g.type) {
    case "videos":
      ddg.searchParams.set("ia", "videos")
      ddg.searchParams.set("iax", "videos")
      break
    case "images":
      ddg.searchParams.set("ia", "images")
      ddg.searchParams.set("iax", "images")
      break
    case "news":
      ddg.searchParams.set("ia", "news")
      ddg.searchParams.set("iar", "news")
      break
    case "maps":
      ddg.searchParams.set("iaxm", "maps")
      break
    case "search":
    case "home":
    case "unknown":
    default:
      ddg.searchParams.set("ia", "web")
      break
  }

  actions.openLink(ddg.href)
}

// DuckDuckGo
actions.dg = {}
actions.dg.goog = () => {
  let u
  try {
    u = new URL(window.location.href)
  } catch (e) {
    return
  }
  const q = u.searchParams.get("q")
  if (!q) {
    return
  }

  const goog = new URL("https://google.com/search")
  goog.searchParams.set("q", q)

  const iax = u.searchParams.get("iax")
  const iaxm = u.searchParams.get("iaxm")
  const iar = u.searchParams.get("iar")

  if (iax === "images") {
    goog.searchParams.set("tbm", "isch")
  } else if (iax === "videos") {
    goog.searchParams.set("tbm", "vid")
  } else if (iar === "news") {
    goog.searchParams.set("tbm", "nws")
  } else if (iaxm === "maps") {
    goog.pathname = "/maps"
  }

  actions.openLink(goog.href)
}

actions.dg.siteSearch = (site) => {
  let u
  try {
    u = new URL(window.location.href)
  } catch (e) {
    return
  }

  const siteParam = `site:${site}`

  const q = u.searchParams.get("q")
  if (!q) {
    return
  }

  const i = q.indexOf(siteParam)
  if (i !== -1) {
    u.searchParams.set("q", q.replace(siteParam, ""))
  } else {
    u.searchParams.set("q", `${q} ${siteParam}`)
  }

  actions.openLink(u.href)
}

// GitHub
// ------
actions.gh = {}
actions.gh.star = ({ toggle = false } = {}) => async () => {
  const hasDisplayNoneParent = (e) =>
    window.getComputedStyle(e).display === "none" ||
    (e.parentElement ? hasDisplayNoneParent(e.parentElement) : false)

  const starContainers = Array.from(
    document.querySelectorAll("div.starring-container")
  ).filter((e) => !hasDisplayNoneParent(e))

  let container
  switch (starContainers.length) {
    case 0:
      return
    case 1:
      ;[container] = starContainers
      break
    default:
      try {
        container = await util.createHints(starContainers, { action: null })
      } catch (_) {
        return
      }
  }

  const repoUrl = container.parentElement.parentElement?.matches(
    "ul.pagehead-actions"
  )
    ? window.location.pathname
    : new URL(container.parentElement.querySelector("form").action).pathname

  const status = container.classList.contains("on")
  const repo = repoUrl.slice(1).split("/").slice(0, 2).join("/")

  let star = "★"
  let statusMsg = "starred"
  let copula = "is"

  if ((status && toggle) || (!status && !toggle)) {
    statusMsg = `un${statusMsg}`
    star = "☆"
  }

  if (toggle) {
    copula = "has been"
    container
      .querySelector(
        status
          ? ".starred button, button.starred"
          : ".unstarred button, button.unstarred"
      )
      .click()
  }

  Front.showBanner(`${star} Repository ${repo} ${copula} ${statusMsg}!`)
}

actions.gh.parseRepo = (url = window.location.href, rootOnly = false) => {
  let u
  try {
    u = url instanceof URL ? url : new URL(url)
  } catch (e) {
    u = new URL(`https://github.com/${url}`)
  }
  const [user, repo, ...rest] = u.pathname.split("/").filter((s) => s !== "")
  const isRoot = rest.length === 0
  const cond =
    ["github.com", "gist.github.com", "raw.githubusercontent.com"].includes(
      u.hostname
    ) &&
    typeof user === "string" &&
    user.length > 0 &&
    typeof repo === "string" &&
    repo.length > 0 &&
    (isRoot || rootOnly === false) &&
    /^([a-zA-Z0-9]+-?)+$/.test(user) &&
    !ghReservedNames.check(user)
  return cond
    ? {
      type: "repo",
      user,
      repo,
      owner: user,
      name: repo,
      href: url,
      url: u,
      repoBase: `${user}/${repo}`,
      repoRoot: isRoot,
      repoPath: rest,
    }
    : null
}

actions.gh.parseUser = (url = window.location.href, rootOnly = false) => {
  const u = url instanceof URL ? url : new URL(url)
  const [user, ...rest] = u.pathname.split("/").filter((s) => s !== "")
  const isRoot = rest.length === 0
  const cond =
    u.origin === window.location.origin &&
    typeof user === "string" &&
    user.length > 0 &&
    (rootOnly === false || rest.length === 0) &&
    /^([a-zA-Z0-9]+-?)+$/.test(user) &&
    !ghReservedNames.check(user)
  return cond
    ? {
      type: "user",
      name: user,
      user,
      href: url,
      url: u,
      userRoot: isRoot,
      userPath: rest,
    }
    : null
}

actions.gh.parseFile = (url = window.location.href) => {
  const u = url instanceof URL ? url : new URL(url)
  const [user, repo, pathType, commitHash, ...rest] = u.pathname
    .split("/")
    .filter((s) => s !== "")
  const cond =
    u.origin === window.location.origin &&
    typeof user === "string" &&
    user.length > 0 &&
    typeof repo === "string" &&
    repo.length > 0 &&
    typeof pathType === "string" &&
    (pathType === "blob" || pathType === "tree") &&
    typeof commitHash === "string" &&
    commitHash.length > 0 &&
    /^([a-zA-Z0-9]+-?)+$/.test(user) &&
    !ghReservedNames.check(user)
  if (!cond) return null
  const f = {
    type: "file",
    user,
    repo,
    pathType,
    commitHash,
    isDirectory: pathType === "tree",
    href: url,
    url: u,
    filePath: rest,
    repoBase: `/${user}/${repo}`,
  }
  f.rawUrl = f.isDirectory
    ? null
    : `https://raw.githubusercontent.com/${f.user}/${f.repo}/${f.commitHash
    }/${f.filePath.join("/")}`
  return f
}

actions.gh.parseCommit = (url = window.location.href) => {
  const u = url instanceof URL ? url : new URL(url)
  const [user, repo, commit, commitHash] = u.pathname
    .split("/")
    .filter((s) => s !== "")
  const cond =
    u.origin === window.location.origin &&
    typeof user === "string" &&
    user.length > 0 &&
    typeof repo === "string" &&
    repo.length > 0 &&
    typeof commit === "string" &&
    commit === "commit" &&
    typeof commitHash === "string" &&
    commitHash.length > 0 &&
    /^([a-zA-Z0-9]+-?)+$/.test(user) &&
    !ghReservedNames.check(user)
  return cond
    ? {
      type: "commit",
      user,
      repo,
      commitHash,
      href: url,
      url: u,
    }
    : null
}

actions.gh.parseIssue = (url = window.location.href) => {
  const u = url instanceof URL ? url : new URL(url)
  const [user, repo, maybeIssues, ...rest] = u.pathname
    .split("/")
    .filter((s) => s !== "")
  const isRoot = rest.length === 0
  const cond =
    u.origin === window.location.origin &&
    typeof user === "string" &&
    user.length > 0 &&
    typeof repo === "string" &&
    repo.length > 0 &&
    maybeIssues === "issues" &&
    /^([a-zA-Z0-9]+-?)+$/.test(user) &&
    !ghReservedNames.check(user)
  return cond
    ? {
      href: url,
      url: u,
      ...(isRoot
        ? {
          type: "issues",
          issuePath: rest,
        }
        : {
          type: "issue",
          number: rest[0],
          issuePath: rest,
        }),
    }
    : null
}

actions.gh.parsePull = (url = window.location.href) => {
  const u = url instanceof URL ? url : new URL(url)
  const [user, repo, maybePulls, ...rest] = u.pathname
    .split("/")
    .filter((s) => s !== "")
  const isRoot = rest.length === 0
  const cond =
    u.origin === window.location.origin &&
    typeof user === "string" &&
    user.length > 0 &&
    typeof repo === "string" &&
    repo.length > 0 &&
    /^pulls?$/.test(maybePulls) &&
    /^([a-zA-Z0-9]+-?)+$/.test(user) &&
    !ghReservedNames.check(user)
  return cond
    ? {
      href: url,
      url: u,
      ...(isRoot
        ? {
          type: "pulls",
          pullPath: rest,
        }
        : {
          type: "pull",
          number: rest[0],
          pullPath: rest,
        }),
    }
    : null
}

actions.gh.isUser = (url = window.location.href, rootOnly = true) =>
  actions.gh.parseUser(url, rootOnly) !== null

actions.gh.isRepo = (url = window.location.href, rootOnly = true) =>
  actions.gh.parseRepo(url, rootOnly) !== null

actions.gh.isFile = (url = window.location.href) =>
  actions.gh.parseFile(url) !== null
actions.gh.isCommit = (url = window.location.href) =>
  actions.gh.parseCommit(url) !== null
actions.gh.isIssue = (url = window.location.href) =>
  actions.gh.parseIssue(url) !== null
actions.gh.isPull = (url = window.location.href) =>
  actions.gh.parsePull(url) !== null

actions.gh.openRepo = () =>
  util.createHintsFiltered((a) => actions.gh.isRepo(a.href))
actions.gh.openUser = () =>
  util.createHintsFiltered((a) => actions.gh.isUser(a.href))
actions.gh.openFile = () =>
  util.createHintsFiltered((a) => actions.gh.isFile(a.href))
actions.gh.openCommit = () =>
  util.createHintsFiltered((a) => actions.gh.isCommit(a.href))
actions.gh.openIssue = () =>
  util.createHintsFiltered((a) => actions.gh.isIssue(a.href))
actions.gh.openPull = () =>
  util.createHintsFiltered((a) => actions.gh.isPull(a.href))

actions.gh.openPage = (path) => actions.openLink(`https://github.com/${path}`)

actions.gh.openRepoPage = (repoPath) => {
  const repo = actions.gh.parseRepo()
  if (repo === null) return
  actions.gh.openPage(`${repo.repoBase}${repoPath}`)
}

actions.gh.openRepoOwner = () => {
  const repo = actions.gh.parseRepo()
  if (repo === null) return
  actions.gh.openPage(`${repo.owner}`)
}

actions.gh.openGithubPagesRepo = () => {
  const user = window.location.hostname.split(".")[0]
  const repo = window.location.pathname.split("/")[1] ?? ""
  actions.gh.openPage(`${user}/${repo}`)
}

actions.gh.openSourceFile = () => {
  const p = window.location.pathname.split("/")
  actions.gh.openPage(`${[...p.slice(1, 3), "tree", ...p.slice(3)].join("/")}`)
}

actions.gh.openProfile = () =>
  actions.gh.openPage(
    `${document.querySelector("meta[name='user-login']").content}`
  )

actions.gh.toggleLangStats = () =>
  document.querySelector(".repository-lang-stats-graph").click()

actions.gh.goParent = () => {
  const segments = window.location.pathname.split("/").filter((s) => s !== "")
  const newPath = (() => {
    const [user, repo, pathType] = segments
    switch (segments.length) {
      case 0:
        return false
      case 4:
        switch (pathType) {
          case "blob":
          case "tree":
            return [user, repo]
          case "pull":
            return [user, repo, "pulls"]
          default:
            break
        }
        break
      case 5:
        if (pathType === "blob") {
          return [user, repo]
        }
        break
      default:
        break
    }
    return segments.slice(0, segments.length - 1)
  })()
  if (newPath !== false) {
    const u = `${window.location.origin}/${newPath.join("/")}`
    actions.openLink(u)
  }
}

actions.gh.viewSourceGraph = () => {
  const url = new URL("https://sourcegraph.com/github.com")
  let page = null
  // The following conditional expressions are indeed intended to be
  // assignments, this is not a bug.
  if ((page = actions.gh.parseFile(window.location.href)) !== null) {
    const filePath = page.filePath.join("/")
    url.pathname += `/${page.user}/${page.repo}@${page.commitHash}/-/${page.pathType}/${filePath}`
    if (window.location.hash !== "") {
      url.hash = window.location.hash
    } else if (!util.isElementInViewport(document.querySelector("#L1"))) {
      for (const e of document.querySelectorAll(".js-line-number")) {
        if (util.isElementInViewport(e)) {
          url.hash = e.id
          break
        }
      }
    }
  } else if ((page = actions.gh.parseCommit(window.location.href)) !== null) {
    url.pathname += `/${page.user}/${page.repo}@${page.commitHash}`
  } else if ((page = actions.gh.parseRepo(window.location.href)) !== null) {
    url.pathname += `/${page.user}/${page.repo}`
  } else {
    url.pathname = ""
  }

  actions.openLink(url.href, { newTab: true })
}

actions.gh.selectFile = async ({ files = true, directories = true } = {}) => {
  if (!(files || directories))
    throw new Error("At least one of 'files' or 'directories' must be true")

  const test = (f) =>
    f && !((!directories && f.isDirectory) || (!files && !f.isDirectory))

  let file = actions.gh.parseFile()
  if (test(file)) return file

  const repo = actions.gh.parseRepo()
  if (repo === null) throw new Error("Not a repository")

  const elem = util.createHintsFiltered((a) => {
    const f = actions.gh.parseFile(a.href)
    return f && f.isDirectory === false
  }, null)

  file = actions.gh.parseFile(elem.href)
  if (!test(file)) throw new Error("Not a file")
  return file
}

actions.gh.openFileFromClipboard = async ({ newTab = true } = {}) => {
  const clip = await navigator.clipboard.readText()
  if (typeof clip !== "string" || clip.length === 0) {
    return
  }

  const loc = window.location.href
  const dest = {
    user: null,
    repo: null,
    commitHash: "master",
  }

  const file = actions.gh.parseFile(loc)
  if (file !== null) {
    dest.user = file.user
    dest.repo = file.repo
    dest.commitHash = file.commitHash
  } else {
    const commit = actions.gh.parseCommit(loc)
    if (commit !== null) {
      dest.user = commit.user
      dest.repo = commit.repo
      dest.commitHash = commit.commitHash
    } else {
      const repository = actions.gh.parseRepo(loc)
      if (repository !== null) {
        return
      }
      dest.user = repository.user
      dest.repo = repository.repo
    }
  }

  actions.openLink(
    `https://github.com/${dest.user}/${dest.repo}/tree/${dest.commitHash}/${clip}`,
    { newTab }
  )
}

// GitLab
// ------
actions.gl = {}
actions.gl.star = () => {
  const repo = window.location.pathname
    .slice(1)
    .split("/")
    .slice(0, 2)
    .join("/")
  const btn = document.querySelector(".btn.star-btn > span")
  btn.click()
  const action = `${btn.textContent.toLowerCase()}red`
  let star = "☆"
  if (action === "starred") {
    star = "★"
  }
  Front.showBanner(`${star} Repository ${repo} ${action}`)
}

// Twitter
// ------
actions.tw = {}
actions.tw.openUser = () =>
  util.createHints(
    [].concat(
      [
        ...document.querySelectorAll(
          "a[role='link'] img[src^='https://pbs.twimg.com/profile_images']"
        ),
      ].map((e) => e.closest("a")),
      [...document.querySelectorAll("a[role='link']")].filter((e) =>
        e.text.match(/^@/)
      )
    )
  )

// Reddit
// ------
actions.re = {}
actions.re.collapseNextComment = () => {
  const vis = Array.from(
    document.querySelectorAll(".noncollapsed.comment")
  ).filter((e) => util.isElementInViewport(e))
  if (vis.length > 0) {
    vis[0].querySelector(".expand").click()
  }
}

// Hacker News
// ----------
actions.hn = {}
actions.hn.goParent = () => {
  const par = document.querySelector(".navs>a[href^='item']")
  if (!par) {
    return
  }
  actions.openLink(par.href)
}

actions.hn.collapseNextComment = () => {
  const vis = Array.from(document.querySelectorAll("a.togg")).filter(
    (e) => e.innerText === "[–]" && util.isElementInViewport(e)
  )
  if (vis.length > 0) {
    vis[0].click()
  }
}

actions.hn.goPage = (dist = 1) => {
  let u
  try {
    u = new URL(window.location.href)
  } catch (e) {
    return
  }
  let page = u.searchParams.get("p")
  if (page === null || page === "") {
    page = "1"
  }
  const cur = parseInt(page, 10)
  if (Number.isNaN(cur)) {
    return
  }
  const dest = cur + dist
  if (dest < 1) {
    return
  }
  u.searchParams.set("p", dest)
  actions.openLink(u.href)
}

actions.hn.openLinkAndComments = (e) => {
  const linkUrl = e.querySelector(".titleline>a").href
  const commentsUrl = e.nextElementSibling.querySelector(
    "a[href^='item']:not(.titlelink)"
  ).href
  actions.openLink(commentsUrl, { newTab: true })
  actions.openLink(linkUrl, { newTab: true })
}

// ProductHunt
// -----------
actions.ph = {}
actions.ph.openExternal = () => {
  Hints.create("ul[class^='postsList_'] > li > div[class^='item_']", (p) =>
    actions.openLink(
      p.querySelector(
        "div[class^='meta_'] > div[class^='actions_'] > div[class^='minorActions_'] > a:nth-child(1)"
      ).href,
      { newTab: true }
    )
  )
}

// Wikipedia
// ---------
actions.wp = {}
actions.wp.toggleSimple = () => {
  const u = new URL(window.location.href)
  u.hostname = u.hostname
    .split(".")
    .map((s, i) => {
      if (i === 0) {
        return s === "simple" ? "" : "simple"
      }
      return s
    })
    .filter((s) => s !== "")
    .join(".")
  actions.openLink(u.href)
}

actions.wp.viewWikiRank = () => {
  const h = document.location.hostname.split(".")
  const lang = h.length > 2 && h[0] !== "www" ? h[0] : "en"
  const p = document.location.pathname.split("/")
  if (p.length < 3 || p[1] !== "wiki") {
    return
  }
  const article = p.slice(2).join("/")
  actions.openLink(`https://wikirank.net/${lang}/${article}`, { newTab: true })
}

actions.wp.markdownSummary = () =>
  `> ${[
    (acc) => [...acc.querySelectorAll("sup")].map((e) => e.remove()),
    (acc) =>
      [...acc.querySelectorAll("b")].forEach((e) => {
        e.innerText = `**${e.innerText}**`
      }),
    (acc) =>
      [...acc.querySelectorAll("i")].forEach((e) => {
        e.innerText = `_${e.innerText}_`
      }),
  ]
    .reduce(
      (acc, f) => (f(acc) && false) || acc,
      document
        .querySelector("#mw-content-text p:not([class]):not([id])")
        .cloneNode(true)
    )
    .innerText.trim()}

— ${actions.getMarkdownLink()}`

// Nest Thermostat Controller
// --------------------------
actions.nt = {}
actions.nt.adjustTemp = (dir) =>
  document
    .querySelector(
      `button[data-test='thermozilla-controller-controls-${dir > 0 ? "in" : "de"
      }crement-button']`
    )
    .click()

actions.nt.setMode = async (mode) => {
  const selectMode = async (popover) => {
    const query = () => !popover.isConnected
    const q = query()
    if (q) return q
    popover
      .querySelector(
        `button[data-test='thermozilla-mode-switcher-${mode}-button']`
      )
      .click()
    return util.until(query)
  }

  const openPopover = async () => {
    const query = () =>
      document.querySelector("div[data-test='thermozilla-mode-popover']")
    const q = query()
    if (q) return q
    document
      .querySelector("button[data-test='thermozilla-mode-button']")
      .click()
    return util.until(query)
  }

  const popover = await openPopover()
  return selectMode(popover)
}

actions.nt.setFan = async (desiredState) => {
  const startStopFan = async (startStop, popover) => {
    const query = () => !popover.isConnected
    const q = query()
    if (q) return q
    popover
      .querySelector(
        `div[data-test='thermozilla-fan-timer-${startStop}-button']`
      )
      .click()
    return util.until(query)
  }

  const selectFanTime = async (listbox) => {
    const query = () => !listbox.isConnected
    const q = query()
    if (q) return q
    Hints.dispatchMouseClick(
      listbox.querySelector("div[role='option']:last-child")
    )
    return util.until(query)
  }

  const openFanListbox = async (popover) => {
    const query = () => popover.querySelector("div[role='listbox']")
    const q = query()
    if (q) return q
    Hints.dispatchMouseClick(popover.querySelector("div[role='combobox']"))
    return util.until(query)
  }

  const openPopover = async () => {
    const query = () =>
      document.querySelector("div[data-test='thermozilla-fan-timer-popover']")
    const q = query()
    if (q) return q
    document.querySelector("button[data-test='thermozilla-fan-button']").click()
    return util.until(query)
  }

  const fanRunning = () =>
    document.querySelector(
      "div[data-test='thermozilla-aag-fan-listcell-title']"
    )

  const startFan = async () => {
    const popover = await openPopover()
    const listbox = await openFanListbox(popover)
    await selectFanTime(listbox)
    return startStopFan("start", popover)
  }

  const stopFan = async () => {
    const popover = await openPopover()
    await startStopFan("stop", popover)
    await util.until(() => !fanRunning())
  }

  if (fanRunning()) {
    await stopFan()
  }

  if (desiredState === 1) {
    await startFan()
  }
}

// rescript-lang.org
actions.re = {}
actions.re.focusSearch = () =>
  actions.dispatchMouseEvents(
    document.getElementById("docsearch"),
    "mousedown",
    "click"
  )

actions.re.scrollSidebar = (dir) =>
  actions.scrollElement(document.getElementById("sidebar-content"), dir)
actions.re.scrollContent = (dir) => actions.scrollElement(document.body, dir)

// devdocs.io
actions.dv = {}

actions.dv.scrollSidebar = (dir) =>
  actions.scrollElement(document.querySelector("._list"), dir)
actions.dv.scrollContent = (dir) =>
  actions.scrollElement(document.querySelector("._content"), dir)

// ikea.com
actions.ik = {}

actions.ik.toggleProductDetails = async () => {
  const closeButtonQuery = () =>
    document.querySelector(".range-revamp-modal-header__close")
  const expandButtonQuery = () =>
    document.querySelector(".range-revamp-expander__btn")
  const productDetailsButtonQuery = () =>
    document.querySelector(
      ".range-revamp-product-information-section__button button"
    )

  const openProductDetailsModal = async () => {
    productDetailsButtonQuery().click()
    const expandButton = expandButtonQuery()
    if (expandButton) return expandButton
    return util.until(expandButtonQuery)
  }

  const closeButton = closeButtonQuery()
  if (closeButton) {
    closeButton.click()
    return
  }

  const expandButton = await openProductDetailsModal()
  if (expandButton) expandButton.click()
}

actions.ik.toggleProductReviews = () => {
  const btn =
    document.querySelector(".ugc-rr-pip-fe-modal-header__close") ??
    document.querySelector(".range-revamp-chunky-header__reviews")
  if (btn) btn.click()
}

// youtube.com
actions.yt = {}
actions.yt.getCurrentTimestamp = () => {
  const [ss, mm, hh = 0] = document
    .querySelector("#ytd-player .ytp-time-current")
    ?.innerText?.split(":")
    ?.reverse()
    ?.map(Number) ?? [0, 0, 0]
  return [ss, mm, hh]
}

actions.yt.getCurrentTimestampSeconds = () => {
  const [ss, mm, hh] = actions.yt.getCurrentTimestamp()
  return hh * 60 * 60 + mm * 60 + ss
}

actions.yt.getCurrentTimestampHuman = () => {
  const [ss, mm, hh] = actions.yt.getCurrentTimestamp()
  const pad = (n) => `${n}`.padStart(2, "0")
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`
}

actions.yt.getShortLink = () => {
  const params = new URLSearchParams(window.location.search)
  return `https://youtu.be/${params.get("v")}`
}

actions.yt.getCurrentTimestampLink = () =>
  `${actions.yt.getShortLink()}?t=${actions.yt.getCurrentTimestampSeconds()}`

actions.yt.getCurrentTimestampMarkdownLink = () =>
  actions.getMarkdownLink({
    title: `${document.querySelector("#ytd-player .ytp-title").innerText
      } @ ${actions.yt.getCurrentTimestampHuman()} - YouTube`,
    href: actions.yt.getCurrentTimestampLink(),
  })
actions.yt.clickLikeButtonYoutube = () => {
  document.querySelector("#segmented-like-button > ytd-toggle-button-renderer > yt-button-shape > button > yt-touch-feedback-shape > div").click();
}
actions.yt.checkSaveButtonTextOnYoutube = (text) => {
  return text.indexOf('lưu') != -1 || text.indexOf('save') != -1 || text.indexOf('playlist') != -1 || text.indexOf('danh sách phát') != -1
}
actions.yt.clickPlaylistButtonYoutube = () => {
  let outBtns = Array.from(document.querySelectorAll("#flexible-item-buttons > ytd-button-renderer button"));
  let isOut = false;
  for (let btn of outBtns) {
    const text = btn.ariaLabel.trim().toLowerCase()
    if (actions.yt.checkSaveButtonTextOnYoutube(text)) {
      btn.click();
      isOut = true;
      break;
    }
  }
  if (isOut) return;
  document.querySelector("#button-shape > button").click()
  let btns = document.querySelectorAll('.ytd-popup-container ytd-menu-service-item-renderer');
  for (let btn of btns) {
    const text = btn.innerText.trim().toLowerCase()
    if (actions.yt.checkSaveButtonTextOnYoutube(text)) {
      btn.click();
      break;
    }
  }
}
actions.yt.showPlaylist = () => {
  util.createHints('#dismissible', async (el) => {
    const menuBtn = el.querySelector('#menu button');
    if (!menuBtn) {
      return;
    }
    menuBtn.click();
    await util.sleep(100);
    document.querySelector("#items > ytd-menu-service-item-renderer:nth-child(3)").click()
  })
}


//nhentai
actions.nh = {
  imagesPerPageForViewer: 50,
}
actions.nh.getIdFromUrl = (url) => {
  const match = url.match(/nhentai\.net\/g\/(\d+)/)
  return match ? match[1] : null
}
actions.nh.createViewer = async (idGallery) => {
  const urls = await fetch('https://nhentai.net/api/gallery/' + idGallery).then(res => res.json()).then(data => {
    const mediaId = data.media_id;
    const pages = data.num_pages;
    const images = [];
    for (let i = 1; i <= pages; i++) {
      images.push(`https://i7.nhentai.net/galleries/${mediaId}/${i}.jpg`)
    }
    return images;
  })
  const imagesPerPage = actions.nh.imagesPerPageForViewer;
  //   let sizePercent = 50;
  let sizeImage = '50vw';
  let page = 1;
  const totalPage = Math.ceil(urls.length / imagesPerPage);
  const containerBox = document.createElement('div');
  containerBox.style.position = 'fixed';
  containerBox.style.top = '0';
  containerBox.style.left = '0';
  containerBox.style.right = '0';
  containerBox.style.bottom = '0';
  containerBox.style.borderRadius = '10px'
  containerBox.style.margin = '20px';
  containerBox.style.backgroundColor = '#000'
  containerBox.style.float = 'left'
  containerBox.style.zIndex = '9999'
  containerBox.addEventListener('close', () => {
  })
  const removeContainerBox = () => {
    document.body.style.overflow = "auto";
    containerBox.remove();
  }

  const closeBtn = document.createElement('button');
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '0';
  closeBtn.style.right = '0';
  closeBtn.innerHTML = "×";
  closeBtn.style.backgroundColor = 'rgba(0,0,0,0.1)';
  closeBtn.style.border = 'none';
  closeBtn.style.color = '#fff';
  closeBtn.style.fontSize = '1.5rem';
  closeBtn.style.fontWeight = 'bold';
  closeBtn.style.borderRadius = '50%';
  closeBtn.style.width = '2rem';
  closeBtn.style.height = '2rem';
  closeBtn.style.padding = '0';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.margin = '10px';

  closeBtn.onclick = () => {
    removeContainerBox();
  }
  const infoBox = document.createElement('div');
  infoBox.style.position = 'absolute';
  infoBox.style.top = '0';
  infoBox.style.left = '0';
  infoBox.style.display = 'flex'
  infoBox.style.flexDirection = 'column'
  const favoriteBtn = document.createElement('button');
  favoriteBtn.className = 'tth-favorite-btn'
  favoriteBtn.innerHTML = "Loading...";
  favoriteBtn.style.backgroundColor = '#ED2553'
  favoriteBtn.style.border = 'none';
  favoriteBtn.style.color = '#fff';
  favoriteBtn.style.fontSize = '1.5rem';
  favoriteBtn.style.fontWeight = 'bold';
  favoriteBtn.style.borderRadius = '10px';
  favoriteBtn.style.padding = '0';
  favoriteBtn.style.cursor = 'pointer';
  favoriteBtn.style.margin = '10px';
  favoriteBtn.style.padding = '10px';
  favoriteBtn.style.fontSize = '1.4rem';
  const favoriteMethod = 'favorite';
  const unfavoriteMethod = 'unfavorite';
  favoriteBtn.onclick = () => {
    const state = favoriteBtn.innerHTML != favoriteMethod ? unfavoriteMethod : favoriteMethod
    favoriteBtn.disabled = true;

    fetch('https://nhentai.net/api/gallery/' + idGallery + '/' + state, {
      method: 'post',
      headers: {
        "X-Csrftoken": document.cookie.replace(/.+=/g, '')
      }
    }).then(res => {
      favoriteBtn.innerHTML = favoriteBtn.innerHTML == favoriteMethod ? unfavoriteMethod : favoriteMethod;
      favoriteBtn.disabled = false;
    })
  }
  fetch('https://nhentai.net/g/' + idGallery).then(res => res.text()).then(data => {
    const parser = new DOMParser();
    const dom = parser.parseFromString(data, 'text/html');
    favoriteBtn.innerHTML = dom.querySelector('#favorite').innerText.toLowerCase().includes(unfavoriteMethod) ? unfavoriteMethod : favoriteMethod;
  })
  const createDetailInfoBox = (str) => {
    const textBox = document.createElement('a');
    textBox.style.padding = '5px';
    textBox.style.margin = '5px';
    textBox.style.border = '2px solid #ccc'
    fetch('https://nhentai.net/api/gallery/' + idGallery).then(res => res.json()).then(data => {
      const tags = data.tags;
      for (let item of data.tags) {
        if (item.type == str.toLowerCase()) {
          textBox.innerText = str + ': \n' + item.name;
          textBox.href = item.url;
          return;
        }
      }
      textBox.innerText = str + ': None'
      textBox.style.cursor = 'default';
    })
    return textBox;
  }
  infoBox.appendChild(favoriteBtn)
  infoBox.appendChild(createDetailInfoBox('artist'))
  infoBox.appendChild(createDetailInfoBox('group'))
  infoBox.appendChild(createDetailInfoBox('parody'))

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      removeContainerBox();
    }
  });
  const updateTotalPage = () => {
    document.querySelectorAll('.tth-total-page').forEach(el => {
      el.innerHTML = `${page}/${totalPage}`;
    })
  }
  const nextPageHandler = () => {
    imgBox.scrollTop = 0;
    if (page < totalPage) {
      page++;
      updatePage();
      updateTotalPage();
    }
  }
  const prevPageHandler = () => {
    imgBox.scrollTop = 0;
    if (page > 0) {
      page--;
      updatePage();
      updateTotalPage();
    }
  }
  const createPagination = () => {
    const pagination = document.createElement('div');
    pagination.style.padding = '10px';
    pagination.style.alignItems = 'center';
    pagination.style.color = '#fff';
    pagination.style.fontSize = '1.5rem';
    pagination.style.fontWeight = 'bold';
    pagination.style.borderRadius = '10px'
    pagination.style.float = 'left'
    pagination.style.display = 'flex';
    pagination.style.justifyContent = 'center';
    pagination.style.width = '100%';
    const totalPageElement = document.createElement('p');
    totalPageElement.style.margin = '0 10px';
    totalPageElement.className = 'tth-total-page';
    totalPageElement.innerHTML = `${page}/${totalPage}`;
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'Next';
    nextBtn.onclick = () => {
      nextPageHandler();
    }
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = 'Prev';
    prevBtn.onclick = () => {
      prevPageHandler();
    }
    updateTotalPage()
    pagination.appendChild(prevBtn);
    pagination.appendChild(totalPageElement);
    pagination.appendChild(nextBtn);
    return pagination
  }
  const paginationTop = createPagination();
  const paginationBottom = createPagination();
  const imgBox = document.createElement('div');
  imgBox.className = 'tth-images-area'
  imgBox.style.position = 'relative';
  imgBox.style.width = '100%';
  imgBox.style.height = '100%';
  imgBox.style.overflowY = 'auto';
  imgBox.style.display = 'flex';
  imgBox.style.alignItems = 'center';
  imgBox.style.flexDirection = 'column';
  imgBox.style.float = 'left'
  imgBox.style.borderRadius = '10px'
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      nextPageHandler();
    }
    else if (e.key === 'ArrowLeft') {
      prevPageHandler();
    }
    else if (e.key === 'ArrowDown') {
      //   sizePercent += 10;
      sizeImage = (Number(sizeImage.replace(/[a-z]+$/, '')) - 10) + sizeImage.match(/[a-z]+$/g)[0]
      Array.from(imgBox.querySelectorAll('img')).forEach(el => {
        el.style.width = sizeImage//sizePercent + '%';
      })
    }
    else if (e.key === 'ArrowUp') {
      //   sizePercent -= 10;
      sizeImage = (Number(sizeImage.replace(/[a-z]+$/, '')) + 10) + sizeImage.match(/[a-z]+$/g)[0]
      Array.from(imgBox.querySelectorAll('img')).forEach(el => {
        el.style.width = sizeImage//sizePercent + '%';
      })
    }
  });
  const updateImgBox = () => {
    imgBox.innerHTML = '';
    const imagesNumber = imagesPerPage * (page - 1);
    imgBox.appendChild(paginationTop)
    for (let i = 0; i < imagesPerPage; i++) {
      if (imagesNumber + i >= urls.length) {
        break;
      }
      const div = document.createElement('div')
      div.style.position = 'relative'
      const img = document.createElement('img');
      img.src = urls[imagesNumber + i];
      img.style.position = 'absolute'
      img.style.top = '0';
      img.style.left = '0';
      img.style.width = sizeImage//sizePercent + '%';
      img.style.height = 'auto';
      img.style.objectFit = 'cover';
      img.loading = 'lazy';
      img.onerror = () => {
        if (img.src.includes('i5') && img.src.includes('jpg')) {
          img.src = img.src.replace('i5', 'i3');
        }
        else if (img.src.includes('i3') && img.src.includes('png')) {
          img.src = img.src.replace('png', 'jpg');
        }
        else if (img.src.includes('i5') && img.src.includes('png')) {
          img.src = img.src.replace('i5', 'i3');
        }
        else if (img.src.includes('i7') && img.src.includes('png')) {
          img.src = img.src.replace('i7', 'i5');
        }
        else if (img.src.includes('jpg')) {
          img.src = img.src.replace('jpg', 'png');
        }
      }
      const imgTemp = document.createElement('img');
      imgTemp.src = img.src.replace('.jpg', 't.jpg').replace(/\/\/i\d+/g, '//t3');
      imgTemp.onerror = () => {
        if (imgTemp.src.includes('t7') && imgTemp.src.includes('jpg')) {
          imgTemp.src = imgTemp.src.replace('t7', 't5');
        }
        else if (imgTemp.src.includes('t7') && imgTemp.src.includes('png')) {
          imgTemp.src = imgTemp.src.replace('png', 'jpg');
        }
        else if (imgTemp.src.includes('t5') && imgTemp.src.includes('png')) {
          imgTemp.src = imgTemp.src.replace('t5', 't7');
        }
        else if (imgTemp.src.includes('t3') && imgTemp.src.includes('png')) {
          imgTemp.src = imgTemp.src.replace('t3', 't5');
        }
        else if (imgTemp.src.includes('jpg')) {
          imgTemp.src = imgTemp.src.replace('jpg', 'png');
        }
      }
      imgTemp.style.width = sizeImage//sizePercent + '%';
      imgTemp.style.height = 'auto';
      imgTemp.style.objectFit = 'cover';

      div.appendChild(imgTemp)
      div.appendChild(img)
      imgBox.appendChild(div);
    }
    imgBox.appendChild(paginationBottom);
  }
  const updatePage = () => {
    updateImgBox();
  }
  updatePage();
  containerBox.appendChild(imgBox);
  containerBox.appendChild(closeBtn);
  containerBox.appendChild(infoBox);
  document.body.style.overflow = "hidden";
  document.body.appendChild(containerBox);
  Hints.create("tth-images-area", Hints.dispatchMouseClick);
}
//iwara
actions.iw = {
  socket: null,
  vidResolution: [
    'Source',
    '540p',
    '360p'
  ]
};
actions.iw.getSocket = () => {
  return actions.iw.socket;
}
actions.iw.setSocket = () => {
  actions.iw.socket = new WebSocket('ws://localhost:9790');
  actions.iw.socket.addEventListener('message', (res) => {
    const data = JSON.parse(res.data)
    if (data.isContinue) {
      Array.from(document.querySelectorAll('div.videoTeaser')).forEach(el => {
        if (el.querySelector('a').href.includes(data.url))
          el.style.backgroundColor = ''
      })
    }
  })
}

actions.iw.getIdIwara = (url) => {
  const match = url.match(/iwara.tv\/video\/([^\/]+)/)
  return match ? match[1] : url
}
actions.iw.getJSON = (url, callback, xVersionHeader = '', headers = {}) => {
  if (xVersionHeader) {
    headers = {
      ...headers,
      'x-version': xVersionHeader,
    }
  }
  fetch(url, {
    headers: {
      "Authorization": "Bearer " + localStorage.token,
      ...headers
    }
  })
    .then(response => response.json())
    .then(data => callback(null, data))
  return;
};
actions.iw.createCheckBoxes = (checkboxes, isIwara) => {
  // Create container element
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.alignItems = 'center';
  container.style.height = '100vh';
  container.style.background = 'rgba(0, 0, 0, 0.5)';
  container.style.backdropFilter = 'blur(5px)';
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '100%';
  container.style.zIndex = '9999';
  const handleEsc = (e) => {
    if (e.key == "Escape") {
      container.remove();
      document.removeEventListener('keyup', handleEsc)
    }
  }
  document.addEventListener('keyup', handleEsc)

  // Create black box
  const blackBox = document.createElement('div');
  blackBox.style.backgroundColor = 'black';
  blackBox.style.color = 'white';
  blackBox.style.padding = '20px';
  blackBox.style.borderRadius = '10px'; // Adjust the border radius here
  blackBox.style.width = '300px';
  blackBox.style.position = 'relative';

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '10px';
  closeButton.style.right = '10px';
  closeButton.style.border = 'none';
  closeButton.style.backgroundColor = 'transparent';
  closeButton.style.color = 'white';
  closeButton.style.fontSize = '24px';
  closeButton.style.fontWeight = 'bold';
  closeButton.style.cursor = 'pointer';
  closeButton.style.width = '30px';
  closeButton.style.height = '30px';
  closeButton.style.borderRadius = '50%';
  closeButton.style.display = 'flex';
  closeButton.style.justifyContent = 'center';
  closeButton.style.alignItems = 'center';
  closeButton.style.outline = 'none';
  closeButton.style.boxShadow = '0 0 3px rgba(0, 0, 0, 0.3)';
  closeButton.style.transition = 'background-color 0.3s';

  // Event listener for close button
  closeButton.addEventListener('click', () => {
    container.remove();
  });

  // Mouse hover effect for close button
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.backgroundColor = 'transparent';
  });

  // Append close button to the black box
  blackBox.appendChild(closeButton);

  // Create checkboxes

  checkboxes.forEach(async (obj) => {
    let checkboxText = '';
    const checkboxContainer = document.createElement('div');
    checkboxContainer.style.display = 'flex';
    checkboxContainer.style.alignItems = 'center';
    if (isIwara) {
      checkboxText = obj.title;
    }

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxText;
    checkbox.checked = false;
    if (isIwara && obj.isAdded) {
      checkbox.checked = true;
    }
    if (isIwara) {
      checkboxContainer.addEventListener('mousedown', async () => {
        let method = checkbox.checked ? 'delete' : 'post'
        const authorization = 'Bearer ' + localStorage.accessToken
        console.log('TESTING: ', method, ' ', authorization)
        fetch(`https://api.iwara.tv/video/${obj.idVideo}/like`, {
          method: method,
          headers: {
            'Authorization': authorization
          }
        }).then(() => {
          fetch(`https://api.iwara.tv/playlist/${obj.idPlaylist}/${obj.idVideo}`, {
            method: method,
            headers: {
              'Authorization': authorization
            }
          })
        })
      })
    }
    const label = document.createElement('label');
    label.setAttribute('for', checkboxText);
    label.textContent = checkboxText;

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);

    blackBox.appendChild(checkboxContainer);
  });

  // Append black box to the container
  container.appendChild(blackBox);

  // Add the container to the body
  document.body.appendChild(container);
}
actions.iw.getAccessTokenFromIwara = async () => {
  return await fetch('https://api.iwara.tv/user/token', {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + localStorage.token
    }
  }).then(res => res.json()).then(data => data.accessToken)
}


actions.iw.copyAndPlayVideo = (id, index = 0, isPlayWithMpv = true) => {
  const changeColorForPlayingUrl = (id) => {
    Array.from(document.querySelectorAll('div.videoTeaser>a')).forEach(el => {
      if (el.href.includes(id)) {
        el.parentElement.style.backgroundColor = 'blue';
      }
    })
  }
  const getFileId = (url) => {
    return url.match(/file\/.+\?/g)[0].replace(/file\/|\?/g, '')
  }
  const getExpire = (url) => {
    return url.match("expires=.+&")[0].replace(/expires=|&/g, '');
  }
  if (!actions.iw.getSocket()) {
    actions.iw.setSocket();
    const socket = actions.iw.getSocket();
    const handleOpen = () => {
      changeColorForPlayingUrl(id);
      socket.removeEventListener('open', handleOpen);
    }
    socket.addEventListener('open', handleOpen)
  }
  else {
    changeColorForPlayingUrl(id)
  }
  actions.iw.getJSON(`https://api.iwara.tv/video/${id}`, async (status, res) => {
    if (status) {
      api.Front.showBanner('Error: ', status);
      return;
    }
    if (res.message && (res?.message?.trim()?.toLowerCase()?.includes('notfound') || res?.message?.trim()?.toLowerCase()?.includes('private'))) {
      api.Front.showPopup(res.message + ' for ' + id)
      api.Clipboard.write('https://www.iwara.tv/' + id)
      return;
    }
    else if (res.message) {
      actions.iw.copyAndPlayVideo(id, index, isPlayWithMpv);
      return;
    }
    if (res.embedUrl && !res.fileUrl) {
      api.Clipboard.write(res.embedUrl);
      return;
    }
    const fileUrl = res.fileUrl;
    const fileId = getFileId(fileUrl)
    if (!fileId || !fileUrl) {
      api.Front.showPopup('Not found requrement');
      return;
    }
    // console.log((fileId + '_' + getExpire(fileUrl) + '_5nFp9kmbNnHdAFhaqMvt'))
    actions.iw.getJSON(fileUrl, (status2, res2) => {
      const json = res2;
      // console.log(json)
      let i = json.length - 1;
      for (let j = 0; j < json.length; j++) {
        if (actions.iw.vidResolution[index].toLowerCase().indexOf(json[j].name.toLowerCase()) != -1) {
          i = j;
          break;
        }
      }
      const uri = 'https:' + json[i].src.download;
      api.Clipboard.write(uri)
      if (isPlayWithMpv) {
        api.Front.showBanner('Opening mpv...');
        util.playWithMpv(uri, 'https://www.iwara.tv/video/' + id);
      }
    }, await util.convertToSHA1(fileId + '_' + getExpire(fileUrl) + '_5nFp9kmbNnHdAFhaqMvt'))
  })
}
actions.iw.showPlaylistMenu = () => {
  util.createHints("*[href*='video/']", async function(element) {
    let checkBoxes = [];
    localStorage.accessToken = await actions.iw.getAccessTokenFromIwara()
    const idVideo = actions.iw.getIdIwara(element.href);
    await fetch('https://api.iwara.tv/light/playlists?id=' + idVideo, {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + localStorage.accessToken
      }
    }).then(res => res.json()).then(data => {
      for (let obj of data) {
        checkBoxes = [...checkBoxes, {
          idPlaylist: obj.id,
          idVideo,
          isAdded: obj.added,
          title: obj.title,
        }]
      }
    })
    actions.iw.createCheckBoxes(checkBoxes, true)
  })
}
actions.iw.playUrlsInClipboardWithMpv = () => {
  api.Clipboard.read(function(res) {
    const urls = res.data.split('\n');
    for (const url of urls) {
      if (url.includes('iwara')) {
        actions.iw.copyAndPlayVideo(url.match(/video\/.+(\/)?/)[0].replace(/video\/|\/.+/g, ''));
      }
      else {
        util.playWithMpv(url);
      }
    }
  })
}
actions.iw.playUrlsOnPageWithMpv = () => {
  let index = 0;
  const urls = Array.from(document.querySelectorAll('a[href*="/video/"]'))
    .map(a => actions.iw.getIdIwara(a.href))
    .filter((item, pos, self) => self.indexOf(item) == pos);
  actions.iw.copyAndPlayVideo(urls[0])
  actions.iw.getSocket().onmessage = (res) => {
    const data = JSON.parse(res.data)
    if (data.isContinue) {
      actions.iw.copyAndPlayVideo(urls[++index]);
    }
    else if (index == urls.length - 1) {
      actions.iw.getSocket().close();
    }
  }

}
actions.iw.GoToMmdFansVid = (title, isSearching = true) => {
  if (isSearching) {
    api.Front.showBanner('Searching...')
    // originalTitle = title;
  };
  actions.getDOM(encodeURI('https://mmdfans.net/?query=' + title), function(s, res) {
    if (s) {
      api.Front.showPopup('Error:' + s)
      return;
    }
    const doc = res;
    const videos = doc.querySelectorAll('.mdui-col > a')
    console.log(doc)
    console.log(videos)
    if (!videos || videos.length < 1) {
      const titleBackup = title;
      title = title.replace(/ [^ ]*$/, "")
      if (!title || titleBackup == title) {
        api.Front.showPopup("Not found video")
        return;
      }
      api.Front.showBanner('Not found, searching ' + title)
      actions.iw.GoToMmdFansVid(title, false)
      return;
    }
    let index = 0;
    if (videos.length > 1) {
      api.Front.showBanner('Result have above 1 video');
      const vids = Array.from(doc.querySelectorAll('.mdui-grid-tile'))
      for (let i in vids) {
        if (vids[i].innerText.indexOf(title) != -1) {
          index = i;
        }
      }
    }

    let openUrl = "https://mmdfans.net/" + videos[index].href.match(/mmd\/.+/ig)[0];
    console.log(openUrl)
    window.open(openUrl);

  })
}
actions.iw.getVideoTitle = async (id) => {
  return await fetch(`https://api.iwara.tv/video/${id}`)
    .then((response) => response.json())
    .then(data => data.title);
}

// DOI
actions.doi = {}
actions.doi.providers = {}
actions.doi.providers.meta_citation_doi = () =>
  document.querySelector("meta[name=citation_doi]")?.content
actions.doi.providers.meta_dcIdentifier_doi = () =>
  document.querySelector("meta[name='dc.Identifier'][scheme=doi]")?.content

actions.doi.getLink = (provider) => {
  if (!priv.doi_handler) {
    Front.showBanner("DOI Handler not confingured (see conf.priv.example.js)")
    return
  }
  const doi = provider()
  if (!doi) {
    Front.showBanner("DOI not found")
    return
  }
  return priv.doi_handler(doi)
}

//erommdtube
actions.em = {};
actions.em.openCurrentVideoWithIwara = () => {
  try {
    const id = document.querySelector('[href*="https://ecchi.iwara"]').href.match(/(video|videos)\/.+/i)[0].replace(/(.+\/)/, '');
    if (id) {
      window.open('https://iwara.tv/video/' + id);
      return;
    }
  }
  catch {
    window.open(document.querySelector('[href*="iwara.tv/video"]').href);
  }
}
actions.em.openWithIwara = () => {
  util.createHints("*[href*='erommdtube.com/movies/']", function(element) {
    actions.getDOM(element.href, function(s, res) {
      if (s) {
        api.Front.showPopup('Error:' + s)
        return;
      }
      const doc = res;
      window.open(doc.querySelector('[href*="iwara.tv"]').href);
    })
  })
}
actions.em.openWithMMDFans = () => {
  util.createHints("*[href*='erommdtube.com/movies/']", function(element) {
    const title = element.querySelector('.main__list-title').innerText;
    actions.iw.GoToMmdFansVid(title);
  })
}
actions.em.openCurrentVideoWithMMDFans = () => {
  const title = document.querySelector('h1.show__h1').innerText;
  actions.iw.GoToMmdFansVid(title);
}
actions.em.openCurrentVideoWithMPV = () => {
  const url = document.querySelector('[href*="iwara.tv"]').href;
  actions.iw.copyAndPlayVideo(actions.iw.getIdIwara(url));
}
actions.em.openVideoWithMPV = () => {
  util.createHints("*[href*='erommdtube.com/movies/']", function(element) {
    actions.getDOM(element.href, function(s, res) {
      debugger;
      const url = res.querySelector('[href*="iwara.tv"]').href;
      actions.iw.copyAndPlayVideo(actions.iw.getIdIwara(url));
    })
  })
}

//oreno3d
actions.or = {};
actions.or.openCurrentVideoWithIwara = () => {
  try {
    const id = document.querySelector('[href*="https://ecchi.iwara"]').href.match(/(video|videos)\/.+/i)[0].replace(/(.+\/)/, '');
    if (id) {
      window.open('https://iwara.tv/video/' + id);
      return;
    }
  }
  catch {
    window.open(document.querySelector('[href*="iwara.tv/video"]').href);
  }
}
actions.or.openWithIwara = () => {
  util.createHints("*[href*='erommdtube.com/movies/']", function(element) {
    actions.getDOM(element.href, function(s, res) {
      if (s) {
        api.Front.showPopup('Error:' + s)
        return;
      }
      const doc = res;
      window.open(doc.querySelector('[href*="iwara.tv"]').href);
    })
  })
}
actions.or.openWithMMDFans = () => {
  util.createHints("*[href*='erommdtube.com/movies/']", function(element) {
    const title = element.querySelector('.main__list-title').innerText;
    actions.iw.GoToMmdFansVid(title);
  })
}
actions.or.openCurrentVideoWithMMDFans = () => {
  const title = document.querySelector('h1.show__h1').innerText;
  actions.iw.GoToMmdFansVid(title);
}
actions.or.openCurrentVideoWithMPV = () => {
  const url = document.querySelector('[href*="iwara.tv"]').href;
  actions.iw.copyAndPlayVideo(actions.iw.getIdIwara(url));
}
actions.or.openVideoWithMPV = () => {
  util.createHints("*[href*='erommdtube.com/movies/']", function(element) {
    actions.getDOM(element.href, function(s, res) {
      const url = res.querySelector('[href*="iwara.tv"]').href;
      actions.iw.copyAndPlayVideo(actions.iw.getIdIwara(url));
    })
  })
}
export default actions
