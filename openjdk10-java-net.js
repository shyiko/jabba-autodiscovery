const fetch = require('node-fetch')
const cheerio = require('cheerio')

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection: ' + reason.stack)
  process.exit(1)
})

// const minBuildNumber = 40
const baseURL = 'https://download.java.net/java/GA/jdk10'

fetch('http://jdk.java.net/10/')
  .then((res) => {
    if (!res.ok) { throw new Error('' + res.status) }
    return res
  })
  .then((res) => res.text())
  .then((html) => {
    const $ = cheerio.load(html)
    const ee = []
    function resolve(v, hash) {
      // https://download.java.net/java/GA/jdk10/10.0.1/fb4372174a714e6b8c52526dc134031e/10/openjdk-10.0.1_windows-x64_bin.tar.gz.sha256
      fetch(`https://download.java.net/java/GA/jdk10/${v}/${hash}/10/openjdk-${v}_windows-x64_bin.tar.gz.sha256`,
          {method: 'HEAD'})
        .then((res) => {
          if (res.ok) {
            let version
            version = `1.10.0`
            ee.push(
              {os: 'darwin', arch: 'amd64', version, url: `${baseURL}/${v}/${hash}/10/openjdk-${v}_osx-x64_bin.tar.gz`},
              // {os: 'linux', arch: '386', version: `1.10.0-${v}`, url: `${baseURL}/${v}/BCL/jdk-9+${v}_linux-x86_bin.tar.gz`},
              {os: 'linux', arch: 'amd64', version, url: `${baseURL}/${v}/${hash}/10/openjdk-${v}_linux-x64_bin.tar.gz`},
              {os: 'windows', arch: 'amd64', version, url: `${baseURL}/${v}/${hash}/10/openjdk-${v}_windows-x64_bin.tar.gz`}
              // {os: 'linux', arch: 'arm', version: `1.10.0-${v}`, url: `${baseURL}/${v}/BCL/jdk-9+${v}_linux-arm32-vfp-hflt_bin.tar.gz`},
              // {os: 'linux', arch: 'arm64', version: `1.10.0-${v}`, url: `${baseURL}/${v}/BCL/jdk-9+${v}_linux-arm64-vfp-hflt_bin.tar.gz`}
            )
            version = `1.10.0-${v.match(/(\d+)/g)[2]}`
            ee.push(
              {os: 'darwin', arch: 'amd64', version, url: `${baseURL}/${v}/${hash}/10/openjdk-${v}_osx-x64_bin.tar.gz`},
              // {os: 'linux', arch: '386', version: `1.10.0-${v}`, url: `${baseURL}/${v}/BCL/jdk-9+${v}_linux-x86_bin.tar.gz`},
              {os: 'linux', arch: 'amd64', version, url: `${baseURL}/${v}/${hash}/10/openjdk-${v}_linux-x64_bin.tar.gz`},
              {os: 'windows', arch: 'amd64', version, url: `${baseURL}/${v}/${hash}/10/openjdk-${v}_windows-x64_bin.tar.gz`}
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
    const href = $('.sha > a').first().attr('href')
    resolve(href.match(/jdk10\/(\d+.\d+.\d+)\//)[1], href.match(/jdk10\/\d+.\d+.\d+\/([^\/]+)/)[1])
  })

