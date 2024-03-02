import actions from "./actions.js"
import api from "./api.js"
import util from "./util.js"
import actions from "./actions.js"


const { Clipboard } = api

export default [
  {
    leader: "",
    alias: "A",
    description: "Open video",
    callback: () =>
      util.createHints(
        "*[id='video-title']",
        actions.openAnchor({ newTab: true })
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
        "click"
      ),
  },
  {
    leader: "",
    alias: "Yt",
    description: "Copy YouTube video link for current time",
    callback: () => Clipboard.write(actions.yt.getCurrentTimestampLink()),
  },
  {
    leader: "",
    alias: "Ym",
    description: "Copy YouTube video markdown link for current time",
    callback: () =>
      Clipboard.write(actions.yt.getCurrentTimestampMarkdownLink()),
  },
  {
    leader: "",
    alias: "cl",
    description: "Like And Show Playlist For Current Video",
    callback: () => {
      actions.yt.clickLikeButtonYoutube();
      actions.yt.clickPlaylistButtonYoutube();
    }
  },
  {
    leader: "",
    alias: "cvl",
    description: "Like And Show Playlist For Current Video",
    callback: () => {
      actions.yt.clickLikeButtonYoutube();
    }
  },
  {
    leader: "",
    alias: "cvp",
    description: "Like And Show Playlist For Current Video",
    callback: () => {
      actions.yt.clickPlaylistButtonYoutube();
    }
  },
  {
    leader: "",
    alias: "l",
    description: "Show Playlist",
    callback: () => {
      actions.yt.showPlaylist();
    }
  },

]
