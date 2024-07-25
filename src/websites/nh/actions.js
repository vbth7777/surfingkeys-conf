import ghReservedNames from "github-reserved-names"

import api from "../../api.js"
import priv from "../../conf.priv.js"
import util from "../../util.js"
import actions from "../global/actions.js"

const { tabOpenLink, Front, Hints, Normal, RUNTIME } = api

actions.nh = {
  imagesPerPageForViewer: 50,
  removeReaderArea: null,
}
actions.nh.getIdFromUrl = (url) => {
  const match = url.match(/nhentai\.net\/g\/(\d+)/)
  return match ? match[1] : null
}
actions.nh.createViewer = async (idGallery) => {
  const nhApi = await fetch(
    "https://nhentai.net/api/gallery/" + idGallery,
  ).then((res) => res.json())
  const mediaId = nhApi.media_id
  const types = nhApi.images.pages.map((e) => {
    if (e.t == "j") {
      return "jpg"
    } else if (e.t == "p") {
      return "png"
    }
  })
  const images = await (async () => {
    const urls = (() => {
      const images = []
      for (let i = 0; i < types.length; i++) {
        images.push(
          `https://i7.nhentai.net/galleries/${mediaId}/${i + 1}.${types[i] || "png"}`,
        )
      }
      return images
    })()
    return urls
  })()
  const previewImages = await (async () => {
    const urls = (() => {
      const images = []
      for (let i = 0; i < types.length; i++) {
        images.push(
          `https://t3.nhentai.net/galleries/${mediaId}/${i + 1}t.${types[i] || "png"}`,
        )
      }
      return images
    })()
    return urls
  })()
  const infomations = await (async () => {
    return nhApi.tags
  })()
  util.createComicViewer(
    images,
    50,
    previewImages,
    infomations,
    (components) => {
      actions.nh.readArea = components.containerBox
      actions.nh.removeReaderArea = components.events.removeContainerBox
      const favoriteMethod = "favorite"
      const unfavoriteMethod = "unfavorite"
      const favoriteBtn = components.favoriteBtn
      favoriteBtn.onclick = () => {
        const state =
          favoriteBtn.innerHTML != favoriteMethod
            ? unfavoriteMethod
            : favoriteMethod
        favoriteBtn.disabled = true
        favoriteBtn.style.opacity = 0.5
        favoriteBtn.style.cursor = "default"

        fetch("https://nhentai.net/api/gallery/" + idGallery + "/" + state, {
          method: "post",
          headers: {
            "X-Csrftoken": document.cookie.replace(/.+=/g, ""),
          },
        }).then((res) => {
          favoriteBtn.innerHTML =
            favoriteBtn.innerHTML == favoriteMethod
              ? unfavoriteMethod
              : favoriteMethod
          favoriteBtn.disabled = false
          favoriteBtn.style.opacity = 1
          favoriteBtn.style.cursor = "pointer"
        })
      }
      //check state favorite
      fetch("https://nhentai.net/g/" + idGallery)
        .then((res) => res.text())
        .then((data) => {
          const parser = new DOMParser()
          const dom = parser.parseFromString(data, "text/html")
          favoriteBtn.innerHTML = dom
            .querySelector("#favorite")
            .innerText.toLowerCase()
            .includes(unfavoriteMethod)
            ? unfavoriteMethod
            : favoriteMethod
        })
      const server = [3, 5, 7]
      let formatToggle = false
      let counter = 0

      let retryCounter = 0
      let img
      components.events.imageErrorEvent = (e) => {
        // if (counter >= 2 && format == 'jpg') {
        //   return;
        // }
        if (retryCounter >= 2) {
          return
        }

        img = e.srcElement
        const changeServer = (serverNumber) => {
          return img.src.replace(/\/\/i\d+/g, "//i" + serverNumber)
        }
        if (counter >= 2) {
          counter = 0
        } else {
          counter++
        }
        img.src = changeServer(server[counter])
        if (counter >= 2) {
          retryCounter++
        }
      }
      retryCounter = 0
      counter = 0
      components.events.previewImageErrorEvent = (e) => {
        // if (counter >= 2 && format == 'jpg') {
        //   return;
        // }
        if (retryCounter >= 2) {
          return
        }
        const imgTemp = e.srcElement
        const changeServer = (serverNumber) => {
          return imgTemp.src.replace(/\/\/t\d+/g, "//t" + serverNumber)
        }
        if (counter >= 2) {
          counter = 0
        } else {
          counter++
        }
        imgTemp.src = changeServer(server[counter])
        if (counter >= 2) {
          retryCounter++
        }
      }
      components.events.imageAddEvent = (img, imgTemp) => {
        let counter = 0
        const interval = setInterval(() => {
          if (img.height > 100) {
            clearInterval(interval)
          } else {
            counter++
            if (counter >= 5 || img.height == 16) {
              img.src = img.src.replace(
                /\/\/i\d+/g,
                "//i" + server[Math.floor(Math.random() * server.length)],
              )
            }
          }
        }, 1000)
        let counter2 = 0
        const interval2 = setInterval(() => {
          if (imgTemp.height > 100) {
            clearInterval(interval2)
          } else {
            counter2++
            if (counter2 >= 2) {
              imgTemp.src = imgTemp.src.replace(
                /\/\/t\d+/g,
                "//t" + server[Math.floor(Math.random() * server.length)],
              )
            }
          }
        }, 1000)
      }
    },
  )
}
export default actions.nh
