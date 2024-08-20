import ghReservedNames from "github-reserved-names"

import api from "../../api.js"
import priv from "../../conf.priv.js"
import util from "../../util.js"
import actions from "../global/actions.js"

const { tabOpenLink, Front, Hints, Normal, RUNTIME } = api
actions.ah = {}
actions.ah.getImages = async (idGallery) => {
  const json = await util.autoChangeIpWhenError(async () => {
    return await fetch(
      "https://anchira.to/api/v1/library/" + idGallery + "/data",
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent":
            "Mozilla/5.0 (Windows; Windows NT 10.0;) AppleWebKit/603.21 (KHTML, like Gecko) Chrome/47.0.1437.111 Safari/536.2 Edge/12.94565",
        },
      },
    ).then((res) => res.json())
  })
  // let json = false
  // while (!json) {
  //   try {
  //     json = await fetch('https://anchira.to/api/v1/library/' + idGallery + '/data', {
  //       headers: {
  //         'X-Requested-With': 'XMLHttpRequest',
  //         'User-Agent': "Mozilla/5.0 (Windows; Windows NT 10.0;) AppleWebKit/603.21 (KHTML, like Gecko) Chrome/47.0.1437.111 Safari/536.2 Edge/12.94565"
  //       }
  //     }).then(res => res.json());
  //   } catch (error) {
  //     await fetch('http://localhost:5466/api/change-ip', {
  //       method: 'post'
  //     }).then(res => {
  //       if (res.status == 200) {
  //         Front.showBanner('Success change ip');
  //       }
  //       else {
  //         Front.showPopup('Failed to change ip');
  //       }
  //     })
  //   }
  //   console.log(await fetch('http://localhost:5466/api/get-ip').then(res => res.text()))
  // }

  const images = []
  console.log(json)

  const names = json.names
  const id = json.id
  const key = json.key
  const hash = json.hash

  for (let name of names) {
    images.push(`https://kisakisexo.xyz/${id}/${key}/${hash}/b/${name}`)
  }

  return images
}
actions.ah.createViewer = async (idGallery) => {
  const data = await fetch("https://anchira.to/api/v1/library/" + idGallery, {
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
  }).then((res) => res.json())
  const images = await actions.ah.getImages(idGallery)
  const pages = data.pages
  const previewImages = await (async () => {
    const urls = (() => {
      const images = []
      for (let i = 0; i < pages; i++) {
        images.push(`https://kisakisexo.xyz/${idGallery}/s/${i + 1}`)
      }
      return images
    })()
    return urls
  })()
  const infomations = await (async () => {
    const info = []
    const tags = data.tags
    for (let tag of tags) {
      if (!tag.namespace) {
        info.push({
          type: "tag",
          name: tag.name,
          url: "https://anchira.to/?s=tag:" + encodeURIComponent(tag.name),
        })
      } else if (tag.namespace == 1) {
        info.push({
          type: "artist",
          name: tag.name,
          url: "https://anchira.to/?s=artist:" + encodeURIComponent(tag.name),
        })
      } else if (tag.namespace == 2) {
        info.push({
          type: "group",
          name: tag.name,
          url: "https://anchira.to/?s=circle:" + encodeURIComponent(tag.name),
        })
      } else if (tag.namespace == 3) {
        info.push({
          type: "parody",
          name: tag.name,
          url: "https://anchira.to/?s=parody:" + encodeURIComponent(tag.name),
        })
      }
    }
    return info
  })()
  util.createComicViewer(
    images,
    50,
    previewImages,
    infomations,
    (components) => {},
  )
}
export default actions.ah
