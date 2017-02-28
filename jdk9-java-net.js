const fetch = require('node-fetch')
const cheerio = require('cheerio')

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection: ' + reason.stack)
  process.exit(1)
})

const minBuildNumber = 155
const baseURL = 'http://download.java.net/java/jdk9/archive'

fetch('https://jdk9.java.net/download/')
  .then((res) => {
    if (!res.ok) { throw new Error('' + res.status) }
    return res
  })
  .then((res) => res.text())
  .then((html) => {
    const $ = cheerio.load(html)
    const ee = []
    function resolve(v) {
      fetch(`http://www.java.net/download/java/jdk9/archive/${v}/binaries/jre-9-ea+${v}_windows-x86_bin.sha256`,
          {method: 'HEAD'})
        .then((res) => {
          if (res.ok) {
            ee.push(
              {os: 'darwin', arch: 'amd64', version: `1.9.0-${v}`, url: `${baseURL}/${v}/binaries/jdk-9-ea+${v}_osx-x64_bin.dmg`},
              {os: 'linux', arch: '386', version: `1.9.0-${v}`, url: `${baseURL}/${v}/binaries/jdk-9-ea+${v}_linux-x86_bin.tar.gz`},
              {os: 'linux', arch: 'amd64', version: `1.9.0-${v}`, url: `${baseURL}/${v}/binaries/jdk-9-ea+${v}_linux-x64_bin.tar.gz`},
              {os: 'windows', arch: 'amd64', version: `1.9.0-${v}`, url: `${baseURL}/${v}/binaries/jdk-9-ea+${v}_windows-x64_bin.exe`}
            )
          }
          if (!res.ok || v <= minBuildNumber) {
            console.log(JSON.stringify(ee, null, '  '))
            process.exit()
          }
          process.nextTick(resolve, v - 1)
        })
    }
    resolve(parseInt($('a.s').first().attr('href').match(/archive\/(\d+)\/binaries/)[1], 10))
  })

