import ghReservedNames from "github-reserved-names"

import api from "../../api.js"
import priv from "../../conf.priv.js"
import util from "../../util.js"
import actions from "../global/actions.js"

const { tabOpenLink, Front, Hints, Normal, RUNTIME } = api

actions.or = {}
actions.or.openCurrentVideoWithIwara = () => {
  try {
    const id = document
      .querySelector('[href*="https://ecchi.iwara"]')
      .href.match(/(video|videos)\/.+/i)[0]
      .replace(/(.+\/)/, "")
    if (id) {
      window.open("https://iwara.tv/video/" + id)
      return
    }
  } catch {
    window.open(document.querySelector('[href*="iwara.tv/video"]').href)
  }
}
actions.or.openWithIwara = () => {
  util.createHints("*[href*='erommdtube.com/movies/']", function (element) {
    actions.getDOM(element.href, function (s, res) {
      if (s) {
        api.Front.showPopup("Error:" + s)
        return
      }
      const doc = res
      window.open(doc.querySelector('[href*="iwara.tv"]').href)
    })
  })
}
actions.or.openWithMMDFans = () => {
  util.createHints("*[href*='erommdtube.com/movies/']", function (element) {
    const title = element.querySelector(".main__list-title").innerText
    actions.iw.GoToMmdFansVid(title)
  })
}
actions.or.openCurrentVideoWithMMDFans = () => {
  const title = document.querySelector("h1.show__h1").innerText
  actions.iw.GoToMmdFansVid(title)
}
actions.or.openCurrentVideoWithMPV = () => {
  const url = document.querySelector('[href*="iwara.tv"]').href
  actions.iw.copyAndPlayVideo(actions.iw.getIdIwara(url))
}
actions.or.openVideoWithMPV = () => {
  util.createHints("*[href*='erommdtube.com/movies/']", function (element) {
    actions.getDOM(element.href, function (s, res) {
      const url = res.querySelector('[href*="iwara.tv"]').href
      actions.iw.copyAndPlayVideo(actions.iw.getIdIwara(url))
    })
  })
}

export default actions.or
