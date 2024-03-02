import util from "./util.js"

const yt = {}

// youtube.com
yt = {}
yt.getCurrentTimestamp = () => {
  const [ss, mm, hh = 0] = document
    .querySelector("#ytd-player .ytp-time-current")
    ?.innerText?.split(":")
    ?.reverse()
    ?.map(Number) ?? [0, 0, 0]
  return [ss, mm, hh]
}

yt.getCurrentTimestampSeconds = () => {
  const [ss, mm, hh] = yt.getCurrentTimestamp()
  return hh * 60 * 60 + mm * 60 + ss
}

yt.getCurrentTimestampHuman = () => {
  const [ss, mm, hh] = yt.getCurrentTimestamp()
  const pad = (n) => `${n}`.padStart(2, "0")
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`
}

yt.getShortLink = () => {
  const params = new URLSearchParams(window.location.search)
  return `https://youtu.be/${params.get("v")}`
}

yt.getCurrentTimestampLink = () =>
  `${yt.getShortLink()}?t=${actions.yt.getCurrentTimestampSeconds()}`

yt.getCurrentTimestampMarkdownLink = () =>
  getMarkdownLink({
    title: `${document.querySelector("#ytd-player .ytp-title").innerText
      } @ ${yt.getCurrentTimestampHuman()} - YouTube`,
    href: yt.getCurrentTimestampLink(),
  })
yt.clickLikeButtonYoutube = () => {
  document.querySelector("#top-level-buttons-computed > segmented-like-dislike-button-view-model > yt-smartimation > div > div > like-button-view-model > toggle-button-view-model > button > yt-touch-feedback-shape > div > div.yt-spec-touch-feedback-shape__fill").click();
}
yt.checkSaveButtonTextOnYoutube = (text) => {
  return text.indexOf('lưu') != -1 || text.indexOf('save') != -1 || text.indexOf('playlist') != -1 || text.indexOf('danh sách phát') != -1
}
yt.clickPlaylistButtonYoutube = async () => {
  document.querySelector("#button-shape > button").click()
  await util.sleep(1000)
  let btns = document.querySelectorAll('.ytd-popup-container ytd-menu-service-item-renderer');
  for (let btn of btns) {
    const text = btn.innerText.trim().toLowerCase()
    if (yt.checkSaveButtonTextOnYoutube(text)) {
      btn.click();
      break;
    }
  }
  let outBtns = Array.from(document.querySelectorAll("#flexible-item-buttons > ytd-button-renderer button"));
  for (let btn of outBtns) {
    const text = btn.ariaLabel.trim().toLowerCase()
    if (yt.checkSaveButtonTextOnYoutube(text)) {
      btn.click();
      break;
    }
  }
}
yt.showPlaylist = () => {
  util.createHints('#dismissible', async (el) => {
    const menuBtn = el.querySelector('#menu button');
    if (!menuBtn) {
      return;
    }
    menuBtn.click();
    await util.sleep(100);
    document.querySelector("#items > ytd-menu-service-item-renderer:nth-child(3)").click()
  })
}

export default yt;
