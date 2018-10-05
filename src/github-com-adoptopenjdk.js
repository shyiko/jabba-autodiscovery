const fetch = require('node-fetch')
const fetch2xx = _ => _.ok ? _ : _.buffer().then(_ => { throw new Error(`${_.status}`) })

// e.g. https://raw.githubusercontent.com/AdoptOpenJDK/openjdk8-releases/master/releases.json
;(async (url, openj9) => {
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
      if (url.includes('jre_')) {
        console.error(`skip(jre): ${url}`)
        continue
      }
      if (url.includes('linuxXL') || !(openj9 ^ !url.includes('openj9'))) {
        console.error(`skip(qualifier): ${url}`)
        continue
      }
      const o = url.toLowerCase().includes('x64_linux') ? {os: 'linux', arch: 'amd64'} :
        url.toLowerCase().includes('aarch64_linux') ? {os: 'linux', arch: 'arm64'} :
        url.toLowerCase().includes('x64_mac') ? {os: 'darwin', arch: 'amd64'} :
        url.toLowerCase().includes('x64_win') ? {os: 'windows', arch: 'amd64'} :
        null
      if (o == null) {
        console.error(`skip(os/arch): ${url}`)
        continue
      }
      ee.push({
        ...o,
        version: version.replace(/^(\d+)(\+.*)?$/, '$1.0.0$2'),
        url
      })
    }
  }
  console.log(JSON.stringify(ee, null, '  '))
})(process.argv[2], process.argv[3] === 'openj9')
