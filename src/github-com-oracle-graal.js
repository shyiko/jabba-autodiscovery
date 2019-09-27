// https://github.com/oracle/graal/releases

const fetch = require('node-fetch')

;(async () => {
  const headers = {}
  if (process.env.GITHUB_TOKEN) {
    headers['authorization'] = `token ${process.env.GITHUB_TOKEN}`
  }
  const res = await fetch('https://api.github.com/repos/oracle/graal/releases', {headers})
  const releases = await res.json()
  const mm = new Map()
  const ee = []
  for (const release of releases) {
    const m = release.tag_name.match(/^vm-(\d.+)$/)
    if (m == null) {
      continue
    }
    for (const asset of release.assets || []) {
      const url = asset.browser_download_url
      if (url.endsWith('.jar')) {
        console.error(`skip(ext): ${url}`)
        continue
      }
      const os = (
        url.includes('linux-amd64') ? 'linux' :
        url.includes('darwin-amd64') || url.includes('macos-amd64') ? 'darwin' :
        url.includes('windows-amd64') ? 'windows' : null
      )
      const arch = 'amd64'
      const version = m[1].replace(/^(\d+[.]\d+[.]\d+)[.]\d+$/, '$1')
      const key = `${os}${arch}${version}`
      if (!os) {
        console.error(`skip(url): ${url}`)
        continue
      }
      if (!mm.has(key)) {
        mm.set(key, url)
        ee.push({os, arch, version, url})
      } else {
        console.error(`skip(dup): ${url} (keeping ${mm.get(key)})`)
      }
    }
  }
  console.log(JSON.stringify(ee, null, '  '))
})()
