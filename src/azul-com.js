const fetch = require('node-fetch')
const fetch2xx = _ => _.ok ? _ : _.buffer().then(_ => { throw new Error(`${_.status}`) })
const domino = require('domino')

// e.g. https://www.azul.com/downloads/zulu/zulu-linux/
;(async (url) => {
  const html = await fetch(url).then(fetch2xx).then(_ => _.text())
  const window = domino.createWindow(html, url)
  const document = window.document
  const nodeList = document.querySelector('.main_content_area').querySelectorAll('a.r-download')
  const mm = new Map()
  const ee = []
  for (const node of nodeList) {
    // e.g. https://cdn.azul.com/zulu/bin/zulu10.2+3-jdk10.0.1-linux_x64.tar.gz
    const url = node.href
    if (!url.endsWith(".zip") && !url.endsWith(".tar.gz")) {
      if (!url.endsWith(".rpm") && !url.endsWith(".deb") && !url.endsWith(".msi")) {
        console.error(`skip(ext): ${url}`)
      }
      continue
    }
    const os =
      url.includes('linux') ? 'linux' :
      url.includes('win') ? 'windows' :
      url.includes('mac') ? 'darwin' :
      null
    const arch =
      url.includes('x86_64') || url.includes('x64') || url.includes('amd64') ? 'amd64' :
      url.includes('i686') || url.includes('x86') ? '386' :
      url.includes('aarch64') ? 'arm64' :
      url.includes('aarch32hf') ? 'arm' :
      null
    const versionMatch = url.match(/(?:jdk|ezdk-)(.*)-(?:linux|win|mac)/)
    if (!os || !arch || !versionMatch) {
      console.error(`skip(url): ${url}`)
      continue
    }
    const version = versionMatch[1]
      .replace(/^([678])[.]0[.]/, '$1u')
      .replace(/^1.([678])[.]0_(\d+).*/, '$1u$2')
      .replace(/-c2$/, '')
    const key = `${os}${arch}${version}`
    if (!mm.has(key)) {
      // zip/tar.gz - first one wins
      mm.set(key, url)
      ee.push({os, arch, version, url})
    } else if (url !== mm.get(key)) {
      console.error(`skip(dup): ${url} (keeping ${mm.get(key)})`)
    }
  }
  console.log(JSON.stringify(ee, null, '  '))
})(process.argv[2])
