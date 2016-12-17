const cheerio = require('cheerio')
const concat = require('concat-stream')
const fetch = require('node-fetch')
const stringify = require('json-stable-stringify')
const semver = require('semver')
const exec = require('child_process').exec

if (process.stdin.isTTY) {
  process.exit(1)
}

const stdin = process.stdin

stdin.resume()
stdin.setEncoding('utf8')
stdin.pipe(concat((data) => {
  next(JSON.parse(data)).then(
    (updatedData) => {
      console.log(stringify(updatedData, {
        cmp: (l, r) => semver.valid(l.key) && semver.valid(r.key)
          ? semver.compare(r.key, l.key) : l.key.localeCompare(r.key),
        space: 2
      }))
    }, 
    (err) => {
      console.error(err.stack)
      process.exit(1)
    }
  )
}))

function next(data) {
  return Promise.all([
    node('www-oracle-com-javase.js http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html')
      .then((data) => ({ns: 'jdk', data})),
    node('www-oracle-com-javase.js http://www.oracle.com/technetwork/java/javase/downloads/java-archive-javase8-2177648.html')
      .then((data) => ({ns: 'jdk', data})),
    node('www-oracle-com-javase.js http://www.oracle.com/technetwork/java/javase/downloads/java-archive-downloads-javase7-521261.html')
      .then((data) => ({ns: 'jdk', data})),
    node('www-oracle-com-javase.js http://www.oracle.com/technetwork/java/javase/downloads/java-archive-downloads-javase6-419409.html')
      .then((data) => ({ns: 'jdk', data})),
    node('jdk9-java-net.js').then((data) => ({ns: 'jdk', data})),
    node('zulu-org.js').then((data) => ({ns: 'jdk@zulu', data})),
    node('developer-ibm-com-javasdk.js').then((data) => ({ns: 'jdk@ibm', data}))
  ]).then((nn) => {
    nn.forEach((n) => {
      n.data.forEach((e) => {
        const block = data[e.os][e.arch] || (data[e.os][e.arch] = {})
        const vv = block[n.ns] || (block[n.ns] = {})
        vv[e.version] =
          (
          e.url.endsWith('.exe') ? 'exe+' :
          e.url.endsWith('.tar.gz') ? 'tgz+' :
          e.url.endsWith('.zip') ? 'zip+' :
          e.url.endsWith('.dmg') ? 'dmg+' :
          e.url.endsWith('.bin') && ~n.ns.indexOf('@ibm') ? 'ia+' :
          e.url.endsWith('.bin') ? 'bin+' : ''
          ) +
          e.url
      })
    })
    return data
  })
}

function node(cmd) {
  return new Promise((resolve, reject) => {
    exec(`node ${cmd}`, (err, stdout, stderr) => {
      if (err) {
        return reject(err)
      }
      resolve(JSON.parse(stdout))
    })
  })
}
