import actions from "../global/actions.js"
import webActions from "./actions.js"
import api from "../../api.js"
import help from "../../help.js"
import priv from "../../conf.priv.js"
import util from "../../util.js"
import { PLAY_VIDEO_MPV_ALIAS } from "../global/constants.js"

const { categories } = help

const { Clipboard, Front } = api
export default [
  {
    leader: "",
    alias: PLAY_VIDEO_MPV_ALIAS,
    description: "Copy And View Video By MPV",
    callback: () => {
      util.createHints('a[href*="/video/"]', (el) => {
        const id = webActions.getIdIwara(el.href)
        webActions.copyAndPlayVideo(id)
      })
    },
  },
  {
    alias: "cv",
    description: "Copy And View Current Video By MPV",
    callback: () => {
      // const id = webActions.getIdIwara(window.location.href);
      // webActions.copyAndPlayVideo(id);
      util.playWithMpv(
        document.querySelector(".videoPlayer video").src,
        window.location.href,
        localStorage.accessToken,
      )
    },
  },
  {
    alias: "ck",
    description: "View Async Current Video By MPV",
    callback: () => {
      // const id = webActions.getIdIwara(window.location.href);
      // webActions.copyAndPlayVideo(id);
      const url = document.querySelector(".videoPlayer video").src
      api.Front.showBanner(`Opening with mpv (${url})...`)
      fetch("http://localhost:9789/async-run", {
        method: "post",
        body: new URLSearchParams({ url }),
      }).catch((err) => console.error(err))
    },
  },
  {
    alias: "k",
    description: "Show Playlist",
    callback: () => {
      webActions.showPlaylistMenu()
    },
  },
  {
    alias: "pk",
    description: "Like And Show Playlist For Current Video",
    callback: () => {
      Array.from(document.querySelectorAll("button")).forEach((el) => {
        if (el.innerText.toLowerCase().includes("like")) {
          el.click()
        }
      })
    },
  },
  {
    alias: "paq",
    description: "Play All Videos On The Page By MPV By Queue",
    callback: () => {
      webActions.playUrlsOnPageWithMpv()
    },
  },
  {
    alias: "paa",
    description: "Play All Videos On The Page By MPV",
    callback: () => {
      const vids = document.querySelectorAll(
        '.videoTeaser__content a[href*="/video/"]',
      )
      for (let vid of vids) {
        util.playWithMpv(vid.href, null, localStorage.accessToken)
      }
    },
  },
  {
    alias: "m",
    description: "Search The Video On MMDFans",
    callback: async () => {
      const el = document.querySelector(".page-video__details > .text")
      const authorName = document.querySelector(".username").innerText

      if (el) {
        webActions.GoToMmdFansVid(el.innerText, authorName)
        return
      }
      const title = await webActions.getVideoTitle(
        webActions.getIdIwara(document.location.href),
      )
      console.log(title)
      webActions.GoToMmdFansVid(title)
    },
  },
  {
    alias: "vp",
    description: "Preview All Videos On Page",
    callback: async () => {
      if (webActions.reviewIntervalId) {
        clearInterval(webActions.reviewIntervalId)
      }
      webActions.previewIntervalId = setInterval(() => {
        const event = new MouseEvent("mouseover", {
          bubbles: true,
        })
        Array.from(
          document.querySelectorAll(".videoTeaser__thumbnail"),
        ).forEach((el) => el.dispatchEvent(event))
      }, 1000)
    },
  },
  {
    alias: "vs",
    description: "Stop Preview All Videos On Page",
    callback: async () => {
      clearInterval(webActions.previewIntervalId)
      webActions.previewIntervalId = null
      const event = new MouseEvent("mouseout", {
        bubbles: true,
      })
      Array.from(document.querySelectorAll(".videoTeaser__thumbnail")).forEach(
        (el) => el.dispatchEvent(event),
      )
    },
  },
  {
    alias: "u",
    description: "Play All Video Of User",
    callback: async () => {
      const getProfileID = (url) => {
        return url.match(/profile\/([^\/])*/)
      }
      let profileId = null
      if (window.location.href.includes("profile")) {
        profileId = getProfileID(window.location.href)
      } else {
        await util.createHints('a[href*="/profile/"]', async (el) => {
          profileId = getProfileID(el.href)
        })
      }
      if (profileId) {
        const idUser = (
          await util.getJSON("https://api.iwara.tv/profile/" + profileId)
        ).user.id
        let page = 0
        let maxPage = true
        while (page != maxPage) {
          const url = `https://api.iwara.tv/videos?sort=date&page=${page++}&user=${idUser}`
          const json = await util.getJSON(url)
          maxPage =
            maxPage !== true ? parseInt(json.count / json.limit) : maxPage
          const videos = json.results
          for (let vid of videos) {
            webActions.copyAndPlayVideo(vid.id)
          }
        }
      }
    },
  },
]
