const fetch = require('node-fetch')
const fetch2xx = _ => _.ok ? _ : _.buffer().then(_ => { throw new Error(`${_.status}`) })
const platformMap = {
  'Linux x64': {os: 'linux', arch: 'amd64'},
  'Linux aarch64': {os: 'linux', arch: 'arm64'},
  'macOS x64': {os: 'darwin', arch: 'amd64'},
  'Windows x64': {os: 'windows', arch: 'amd64'}
}

;(async (url) => {
  const json = await fetch(url)
    .then(fetch2xx)
    .then(_ => _.headers.get('content-type').includes('application/json') ? _.json() : [])
  const ee = []
  ;(Array.isArray(json) ? json : [json]).forEach((e) => {
    // jdk8u152-b01 or jdk-9+181
    const version = e.release_name.replace(/^jdk-?/, '')
      .replace(/_openj9-.*/, '')
    e.binaries.forEach((b) => {
      const platform = platformMap[b.platform]
      if (platform != null) {
        ee.push({...platform, ...{version, url: b['binary_link']}})
      } else {
        console.error(`skip(arch): ${b.platform}`)
      }
    })
  });
  console.log(JSON.stringify(ee, null, '  '))
})(process.argv[2])
