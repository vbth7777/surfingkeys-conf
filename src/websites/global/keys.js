import actions from "./actions.js"
import webActions from "./actions.js"
import api from "../../api.js"
import help from "../../help.js"
import priv from "../../conf.priv.js"
import util from "../../util.js"
import { PLAY_VIDEO_MPV_ALIAS } from "./constants.js"

const { categories } = help

const { Clipboard, Front } = api
export default [
  {
    leader: "",
    alias: PLAY_VIDEO_MPV_ALIAS,
    description: "View Video By MPV",
    callback: () => {
      util.createHints("a[href]", (el) => {
        util.playWithMpv(el.href)
      })
    },
  },
  {
    leader: "",
    alias: "oam",
    description: "Async View Video By MPV",
    callback: () => {
      util.createHints("a[href]", (el) => {
        util.playAsyncWithMpv(el.href)
      })
    },
  },
  {
    leader: "",
    alias: "oc",
    category: categories.clipboard,
    description: "View Video By MPV In Clipboard",
    callback: () => {
      actions.openUrlsInClipboardWithMpv()
    },
  },
  {
    leader: "",
    alias: ";h",
    description: "Mouse Over On Page",
    callback: () => {
      const event = new MouseEvent("mouseover", {
        bubbles: true,
      })
      util.createHints("button, a, div", (el) => el.dispatchEvent(event))
    },
  },
]
