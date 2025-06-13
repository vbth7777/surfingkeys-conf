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
    alias: "c",
    description: "Copy Author Name - Type - ID",
    callback: () => {
      const { name, type, id, author } = webActions.getAuthorInfo()
      if (author.href.includes("patreon.com")) {
        Clipboard.write(`${name} - ${author.href.match(/\d+$/)[0]}`)
        Front.showBanner("Copied Author Name - ID")
        return
      }
      if (type == "patreon" || !type) {
        Clipboard.write(`${name} - ${author.href.match(/\d+$/)[0]}`)
        Front.showBanner("Copied Author Name - ID")
      } else {
        Clipboard.write(`${name} - ${type} - ${id}`)
        Front.showBanner("Copied Author Name - Type - ID")
      }
    },
  },
]
