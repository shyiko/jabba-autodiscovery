const fetch = require('node-fetch')
const fetch2xx = _ => _.ok ? _ : _.buffer().then(_ => { throw new Error(`${_.status}`) })
const domino = require('domino')

// e.g. https://builds.shipilev.net/openjdk-shenandoah-jdk8/
;(async (url) => {
  const html = await fetch(`${url}?C=M&O=D`).then(fetch2xx).then(_ => _.text())
  const window = domino.createWindow(html, url)
  const document = window.document
  const nodeList = document.querySelector('#list').querySelectorAll('a')
  const ee = []
  for (const node of Array.from(nodeList)) { // for of isn't working because of the "domino"
    const url = node.href
    if (!url.endsWith('.tar.xz')) {
      if (!url.endsWith('.log')) {
        console.error(`skip(ext): ${url}`)
      }
      continue
    }
    const m = url.match(/openjdk-shenandoah-jdk(\d+)-b(\d+).*-(x86(?:_64)?|aarch64|arm32-hflt)-release.tar.xz$/)
    if (m == null) {
      console.error(`skip(url): ${url}`)
      continue
    }
    const arch = m[3] === 'x86' ? '386' :
      m[3] === 'x86_64' ? 'amd64' :
      m[3] === 'aarch64' ? 'arm64' :
      m[3] === 'arm32-hflt' ? 'arm' :
      null
    if (arch == null) {
      console.error(`skip(arch): ${url}`)
      continue
    }
    ee.push({
      os: 'linux',
      arch,
      version: `${m[1]}-b${m[2]}`,
      url
    })
  }
  console.log(JSON.stringify(ee, null, '  '))
})(process.argv[2])

