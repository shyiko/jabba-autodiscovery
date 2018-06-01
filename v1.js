const stringify = require('json-stable-stringify')
const naturalSort = require('./src/natural-sort')

module.exports = (nn) => {
  const index = {}
  nn.forEach((n) => {
    (n.data || n).forEach((e) => {
      const ns = e.ns || n.ns
      const require = e.require || n.require
      const os = index[e.os] || (index[e.os] = {})
      const arch = os[e.arch] || (os[e.arch] = {})
      const provider = arch[ns] || (arch[ns] = {})
      /*
      if (e.tag) {
        const tags = provider.tags || (provider.tags = {})
        tags[e.tag] = e.version
        return
      }
      */
      const releases = provider.releases || (provider.releases = {})
      const url = e.url
      if (releases[e.version] != null && releases[e.version].url !== url) {
        console.error(`overriding ${releases[e.version].url} with ${url}`)
      }
      releases[e.version] = {url, require}
    })
  })
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
