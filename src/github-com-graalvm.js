// https://github.com/oracle/graal/releases

const fetch = require('node-fetch')

;(async (repo) => {
  const headers = {}
  if (process.env.GITHUB_TOKEN) {
    headers['authorization'] = `token ${process.env.GITHUB_TOKEN}`
  }
  const mm = new Map()
  const ee = []
  let page = 1
  let releases
  do {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases?page=${page}&per_page=100`, { headers })
    releases = await res.json()
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
            url.includes('linux-aarch64') ? 'linux' :
              url.includes('darwin-amd64') || url.includes('macos-amd64') ? 'darwin' :
                url.includes('windows-amd64') ? 'windows' : null
        )
        const arch = url.includes('aarch64') ? 'arm64' : 'amd64'
        const version = m[1].replace(/^(\d+[.]\d+[.]\d+)[.]\d+$/, '$1')
        const javaVersionMatch = url.match(/-java(\d+)-/)
        const ns = javaVersionMatch != null ? `graalvm-ce-java${javaVersionMatch[1]}` : 'graalvm-ce-java8'
        const key = `${ns}${os}${arch}${version}`
        if (!os) {
          console.error(`skip(url): ${url}`)
          continue
        }
        if (!mm.has(key)) {
          mm.set(key, url)
          ee.push({ ns, os, arch, version, url })
          ee.push({ ns: 'graalvm-ce', os, arch, version, url }) // backward-compat
        } else {
          console.error(`skip(dup): ${url} (keeping ${mm.get(key)})`)
        }
      }
    }
    page++
  } while (releases.length == 100)
  console.log(JSON.stringify(ee, null, '  '))
})(process.argv[2])
