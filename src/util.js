import { html } from "uhtml"
import DOMPurify from "dompurify"

import api from "./api.js"

const { Hints, RUNTIME, Front } = api

const util = {}

const promisify = (fn) => (...args) =>
  new Promise((resolve, reject) => {
    try {
      fn(...args, resolve)
    } catch (e) {
      reject(e)
    }
  })
util.promisify = promisify

const runtime = promisify(RUNTIME)
util.runtime = runtime

util.getHTML = async (url) => {
  const html = await runtime("request", { url })
  const parser = new DOMParser()
  const doc = parser.parseFromString(html.text, "text/html")
  return doc
}
util.getJSON = async (url, headers = null) => {

  const res = await runtime("request", { url, headers })
  return JSON.parse(res.text)
}
util.runtimeHttpRequest = async (url, opts) => {
  const res = await runtime("request", { ...opts, url })
  return res.text
}

util.getURLPath = ({ count = 0, domain = false } = {}) => {
  let path = window.location.pathname.slice(1)
  if (count) {
    path = path.split("/").slice(0, count).join("/")
  }
  if (domain) {
    path = `${window.location.hostname}/${path}`
  }
  return path
}

util.getMap = (mode, keys) =>
  keys.split("").reduce((acc, c) => acc[c] || acc, mode.mappings).meta || null

util.escapeHTML = (text) => {
  const el = document.createElement("span")
  el.textContent = text
  return el.innerHTML
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
util.escapeRegExp = (str) => str.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&")

util.until = (check, test = (a) => a, maxAttempts = 50, interval = 50) =>
  new Promise((resolve, reject) => {
    const f = (attempts = 0) => {
      const res = check()
      if (!test(res)) {
        if (attempts > maxAttempts) {
          reject(new Error("until: timeout"))
        } else {
          setTimeout(() => f(attempts + 1), interval)
        }
        return
      }
      resolve(res)
    }
    f()
  })

const localStorageFns = () => {
  if (typeof browser !== "undefined") {
    return [browser.storage.local.get, browser.storage.local.set]
  }
  if (typeof chrome !== "undefined") {
    return [chrome.storage.local.get, chrome.storage.local.set].map((fn) =>
      util.promisify(fn.bind(chrome.storage.local))
    )
  }
  const fn = () =>
    new Error("local storage unavailable: unsupported environment")
  return [fn, fn]
}

const [localStorageGet, localStorageSet] = localStorageFns()

util.localStorage = {}

util.localStorage.fullkey = (key) => `surfingkeys-conf.${key}`

util.localStorage.get = async (key) => {
  const fullkey = util.localStorage.fullkey(key)
  return (await localStorageGet(fullkey))[fullkey]
}

util.localStorage.set = async (key, val) => {
  const fullkey = util.localStorage.fullkey(key)
  const storageObj = { [fullkey]: val }
  return localStorageSet(storageObj)
}

util.htmlUnsafe = (content) => html.node([content])

util.htmlPurify = (content, config = { USE_PROFILES: { html: true } }) =>
  util.htmlUnsafe(DOMPurify.sanitize(content, config))

util.htmlNode = (template, ...values) => html.node(template, ...values)

util.htmlForEach = (items) => items.map((item) => html.for(item)`${item}`)

util.html = (template, ...values) =>
  util.htmlNode(template, ...values).outerHTML

util.suggestionItem = (props = {}) => (template, ...values) => ({
  html: util.html(template, ...values),
  props,
})

util.urlItem = (title, url, { desc = null, query = null } = {}) => {
  const descItems =
    desc && desc.length > 0
      ? (Array.isArray(desc) ? desc : [desc]).map(
        (d) => util.htmlNode`<div>${d}</div>`
      )
      : []
  return util.suggestionItem({ url: url, query: query ?? title })`
    <div>
      <div style="font-weight: bold">${title}</div>
      ${util.htmlForEach(descItems)}
      <div style="opacity: 0.7; line-height: 1.3em">${url}</div>
    </div>
  `
}

util.defaultSelector = "a[href]:not([href^=javascript])"

util.querySelectorFiltered = (
  selector = util.defaultSelector,
  filter = () => true
) => [...document.querySelectorAll(selector)].filter(filter)

util.createHints = (
  selector = util.defaultSelector,
  action = Hints.dispatchMouseClick,
  attrs = {}
) =>
  new Promise((resolve) => {
    Hints.create(
      selector,
      (...args) => {
        resolve(...args)
        if (typeof action === "function") action(...args)
      },
      attrs
    )
  })

util.createHintsFiltered = (filter, selector, ...args) => {
  util.createHints(util.querySelectorFiltered(selector, filter), ...args)
}

// https://developer.mozilla.org/en-US/docs/web/api/element/getboundingclientrect
util.isRectVisibleInViewport = (rect) =>
  rect.height > 0 &&
  rect.width > 0 &&
  rect.bottom >= 0 &&
  rect.right >= 0 &&
  rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
  rect.left <= (window.innerWidth || document.documentElement.clientWidth)

util.isElementInViewport = (e) =>
  e.offsetHeight > 0 &&
  e.offsetWidth > 0 &&
  !e.getAttribute("disabled") &&
  util.isRectVisibleInViewport(e.getBoundingClientRect())

util.getDuckduckgoFaviconUrl = (url) => {
  const u = url instanceof URL ? url : new URL(url)
  return new URL(`https://icons.duckduckgo.com/ip3/${u.hostname}.ico`).href
}

// Originally based on JavaScript Pretty Date
// https://johnresig.com/blog/javascript-pretty-date/
// Copyright (c) 2011 John Resig (ejohn.org)
// Licensed under the MIT and GPL licenses.
util.prettyDate = (date) => {
  const diff = (new Date().getTime() - date.getTime()) / 1000
  const dayDiff = Math.floor(diff / 86400)
  if (Number.isNaN(dayDiff) || dayDiff < 0) return ""
  const [count, unit] = (dayDiff === 0 &&
    ((diff < 60 && [null, "just now"]) ||
      (diff < 3600 && [Math.floor(diff / 60), "minute"]) ||
      (diff < 86400 && [Math.floor(diff / 3600), "hour"]))) ||
    (dayDiff === 1 && [null, "yesterday"]) ||
    (dayDiff < 7 && [dayDiff, "day"]) ||
    (dayDiff < 30 && [Math.round(dayDiff / 7), "week"]) ||
    (dayDiff < 365 && [Math.round(dayDiff / 30), "month"]) || [
      Math.round(dayDiff / 365),
      "year",
    ]
  return `${count ?? ""}${count ? " " : ""}${unit}${(count ?? 0) > 1 ? "s" : ""
    }${count ? " ago" : ""}`
}
util.convertToSHA1 = async (str) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
util.playWithMpv = (url, pageUrl = null, accessToken = null) => {
  Front.showBanner(`Opening with mpv (${url})...`)
  fetch('http://localhost:9789', {
    method: 'post',
    body: new URLSearchParams({ url, pageUrl, accessToken })
  }).catch(err => console.error(err))
}
util.playAsyncWithMpv = (url) => {
  fetch('http://localhost:9789/async-run', {
    method: 'post',
    body: new URLSearchParams({ url })
  })
}
util.sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
util.createComicViewer = async (images, imagesPerPage, previewImages, infomations, callback) => {
  //infomations = {name, url, type}
  const urls = images;
  const events = {
    imageErrorEvent: () => { },
    previewImageErrorEvent: () => { },
    removeContainerBox: () => { },
    imageAddEvent: () => { }
  }


  //   let sizePercent = 50;
  let sizeImage = '50vw';
  let page = 1;
  const totalPage = Math.ceil(urls.length / imagesPerPage);
  const containerBox = document.createElement('div');
  containerBox.style.position = 'fixed';
  containerBox.style.top = '0';
  containerBox.style.left = '0';
  containerBox.style.right = '0';
  containerBox.style.bottom = '0';
  containerBox.style.borderRadius = '10px'
  containerBox.style.margin = '20px';
  containerBox.style.backgroundColor = '#000'
  containerBox.style.float = 'left'
  containerBox.style.zIndex = '9999'
  containerBox.addEventListener('close', () => {
  })
  const removeContainerBox = () => {
    document.body.style.overflow = "auto";
    containerBox.remove();
  }
  events.removeContainerBox = removeContainerBox;

  const closeBtn = document.createElement('button');
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '0';
  closeBtn.style.right = '0';
  closeBtn.innerHTML = "×";
  closeBtn.style.backgroundColor = 'rgba(0,0,0,0.1)';
  closeBtn.style.border = 'none';
  closeBtn.style.color = '#fff';
  closeBtn.style.fontSize = '1.5rem';
  closeBtn.style.fontWeight = 'bold';
  closeBtn.style.borderRadius = '50%';
  closeBtn.style.width = '2rem';
  closeBtn.style.height = '2rem';
  closeBtn.style.padding = '0';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.margin = '10px';

  closeBtn.onclick = () => {
    removeContainerBox();
  }
  const infoBox = document.createElement('div');
  infoBox.style.position = 'absolute';
  infoBox.style.top = '0';
  infoBox.style.left = '0';
  infoBox.style.display = 'flex'
  infoBox.style.flexDirection = 'column'
  const favoriteBtn = document.createElement('button');
  favoriteBtn.className = 'tth-favorite-btn'
  favoriteBtn.innerHTML = "Loading...";
  favoriteBtn.style.backgroundColor = '#ED2553'
  favoriteBtn.style.border = 'none';
  favoriteBtn.style.color = '#fff';
  favoriteBtn.style.fontSize = '1.5rem';
  favoriteBtn.style.fontWeight = 'bold';
  favoriteBtn.style.borderRadius = '10px';
  favoriteBtn.style.padding = '0';
  favoriteBtn.style.cursor = 'pointer';
  favoriteBtn.style.margin = '10px';
  favoriteBtn.style.padding = '10px';
  favoriteBtn.style.fontSize = '1.4rem';

  const createDetailInfoBox = (str) => {
    const textBox = document.createElement('div');
    textBox.style.padding = '5px';
    textBox.style.margin = '5px';
    textBox.style.border = '2px solid #ccc'
    textBox.style.maxWidth = '200px';
    textBox.style.minWidth = '100px';
    const tags = infomations;
    const storagedTags = [];
    for (let item of tags) {
      if (item.type == str.toLowerCase()) {
        if (item.name.toLowerCase().includes('neto')) {
          storagedTags.push(item);
          continue;
        }
        textBox.innerHTML += `<a href="${item.url}">${item.name}</a>, `;
      }
    }
    for (let item of storagedTags) {
      textBox.innerHTML = `<a href="${item.url}" style="color:red;">${item.name}</a>, ` + textBox.innerHTML;
    }
    textBox.innerHTML = str + ': ' + textBox.innerHTML;
    if (textBox.innerText == str + ': ') {
      textBox.innerText = str + ': None'
      textBox.style.cursor = 'default';
    }
    else {
      textBox.innerHTML = textBox.innerHTML.slice(0, -2);
    }
    return textBox;
  }
  const artistBox = createDetailInfoBox('artist')
  const groupBox = createDetailInfoBox('group')
  const parodyBox = createDetailInfoBox('parody')
  const tagBox = createDetailInfoBox('tag')
  infoBox.appendChild(favoriteBtn)
  infoBox.appendChild(artistBox)
  infoBox.appendChild(groupBox)
  infoBox.appendChild(parodyBox)
  infoBox.appendChild(tagBox)

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      removeContainerBox();
    }
  });
  const updateTotalPage = () => {
    document.querySelectorAll('.tth-total-page').forEach(el => {
      el.innerHTML = `${page}/${totalPage}`;
    })
  }
  const nextPageHandler = () => {
    if (page < totalPage) {
      imgBox.scrollTop = 0;
      page++;
      updatePage();
      updateTotalPage();
    }
  }
  const prevPageHandler = () => {
    if (page > 0) {
      imgBox.scrollTop = 0;
      page--;
      updatePage();
      updateTotalPage();
    }
  }
  const createPagination = () => {
    const pagination = document.createElement('div');
    pagination.style.padding = '10px';
    pagination.style.alignItems = 'center';
    pagination.style.color = '#fff';
    pagination.style.fontSize = '1.5rem';
    pagination.style.fontWeight = 'bold';
    pagination.style.borderRadius = '10px'
    pagination.style.float = 'left'
    pagination.style.display = 'flex';
    pagination.style.justifyContent = 'center';
    pagination.style.width = '100%';
    const totalPageElement = document.createElement('p');
    totalPageElement.style.margin = '0 10px';
    totalPageElement.className = 'tth-total-page';
    totalPageElement.innerHTML = `${page}/${totalPage}`;
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'Next';
    nextBtn.className = 'tth-next-btn'
    nextBtn.onclick = () => {
      nextPageHandler();
    }
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = 'Prev';
    prevBtn.className = 'tth-prev-btn'
    prevBtn.onclick = () => {
      prevPageHandler();
    }
    updateTotalPage()
    pagination.appendChild(prevBtn);
    pagination.appendChild(totalPageElement);
    pagination.appendChild(nextBtn);
    return pagination
  }
  const paginationTop = createPagination();
  const paginationBottom = createPagination();
  const imgBox = document.createElement('div');
  imgBox.className = 'tth-images-area'
  imgBox.style.position = 'relative';
  imgBox.style.width = '100%';
  imgBox.style.height = '100%';
  imgBox.style.overflowY = 'auto';
  imgBox.style.display = 'flex';
  imgBox.style.alignItems = 'center';
  imgBox.style.flexDirection = 'column';
  imgBox.style.float = 'left'
  imgBox.style.borderRadius = '10px'

  let currentImgView = null;
  const isImgInView = (img) => {
    if (!img) {
      return false;
    }
    const rect = img.getBoundingClientRect();

    if (rect.y > 0 && rect.y < window.innerHeight) {
      return true;
    }
  }

  document.addEventListener('keydown', (e) => {
    const imgs = imgBox.querySelectorAll('img');
    console.log(isImgInView(currentImgView))
    if (!isImgInView(currentImgView)) {
      currentImgView = (() => {
        for (let i = 0; i < imgs.length; i++) {
          if (util.isElementInViewport(imgs[i])) {
            console.log(imgs[i])
            return imgs[i];
          }
        }
      })();
    }
    if (e.key === 'ArrowRight') {
      nextPageHandler();
    }
    else if (e.key === 'ArrowLeft') {
      prevPageHandler();
    }
    else if (e.key === 'ArrowDown') {

      //   sizePercent += 10;

      sizeImage = (Number(sizeImage.replace(/[a-z]+$/, '')) - 10) + sizeImage.match(/[a-z]+$/g)[0]
      Array.from(imgs).forEach(el => {
        el.style.width = sizeImage//sizePercent + '%';
      })
      currentImgView.scrollIntoView();
    }
    else if (e.key === 'ArrowUp') {
      //   sizePercent -= 10;
      sizeImage = (Number(sizeImage.replace(/[a-z]+$/, '')) + 10) + sizeImage.match(/[a-z]+$/g)[0]
      Array.from(imgBox.querySelectorAll('img')).forEach(el => {
        el.style.width = sizeImage//sizePercent + '%';
      })
      currentImgView.scrollIntoView();
    }
  });
  const updateImgBox = () => {
    imgBox.innerHTML = '';
    const imagesNumber = imagesPerPage * (page - 1);
    imgBox.appendChild(paginationTop)
    for (let i = 0; i < imagesPerPage; i++) {
      if (imagesNumber + i >= urls.length) {
        break;
      }
      const div = document.createElement('div')
      div.style.position = 'relative'

      const img = document.createElement('img');
      img.src = urls[imagesNumber + i];
      img.style.position = 'absolute'
      img.style.top = '0';
      img.style.left = '0';
      img.style.width = sizeImage//sizePercent + '%';
      // img.style.height = 'auto';
      img.style.objectFit = 'cover';
      // img.loading = 'lazy';
      img.onerror = events.imageErrorEvent;

      const imgTemp = document.createElement('img');
      if (!previewImages) {
        imgTemp.src = urls[imagesNumber + i];
      }
      else {
        imgTemp.src = previewImages[imagesNumber + i]
      }
      imgTemp.onerror = events.previewImageErrorEvent
      imgTemp.style.width = sizeImage//sizePercent + '%';
      imgTemp.style.height = 'auto';
      imgTemp.style.objectFit = 'cover';

      img.onload = () => {
        img.style.height = img.height;
      }
      const interval = setInterval(() => {
        if (img.height > 0 && imgTemp.height == 0) {
          imgTemp.style.height = img.height;
          clearInterval(interval);
        }
        else if (img.height > 0 && imgTemp.height > 0) {
          clearInterval(interval);
        }
      }, 1000)



      events.imageAddEvent(img, imgTemp);


      div.appendChild(imgTemp)
      div.appendChild(img)
      imgBox.appendChild(div);
    }
    imgBox.appendChild(paginationBottom);

  }
  const updatePage = () => {
    updateImgBox();
  }
  containerBox.appendChild(imgBox);
  containerBox.appendChild(closeBtn);
  containerBox.appendChild(infoBox);
  document.body.style.overflow = "hidden";
  document.body.appendChild(containerBox);
  Hints.create("tth-images-area", Hints.dispatchMouseClick);
  callback({ favoriteBtn, artistBox, groupBox, parodyBox, tagBox, paginationTop, paginationBottom, containerBox, events });
  updatePage();
}
util.autoChangeIpWhenError = async (callback) => {
  let json = false
  let counter = 0;
  while (!json) {
    try {
      json = await callback();
    } catch (error) {
      counter++;
      if (counter > 5) {
        counter = 0;
        await fetch('http://localhost:5466/api/delete', {
          method: 'post'
        }).then(res => {
          if (res.status == 200) {
            Front.showBanner('Success delete');
          }
          else {
            Front.showPopup('Failed to delete');
          }
        })
        await fetch('http://localhost:5466/api/register', {
          method: 'post'
        }).then(res => {
          if (res.status == 200) {
            Front.showBanner('Success register');
          }
          else {
            Front.showPopup('Failed to register');
          }
        })
      }
      await fetch('http://localhost:5466/api/change-ip', {
        method: 'post'
      }).then(res => {
        if (res.status == 200) {
          Front.showBanner('Success change ip');
        }
        else {
          Front.showPopup('Failed to change ip');
        }
      })
    }
    console.log(await fetch('http://localhost:5466/api/get-ip').then(res => res.text()))
  }
  return json
}

export default util
