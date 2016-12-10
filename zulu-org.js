const fetch = require('node-fetch')
const cheerio = require('cheerio')

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection: ' + reason.stack)
  process.exit(1)
})

fetch('http://zulu.org/download/')
  .then((res) => {
    if (!res.ok) { throw new Error('' + res.status) }
    return res
  })
  .then((res) => res.text())
  .then((html) => {
    const $ = cheerio.load(html)
    const ee = []
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
      const v = $($td.get(0)).text().toLowerCase().trim().split('u')
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
      ee.push({
        os, arch: 'amd64', version: '1.' + v[0] + '.' + v[1], url
      })
    })
    console.log(JSON.stringify(ee, null, '  '))
  })

