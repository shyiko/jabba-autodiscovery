const fetch = require('node-fetch')
const fetch2xx = _ => _.ok ? _ : _.buffer().then(_ => { throw new Error(`${_.status}`) })
const domino = require('domino')

// e.g. https://www.oracle.com/java/technologies/java-archive-javase10-downloads.html
;(async (url) => {
  const html = await fetch(url).then(fetch2xx).then(_ => _.text())
  const window = domino.createWindow(html, url)
  const document = window.document
  const nodeList = document.querySelectorAll('a[data-file]')
  const mm = new Map()
  const ee = []
  for (const node of Array.from(nodeList)) { // for of isn't working because of the "domino"
    let url = node.getAttribute('data-file')
    if (url.startsWith('//')) {
      url = 'https:' + url
    }
    const m = url.match(/(jdk|serverjre)-(.*)_(linux|windows|osx)-(x64).*[.](tar[.]gz|dmg|zip|exe)$/)
    if (m == null) {
      console.error(`skip(url): ${url}`)
      continue
    }
    const ns = m[1] == 'serverjre' ? 'oracle-server-jre' : 'oracle-jdk'
    const version = m[2]
    const os = m[3] === 'osx' ? 'darwin' : m[3]
    const arch = 'amd64' // m[4]
    const key = `${ns}${os}${arch}${version}`
    if (!mm.has(key) || m[5] == 'tar.gz' || m[5] == 'zip') {
      // prefer tar.gz/zip over dmg/exe
      mm.set(key, url)
      ee.push({
        ns,
        os,
        arch,
        version,
        url
      })
    } else if (url !== mm.get(key)) {
      console.error(`skip(dup): ${url} (keeping ${mm.get(key)})`)
    }
  }
  console.log(JSON.stringify(ee, null, '  '))
})(process.argv[2])
