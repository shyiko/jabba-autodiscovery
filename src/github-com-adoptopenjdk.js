const fetch = require('node-fetch')
const fetch2xx = _ => _.ok ? _ : _.buffer().then(_ => { throw new Error(`${_.status}`) })

// e.g. https://raw.githubusercontent.com/AdoptOpenJDK/openjdk8-releases/master/releases.json
;(async (url) => {
  const json = await fetch(url).then(fetch2xx).then(_ => _.json())
  const ee = []
  for (const e of json) {
    // jdk8u152-b01 or jdk-9+181
    const version = e.tag_name.replace(/^jdk-?/, '')
      .replace(/_openj9-.*/, '')
    for (const asset of e.assets) {
      const url = asset.browser_download_url
      if (!url.endsWith(".tar.gz") && !url.endsWith(".zip")) {
        if (!url.endsWith(".txt")) {
          console.error(`skip(url): ${url}`)
        }
        continue
      }
      const o = url.includes('x64_Linux') ? {os: 'linux', arch: 'amd64'} :
        url.includes('aarch64_Linux') ? {os: 'linux', arch: 'arm64'} :
        url.includes('x64_Mac') ? {os: 'darwin', arch: 'amd64'} :
        url.includes('x64_Win') ? {os: 'windows', arch: 'amd64'} :
        null
      if (o == null) {
        console.error(`skip(os/arch): ${url}`)
        continue
      }
      ee.push({...o, version, url})
    }
  }
  console.log(JSON.stringify(ee, null, '  '))
})(process.argv[2])
