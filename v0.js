const stringify = require('json-stable-stringify')
const naturalSort = require('./src/natural-sort')

const v0nsbyv1 = {
  'oracle-jdk': 'jdk',
  'oracle-server-jre': 'jdk@sjre',
  'graalvm-ce': 'jdk@graalvm',
  'adoptopenjdk': 'jdk@adopt',
  'adoptopenjdk-openj9': 'jdk@adopt-openj9',
  'ibm-sdk': 'jdk@ibm',
  'openjdk': 'jdk@openjdk',
  'openjdk-shenandoah': 'jdk@openjdk-shenandoah',
  'openjdk-ri': 'jdk@openjdk-ri',
  'zulu-embedded': 'jdk@zulu',
  'zulu': 'jdk@zulu',
  'amazon-corretto': 'jdk@amazon-corretto',
  'liberica': 'jdk@liberica',
}

module.exports = (nn) => {
  const index = {}
  nn.forEach((n) => {
    (n.data || n).forEach((e) => {
      const require = e.require || n.require
      if (require != null && require.length) {
        return // not supported by jabba@<1.0.0
      }
      const ns = v0nsbyv1[e.ns || n.ns]
      if (ns == null) {
        console.error(`Unable to resolve ns from ${e.ns || n.ns}`)
        process.exit(1)
      }
      const os = index[e.os] || (index[e.os] = {})
      const arch = os[e.arch] || (os[e.arch] = {})
      const provider = arch[ns] || (arch[ns] = {})
      const type = (
        e.url.endsWith('.exe') ? 'exe+' :
        e.url.endsWith('.tar.gz') || e.url.endsWith('.tgz') ? 'tgz+' :
        e.url.endsWith('.tar.xz') || e.url.endsWith('.tgx') || e.url.endsWith('.txz') ? 'tgx+' :
        e.url.endsWith('.zip') ? 'zip+' :
        e.url.endsWith('.dmg') ? 'dmg+' :
        e.url.endsWith('.bin') && ns.includes('ibm') ? 'ia+' :
        e.url.endsWith('.bin') ? 'bin+' : null
      )
      if (type == null) {
        console.error(`Unable to determine <type>+ of ${e.url}`)
        process.exit(1)
      }
      let version = e.version
      let m = version.match(/^(\d+)u(\d+)(?:-b(\d+))?$/)
      // 8u171-b11
      if (m != null && (
        ns === 'jdk@zulu' ||
        ns === 'jdk@sjre' ||
        ns === 'jdk' ||
        // ns === 'jdk@adopt' ||
        // ns === 'jdk@adopt-openj9' ||
        ns === 'jdk@openjdk-ri' ||
        ns === 'jdk@liberica'
      )) {
        version = `1.${m[1]}.${m[2]}`
      } else
      // 9.0.4+12
      if (
        ns === 'jdk@adopt' ||
        ns === 'jdk@adopt-openj9' ||
        ns === 'jdk@openjdk-ri' ||
        ns === 'jdk@liberica'
      ) {
        m = m || version.match(/^(\d+)(?:.(\d+))?(?:.(\d+))?(?:\+(.+))?$/)
        version = `1.${m[1]}.${m[2]}${m[3] ? `-${m[3]}` : ''}`
      } else
      if (ns === 'jdk@amazon-corretto') { // 8.212.04.2 or 11.0.3.7.1
        m = version.match(/^(\d+).(\d+).(\d+).(\d+)$/)
        if (m != null) {
          version = `1.${m[1]}.${m[2]}-${m[3]}.${m[4]}`
        } else {
          m = version.match(/^(\d+).(\d+).(\d+).(\d+).(\d+)$/)
          version = `1.${m[1]}.${m[2]}-${m[3]}.${m[4]}.${m[5]}`
        }
      } else
        // openjdk-ri: 11+28 or 8u40-b25
      if (ns === 'jdk@ibm') { // 1.2.3.4
        m = version.match(/^(\d+).(\d+).(\d+).(\d+)$/)
        version = `1.${m[1]}.${m[2]}-${m[3]}.${m[4]}`
      } else
      if (ns === 'jdk@openjdk-shenandoah') { // 10-b242
        m = version.match(/^(\d+)$/)
        version = `1.${m[1]}.0`
      } else
      if (ns === 'jdk@graalvm') { // 1.0.0-rc1
        version = version.replace('-rc', '-').replace(/-dev-b0?/, '-')
      } else {
        let m = version.match(/^(\d+)(?:.(\d+))?(?:.(\d+))?(?:-([^\+]+))?(?:\+(.+))?$/) // 10.0.1+10 or 11-ea+15
        if (m == null) {
          console.error(`Unexpected version format (${ns}:${e.version})`)
          process.exit(1)
        }
        const pre = m[4]
        if (pre === 'zgcea' || pre === 'valhallaea') {
          return // not supported by jabba@<1.0.0
        }
        if (pre === 'ea') {
          version = `1.${m[1]}.0-${m[5] || 0}`
        } else {
          version = `1.${m[1]}.0${m[3] ? `-${m[3]}` : ''}`
        }
      }
      if (ns === 'jdk@zulu') {
        version = version.replace(/([^0-9])0+(\d+)/g, '$1$2')
      }
      if ((ns === 'jdk@adopt' || ns === 'jdk@adopt-openj9') && !version.includes('-')) {
        version = `${version}-0`
      }
      const url = type + e.url
      if (provider[version] != null && provider[version] !== url) {
        console.error(`overriding ${provider[version]} with ${url}`)
      }
      provider[version] = url
    })
  })
  for (const os of Object.keys(index)) {
    for (const arch of Object.keys(index[os])) {
      for (const provider of Object.keys(index[os][arch])) {
        let ranges = []
        if (
          provider === 'jdk' ||
          provider === 'jdk@sjre' ||
          provider === 'jdk@openjdk' ||
          provider === 'jdk@openjdk-ri' ||
          provider === 'jdk@zulu' ||
          provider === 'jdk@liberica'
        ) {
          // 1.10.0-1 -> 1.10.0
          ranges = [
            { k: '1.13', v: '1.13.0' },
            { k: '1.12', v: '1.12.0' },
            { k: '1.11', v: '1.11.0' },
            { k: '1.10', v: '1.10.0' },
            { k: '1.9', v: '1.9.0' }
          ]
        } else
        if (provider === 'jdk@ibm') {
          // jdk@ibm 1.8.0-5.16 -> 1.8.0 (same for 1.7/1.6)
          ranges = [
            { k: '1.8', v: '1.8.0' },
            { k: '1.7.0', v: '1.7.0' },
            { k: '1.7.1', v: '1.7.1' },
            { k: '1.6', v: '1.6.0' }]
        }
        if (ranges.length) {
          const block = index[os][arch][provider]
          const kk = Object.keys(block)
          for (const range of ranges) {
            const s = kk.filter((k) => k.startsWith(range.k)).sort(naturalSort)
            if (s.length) {
              const url = block[s[s.length - 1]]
              if (!url.includes('-ea-') && !url.includes('-ea+')) {
                block[range.v] = url
              }
            }
          }
        }
      }
    }
  }
  return index
}

if (module.parent == null) {
  const index = module.exports(
    JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'))
  )
  console.log(stringify(index, {
    cmp: (l, r) => naturalSort(r.key, l.key),
    space: 2
  }))
}
