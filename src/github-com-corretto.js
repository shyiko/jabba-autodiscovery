// https://github.com/oracle/graal/releases

const fetch = require('node-fetch')
const hrefsRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi

;(async (repo) => {
  const headers = {}
  if (process.env.GITHUB_TOKEN) {
    headers['authorization'] = `token ${process.env.GITHUB_TOKEN}`
  }
  const ee = []
  let page = 1
  let releases
  do {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases?page=${page}&per_page=100`, { headers })
    releases = await res.json()
    for (const release of releases) {
      if (release.prerelease) {
        console.error(`skip(pre-release): ${release.tag_name}`)
        continue
      }
      for (const url of release.body.match(hrefsRegex) || []) {
        if (!url.endsWith('.zip') && !url.endsWith('.tar.gz')) {
          if (
            !url.endsWith('.sig') &&
            !url.endsWith('.pub') &&
            !url.endsWith('.deb') &&
            !url.endsWith('.rpm') &&
            !url.endsWith('.msi') &&
            !url.endsWith('.pkg') &&
            !url.endsWith('.html')
          ) {
            console.error(`skip(ext): ${url}`)
          }
          continue
        }
        const m = url.match(/amazon-corretto-([0-9.]+)(?:-[0-9.]+)?-(linux|windows|macosx)-(x86|x64|aarch64)(-jdk)?[.](zip|tar.gz)$/)
        if (m == null) {
          console.error(`skip(url): ${url}`)
          continue
        }
        const os = m[2] === 'macosx' ? 'darwin' : m[2]
        const arch = m[3] === 'x86' ? '386' :
          m[3] === 'x64' ? 'amd64' :
          m[3] === 'aarch64' ? 'arm64' :
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
    }
    page++
  } while (releases.length == 100)
  console.log(JSON.stringify(ee, null, '  '))
})(process.argv[2])
