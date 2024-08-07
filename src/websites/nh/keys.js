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
        webActions.createViewer(id)
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
      webActions.createViewer(id)
    },
  },
  {
    alias: "f",
    description: "Favorite Comic",
    callback: () => {
      let btn =
        document.querySelector(".tth-favorite-btn") ||
        document.querySelector("#favorite")
      Front.showBanner(
        btn.innerText.trim().toLowerCase().replace("favorite", "favorited"),
      )
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
]
