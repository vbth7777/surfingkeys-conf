import ghReservedNames from "github-reserved-names"

import api from "../../api.js"
import priv from "../../conf.priv.js"
import util from "../../util.js"
import actions from "../global/actions.js"

const { tabOpenLink, Front, Hints, Normal, RUNTIME } = api

actions.yt = {}
actions.yt.getCurrentTimestamp = () => {
  const [ss, mm, hh = 0] = document
    .querySelector("#ytd-player .ytp-time-current")
    ?.innerText?.split(":")
    ?.reverse()
    ?.map(Number) ?? [0, 0, 0]
  return [ss, mm, hh]
}

actions.yt.getCurrentTimestampSeconds = () => {
  const [ss, mm, hh] = actions.yt.getCurrentTimestamp()
  return hh * 60 * 60 + mm * 60 + ss
}

actions.yt.getCurrentTimestampHuman = () => {
  const [ss, mm, hh] = actions.yt.getCurrentTimestamp()
  const pad = (n) => `${n}`.padStart(2, "0")
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`
}

actions.yt.getShortLink = () => {
  const params = new URLSearchParams(window.location.search)
  return `https://youtu.be/${params.get("v")}`
}

actions.yt.getCurrentTimestampLink = () =>
  `${actions.yt.getShortLink()}?t=${actions.yt.getCurrentTimestampSeconds()}`

actions.yt.getCurrentTimestampMarkdownLink = () =>
  actions.getMarkdownLink({
    title: `${
      document.querySelector("#ytd-player .ytp-title").innerText
    } @ ${actions.yt.getCurrentTimestampHuman()} - YouTube`,
    href: actions.yt.getCurrentTimestampLink(),
  })
actions.yt.clickLikeButtonYoutube = () => {
  document
    .querySelector(
      "#top-level-buttons-computed > segmented-like-dislike-button-view-model > yt-smartimation > div > div > like-button-view-model > toggle-button-view-model > button > yt-touch-feedback-shape > div > div.yt-spec-touch-feedback-shape__fill",
    )
    .click()
}
actions.yt.checkSaveButtonTextOnYoutube = (text) => {
  return (
    text.indexOf("lưu") != -1 ||
    text.indexOf("save") != -1 ||
    text.indexOf("playlist") != -1 ||
    text.indexOf("danh sách phát") != -1
  )
}
actions.yt.clickPlaylistButtonYoutube = async () => {
  document.querySelector("#button-shape > button").click()
  await util.sleep(1000)
  let btns = document.querySelectorAll(
    ".ytd-popup-container ytd-menu-service-item-renderer",
  )
  for (let btn of btns) {
    const text = btn.innerText.trim().toLowerCase()
    if (actions.yt.checkSaveButtonTextOnYoutube(text)) {
      btn.click()
      break
    }
  }
  let outBtns = Array.from(
    document.querySelectorAll(
      "#flexible-item-buttons > ytd-button-renderer button",
    ),
  )
  for (let btn of outBtns) {
    const text = btn.ariaLabel.trim().toLowerCase()
    if (actions.yt.checkSaveButtonTextOnYoutube(text)) {
      btn.click()
      break
    }
  }
}
actions.yt.showPlaylist = () => {
  util.createHints("#dismissible", async (el) => {
    const menuBtn = el.querySelector("#menu button")
    if (!menuBtn) {
      return
    }
    menuBtn.click()
    await util.sleep(100)
    document
      .querySelector("#items > ytd-menu-service-item-renderer:nth-child(3)")
      .click()
  })
}
export default actions.yt
