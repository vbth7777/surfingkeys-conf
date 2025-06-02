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
    alias: "c",
    description: "Copy Author Name - Type - ID",
    callback: () => {
      const author = document.querySelector(
        "html body div#root div.content-wrapper.shifted main#main.main section.site-section.site-section--user header.user-header div.user-header__info h1#user-header__info-top.user-header__name a.user-header__profile",
      )
      const name = author.innerText.trim()
      const type = author.href.match(/(\w+)\/creator/g)[1]
      const id = author.href.match(/creator\/(\d+)/g)[1]
      if (type != "patreon") {
        Clipboard.write(`${name} - ${id}`)
        Front.showBanner("Copied Author Name - ID")
      } else {
        Clipboard.write(`${name} - ${type} - ${id}`)
        Front.showBanner("Copied Author Name - Type - ID")
      }
    },
  },
]
