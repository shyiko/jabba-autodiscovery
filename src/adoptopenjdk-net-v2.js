const fetch = require('node-fetch')
const fetch2xx = _ => _.ok ? _ : _.buffer().then(_ => { throw new Error(`${_.status}`) })
const platformMap = {
  'linux/x64': {os: 'linux', arch: 'amd64'},
  'linux/aarch64': {os: 'linux', arch: 'arm64'},
  'mac/x64': {os: 'darwin', arch: 'amd64'},
  'windows/x64': {os: 'windows', arch: 'amd64'}
}

;(async (url) => {
  const json = await fetch(url)
    .then(fetch2xx)
    .then(_ => _.headers.get('content-type').includes('application/json') ? _.json() : [])
  const ee = []
  const cache = {}
  ;(Array.isArray(json) ? json : [json])
    .sort((l, r) => r.timestamp.localeCompare(l.timestamp)) // latest wins
    .forEach((e) => {
    // jdk8u152-b01 or jdk-9+181
    const version = e.release_name.replace(/^jdk-?/, '')
      .replace(/_openj9-.*/, '')
    e.binaries
      .sort((l, r) => r.updated_at.localeCompare(l.updated_at)) // latest wins
      .forEach((b) => {
      if (b.binary_type !== 'jdk') {
        console.error(`skip(binary_type): ${b.binary_type}`)
        return
      }
      if (b.heap_size !== 'normal') {
        console.error(`skip(heap_size): ${b.heap_size}`)
        return
      }
      const q = b.os + '/' + b.architecture
      const platform = platformMap[q]
      if (platform == null) {
        console.error(`skip(qualifier): ${q}`)
        return
      }
      const vm = b.openjdk_impl
      const ns = (
        vm === 'openj9' ? 'adoptopenjdk-openj9' :
        vm === 'hotspot' || vm == 'jdk' ? 'adoptopenjdk' :
        null
      )
      if (ns == null) {
        console.error(`skip(vm): ${vm}`)
        return
      }
      const ne = {ns, version, ...platform}
      const cacheKey = JSON.stringify(ne)
      if (cache[cacheKey]) {
        console.error(`skip(conflict): ${e.release_name} superseded by ${cache[cacheKey]} (${cacheKey})`)
        return
      }
      ee.push({...ne, url: b['binary_link']})
      cache[cacheKey] = e.release_name
    })
  });
  console.log(JSON.stringify(ee, null, '  '))
})(process.argv[2])
