const fetch = require('node-fetch')
const cheerio = require('cheerio')

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection: ' + reason.stack)
  process.exit(1)
})

fetch('http://zulu.org/zulu-9-pre-release-downloads/')
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
      const url = $('a.btn-zip', this).attr('href')
      if (!url) {
        return
      }
      const m = url.match(/zulu(\d+)[.](\d+)[.](\d+)[.](\d+)-ea/)
      if (!m) {
        return
      }
      const version = '1.' + m[1] + '.' + m[2] + '-' + m[4]
      if (url.endsWith('linux_x64.tar.gz')) {
        ee.push({
          os: 'linux',
          arch: 'amd64',
          version,
          url
        })
      } else
      if (url.endsWith('win_x64.zip')) {
        ee.push({
          os: 'windows',
          arch: 'amd64',
          version,
          url
        })
      } else
      if (url.endsWith('macosx_x64.zip')) {
        ee.push({
          os: 'darwin',
          arch: 'amd64',
          version,
          url
        })
      }
    })
    console.log(JSON.stringify(ee, null, '  '))
  })

