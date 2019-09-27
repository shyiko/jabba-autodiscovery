const fetch = require('node-fetch')
const fetch2xx = _ => _.ok ? _ : _.buffer().then(_ => { throw new Error(`${_.status}`) })

;(async () => {
  const json = await fetch('https://raw.githubusercontent.com/shyiko/jabba/master/index.json')
    .then(fetch2xx).then(_ => _.json())
  const ee = []
  for (const os of Object.keys(json)) {
    for (const arch of Object.keys(json[os])) {
      for (const u of Object.values(json[os][arch]['jdk@zulu'] || {})) {
        const url = u.replace(/^[a-z]+\+http/, 'http')
        let versionMatch = url.match(/(?:jdk|ezdk-)([^\/]*)-(?:linux|win|mac)/) ||
          url.match(/(?:zulu)([^\/]*)-(?:linux|win|mac)/)
        if (!versionMatch) {
          console.error(url)
          process.exit(1)
        }
        if (url.includes('-ea-')) {
          continue
        }
        const version = versionMatch[1]
          .replace(/^([678])[.]0[.]/, '$1u')
          .replace(/^1.([678])[.]0_(\d+).*/, '$1u$2')
          .replace(/^1.([678])[.]0-.*/, '$1')
          .replace(/^(1\d+)$/, '$1.0.0')
        ee.push({os, arch, version, url: url.replace('http://', 'https://')})
      }
    }
  }
  console.log(JSON.stringify(ee, null, '  '))
})()
