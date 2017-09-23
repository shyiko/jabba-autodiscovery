const fetch = require('node-fetch')
const cheerio = require('cheerio')

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection: ' + reason.stack)
  process.exit(1)
})

const latestRef = process.argv[2] === 'true'

fetch('http://zulu.org/download/')
  .then((res) => {
    if (!res.ok) { throw new Error('' + res.status) }
    return res
  })
  .then((res) => res.text())
  .then((html) => {
    const $ = cheerio.load(html)
    const ee = []
    const cache = {}
    $('table > tbody > tr').each(function () {
      const $td = $(this).children()
      const url = $('a.btn-zip', this).attr('data-url-download')
      if (!url) {
        return
      }
      const type = $($td.get(5)).text().toLowerCase().trim()
      if (type !== 'jdk') {
        return
      }
      const vr = $($td.get(0)).text().toLowerCase().trim()
      const v = vr.includes('u') ? vr.split('u') : vr.split('.')

      const versionPrefix = `1.${v[0]}.${v[1]}`
      const version = `${versionPrefix}${
        v[2] == null ? '' : '-' + v[2]}`
      const pushVersionPrefix = latestRef && !cache[versionPrefix]
      cache[versionPrefix] = true

      const platform = $($td.get(1)).text().toLowerCase().trim()
      const arch = $($td.get(3)).text().toLowerCase().trim()
      if (arch !== 'intel x64') {
        return
      }
      const os = platform === 'mac' ? 'darwin' :
        platform === 'linux' || platform === 'windows' ? platform : null
      if (!os) {
        return
      }
      if (pushVersionPrefix) {
        ee.push({
          os, arch: 'amd64', version: versionPrefix, url
        })
      }
      ee.push({
        os, arch: 'amd64', version, url
      })
    })
    console.log(JSON.stringify(ee, null, '  '))
  })

