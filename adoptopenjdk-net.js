const fetch = require('node-fetch')

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection: ' + reason.stack)
  process.exit(1)
})

const url = process.argv[2]
const latestRef = process.argv[3] === 'true'
const platformMap = {
  'Linux x64': {os: 'linux', arch: 'amd64'},
  'Linux aarch64': {os: 'linux', arch: 'arm64'},
  'macOS x64': {os: 'darwin', arch: 'amd64'},
  'Windows x64': {os: 'windows', arch: 'amd64'}
}
fetch(url)
  .then((res) => {
    if (!res.ok) { throw new Error('' + res.status) }
    return res
  })
  .then((res) => res.json())
  .then((res) => {
    const ee = []
    const cache = {}
    ;(Array.isArray(res) ? res : [res]).forEach((e) => {
      e.release_name // jdk8u152-b01 or jdk-9+181
      const m = e.release_name.match(/jdk(\d+)u(\d+)-b(\d+)/) ||
        (() => {
          const partial = e.release_name.match(/jdk-(\d+)\+(\d+)/)
          return partial == null ? partial : [partial[0], partial[1], 0, partial[2]]
        })()
      if (m == null) {
        console.error('Unexpected release name ' + e.release_name)
        process.exit(1)
      }
      const versionPrefix = `1.${m[1]}.${m[2]}`
      const version = `${versionPrefix}${m[3] == null ? '' : '-' + m[3]}`
      const pushVersionPrefix = latestRef && !cache[versionPrefix]
      cache[versionPrefix] = true
      e.binaries.forEach((b) => {
        const o = platformMap[b.platform]
        if (o != null) {
          if (pushVersionPrefix) {
            ee.push(Object.assign({}, o, {
              version: versionPrefix,
              url: b.binary_link
            }))
          }
          ee.push(Object.assign({}, o, {
            version,
            url: b.binary_link
          }))
        }
      })
    });
    console.log(JSON.stringify(ee, null, '  '))
  })
