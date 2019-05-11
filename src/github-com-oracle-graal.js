// https://github.com/oracle/graal/releases

const fetch = require('node-fetch')

;(async () => {
  const headers = {}
  if (process.env.GITHUB_TOKEN) {
    headers['authorization'] = `token ${process.env.GITHUB_TOKEN}`
  }
  const res = await fetch('https://api.github.com/repos/oracle/graal/releases', {headers})
  const releases = await res.json()
  const acc = []
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
      if (url.includes('linux-amd64')) {
        acc.push({os: "linux", arch: "amd64", version: m[1], url})
      } else
      if (url.includes('darwin-amd64')) {
        acc.push({os: "darwin", arch: "amd64", version: m[1], url})
      } else
      if (url.includes('macos-amd64')) {
        acc.push({os: "darwin", arch: "amd64", version: m[1], url})
      } else
      if (url.includes('windows-amd64')) {
        acc.push({os: "windows", arch: "amd64", version: m[1], url})
      } else {
        console.error(`skip(url): ${url}`)
      }
    }
  }
  console.log(JSON.stringify(acc, null, '  '))
})()
