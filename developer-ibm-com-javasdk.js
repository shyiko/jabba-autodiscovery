const fetch = require('node-fetch')
const cheerio = require('cheerio')

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection: ' + reason.stack)
  process.exit(1)
})

const latestRef = process.argv[2] === 'true'

function list(url) {
  return fetch(url)
    .then((res) => {
      if (!res.ok) { throw new Error(url + ' ' + res.status) }
      return res
    })
    .then((res) => res.text())
    .then((html) => {
      const $ = cheerio.load(html)
      const links = []
      $('img[alt="[DIR]"],[alt="[   ]"]').each(function () {
        const href = $(this).next().attr('href')
        href && links.push(href)
      })
      return {
        url,
        links
      }
    })
}

list('http://public.dhe.ibm.com/ibmdl/export/pub/systems/cloud/runtimes/java/')
  .then(({links}) => {
    const cache = {}
    return links.reduce((p, r) => {
      const m = r.match(/(\d+.\d+.\d+.\d+)\//)
      if (m) {
        const ref = m[1]
/*
        if (ref !== '8.0.3.22') {
          return p
        }
*/
        const split = ref.split('.')
        const versionPrefix = `1.${split[0]}.${split[1]}`
        const version = `${versionPrefix}-${split[2]}.${split[3]}`
        const pushVersionPrefix = latestRef && !cache[versionPrefix]
        cache[versionPrefix] = true
        return p
          .then((state) =>
            list(`http://public.dhe.ibm.com/ibmdl/export/pub/systems/cloud/runtimes/java/${ref}/linux/x86_64/`)
              .catch(() => list(`http://public.dhe.ibm.com/ibmdl/export/pub/systems/cloud/runtimes/java/${ref}/linux/x64/`))
              .then(({url, links}) => {
                const ll = links.filter((v) => v.startsWith('ibm-java-sdk-'))
                if (ll.length != 1) {
                  console.error("Unexpected content of " + url)
                  process.exit(1)
                }
                let r = state
                if (pushVersionPrefix) {
                  r = r.concat({
                    os: 'linux',
                    arch: 'amd64',
                    version: versionPrefix,
                    url: url + ll[0]
                  })
                }
                return r.concat({
                  os: 'linux',
                  arch: 'amd64',
                  version,
                  url: url + ll[0]
                })
              })
          )
          .then((state) =>
            list(`http://public.dhe.ibm.com/ibmdl/export/pub/systems/cloud/runtimes/java/${ref}/linux/i386/`)
              .catch(() => list(`http://public.dhe.ibm.com/ibmdl/export/pub/systems/cloud/runtimes/java/${ref}/linux/x86/`))
              .then(({url, links}) => {
                const ll = links.filter((v) => v.startsWith('ibm-java-sdk-'))
                if (ll.length != 1) {
                  console.error("Unexpected content of " + url)
                  process.exit(1)
                }
                let r = state
                if (pushVersionPrefix) {
                  r = r.concat({
                    os: 'linux',
                    arch: '386',
                    version: versionPrefix,
                    url: url + ll[0]
                  })
                }
                return r.concat({
                  os: 'linux',
                  arch: '386',
                  version,
                  url: url + ll[0]
                })
              })
          )
      }
      return p
    }, Promise.resolve([]))
  })
  .then((ee) => {
    console.log(JSON.stringify(ee, null, '  '))
  })

/*
fetch('https://developer.ibm.com/javasdk/downloads/sdk8/')
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
*/
