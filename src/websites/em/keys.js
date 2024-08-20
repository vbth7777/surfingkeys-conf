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
    alias: "ci",
    description: "Open Current Video With Iwara",
    callback: () => {
      webActions.openCurrentVideoWithIwara()
    },
  },
  {
    alias: "i",
    description: "Open With Iwara",
    callback: () => {
      webActions.openWithIwara()
    },
  },
  {
    alias: "cf",
    description: "Open Current Video With MMDFans",
    callback: () => {
      webActions.openCurrentVideoWithMMDFans()
    },
  },
  {
    alias: "f",
    description: "Open With MMDFans",
    callback: () => {
      webActions.openWithMMDFans()
    },
  },
  {
    alias: "cm",
    description: "Open Current Video With MPV",
    callback: () => {
      webActions.openCurrentVideoWithMPV()
    },
  },
  {
    leader: "",
    alias: PLAY_VIDEO_MPV_ALIAS,
    description: "Open With MPV",
    callback: () => {
      webActions.openVideoWithMPV()
    },
  },
]
