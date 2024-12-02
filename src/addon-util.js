import { html } from "uhtml"
import DOMPurify from "dompurify"

import api from "./api.js"

const { Hints, RUNTIME } = api
Hints.style(
  "font-family: Arial;background: #fff;border-color: #000; color: #000; font-size:12px;",
)
const util = {}
util.convertToSHA1 = async (str) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest("SHA-1", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}
util.playWithMpv = (url, pageUrl = null, accessToken = null) => {
  Front.showBanner(`Opening with mpv (${url})...`)
  fetch("http://localhost:9789", {
    method: "post",
    body: new URLSearchParams({ url, pageUrl, accessToken }),
  }).catch((err) => console.error(err))
}
util.playAsyncWithMpv = (url) => {
  fetch("http://localhost:9789/async-run", {
    method: "post",
    body: new URLSearchParams({ url }),
  })
}
util.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
util.createComicViewer = async (
  images,
  imagesPerPage,
  previewImages,
  infomations,
  callback,
) => {
  // infomations = {name, url, type}
  const urls = images
  const events = {
    imageErrorEvent: () => {},
    previewImageErrorEvent: () => {},
    removeContainerBox: () => {},
    imageAddEvent: () => {},
  }

  //   let sizePercent = 50;
  let sizeImage = "50vw"
  let page = 1
  const totalPage = Math.ceil(urls.length / imagesPerPage)
  const containerBox = document.createElement("div")
  containerBox.style.position = "fixed"
  containerBox.style.top = "0"
  containerBox.style.left = "0"
  containerBox.style.right = "0"
  containerBox.style.bottom = "0"
  containerBox.style.borderRadius = "10px"
  containerBox.style.margin = "20px"
  containerBox.style.backgroundColor = "#000"
  containerBox.style.float = "left"
  containerBox.style.zIndex = "9999"
  containerBox.addEventListener("close", () => {})
  const removeContainerBox = () => {
    document.body.style.overflow = "auto"
    containerBox.remove()
  }
  events.removeContainerBox = removeContainerBox

  const closeBtn = document.createElement("button")
  closeBtn.style.position = "absolute"
  closeBtn.style.top = "0"
  closeBtn.style.right = "0"
  closeBtn.innerHTML = "×"
  closeBtn.style.backgroundColor = "rgba(0,0,0,0.1)"
  closeBtn.style.border = "none"
  closeBtn.style.color = "#fff"
  closeBtn.style.fontSize = "1.5rem"
  closeBtn.style.fontWeight = "bold"
  closeBtn.style.borderRadius = "50%"
  closeBtn.style.width = "2rem"
  closeBtn.style.height = "2rem"
  closeBtn.style.padding = "0"
  closeBtn.style.cursor = "pointer"
  closeBtn.style.margin = "10px"

  closeBtn.onclick = () => {
    removeContainerBox()
  }
  const infoBox = document.createElement("div")
  infoBox.style.position = "absolute"
  infoBox.style.top = "0"
  infoBox.style.left = "0"
  infoBox.style.display = "flex"
  infoBox.style.flexDirection = "column"
  const favoriteBtn = document.createElement("button")
  favoriteBtn.className = "tth-favorite-btn"
  favoriteBtn.innerHTML = "Loading..."
  favoriteBtn.style.backgroundColor = "#ED2553"
  favoriteBtn.style.border = "none"
  favoriteBtn.style.color = "#fff"
  favoriteBtn.style.fontSize = "1.5rem"
  favoriteBtn.style.fontWeight = "bold"
  favoriteBtn.style.borderRadius = "10px"
  favoriteBtn.style.padding = "0"
  favoriteBtn.style.cursor = "pointer"
  favoriteBtn.style.margin = "10px"
  favoriteBtn.style.padding = "10px"
  favoriteBtn.style.fontSize = "1.4rem"

  const createDetailInfoBox = (str) => {
    const textBox = document.createElement("div")
    textBox.style.padding = "5px"
    textBox.style.margin = "5px"
    textBox.style.border = "2px solid #ccc"
    textBox.style.maxWidth = "200px"
    textBox.style.minWidth = "100px"
    const tags = infomations
    const storagedTags = []
    for (const item of tags) {
      if (item.type == str.toLowerCase()) {
        if (item.name.toLowerCase().includes("neto")) {
          storagedTags.push(item)
          continue
        }
        textBox.innerHTML += `<a href="${item.url}">${item.name}</a>, `
      }
    }
    for (const item of storagedTags) {
      textBox.innerHTML = `<a href="${item.url}" style="color:red;">${item.name}</a>, ${textBox.innerHTML}`
    }
    textBox.innerHTML = `${str}: ${textBox.innerHTML}`
    if (textBox.innerText == `${str}: `) {
      textBox.innerText = `${str}: None`
      textBox.style.cursor = "default"
    } else {
      textBox.innerHTML = textBox.innerHTML.slice(0, -2)
    }
    return textBox
  }
  const artistBox = createDetailInfoBox("artist")
  const groupBox = createDetailInfoBox("group")
  const parodyBox = createDetailInfoBox("parody")
  const tagBox = createDetailInfoBox("tag")
  infoBox.appendChild(favoriteBtn)
  infoBox.appendChild(artistBox)
  infoBox.appendChild(groupBox)
  infoBox.appendChild(parodyBox)
  infoBox.appendChild(tagBox)

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      removeContainerBox()
    }
  })
  const updateTotalPage = () => {
    document.querySelectorAll(".tth-total-page").forEach((el) => {
      el.innerHTML = `${page}/${totalPage}`
    })
  }
  const nextPageHandler = () => {
    if (page < totalPage) {
      imgBox.scrollTop = 0
      page++
      updatePage()
      updateTotalPage()
    }
  }
  const prevPageHandler = () => {
    if (page > 0) {
      imgBox.scrollTop = 0
      page--
      updatePage()
      updateTotalPage()
    }
  }
  const createPagination = () => {
    const pagination = document.createElement("div")
    pagination.style.padding = "10px"
    pagination.style.alignItems = "center"
    pagination.style.color = "#fff"
    pagination.style.fontSize = "1.5rem"
    pagination.style.fontWeight = "bold"
    pagination.style.borderRadius = "10px"
    pagination.style.float = "left"
    pagination.style.display = "flex"
    pagination.style.justifyContent = "center"
    pagination.style.width = "100%"
    const totalPageElement = document.createElement("p")
    totalPageElement.style.margin = "0 10px"
    totalPageElement.className = "tth-total-page"
    totalPageElement.innerHTML = `${page}/${totalPage}`
    const nextBtn = document.createElement("button")
    nextBtn.innerHTML = "Next"
    nextBtn.className = "tth-next-btn"
    nextBtn.onclick = () => {
      nextPageHandler()
    }
    const prevBtn = document.createElement("button")
    prevBtn.innerHTML = "Prev"
    prevBtn.className = "tth-prev-btn"
    prevBtn.onclick = () => {
      prevPageHandler()
    }
    updateTotalPage()
    pagination.appendChild(prevBtn)
    pagination.appendChild(totalPageElement)
    pagination.appendChild(nextBtn)
    return pagination
  }
  const paginationTop = createPagination()
  const paginationBottom = createPagination()
  const imgBox = document.createElement("div")
  imgBox.className = "tth-images-area"
  imgBox.style.position = "relative"
  imgBox.style.width = "100%"
  imgBox.style.height = "100%"
  imgBox.style.overflowY = "auto"
  imgBox.style.display = "flex"
  imgBox.style.alignItems = "center"
  imgBox.style.flexDirection = "column"
  imgBox.style.float = "left"
  imgBox.style.borderRadius = "10px"

  let currentImgView = null
  const isImgInView = (img) => {
    if (!img) {
      return false
    }
    const rect = img.getBoundingClientRect()

    if (rect.y > 0 && rect.y < window.innerHeight) {
      return true
    }
  }

  document.addEventListener("keydown", (e) => {
    const imgs = imgBox.querySelectorAll("img")
    if (!isImgInView(currentImgView)) {
      currentImgView = (() => {
        for (let i = 0; i < imgs.length; i++) {
          if (util.isElementInViewport(imgs[i])) {
            console.log(imgs[i])
            return imgs[i]
          }
        }
      })()
    }
    if (e.key === "ArrowRight") {
      nextPageHandler()
    } else if (e.key === "ArrowLeft") {
      prevPageHandler()
    } else if (e.key === "ArrowDown") {
      //   sizePercent += 10;

      sizeImage =
        Number(sizeImage.replace(/[a-z]+$/, "")) -
        10 +
        sizeImage.match(/[a-z]+$/g)[0]
      Array.from(imgs).forEach((el) => {
        el.style.width = sizeImage // sizePercent + '%';
      })
      currentImgView.scrollIntoView()
    } else if (e.key === "ArrowUp") {
      //   sizePercent -= 10;
      sizeImage =
        Number(sizeImage.replace(/[a-z]+$/, "")) +
        10 +
        sizeImage.match(/[a-z]+$/g)[0]
      Array.from(imgs).forEach((el) => {
        el.style.width = sizeImage // sizePercent + '%';
      })
      currentImgView.scrollIntoView()
    }
  })
  const updateImgBox = () => {
    imgBox.innerHTML = ""
    const imagesNumber = imagesPerPage * (page - 1)
    imgBox.appendChild(paginationTop)
    for (let i = 0; i < imagesPerPage; i++) {
      if (imagesNumber + i >= urls.length) {
        break
      }
      const div = document.createElement("div")
      div.style.position = "relative"

      const img = document.createElement("img")
      img.src = urls[imagesNumber + i]
      img.style.position = "absolute"
      img.style.top = "0"
      img.style.left = "0"
      img.style.width = sizeImage // sizePercent + '%';
      // img.style.height = 'auto';
      img.style.objectFit = "cover"
      // img.loading = 'lazy';
      img.onerror = events.imageErrorEvent

      const imgTemp = document.createElement("img")
      if (!previewImages) {
        imgTemp.src = urls[imagesNumber + i]
      } else {
        imgTemp.src = previewImages[imagesNumber + i]
      }
      imgTemp.onerror = events.previewImageErrorEvent
      imgTemp.style.width = sizeImage // sizePercent + '%';
      imgTemp.style.height = "auto"
      imgTemp.style.objectFit = "cover"

      img.onload = () => {
        img.style.height = img.height
      }
      const interval = setInterval(() => {
        const max = Math.max(img.height, imgTemp.height)
        if (max > 0) {
          imgTemp.style.height = max
        }
        if (img.height > 0 && imgTemp.height > 0) {
          img.style.height = max
          clearInterval(interval)
        }
        // if (img.height > 0 && imgTemp.height == 0) {
        //   imgTemp.style.height = img.height;
        //   clearInterval(interval);
        // }
        // else if (img.height > 0 && imgTemp.height > 0) {
        //   clearInterval(interval);
        // }
      }, 1000)

      events.imageAddEvent(img, imgTemp)

      div.appendChild(imgTemp)
      div.appendChild(img)
      imgBox.appendChild(div)
    }
    imgBox.appendChild(paginationBottom)
  }
  const updatePage = () => {
    updateImgBox()
  }
  containerBox.appendChild(imgBox)
  containerBox.appendChild(closeBtn)
  containerBox.appendChild(infoBox)
  document.body.style.overflow = "hidden"
  document.body.appendChild(containerBox)
  Hints.create("tth-images-area", Hints.dispatchMouseClick)
  callback({
    favoriteBtn,
    artistBox,
    groupBox,
    parodyBox,
    tagBox,
    paginationTop,
    paginationBottom,
    containerBox,
    events,
  })
  updatePage()
}

// Generation gemini

// util.createComicViewer = async (
//   images,
//   imagesPerPage,
//   previewImages,
//   infomations,
//   callback,
// ) => {
//   const urls = images
//   const events = {
//     imageErrorEvent: (error) => {
//       console.error("Image loading error:", error)
//     },
//     previewImageErrorEvent: (error) => {
//       console.error("Preview image loading error:", error)
//     },
//     removeContainerBox: () => {},
//     imageAddEvent: () => {},
//   }
//
//   let sizeImage = "50vw"
//   let currentPage = 1
//   const totalPages = Math.ceil(urls.length / imagesPerPage)
//
//   // Create elements with DocumentFragment for efficient appending
//   const fragment = document.createDocumentFragment()
//   const containerBox = document.createElement("div")
//   containerBox.style.position = "fixed"
//   containerBox.style.top = "0"
//   containerBox.style.left = "0"
//   containerBox.style.right = "0"
//   containerBox.style.bottom = "0"
//   containerBox.style.borderRadius = "10px"
//   containerBox.style.margin = "20px"
//   containerBox.style.backgroundColor = "#000"
//   containerBox.style.float = "left"
//   containerBox.style.zIndex = "9999"
//   containerBox.addEventListener("close", () => {})
//   const removeContainerBox = () => {
//     document.body.style.overflow = "auto"
//     containerBox.remove()
//   }
//   events.removeContainerBox = removeContainerBox
//
//   const closeBtn = document.createElement("button")
//   closeBtn.style.position = "absolute"
//   closeBtn.style.top = "0"
//   closeBtn.style.right = "0"
//   closeBtn.innerHTML = "×"
//   closeBtn.style.backgroundColor = "rgba(0,0,0,0.1)"
//   closeBtn.style.border = "none"
//   closeBtn.style.color = "#fff"
//   closeBtn.style.fontSize = "1.5rem"
//   closeBtn.style.fontWeight = "bold"
//   closeBtn.style.borderRadius = "50%"
//   closeBtn.style.width = "2rem"
//   closeBtn.style.height = "2rem"
//   closeBtn.style.padding = "0"
//   closeBtn.style.cursor = "pointer"
//   closeBtn.style.margin = "10px"
//
//   closeBtn.onclick = () => {
//     removeContainerBox()
//   }
//   const infoBox = document.createElement("div")
//   infoBox.style.position = "absolute"
//   infoBox.style.top = "0"
//   infoBox.style.left = "0"
//   infoBox.style.display = "flex"
//   infoBox.style.flexDirection = "column"
//   const favoriteBtn = document.createElement("button")
//   favoriteBtn.className = "tth-favorite-btn"
//   favoriteBtn.innerHTML = "Loading..."
//   favoriteBtn.style.backgroundColor = "#ED2553"
//   favoriteBtn.style.border = "none"
//   favoriteBtn.style.color = "#fff"
//   favoriteBtn.style.fontSize = "1.5rem"
//   favoriteBtn.style.fontWeight = "bold"
//   favoriteBtn.style.borderRadius = "10px"
//   favoriteBtn.style.padding = "0"
//   favoriteBtn.style.cursor = "pointer"
//   favoriteBtn.style.margin = "10px"
//   favoriteBtn.style.padding = "10px"
//   favoriteBtn.style.fontSize = "1.4rem"
//
//   const createDetailInfoBox = (str) => {
//     const textBox = document.createElement("div")
//     textBox.style.padding = "5px"
//     textBox.style.margin = "5px"
//     textBox.style.border = "2px solid #ccc"
//     textBox.style.maxWidth = "200px"
//     textBox.style.minWidth = "100px"
//     const tags = infomations
//     const storagedTags = []
//     for (let item of tags) {
//       if (item.type == str.toLowerCase()) {
//         if (item.name.toLowerCase().includes("neto")) {
//           storagedTags.push(item)
//           continue
//         }
//         textBox.innerHTML += `<a href="${item.url}"><span class="math-inline">${item.name}</span></a>, `
//       }
//     }
//     for (let item of storagedTags) {
//       textBox.innerHTML =
//         `<a href="${item.url}"> <span class="math-inline" style="color:red;">${item.name}</span> </a>, ` +
//         textBox.innerHTML
//     }
//     textBox.innerHTML = str + ": " + textBox.innerHTML
//     if (textBox.innerText == str + ": ") {
//       textBox.innerText = str + ": None"
//       textBox.style.cursor = "default"
//     } else {
//       textBox.innerHTML = textBox.innerHTML.slice(0, -2)
//     }
//     return textBox
//   }
//   const artistBox = createDetailInfoBox("artist")
//   const groupBox = createDetailInfoBox("group")
//   const parodyBox = createDetailInfoBox("parody")
//   const tagBox = createDetailInfoBox("tag")
//   infoBox.appendChild(favoriteBtn)
//   infoBox.appendChild(artistBox)
//   infoBox.appendChild(groupBox)
//   infoBox.appendChild(parodyBox)
//   infoBox.appendChild(tagBox)
//
//   document.addEventListener("keydown", (e) => {
//     if (e.key === "Escape") {
//       removeContainerBox()
//     }
//   })
//
//   // Pagination functions
//   const updateTotalPage = () => {
//     document.querySelectorAll(".tth-total-page").forEach((el) => {
//       el.innerHTML = `<span class="math-inline">${currentPage}/</span>${totalPages}`
//     })
//   }
//
//   const nextPageHandler = () => {
//     if (currentPage < totalPages) {
//       imageContainer.scrollTop = 0
//       currentPage++
//       updatePage()
//     }
//   }
//
//   const prevPageHandler = () => {
//     if (currentPage > 1) {
//       imageContainer.scrollTop = 0
//       currentPage--
//       updatePage()
//     }
//   }
//
//   const createPagination = () => {
//     const pagination = document.createElement("div")
//     pagination.style.padding = "10px"
//     pagination.style.alignItems = "center"
//     pagination.style.color = "#fff"
//     pagination.style.fontSize = "1.5rem"
//     pagination.style.fontWeight = "bold"
//     pagination.style.borderRadius = "10px"
//     pagination.style.float = "left"
//     pagination.style.display = "flex"
//     pagination.style.justifyContent = "center"
//     pagination.style.width = "100%"
//     const totalPageElement = document.createElement("p")
//     totalPageElement.style.margin = "0 10px"
//     totalPageElement.className = "tth-total-page"
//     totalPageElement.innerHTML = `<span class="math-inline">${currentPage}/</span>${totalPages}`
//     const nextBtn = document.createElement("button")
//     nextBtn.innerHTML = "Next"
//     nextBtn.className = "tth-next-btn"
//     const prevBtn = document.createElement("button")
//     prevBtn.innerHTML = "Prev"
//     prevBtn.className = "tth-prev-btn"
//     updateTotalPage()
//     pagination.appendChild(prevBtn)
//     pagination.appendChild(totalPageElement)
//     pagination.appendChild(nextBtn)
//     pagination.addEventListener("click", (event) => {
//       if (event.target.classList.contains("tth-next-btn")) {
//         nextPageHandler()
//       } else if (event.target.classList.contains("tth-prev-btn")) {
//         prevPageHandler()
//       }
//     })
//     return pagination
//   }
//   const paginationTop = createPagination()
//   const paginationBottom = createPagination()
//
//   const imageContainer = document.createElement("div")
//   imageContainer.className = "tth-images-area"
//   imageContainer.style.position = "relative"
//   imageContainer.style.width = "100%"
//   imageContainer.style.height = "100%"
//   imageContainer.style.overflowY = "auto"
//   imageContainer.style.display = "flex"
//   imageContainer.style.alignItems = "center"
//   imageContainer.style.flexDirection = "column"
//   imageContainer.style.float = "left"
//   imageContainer.style.borderRadius = "10px"
//
//   let currentImgView = null
//   const isImgInView = (img) => {
//     if (!img) {
//       return false
//     }
//     const rect = img.getBoundingClientRect()
//
//     if (rect.y > 0 && rect.y < window.innerHeight) {
//       return true
//     }
//   }
//
//   document.addEventListener("keydown", (e) => {
//     const imgs = imageContainer.querySelectorAll("img")
//     if (!isImgInView(currentImgView)) {
//       currentImgView = (() => {
//         for (let i = 0; i < imgs.length; i++) {
//           if (util.isElementInViewport(imgs[i])) {
//             console.log(imgs[i])
//             return imgs[i]
//           }
//         }
//       })()
//     }
//     if (e.key === "ArrowRight") {
//       nextPageHandler()
//     } else if (e.key === "ArrowLeft") {
//       prevPageHandler()
//     } else if (e.key === "ArrowDown") {
//       //  sizePercent += 10;
//
//       sizeImage =
//         Number(sizeImage.replace(/[a-z]+$/, "")) -
//         10 +
//         sizeImage.match(/[a-z]+$/g)[0]
//       Array.from(imgs).forEach((el) => {
//         el.style.width = sizeImage //sizePercent + '%';
//       })
//       currentImgView.scrollIntoView()
//     } else if (e.key === "ArrowUp") {
//       //  sizePercent -= 10;
//       sizeImage =
//         Number(sizeImage.replace(/[a-z]+$/, "")) +
//         10 +
//         sizeImage.match(/[a-z]+$/g)[0]
//       Array.from(imgs).forEach((el) => {
//         el.style.width = sizeImage //sizePercent + '%';
//       })
//       currentImgView.scrollIntoView()
//     }
//   })
//
//   // Update image container function
//   const updateImageContainer = () => {
//     imageContainer.innerHTML = "" // Clear previous content
//
//     const startIndex = imagesPerPage * (currentPage - 1)
//     const endIndex = Math.min(startIndex + imagesPerPage, urls.length)
//
//     imageContainer.appendChild(paginationTop.cloneNode(true)) // Clone for top and bottom
//
//     for (let i = startIndex; i < endIndex; i++) {
//       const imageWrapper = document.createElement("div")
//       imageWrapper.style.position = "relative"
//
//       const img = new Image()
//       img.src = urls[i]
//       img.alt = `Comic page ${i + 1}` // Add alt text for accessibility
//       img.style.width = sizeImage
//       img.style.objectFit = "contain" // Use 'contain' for better image display
//       img.onerror = () =>
//         events.imageErrorEvent(new Error(`Failed to load image: ${urls[i]}`))
//
//       const previewImg = new Image()
//       previewImg.src = previewImages ? previewImages[i] : urls[i]
//       previewImg.alt = "Loading..."
//       previewImg.style.width = sizeImage
//       previewImg.style.objectFit = "contain"
//       previewImg.onerror = () =>
//         events.previewImageErrorEvent(
//           new Error(`Failed to load preview image: ${previewImg.src}`),
//         )
//
//       img.onload = () => {
//         previewImg.style.display = "none" // Hide preview once main image loads
//       }
//
//       events.imageAddEvent(img, previewImg)
//
//       imageWrapper.appendChild(previewImg)
//       imageWrapper.appendChild(img)
//       imageContainer.appendChild(imageWrapper)
//     }
//
//     imageContainer.appendChild(paginationBottom.cloneNode(true))
//     updateTotalPage()
//   }
//
//   const updatePage = () => {
//     updateImageContainer()
//   }
//
//   // Append elements to fragment and then to body
//   fragment.appendChild(imageContainer)
//   fragment.appendChild(closeBtn)
//   fragment.appendChild(infoBox)
//   containerBox.appendChild(fragment)
//
//   document.body.style.overflow = "hidden"
//   document.body.appendChild(containerBox)
//
//   Hints.create("tth-images-area", Hints.dispatchMouseClick)
//   callback({
//     favoriteBtn,
//     artistBox,
//     groupBox,
//     parodyBox,
//     tagBox,
//     paginationTop,
//     paginationBottom,
//     containerBox,
//     events,
//   })
//   updatePage()
// }

util.autoChangeIpWhenError = async (callback) => {
  let json = false
  let counter = 0
  while (!json) {
    try {
      json = await callback()
    } catch (error) {
      counter++
      if (counter > 5) {
        counter = 0
        await fetch("http://localhost:5466/api/delete", {
          method: "post",
        }).then((res) => {
          if (res.status == 200) {
            Front.showBanner("Success delete")
          } else {
            Front.showPopup("Failed to delete")
          }
        })
        await fetch("http://localhost:5466/api/register", {
          method: "post",
        }).then((res) => {
          if (res.status == 200) {
            Front.showBanner("Success register")
          } else {
            Front.showPopup("Failed to register")
          }
        })
      }
      await fetch("http://localhost:5466/api/change-ip", {
        method: "post",
      }).then((res) => {
        if (res.status == 200) {
          Front.showBanner("Success change ip")
        } else {
          Front.showPopup("Failed to change ip")
        }
      })
    }
    console.log(
      await fetch("http://localhost:5466/api/get-ip").then((res) => res.text()),
    )
  }
  return json
}
export default util
