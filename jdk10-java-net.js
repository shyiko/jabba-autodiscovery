const fetch = require('node-fetch')
const cheerio = require('cheerio')

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection: ' + reason.stack)
  process.exit(1)
})

// const minBuildNumber = 40
const baseURL = 'http://download.java.net/java/jdk10/archive'

fetch('http://jdk.java.net/10/')
  .then((res) => {
    if (!res.ok) { throw new Error('' + res.status) }
    return res
  })
  .then((res) => res.text())
  .then((html) => {
    const $ = cheerio.load(html)
    const ee = []
    function resolve(v) {
      fetch(`http://download.java.net/java/jdk10/archive/${v}/BCL/jre-10+${v}_windows-x64_bin.exe.sha256`,
          {method: 'HEAD'})
        .then((res) => {
          if (res.ok) {
            ee.push(
              {os: 'darwin', arch: 'amd64', version: `1.10.0-${v}`, url: `${baseURL}/${v}/BCL/jdk-10+${v}_osx-x64_bin.dmg`},
              // {os: 'linux', arch: '386', version: `1.10.0-${v}`, url: `${baseURL}/${v}/BCL/jdk-9+${v}_linux-x86_bin.tar.gz`},
              {os: 'linux', arch: 'amd64', version: `1.10.0-${v}`, url: `${baseURL}/${v}/BCL/jdk-10+${v}_linux-x64_bin.tar.gz`},
              {os: 'windows', arch: 'amd64', version: `1.10.0-${v}`, url: `${baseURL}/${v}/BCL/jdk-10+${v}_windows-x64_bin.exe`}
              // {os: 'linux', arch: 'arm', version: `1.10.0-${v}`, url: `${baseURL}/${v}/BCL/jdk-9+${v}_linux-arm32-vfp-hflt_bin.tar.gz`},
              // {os: 'linux', arch: 'arm64', version: `1.10.0-${v}`, url: `${baseURL}/${v}/BCL/jdk-9+${v}_linux-arm64-vfp-hflt_bin.tar.gz`}
            )
          }
          //if (!res.ok || v <= minBuildNumber) {
          if (true) {
            console.log(JSON.stringify(ee, null, '  '))
            process.exit()
          }
          process.nextTick(resolve, v - 1)
        })
    }
    resolve(parseInt($('.sha > a').first().attr('href').match(/archive\/(\d+)\/GPL/)[1], 10))
  })

