const fetch = require('node-fetch')
const fetch2xx = _ => _.ok ? _ : _.buffer().then(_ => { throw new Error(`${_.status}`) })
const domino = require('domino')

// e.g. https://docs.aws.amazon.com/corretto/latest/corretto-8-ug/downloads-list.html
;(async (url) => {
  const html = await fetch(url).then(fetch2xx).then(_ => _.text())
  const window = domino.createWindow(html, url)
  const document = window.document
  const nodeList = document.querySelector('#main-content').querySelectorAll('a')
  const ee = []
  for (const node of Array.from(nodeList)) { // for of isn't working because of the "domino"
    const url = node.href
    if (!url.endsWith('.tar.gz') && !url.endsWith('.zip')) {
      if (!url.endsWith('.log')) {
        console.error(`skip(ext): ${url}`)
      }
      continue
    }
    const m = url.match(/amazon-corretto-([0-9.]+)-(linux|windows|macosx)-(x86|x64)(-jdk)?[.](zip|tar.gz)$/)
    if (m == null) {
      console.error(`skip(url): ${url}`)
      continue
    }
    const os = m[2] === 'macosx' ? 'darwin' : m[2]
    const arch = m[3] === 'x86' ? '386' :
      m[3] === 'x64' ? 'amd64' :
      null
    if (arch == null) {
      console.error(`skip(arch): ${url}`)
      continue
    }
    ee.push({
      os,
      arch,
      version: m[1],
      url
    })
  }
  console.log(JSON.stringify(ee, null, '  '))
})(process.argv[2])

