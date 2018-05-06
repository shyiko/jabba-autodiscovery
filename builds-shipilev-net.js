const fetch = require('node-fetch')
const cheerio = require('cheerio')

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection: ' + reason.stack)
  process.exit(1)
})

// 'https://builds.shipilev.net/openjdk-shenandoah-jdk8/'
const baseURL = process.argv[2]

fetch(baseURL)
  .then((res) => {
    if (!res.ok) { throw new Error('' + res.status) }
    return res
  })
  .then((res) => res.text())
  .then((html) => {
    const $ = cheerio.load(html)
    const ee = []
    const latest = {} // key -> {b,o}
    $('#list a').each(function (i, el) {
      const name = $(el).attr('href')
      const m = name.match(/^openjdk-shenandoah-jdk(\d+)-b(\d+)-(x86(?:_64)?|aarch64|arm32-hflt)-release.tar.xz$/)
      if (m != null) {
        const arch = m[3] == 'x86' ? '386' :
          m[3] == 'x86_64' ? 'amd64' :
          m[3] == 'aarch64' ? 'arm64' :
          m[3] == 'arm32-hflt' ? 'arm' : null
        if (arch != null) {
          const e = {
            os: 'linux',
            arch,
            version: `1.${m[1]}.0-${m[2]}`,
            url: `${baseURL}${name}`
          }
          ee.push(e)
          const build = +m[2]
          const latestKey = `linux,${arch}`
          if (latest[latestKey] == null || latest[latestKey].build < build) {
            latest[latestKey] = {
              build,
              e: Object.assign({}, e, {version: `1.${m[1]}.0`})
            }
          }
        }
      }
    })
    Object.keys(latest).forEach(function (k) { ee.push(latest[k].e) })
    console.log(JSON.stringify(ee, null, '  '))
  })

