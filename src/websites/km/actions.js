import ghReservedNames from "github-reserved-names"

import api from "../../api.js"
import priv from "../../conf.priv.js"
import util from "../../util.js"
import actions from "../global/actions.js"

const { tabOpenLink, Front, Hints, Normal, RUNTIME } = api

const webActions = {}

webActions.km = {}
webActions.km.getAuthorInfo = () => {
  const author = document.querySelector(
    "html body div#root div.content-wrapper.shifted main#main.main section.site-section.site-section--user header.user-header div.user-header__info h1#user-header__info-top.user-header__name a.user-header__profile",
  )
  const name = author.innerText.trim()
  const type = author.href?.match(/(\w+)\/creator/g)[0]?.replace("/creator", "")
  const id = author.href?.match(/creator\/(\d+)/g)[0]?.replace("creator/", "")
  return {
    name,
    author,
    type,
    id,
  }
}

export default webActions.km
