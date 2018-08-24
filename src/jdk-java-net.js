const fetch = require('node-fetch')
const fetch2xx = _ => _.ok ? _ : _.buffer().then(_ => { throw new Error(`${_.status}`) })
const domino = require('domino')

// e.g. http://jdk.java.net/11/
;(async (url) => {
  const html = await fetch(url).then(fetch2xx).then(_ => _.text())
  const window = domino.createWindow(html, url)
  const document = window.document
  const nodeList = document.querySelector('#main').querySelectorAll('a')
  const ee = []
  for (const node of Array.from(nodeList)) { // for of isn't working because of the "domino"
    const href = node.href
    // e.g.
    // https://download.java.net/java/early_access/jdk11/13/GPL/openjdk-11-ea+13_windows-x64_bin.tar.gz.sha256
    // https://download.java.net/java/early_access/jdk11/13/BCL/jdk-11-ea+13_windows-x64_bin.exe.sha256
    if (!href.endsWith(".sha256")) {
      continue
    }
    const url = href.replace(/[.]sha256$/, '').replace(/_bin$/, '_bin.tar.gz')
    const ns =
      url.includes('BCL/jdk') ? 'oracle-jdk' :
      url.includes('/openjdk') ? 'openjdk' :
      null
    if (ns == null) {
      console.error(`skip(ns): ${url}`)
      continue
    }
    const m = url.match(/jdk-(.*)_(linux|windows|osx)-(x64)/)
    if (m == null) {
      console.error(`skip(url): ${url}`)
      continue
    }
    const os =
      m[2] === 'linux' ? 'linux' :
      m[2] === 'windows' ? 'windows' :
      m[2] === 'osx' ? 'darwin' :
      null
    const arch = m[3] === 'x64' ? 'amd64' : null
    if (!os || !arch || url.includes('/alpine/')) {
      console.error(`skip(os/arch): ${url}`)
      continue
    }
    let version = m[1].replace('-lworldea', '-valhallaea')
    if (url.includes('early_access') && !version.includes('ea')) {
      if (version.includes('+')) {
        version = version.replace('+', '-ea+')
      } else {
        version = version + '-ea'
      }
    }
    ee.push({
      ns,
      os,
      arch,
      version,
      url
    })
  }
  console.log(JSON.stringify(ee, null, '  '))
})(process.argv[2])
