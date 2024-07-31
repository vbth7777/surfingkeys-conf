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
// actions.nh.createViewer = async (idGallery) => {
//   const nhApi = await fetch(
//     "https://nhentai.net/api/gallery/" + idGallery,
//   ).then((res) => res.json())
//   const mediaId = nhApi.media_id
//   const types = nhApi.images.pages.map((e) => {
//     if (e.t == "j") {
//       return "jpg"
//     } else if (e.t == "p") {
//       return "png"
//     }
//   })
//   const images = await (async () => {
//     const urls = (() => {
//       const images = []
//       for (let i = 0; i < types.length; i++) {
//         images.push(
//           `https://i7.nhentai.net/galleries/${mediaId}/${i + 1}.${types[i] || "png"}`,
//         )
//       }
//       return images
//     })()
//     return urls
//   })()
//   const previewImages = await (async () => {
//     const urls = (() => {
//       const images = []
//       for (let i = 0; i < types.length; i++) {
//         images.push(
//           `https://t3.nhentai.net/galleries/${mediaId}/${i + 1}t.${types[i] || "png"}`,
//         )
//       }
//       return images
//     })()
//     return urls
//   })()
//   const infomations = await (async () => {
//     return nhApi.tags
//   })()
//   util.createComicViewer(
//     images,
//     50,
//     previewImages,
//     infomations,
//     (components) => {
//       actions.nh.readArea = components.containerBox
//       actions.nh.removeReaderArea = components.events.removeContainerBox
//       const favoriteMethod = "favorite"
//       const unfavoriteMethod = "unfavorite"
//       const favoriteBtn = components.favoriteBtn
//       favoriteBtn.onclick = () => {
//         const state =
//           favoriteBtn.innerHTML != favoriteMethod
//             ? unfavoriteMethod
//             : favoriteMethod
//         favoriteBtn.disabled = true
//         favoriteBtn.style.opacity = 0.5
//         favoriteBtn.style.cursor = "default"
//
//         fetch("https://nhentai.net/api/gallery/" + idGallery + "/" + state, {
//           method: "post",
//           headers: {
//             "X-Csrftoken": document.cookie.replace(/.+=/g, ""),
//           },
//         }).then((res) => {
//           favoriteBtn.innerHTML =
//             favoriteBtn.innerHTML == favoriteMethod
//               ? unfavoriteMethod
//               : favoriteMethod
//           favoriteBtn.disabled = false
//           favoriteBtn.style.opacity = 1
//           favoriteBtn.style.cursor = "pointer"
//         })
//       }
//       //check state favorite
//       fetch("https://nhentai.net/g/" + idGallery)
//         .then((res) => res.text())
//         .then((data) => {
//           const parser = new DOMParser()
//           const dom = parser.parseFromString(data, "text/html")
//           favoriteBtn.innerHTML = dom
//             .querySelector("#favorite")
//             .innerText.toLowerCase()
//             .includes(unfavoriteMethod)
//             ? unfavoriteMethod
//             : favoriteMethod
//         })
//       const server = [3, 5, 7]
//       let formatToggle = false
//       let counter = 0
//
//       let retryCounter = 0
//       let img
//       components.events.imageErrorEvent = (e) => {
//         // if (counter >= 2 && format == 'jpg') {
//         //   return;
//         // }
//         if (retryCounter >= 2) {
//           return
//         }
//
//         img = e.srcElement
//         const changeServer = (serverNumber) => {
//           return img.src.replace(/\/\/i\d+/g, "//i" + serverNumber)
//         }
//         if (counter >= 2) {
//           counter = 0
//         } else {
//           counter++
//         }
//         img.src = changeServer(server[counter])
//         if (counter >= 2) {
//           retryCounter++
//         }
//       }
//       retryCounter = 0
//       counter = 0
//       components.events.previewImageErrorEvent = (e) => {
//         // if (counter >= 2 && format == 'jpg') {
//         //   return;
//         // }
//         if (retryCounter >= 2) {
//           return
//         }
//         const imgTemp = e.srcElement
//         const changeServer = (serverNumber) => {
//           return imgTemp.src.replace(/\/\/t\d+/g, "//t" + serverNumber)
//         }
//         if (counter >= 2) {
//           counter = 0
//         } else {
//           counter++
//         }
//         imgTemp.src = changeServer(server[counter])
//         if (counter >= 2) {
//           retryCounter++
//         }
//       }
//       components.events.imageAddEvent = (img, imgTemp) => {
//         let counter = 0
//         const interval = setInterval(() => {
//           if (img.height > 100) {
//             clearInterval(interval)
//           } else {
//             counter++
//             if (counter >= 5 || img.height == 16) {
//               img.src = img.src.replace(
//                 /\/\/i\d+/g,
//                 "//i" + server[Math.floor(Math.random() * server.length)],
//               )
//             }
//           }
//         }, 1000)
//         let counter2 = 0
//         const interval2 = setInterval(() => {
//           if (imgTemp.height > 100) {
//             clearInterval(interval2)
//           } else {
//             counter2++
//             if (counter2 >= 2) {
//               imgTemp.src = imgTemp.src.replace(
//                 /\/\/t\d+/g,
//                 "//t" + server[Math.floor(Math.random() * server.length)],
//               )
//             }
//           }
//         }, 1000)
//       }
//     },
//   )
// }

actions.nh.createViewer = async (idGallery) => {
  // Fetch gallery data with error handling
  const nhApi = await fetch(`https://nhentai.net/api/gallery/${idGallery}`)
    .then((res) => res.json())
    .catch((error) => {
      console.error("Error fetching gallery data:", error)
      // Handle error gracefully, e.g., display an error message to the user
      return null
    })

  if (!nhApi) {
    return // Abort viewer creation if gallery data is unavailable
  }

  const mediaId = nhApi.media_id
  const types = nhApi.images.pages.map((e) => (e.t === "j" ? "jpg" : "png"))
  const serverList = [3, 5, 7] // Replace with actual server list

  // Generate image URLs with error handling
  const generateImageUrls = (type, isPreview) => {
    const baseUrl = isPreview ? "https://t" : "https://i"
    const serverIndex = Math.floor(Math.random() * serverList.length)
    return `${baseUrl}${serverList[serverIndex]}.nhentai.net/galleries/${mediaId}/${"{index+1}"}.${type}`
  }

  const generateUrls = async (isPreview) => {
    const urls = []
    for (let i = 0; i < types.length; i++) {
      try {
        urls.push(generateImageUrls(types[i], isPreview))
      } catch (error) {
        console.error("Error generating image URLs:", error)
        // Handle error (e.g., retry with different server)
      }
    }
    return urls
  }

  const images = await generateUrls(false)
  const previewImages = await generateUrls(true)

  // Fetch tags
  const infomations = await (async () => {
    return nhApi.tags
  })()

  // Create comic viewer with error handling

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

      const updateFavoriteState = async (newState) => {
        favoriteBtn.innerHTML = newState
        favoriteBtn.disabled = true
        favoriteBtn.style.opacity = 0.5
        favoriteBtn.style.cursor = "default"

        try {
          const response = await fetch(
            `https://nhentai.net/api/gallery/${idGallery}/${newState}`,
            {
              method: "post",
              headers: {
                "X-Csrftoken": document.cookie.replace(/.+=/g, ""),
              },
            },
          )

          if (response.ok) {
            favoriteBtn.disabled = false
            favoriteBtn.style.opacity = 1
            favoriteBtn.style.cursor = "pointer"
          } else {
            console.error("Error updating favorite state:", response.statusText)
            // Handle error gracefully
          }
        } catch (error) {
          console.error("Error updating favorite state:", error)
          // Handle error gracefully
        }
      }

      favoriteBtn.onclick = async () => {
        const currentState = favoriteBtn.innerHTML.toLowerCase()
        const newState =
          currentState === favoriteMethod ? unfavoriteMethod : favoriteMethod
        await updateFavoriteState(newState)
      }

      // Check favorite state securely
      const checkFavoriteState = async () => {
        try {
          const response = await fetch(`https://nhentai.net/g/${idGallery}`)
          if (!response.ok) {
            console.error("Error fetching favorite state:", response.statusText)
            return
          }

          const data = await response.text()
          const parser = new DOMParser()
          const dom = parser.parseFromString(data, "text/html")

          const favoriteElement = dom.querySelector("#favorite")
          if (
            favoriteElement &&
            favoriteElement.innerText.toLowerCase().includes(unfavoriteMethod)
          ) {
            favoriteBtn.innerHTML = unfavoriteMethod
          } else {
            favoriteBtn.innerHTML = favoriteMethod
          }
        } catch (error) {
          console.error("Error checking favorite state:", error)
        }
      }

      checkFavoriteState()

      let formatToggle = false
      let counter = 0
      let retryCounter = 0

      const handleImageError = (img, changeServer) => {
        if (retryCounter >= 2) {
          return
        }
        img.src = changeServer(img.src)
        if (counter >= 2) {
          retryCounter++
        } else {
          counter++
        }
      }

      components.events.imageErrorEvent = (e) => {
        handleImageError(e.srcElement, (src) =>
          src.replace(/\/\/i\d+/g, "//i" + serverList[counter]),
        )
      }

      components.events.previewImageErrorEvent = (e) => {
        handleImageError(e.srcElement, (src) =>
          src.replace(/\/\/t\d+/g, "//t" + serverList[counter]),
        )
      }

      // Implement image loading optimization using IntersectionObserver (example)
      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target
            if (!img.src) {
              img.src = generateImageUrls(
                img.dataset.type,
                img.dataset.isPreview === "true",
              )
            }
            observer.unobserve(img)
          }
        })
      })

      document
        .querySelectorAll(".comic-viewer__image, .comic-viewer__preview-image")
        .forEach((img) => {
          observer.observe(img)
        })
    },
  )
}
//
export default actions.nh
