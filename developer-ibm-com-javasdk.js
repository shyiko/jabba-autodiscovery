const fetch = require('node-fetch')
const cheerio = require('cheerio')

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection: ' + reason.stack)
  process.exit(1)
})

fetch('https://developer.ibm.com/javasdk/downloads/')
  .then((res) => {
    if (!res.ok) { throw new Error('' + res.status) }
    return res
  })
  .then((res) => res.text())
  .then((html) => {
    const $ = cheerio.load(html)
    const ee = []
    $('a.ibm-download-link').each(function () {
      const href = $(this).attr('href')
      if (/(i386|x86_64)(-archive)?.bin$/.test(href)) {
        const url = href.slice(href.lastIndexOf('&accepted_url=') + '&accepted_url='.length)
        if (~url.indexOf('sdk')) {
          const v = url.match(/\d+.\d+-\d+.\d+/)[0]
          ee.push({
            os: 'linux',
            arch: ~url.indexOf('x86_64') ? 'amd64' : '386',
            version: `1.${v}`,
            url
          })
        }
      }
    })
    console.log(JSON.stringify(ee, null, '  '))
  })

