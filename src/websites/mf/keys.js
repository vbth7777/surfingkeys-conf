import actions from "../global/actions.js"
// import webActions from "./actions.js"
import api from "../../api.js"
import help from "../../help.js"
import priv from "../../conf.priv.js"
import util from "../../util.js"
import { PLAY_VIDEO_MPV_ALIAS } from "../global/constants.js"

const { categories } = help

const { Clipboard, Front } = api
export default [
  {
    alias: "v",
    description: "Copy And View Current Video By MPV",
    callback: () => {
      util.playWithMpv(
        document.querySelector("#mmd-player .mdui-video-fluid source").src,
      )
    },
  },
  {
    alias: "k",
    description: "View Async Current Video By MPV",
    callback: () => {
      const url = document.querySelector(
        "#mmd-player .mdui-video-fluid source",
      ).src
      api.Front.showBanner(`Opening with mpv (${url})...`)
      fetch("http://localhost:9789/async-run", {
        method: "post",
        body: new URLSearchParams({ url }),
      }).catch((err) => console.error(err))
    },
  },
]
