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
    alias: "r",
    description: "Read Comic",
    callback: () => {
      util.createHints('a[href*="/g/"]', (el) => {
        webActions.createViewer(el.href.match(/\/g\/(.+)/)[1])
      })
    },
  },
]
