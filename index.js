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
        cmp: (l, r) => semver.valid(l.key, true) && semver.valid(r.key, true)
          ? semver.compare(r.key, l.key, true) : l.key.localeCompare(r.key),
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
  const truncate = (o, key) => {
    const map = o[key]
    if (map) {
      o[key] = Object.keys(map).reduce((acc, k) => {
        const v = map[k]
        if (!~v.indexOf('oracle.com') && !~v.indexOf('java.net') && !~v.indexOf('ibm.com') && !~v.indexOf('zulu-pre')) {
          acc[k] = v
        }
        return acc
      }, {})
    }
  }
  Object.keys(data).forEach((key) => {
    const byArch = data[key]
    Object.keys(byArch).forEach((arch) => {
      truncate(byArch[arch], 'jdk')
      truncate(byArch[arch], 'jdk@sjre')
      truncate(byArch[arch], 'jdk@ibm')
      truncate(byArch[arch], 'jdk@zulu')
    })
  })
  return Promise.all([
    node('www-oracle-com-javase.js http://www.oracle.com/technetwork/java/javase/downloads/jdk9-downloads-3848520.html')
      .then((data) => ({ns: 'jdk', data})),
/*
    node('www-oracle-com-javase.js http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html')
      .then((data) => ({ns: 'jdk', data})),
*/
    node('www-oracle-com-javase.js http://www.oracle.com/technetwork/java/javase/downloads/server-jre9-downloads-3848530.html')
      .then((data) => ({ns: 'jdk@sjre', data})),
/*
    node('www-oracle-com-javase.js http://www.oracle.com/technetwork/java/javase/downloads/server-jre8-downloads-2133154.html')
      .then((data) => ({ns: 'jdk@sjre', data})),
*/
/*
    node('www-oracle-com-javase.js http://www.oracle.com/technetwork/java/javase/downloads/java-archive-javase8-2177648.html')
      .then((data) => ({ns: 'jdk', data})),
    node('www-oracle-com-javase.js http://www.oracle.com/technetwork/java/javase/downloads/java-archive-downloads-javase7-521261.html')
      .then((data) => ({ns: 'jdk', data})),
    node('www-oracle-com-javase.js http://www.oracle.com/technetwork/java/javase/downloads/java-archive-downloads-javase6-419409.html')
      .then((data) => ({ns: 'jdk', data})),
*/
    //node('jdk9-java-net.js').then((data) => ({ns: 'jdk', data})),
    node('zulu-org.js true').then((data) => ({ns: 'jdk@zulu', data})),
    //node('zulu-org-eap.js').then((data) => ({ns: 'jdk@zulu', data})),
    node('developer-ibm-com-javasdk.js true').then((data) => ({ns: 'jdk@ibm', data})),
    node('adoptopenjdk-net.js https://api.adoptopenjdk.net/openjdk8/releases').then((data) => ({ns: 'jdk@adopt', data})),
    node('adoptopenjdk-net.js https://api.adoptopenjdk.net/openjdk9/releases').then((data) => ({ns: 'jdk@adopt', data})),
    node('adoptopenjdk-net.js https://api.adoptopenjdk.net/openjdk9-openj9/releases').then((data) => ({ns: 'jdk@adopt-openj9', data})),
/*
    node('adoptopenjdk-net.js http://localhost:8000/adoptopenjdk-openjdk8.json').then((data) => ({ns: 'jdk@adopt', data})),
*/
  ]).then((nn) => {
    nn.forEach((n) => {
      n.data.forEach((e) => {
        const ns = e.ns || n.ns
        const block = data[e.os][e.arch] || (data[e.os][e.arch] = {})
        const vv = block[ns] || (block[ns] = {})
        vv[e.version] =
          (
          e.url.endsWith('.exe') ? 'exe+' :
          e.url.endsWith('.tar.gz') ? 'tgz+' :
          e.url.endsWith('.zip') ? 'zip+' :
          e.url.endsWith('.dmg') ? 'dmg+' :
          e.url.endsWith('.bin') && ~ns.indexOf('@ibm') ? 'ia+' :
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
      try {
        resolve(JSON.parse(stdout))
      } catch (e) {
        reject(new Error(`${cmd}: ${e.message}`))
      }
    })
  })
}
