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
    alias: "A",
    description: "Open video",
    callback: () =>
      util.createHints(
        "*[id='video-title']",
        actions.openAnchor({ newTab: true }),
      ),
  },
  {
    leader: "",
    alias: "C",
    description: "Open channel",
    callback: () => util.createHints("*[id='byline']"),
  },
  {
    leader: "",
    alias: "gH",
    description: "Goto homepage",
    callback: () =>
      actions.openLink("https://www.youtube.com/feed/subscriptions?flow=2"),
  },
  {
    leader: "",
    alias: "F",
    description: "Toggle fullscreen",
    callback: () =>
      actions.dispatchMouseEvents(
        document.querySelector("#movie_player.ytp-fullscreen-button"),
        "mousedown",
        "click",
      ),
  },
  {
    leader: "",
    alias: "Yt",
    description: "Copy YouTube video link for current time",
    callback: () => Clipboard.write(webActions.getCurrentTimestampLink()),
  },
  {
    leader: "",
    alias: "Ym",
    description: "Copy YouTube video markdown link for current time",
    callback: () =>
      Clipboard.write(webActions.getCurrentTimestampMarkdownLink()),
  },
  {
    leader: "",
    alias: "cl",
    description: "Like And Show Playlist For Current Video",
    callback: () => {
      webActions.clickLikeButtonYoutube()
      webActions.clickPlaylistButtonYoutube()
    },
  },
  {
    leader: "",
    alias: "cvl",
    description: "Like And Show Playlist For Current Video",
    callback: () => {
      webActions.clickLikeButtonYoutube()
    },
  },
  {
    leader: "",
    alias: "cvp",
    description: "Like And Show Playlist For Current Video",
    callback: () => {
      webActions.clickPlaylistButtonYoutube()
    },
  },
  {
    leader: "",
    alias: "l",
    description: "Show Playlist",
    callback: () => {
      webActions.showPlaylist()
    },
  },
]
