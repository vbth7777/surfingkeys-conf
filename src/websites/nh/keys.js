import actions from "../global/actions.js"
import webActions from "./actions.js"
import api from "../../api.js"
import help from "../../help.js"
import priv from "../../conf.priv.js"
import util from "../../util.js"
import { PLAY_VIDEO_MPV_ALIAS } from "../global/constants.js"

const { categories } = help
let isFullMode = false

const { Clipboard, Front } = api
export default [
  {
    alias: "h",
    leader: "",
    description: "Prev Page",
    callback: () => {
      document.querySelector(".tth-prev-btn").click()
    },
  },
  {
    alias: "l",
    leader: "",
    description: "Next Page",
    callback: () => {
      document.querySelector(".tth-next-btn").click()
    },
  },
  {
    alias: "r",
    description: "Read Comic",
    callback: () =>
      util.createHints('a[href*="/g/"]', (el) => {
        const id = webActions.getIdFromUrl(el.href)
        webActions.createViewer(id, isFullMode)
      }),
  },
  {
    leader: "",
    alias: "q",
    description: "Quit Comic",
    callback: () =>
      util.createHints('a[href*="/g/"]', (el) => {
        webActions?.removeReaderArea()
      }),
  },
  {
    alias: "k",
    description: "Read Current Comic",
    callback: () => {
      const id = webActions.getIdFromUrl(window.location.href)
      webActions.createViewer(id, isFullMode)
    },
  },
  {
    alias: "f",
    description: "Favorite Comic",
    callback: () => {
      const btn =
        document.querySelector(".tth-favorite-btn") ||
        document.querySelector("#favorite")
      Front.showBanner(
        btn.innerText.trim().toLowerCase().replace("favorite", "favorited"),
      )
      btn.click()
    },
  },
  {
    alias: "t",
    description: "Refresh Uncomplete Images",
    callback: () => {
      const btn = document.querySelector(".tth-more-btn")
      Front.showBanner("Change Server Uncomplete Images")
      btn.click()
    },
  },
  {
    leader: "",
    alias: "q",
    description: "Quit Reader Box",
    callback: () => {
      webActions.removeReaderArea()
    },
  },
  {
    alias: "d",
    description: "Download comic",
    callback: () => {
      const imgs = Array.from(
        document.querySelectorAll(".tth-images-area div>img:last-child"),
      ).map((e) => e.src)
      actions.downloadImagesAsZip(imgs)
      Front.showBanner("Downloading The Reading Comic")
    },
  },
  {
    alias: "m",
    description: "Full Mode Toggle",
    callback: () => {
      isFullMode = !isFullMode
      Front.showBanner(`Full Mode: ${isFullMode}`)
    },
  },
  {
    alias: "h",
    description: "Info Box Toggle",
    callback: () => {
      if (document.querySelector(".tth-hide-btn").style.display === "block") {
        document.querySelector(".tth-hide-btn").click()
      } else {
        document.querySelector(".tth-show-btn").click()
      }
    },
  },
]
