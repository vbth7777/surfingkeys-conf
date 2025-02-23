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
    `https://nhentai.net/api/gallery/${idGallery}`,
  ).then((res) => res.json())
  const mediaId = nhApi.media_id
  const types = nhApi.images.pages.map((e) => {
    const hash = {
      j: "jpg",
      p: "png",
      w: "webp",
    }
    for (const key in hash) {
      if (e.t == key) {
        return hash[key]
      }
    }
  })
  let isFavorited = false
  let originalServerNumberTemp = null
  let originalServerNumber = null
  // check state favorite
  await fetch(`https://nhentai.net/g/${idGallery}/`)
    .then((res) => res.text())
    .then((data) => {
      const parser = new DOMParser()
      const dom = parser.parseFromString(data, "text/html")
      originalServerNumberTemp = dom
        .querySelector(
          "#thumbnail-container > div > div:nth-child(1) > a > img",
        )
        .getAttribute("data-src")
        .match(/https:\/\/t(\d)/)[1]
      isFavorited = dom
        .querySelector("#favorite")
        ?.innerText?.toLowerCase()
        ?.includes("unfavorite")
    })
  await fetch(`https://nhentai.net/g/${idGallery}/1/`)
    .then((res) => res.text())
    .then((data) => {
      const parser = new DOMParser()
      const dom = parser.parseFromString(data, "text/html")
      originalServerNumber = dom
        .querySelector("#image-container > a > img")
        .src.match(/https:\/\/i(\d)/)[1]
    })
  const widHei = nhApi.images.pages.map((e) => {
    return { width: e.w, height: e.h }
  })
  const images = await (() => {
    const urls = (async () => {
      const images = []
      for (let i = 0; i < types.length; i++) {
        let url = `https://i${originalServerNumber}.nhentai.net/galleries/${mediaId}/${i + 1}.${types[i] || "png"}`

        images.push({
          url: url,
          width: widHei[i].width,
          height: widHei[i].height,
        })
      }
      return images
    })()
    return urls
  })()
  const previewImages = await (async () => {
    const urls = (() => {
      const images = []
      for (let i = 0; i < types.length; i++) {
        images.push({
          url: `https://t${originalServerNumberTemp}.nhentai.net/galleries/${mediaId}/${i + 1}t.${types[i] || "png"}`,
          width: widHei[i].width,
          height: widHei[i].height,
        })
      }
      return images
    })()
    return urls
  })()
  const infomations = await (async () => nhApi.tags)()
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
      const { favoriteBtn } = components
      favoriteBtn.innerHTML = isFavorited ? unfavoriteMethod : favoriteMethod
      favoriteBtn.onclick = () => {
        const state =
          favoriteBtn.innerHTML != favoriteMethod
            ? unfavoriteMethod
            : favoriteMethod
        favoriteBtn.disabled = true
        favoriteBtn.style.opacity = 0.5
        favoriteBtn.style.cursor = "default"

        fetch(`https://nhentai.net/api/gallery/${idGallery}/${state}`, {
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
      const server = [1, 2, 3, 4, 5, 7]
      const formatToggle = false
      let counter = 0

      let retryCounter = 0
      let img
      let imgTemp
      components.events.imageErrorEvent = (e) => {
        // img.style.position = "absolute"
        // imgTemp.style.position = "relative"
        // // if (counter >= 2 && format == 'jpg') {
        // //   return;
        // // }
        // if (retryCounter >= 2) {
        //   return
        // }
        // img = e.srcElement
        // const changeServer = (serverNumber) => {
        //   return img.src.replace(/\/\/i\d+/g, "//i" + serverNumber)
        // }
        // if (counter >= 2) {
        //   counter = 0
        // } else {
        //   counter++
        // }
        // img.src = changeServer(server[counter])
        // if (counter >= 2) {
        //   retryCounter++
        // }
      }
      retryCounter = 0
      counter = 0
      components.events.previewImageErrorEvent = (e) => {
        return
        imgTemp.style.position = "absolute"
        img.style.position = "relative"
        // if (retryCounter >= 2) {
        //   return
        // }
        // const imgTemp = e.srcElement
        // const changeServer = (serverNumber) => {
        //   return imgTemp.src.replace(/\/\/t\d+/g, "//t" + serverNumber)
        // }
        // if (counter >= 2) {
        //   counter = 0
        // } else {
        //   counter++
        // }
        // imgTemp.src = changeServer(server[counter])
        // if (counter >= 2) {
        //   retryCounter++
        // }
      }
      components.events.imageAddEvent = (img, imgTemp) => {
        let counter2 = 0
        // const interval2 = setInterval(() => {
        //   if (imgTemp.width > 16) {
        //     // if (imgTemp.complete) {
        //     clearInterval(interval2)
        //   } else {
        //     counter2++
        //     if (counter2 >= 2 || imgTemp.height == 16) {
        //       // const currentServer = img.src.match(/\/\/t(\d+)/)[1]
        //       // const newServer = server.indexOf(parseInt(currentServer))
        //       // imgTemp.src = imgTemp.src.replace(
        //       //   /\/\/t\d+/g,
        //       //   `//t${server[newServer == server.length - 1 ? 0 : newServer + 1]}`,
        //       // )
        //       const temp = imgTemp.src
        //       imgTemp.src = imgTemp.src.replace(/t\d/, `t9`)
        //       imgTemp.src = temp
        //     }
        //   }
        // }, 1000)
        let counter = 0
        const interval = setInterval(() => {
          if (img.width > 16) {
            // if (img.complete) {
            clearInterval(interval)
          } else {
            counter++
            if (counter >= 5 || img.height == 16) {
              // const currentServer = img.src.match(/\/\/i(\d+)/)[1]
              // const newServer = server.indexOf(parseInt(currentServer))
              // img.src = img.src.replace(
              //   /\/\/i\d+/g,
              //   `//i${server[newServer == server.length - 1 ? 0 : newServer + 1]}`,
              // )
              const temp = img.src
              img.src = img.src.replace(/t\d/, `t9`)
              img.src = temp
            }
          }
        }, 1000)
      }
    },
    (() => {
      const moreButton = document.createElement("button")
      moreButton.innerHTML = "Change Server"
      moreButton.className = "tth-more-btn"
      moreButton.style.backgroundColor = "#ED2553"
      moreButton.style.border = "none"
      moreButton.style.color = "#fff"
      moreButton.style.fontSize = "1.5rem"
      moreButton.style.fontWeight = "bold"
      moreButton.style.borderRadius = "10px"
      moreButton.style.padding = "0"
      moreButton.style.cursor = "pointer"
      moreButton.style.margin = "10px"
      moreButton.style.padding = "10px"
      moreButton.style.fontSize = "1.4rem"
      moreButton.onclick = () => {
        Array.from(
          document.querySelectorAll(".tth-images-area div > img:nth-child(2)"),
        )
          .filter((e) => !e.complete || e.width == 16)
          .forEach((img) => {
            const page = img.src.match(/galleries\/\d+\/(\d+)\.\w+/)[1]
            fetch(`https://nhentai.net/g/${idGallery}/${page}/`)
              .then((res) => res.text())
              .then((data) => {
                const parser = new DOMParser()
                const dom = parser.parseFromString(data, "text/html")
                const server = dom
                  .querySelector("#image-container > a > img")
                  .src.match(/https:\/\/i(\d)/)[1]
                img.src = img.src.replace(/i\d/, `i${server}`)
              })
          })
      }
      return moreButton
    })(),
  )
}

// actions.nh.createViewer = async (idGallery) => {
//   // Fetch gallery data in one request
//   const nhApi = await fetch(
//     `https://nhentai.net/api/gallery/${idGallery}`,
//   ).then((res) => res.json())
//
//   const mediaId = nhApi.media_id
//   const types = nhApi.images.pages.map((e) => (e.t === "j" ? "jpg" : "png"))
//
//   // Generate image and preview image URLs in a single loop
//   const urls = []
//   const previewUrls = []
//   for (let i = 0; i < types.length; i++) {
//     const type = types[i]
//     urls.push(`https://i7.nhentai.net/galleries/${mediaId}/${i + 1}.${type}`)
//     previewUrls.push(
//       `https://t3.nhentai.net/galleries/${mediaId}/${i + 1}t.${type}`,
//     )
//   }
//
//   const infomations = nhApi.tags
//
//   util.createComicViewer(
//     urls,
//     50,
//     previewUrls,
//     infomations,
//     async (components) => {
//       actions.nh.readArea = components.containerBox
//       actions.nh.removeReaderArea = components.events.removeContainerBox
//
//       const favoriteMethod = "favorite"
//       const unfavoriteMethod = "unfavorite"
//       const favoriteBtn = components.favoriteBtn
//
//       favoriteBtn.onclick = async () => {
//         const state =
//           favoriteBtn.innerHTML === favoriteMethod
//             ? unfavoriteMethod
//             : favoriteMethod
//         favoriteBtn.disabled = true
//         favoriteBtn.style.opacity = 0.5
//         favoriteBtn.style.cursor = "default"
//
//         await fetch(`https://nhentai.net/api/gallery/${idGallery}/${state}`, {
//           method: "post",
//           headers: {
//             "X-Csrftoken": document.cookie.replace(/.+=/g, ""),
//           },
//         })
//
//         favoriteBtn.innerHTML =
//           favoriteBtn.innerHTML === favoriteMethod
//             ? unfavoriteMethod
//             : favoriteMethod
//         favoriteBtn.disabled = false
//         favoriteBtn.style.opacity = 1
//         favoriteBtn.style.cursor = "pointer"
//       }
//
//       // Check favorite state efficiently
//       const response = await fetch(`https://nhentai.net/g/${idGallery}`)
//       const data = await response.text()
//       const isFavorited = data.includes(unfavoriteMethod.toLowerCase())
//       favoriteBtn.innerHTML = isFavorited ? unfavoriteMethod : favoriteMethod
//
//       const server = [3, 5, 7]
//       let formatToggle = false
//       let counter = 0
//       let retryCounter = 0
//
//       const handleImageError = (e) => {
//         if (retryCounter >= 2) return
//
//         const img = e.srcElement
//         const changeServer = (serverNumber) =>
//           img.src.replace(/\/\/i\d+/g, `//i${serverNumber}`)
//
//         if (counter >= 2) {
//           counter = 0
//         } else {
//           counter++
//         }
//
//         img.src = changeServer(server[counter])
//         retryCounter++
//       }
//
//       components.events.imageErrorEvent = handleImageError
//       components.events.previewImageErrorEvent = handleImageError
//
//       const handleImageAdd = (img, imgTemp) => {
//         const interval = setInterval(() => {
//           if (img.height > 100) {
//             clearInterval(interval)
//           } else {
//             counter++
//             if (counter >= 5 || img.height === 16) {
//               img.src = img.src.replace(
//                 /\/\/i\d+/g,
//                 `//i${server[Math.floor(Math.random() * server.length)]}`,
//               )
//             }
//           }
//         }, 1000)
//
//         const interval2 = setInterval(() => {
//           if (imgTemp.height > 100) {
//             clearInterval(interval2)
//           } else {
//             counter++
//             if (counter >= 2) {
//               imgTemp.src = imgTemp.src.replace(
//                 /\/\/t\d+/g,
//                 `//t${server[Math.floor(Math.random() * server.length)]}`,
//               )
//             }
//           }
//         }, 1000)
//       }
//
//       components.events.imageAddEvent = handleImageAdd
//     },
//   )
// }
// actions.nh.createViewer = async (idGallery) => {
//   // Fetch gallery data in one request
//   const nhApi = await fetch(
//     `https://nhentai.net/api/gallery/${idGallery}`,
//   ).then((res) => res.json())
//
//   const mediaId = nhApi.media_id
//   const types = nhApi.images.pages.map((e) => (e.t === "j" ? "jpg" : "png"))
//
//   // Generate image and preview image URLs efficiently using `map`
//   const urls = types.map(
//     (type, i) => `https://i3.nhentai.net/galleries/${mediaId}/${i + 1}.${type}`,
//   )
//   const previewUrls = types.map(
//     (type, i) =>
//       `https://t3.nhentai.net/galleries/${mediaId}/${i + 1}t.${type}`,
//   )
//
//   const informations = nhApi.tags
//
//   util.createComicViewer(
//     urls,
//     50,
//     previewUrls,
//     informations,
//     async (components) => {
//       actions.nh.readArea = components.containerBox
//       actions.nh.removeReaderArea = components.events.removeContainerBox
//
//       const favoriteMethod = "favorite"
//       const unfavoriteMethod = "unfavorite"
//       const favoriteBtn = components.favoriteBtn
//
//       favoriteBtn.onclick = async () => {
//         const state =
//           favoriteBtn.innerHTML === favoriteMethod
//             ? unfavoriteMethod
//             : favoriteMethod
//
//         favoriteBtn.disabled = true
//         favoriteBtn.style.opacity = 0.5
//         favoriteBtn.style.cursor = "default"
//
//         await fetch(`https://nhentai.net/api/gallery/${idGallery}/${state}`, {
//           method: "post",
//           headers: {
//             "X-Csrftoken": document.cookie.replace(/.+=/g, ""),
//           },
//         })
//
//         favoriteBtn.innerHTML = state
//         favoriteBtn.disabled = false
//         favoriteBtn.style.opacity = 1
//         favoriteBtn.style.cursor = "pointer"
//       }
//
//       // Check favorite state efficiently
//       const response = await fetch(`https://nhentai.net/g/${idGallery}`)
//       const data = await response.text()
//       const isFavorited = data.includes(unfavoriteMethod.toLowerCase())
//       favoriteBtn.innerHTML = isFavorited ? unfavoriteMethod : favoriteMethod
//
//       const server = [3, 5, 7]
//       let retryCounter = 0
//
//       const handleImageError = (e) => {
//         if (retryCounter >= 2) return
//
//         const img = e.target // Use e.target instead of e.srcElement for better compatibility
//         retryCounter++
//         img.src = img.src.replace(
//           /\/\/i\d+/,
//           `//i${server[Math.floor(Math.random() * server.length)]}`,
//         )
//       }
//
//       components.events.imageErrorEvent = handleImageError
//       components.events.previewImageErrorEvent = handleImageError
//
//       // const handleImageAdd = (img, imgTemp) => {
//       //   let counter = 0
//       //
//       //   const retryImageLoad = (imgElement, serverPrefix, maxRetries) => {
//       //     const interval = setInterval(() => {
//       //       if (imgElement.height > 100 || counter >= maxRetries) {
//       //         clearInterval(interval)
//       //       } else {
//       //         counter++
//       //         imgElement.src = imgElement.src.replace(
//       //           new RegExp(`//${serverPrefix}\\d+`),
//       //           `//${serverPrefix}${server[Math.floor(Math.random() * server.length)]}`,
//       //         )
//       //       }
//       //     }, 1000)
//       //   }
//       //
//       //   retryImageLoad(img, "i", 5)
//       //   retryImageLoad(imgTemp, "t", 2)
//       // }
//       const handleImageAdd = (img, isPreview) => {
//         let counter = 0
//         const maxRetries = isPreview ? 2 : 5
//         const serverPrefix = isPreview ? "t" : "i"
//
//         const retryImageLoad = (imgElement) => {
//           const interval = setInterval(() => {
//             if (imgElement.complete || counter >= maxRetries) {
//               clearInterval(interval)
//             } else {
//               counter++
//               imgElement.src = imgElement.src.replace(
//                 new RegExp(`//${serverPrefix}\\d+`),
//                 `//${serverPrefix}${server[Math.floor(Math.random() * server.length)]}`,
//               )
//             }
//           }, 2000) // Increased interval to 2 seconds
//         }
//
//         retryImageLoad(img)
//       }
//
//       components.events.imageAddEvent = handleImageAdd
//     },
//   )
// }

export default actions.nh
