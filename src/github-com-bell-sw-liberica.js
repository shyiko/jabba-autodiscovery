// https://github.com/oracle/graal/releases

const fetch = require('node-fetch')

;(async () => {
  const headers = {}
  if (process.env.GITHUB_TOKEN) {
    headers['authorization'] = `token ${process.env.GITHUB_TOKEN}`
  }
  const res = await fetch('https://api.github.com/repos/bell-sw/liberica/releases', {headers})
  const releases = await res.json()
  const acc = []
  for (const release of releases) {
    for (const asset of release.assets || []) {
      const url = asset.browser_download_url
      // /bellsoft-jdk8u212-linux-aarch64.tar.gz
      // /bellsoft-jdk8u212-linux-amd64.tar.gz
      // /bellsoft-jdk8u212-linux-i586.tar.gz
      // /bellsoft-jdk8u212-macos-amd64.zip
      // /bellsoft-jdk8u212-windows-amd64.zip
      // /bellsoft-jdk8u212-windows-i586.zip
      // /bellsoft-jre8u212-...
      if (url.match(/-jre|-musl|-lite|\.rpm|\.deb|\.dmg|\.msi|\.bom|-solaris/) != null) {
        continue // noise
      }
      const m = url.replace(/\%2B/g, '+').match(/bellsoft-jdk([0-9u+.]+)-(linux|windows|macos)/)
      if (m == null) {
        console.error(`skip(url): ${url}`)
        continue
      }
      if (!url.endsWith('.tar.gz') && !url.endsWith('.zip')) {
        console.error(`skip(ext): ${url}`)
        continue
      }
      let version = m[1]
        .replace(/^(\d+)(\+.*)?$/, '$1.0.0$2')
      if (version == "1.8.0") {
        version = url.match(/\/(\d+u\d+)/)[1]
        if (version == null) {
          throw new Error(url)
        }
      }
      if (url.endsWith('linux-aarch64.tar.gz') || url.endsWith('linux-arm64.tar.gz')) {
        acc.push({os: "linux", arch: "arm64", version, url})
      } else
      if (url.endsWith('linux-arm32-vfp-hflt.tar.gz')) {
        acc.push({os: "linux", arch: "arm", version, url})
      } else
      if (url.endsWith('linux-amd64.tar.gz')) {
        acc.push({os: "linux", arch: "amd64", version, url})
      } else
      if (url.endsWith('linux-i586.tar.gz')) {
        acc.push({os: "linux", arch: "386", version, url})
      } else
      if (url.endsWith('macos-amd64.zip') || url.endsWith('macos-amd64.tar.gz')) {
        acc.push({os: "darwin", arch: "amd64", version, url})
      } else
      if (url.endsWith('windows-amd64.zip')) {
        acc.push({os: "windows", arch: "amd64", version, url})
      } else
      if (url.endsWith('windows-i586.zip')) {
        acc.push({os: "windows", arch: "386", version, url})
      } else {
        console.error(`skip(ending): ${url}`)
      }
    }
  }
  console.log(JSON.stringify(acc, null, '  '))
})()
