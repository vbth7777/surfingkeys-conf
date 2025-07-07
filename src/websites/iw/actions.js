import ghReservedNames from "github-reserved-names"

import api from "../../api.js"
import priv from "../../conf.priv.js"
import util from "../../util.js"
import actions from "../global/actions.js"

const { tabOpenLink, Front, Hints, Normal, RUNTIME } = api

const changeColorForPlayingUrl = (id) => {
  Array.from(document.querySelectorAll("div.videoTeaser>a")).forEach((el) => {
    if (el.href.includes(id)) {
      el.parentElement.style.backgroundColor = "blue"
      el.parentElement.classList.add("playing")
    }
  })
}

async function autostart() {
  if (window.location.href.includes("iwara.tv")) {
    while (true) {
      if (document.querySelector(".playing")) {
        await util.sleep(1000)
        continue
      }
      const urls = await util.getJSON("http://localhost:9789/running-urls")
      console.log(urls)
      for (const url of urls) {
        const id = actions.iw.getIdIwara(url)
        // changeColorForPlayingUrl(id)
        if (!actions.iw.getSocket()) {
          actions.iw.setSocket()
          const socket = actions.iw.getSocket()
          const handleOpen = () => {
            changeColorForPlayingUrl(id)
            socket.removeEventListener("open", handleOpen)
          }
          socket.addEventListener("open", handleOpen)
        } else {
          changeColorForPlayingUrl(id)
        }
      }
      await util.sleep(1000)
    }
  }
}
autostart()

actions.iw = {
  socket: null,
  vidResolution: ["Source", "540p", "360p"],
}
actions.iw.getSocket = () => actions.iw.socket
actions.iw.setSocket = () => {
  actions.iw.socket = new WebSocket("ws://localhost:9790")
  actions.iw.socket.addEventListener("message", (res) => {
    const data = JSON.parse(res.data)
    if (data.isContinue) {
      const video = document.querySelector(
        `[href*="${actions.iw.getIdIwara(data.url)}"]`,
      )
      if (video) {
        video.parentElement.style.backgroundColor = ""
      }
      // Array.from(document.querySelectorAll('div.videoTeaser')).forEach(el => {
      //   if (el.querySelector('a').href.includes(data.url))
      //     el.style.backgroundColor = ''
      // })
    }
  })
}

actions.iw.getIdIwara = (url) => {
  const match = url.match(/iwara.tv\/video\/([^\/]+)/)
  return match ? match[1] : url
}
actions.iw.getJSON = (url, callback, xVersionHeader = "", headers = {}) => {
  if (xVersionHeader) {
    headers = {
      ...headers,
      "x-version": xVersionHeader,
    }
  }
  fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.token}`,
      ...headers,
    },
  })
    .then((response) => response.json())
    .then((data) => callback(null, data))
}
actions.iw.createCheckBoxes = (checkboxes, isIwara) => {
  // Create container element
  const container = document.createElement("div")
  container.style.display = "flex"
  container.style.justifyContent = "center"
  container.style.alignItems = "center"
  container.style.height = "100vh"
  container.style.background = "rgba(0, 0, 0, 0.5)"
  container.style.backdropFilter = "blur(5px)"
  container.style.position = "fixed"
  container.style.left = "0"
  container.style.top = "0"
  container.style.width = "100%"
  container.style.zIndex = "9999"
  const handleEsc = (e) => {
    if (e.key == "Escape") {
      container.remove()
      document.removeEventListener("keyup", handleEsc)
    }
  }
  document.addEventListener("keyup", handleEsc)

  // Create black box
  const blackBox = document.createElement("div")
  blackBox.style.backgroundColor = "black"
  blackBox.style.color = "white"
  blackBox.style.padding = "20px"
  blackBox.style.borderRadius = "10px" // Adjust the border radius here
  blackBox.style.width = "300px"
  blackBox.style.position = "relative"

  // Create close button
  const closeButton = document.createElement("button")
  closeButton.innerHTML = "&times;"
  closeButton.style.position = "absolute"
  closeButton.style.top = "10px"
  closeButton.style.right = "10px"
  closeButton.style.border = "none"
  closeButton.style.backgroundColor = "transparent"
  closeButton.style.color = "white"
  closeButton.style.fontSize = "24px"
  closeButton.style.fontWeight = "bold"
  closeButton.style.cursor = "pointer"
  closeButton.style.width = "30px"
  closeButton.style.height = "30px"
  closeButton.style.borderRadius = "50%"
  closeButton.style.display = "flex"
  closeButton.style.justifyContent = "center"
  closeButton.style.alignItems = "center"
  closeButton.style.outline = "none"
  closeButton.style.boxShadow = "0 0 3px rgba(0, 0, 0, 0.3)"
  closeButton.style.transition = "background-color 0.3s"

  // Event listener for close button
  closeButton.addEventListener("click", () => {
    container.remove()
  })

  // Mouse hover effect for close button
  closeButton.addEventListener("mouseenter", () => {
    closeButton.style.backgroundColor = "rgba(255, 255, 255, 0.3)"
  })

  closeButton.addEventListener("mouseleave", () => {
    closeButton.style.backgroundColor = "transparent"
  })

  // Append close button to the black box
  blackBox.appendChild(closeButton)

  // Create checkboxes

  checkboxes.forEach(async (obj) => {
    let checkboxText = ""
    const checkboxContainer = document.createElement("div")
    checkboxContainer.style.display = "flex"
    checkboxContainer.style.alignItems = "center"
    if (isIwara) {
      checkboxText = obj.title
    }

    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.id = checkboxText
    checkbox.checked = false
    if (isIwara && obj.isAdded) {
      checkbox.checked = true
    }
    if (isIwara) {
      checkboxContainer.addEventListener("mousedown", async () => {
        const method = checkbox.checked ? "delete" : "post"
        const authorization = `Bearer ${localStorage.accessToken}`
        console.log("TESTING: ", method, " ", authorization)
        fetch(`https://api.iwara.tv/video/${obj.idVideo}/like`, {
          method,
          headers: {
            Authorization: authorization,
          },
        }).then(() => {
          fetch(
            `https://api.iwara.tv/playlist/${obj.idPlaylist}/${obj.idVideo}`,
            {
              method,
              headers: {
                Authorization: authorization,
              },
            },
          )
        })
      })
    }
    const label = document.createElement("label")
    label.setAttribute("for", checkboxText)
    label.textContent = checkboxText

    checkboxContainer.appendChild(checkbox)
    checkboxContainer.appendChild(label)

    blackBox.appendChild(checkboxContainer)
  })

  // Append black box to the container
  container.appendChild(blackBox)

  // Add the container to the body
  document.body.appendChild(container)
}
actions.iw.getAccessTokenFromIwara = async () =>
  await fetch("https://api.iwara.tv/user/token", {
    method: "post",
    headers: {
      Authorization: `Bearer ${localStorage.token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => data.accessToken)

actions.iw.copyAndPlayVideo = async (id, index = 0, isPlayWithMpv = true) => {
  const getFileId = (url) =>
    url.match(/file\/.+\?/g)[0].replace(/file\/|\?/g, "")
  const getExpire = (url) =>
    url.match("expires=.+&")[0].replace(/expires=|&/g, "")
  if (!actions.iw.getSocket()) {
    actions.iw.setSocket()
    const socket = actions.iw.getSocket()
    const handleOpen = () => {
      changeColorForPlayingUrl(id)
      socket.removeEventListener("open", handleOpen)
    }
    socket.addEventListener("open", handleOpen)
  } else {
    changeColorForPlayingUrl(id)
  }

  const urlVideo = `https://www.iwara.tv/video/${id}`
  // api.Clipboard.write(urlVideo);
  await util.playWithMpv(urlVideo, null, localStorage.accessToken)
  actions.iw.getJSON(
    `https://api.iwara.tv/video/${id}`,
    async (status, res) => {
      if (status) {
        api.Front.showBanner("Error: ", status)
        return
      }
      if (
        res.message &&
        (res?.message?.trim()?.toLowerCase()?.includes("notfound") ||
          res?.message?.trim()?.toLowerCase()?.includes("private"))
      ) {
        api.Front.showPopup(`${res.message} for ${id}`)
        api.Clipboard.write(`https://www.iwara.tv/${id}`)
        return
      }
      if (res.message) {
        actions.iw.copyAndPlayVideo(id, index, isPlayWithMpv)
        return
      }
      if (res.embedUrl && !res.fileUrl) {
        api.Clipboard.write(res.embedUrl)
        return
      }
      const { fileUrl } = res
      const fileId = getFileId(fileUrl)
      if (!fileId || !fileUrl) {
        api.Front.showPopup("Not found requrement")
        return
      }
      // console.log((fileId + '_' + getExpire(fileUrl) + '_5nFp9kmbNnHdAFhaqMvt'))
      actions.iw.getJSON(
        fileUrl,
        (status2, res2) => {
          const json = res2
          // console.log(json)
          let i = json.length - 1
          for (let j = 0; j < json.length; j++) {
            if (
              actions.iw.vidResolution[index]
                .toLowerCase()
                .indexOf(json[j].name.toLowerCase()) != -1
            ) {
              i = j
              break
            }
          }
          const uri = `https:${json[i].src.download}`
          api.Clipboard.write(uri)
          if (isPlayWithMpv) {
            api.Front.showBanner("Opening mpv...")
            util.playWithMpv(uri, `https://www.iwara.tv/video/${id}`)
          }
        },
        await util.convertToSHA1(
          `${fileId}_${getExpire(fileUrl)}_5nFp9kmbNnHdAFhaqMvt`,
        ),
      )
    },
  )
}
actions.iw.likeCurrentVideo = (id) => {
  fetch(`https://api.iwara.tv/video/${id}/like`, {
    method: "post",
    headers: {
      Authorization: `Bearer ${localStorage.accessToken}`,
    },
  })
}
actions.iw.showPlaylistMenu = () => {
  util.createHints("*[href*='video/']", async (element) => {
    let checkBoxes = []
    localStorage.accessToken = await actions.iw.getAccessTokenFromIwara()
    const idVideo = actions.iw.getIdIwara(element.href)
    await fetch(`https://api.iwara.tv/light/playlists?id=${idVideo}`, {
      method: "get",
      headers: {
        Authorization: `Bearer ${localStorage.accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        for (const obj of data) {
          checkBoxes = [
            ...checkBoxes,
            {
              idPlaylist: obj.id,
              idVideo,
              isAdded: obj.added,
              title: obj.title,
            },
          ]
        }
      })
    actions.iw.createCheckBoxes(checkBoxes, true)
  })
}
actions.iw.playUrlsInClipboardWithMpv = () => {
  api.Clipboard.read((res) => {
    const urls = res.data.split("\n")
    for (const url of urls) {
      if (url.includes("iwara")) {
        actions.iw.copyAndPlayVideo(
          url.match(/video\/.+(\/)?/)[0].replace(/video\/|\/.+/g, ""),
        )
      } else {
        util.playWithMpv(url)
      }
    }
  })
}
actions.iw.playUrlsOnPageWithMpv = () => {
  let index = 0
  const urls = Array.from(document.querySelectorAll('a[href*="/video/"]'))
    .map((a) => actions.iw.getIdIwara(a.href))
    .filter((item, pos, self) => self.indexOf(item) == pos)
  actions.iw.copyAndPlayVideo(urls[0])
  actions.iw.getSocket().onmessage = (res) => {
    const data = JSON.parse(res.data)
    if (data.isContinue) {
      actions.iw.copyAndPlayVideo(urls[++index])
    } else if (index == urls.length - 1) {
      actions.iw.getSocket().close()
    }
  }
}
actions.iw.GoToMmdFansVid = (title, config) => {
  const authorName = config ? config.authorName : ""
  const page = config ? config.page : 0
  api.Front.showBanner("Searching...")
  let query = ""
  if (authorName) {
    query = encodeURI(
      `https://mmdfans.net/?query=author:${authorName}&order_by=time`,
    )
  } else {
    query = encodeURI(`https://mmdfans.net/?query=${title}`)
  }
  if (page) {
    query += `&page=${page}`
  }
  actions.getDOM(query, (s, res) => {
    if (s) {
      api.Front.showPopup(`Error:${s}`)
      return
    }
    const doc = res
    const videos = doc.querySelectorAll(".mdui-col > a")
    console.log(doc)
    console.log(videos)
    if (!videos || videos.length < 1) {
      const titleBackup = title
      title = title.replace(/ [^ ]*$/, "")
      if (!title || titleBackup == title) {
        api.Front.showPopup("Not found video")
        actions.iw.GoToMmdFansVid(titleBackup, { page: page + 1, authorName })
        return
      }
      api.Front.showBanner(`Not found, searching ${title}`)
      actions.iw.GoToMmdFansVid(title, false)
      return
    }
    let index = 0
    if (videos.length > 1) {
      api.Front.showBanner("Result have above 1 video")
      const vids = Array.from(doc.querySelectorAll(".mdui-grid-tile"))
      for (const i in vids) {
        if (vids[i].innerText.indexOf(title) != -1) {
          index = i
        }
      }
    }

    const openUrl = `https://mmdfans.net/${videos[index].href.match(/mmd\/.+/gi)[0]}`
    console.log(openUrl)
    window.open(openUrl)
  })
}
actions.iw.getVideoTitle = async (id) =>
  await fetch(`https://api.iwara.tv/video/${id}`)
    .then((response) => response.json())
    .then((data) => data.title)
export default actions.iw
