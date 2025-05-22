import actions from "../global/actions.js"
import webActions from "./actions.js"
import api from "../../api.js"
import help from "../../help.js"
import priv from "../../conf.priv.js"
import util from "../../util.js"
import { PLAY_VIDEO_MPV_ALIAS } from "../global/constants.js"
export default [
  {
    alias: "h",
    leader: "",
    description: "Prev Page",
    callback: () => {
      document.querySelector(".tth-prev-btn").click()
    },
  },
]
