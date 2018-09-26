const stringify = require('json-stable-stringify')
const naturalSort = require('./natural-sort')
const exec = require('child_process').exec

process.on('unhandledRejection', (e) => { throw e }) // fail process

module.exports = async (m = _ => _) => {
  const nn = await Promise.all([
    node('github-com-oracle-graal.js')
      .then((data) => ({ns: 'graalvm-ce', data})),
    node('oracle-com-labs.js')
      .then((data) => ({ns: 'graalvm-ee', require: ['otn-account'], data})),
    node('github-com-shyiko-jabba-index-zulu.js')
      .then((data) => ({ns: 'zulu', data})),
    node('azul-com.js https://www.azul.com/downloads/zulu/zulu-linux/')
      .then((data) => ({ns: 'zulu', data})),
    node('azul-com.js https://www.azul.com/downloads/zulu/zulu-windows/')
      .then((data) => ({ns: 'zulu', data})),
    node('azul-com.js https://www.azul.com/downloads/zulu/zulu-mac/')
      .then((data) => ({ns: 'zulu', data})),
    node('zulu-org.js https://zulu.org/download/?show=all')
      .then((data) => ({ns: 'zulu', data})),
    node('azul-com.js https://www.azul.com/downloads/zulu-embedded/')
      .then((data) => ({ns: 'zulu-embedded', data})),
    // api.adoptopenjdk.net is constantly down
    node('github-com-adoptopenjdk.js https://raw.githubusercontent.com/AdoptOpenJDK/openjdk8-releases/master/releases.json')
      .then((data) => ({ns: 'adoptopenjdk', data})),
    node('github-com-adoptopenjdk.js https://raw.githubusercontent.com/AdoptOpenJDK/openjdk8-openj9-releases/master/releases.json')
      .then((data) => ({ns: 'adoptopenjdk-openj9', data})),
    node('github-com-adoptopenjdk.js https://raw.githubusercontent.com/AdoptOpenJDK/openjdk9-releases/master/releases.json')
      .then((data) => ({ns: 'adoptopenjdk', data})),
    node('github-com-adoptopenjdk.js https://raw.githubusercontent.com/AdoptOpenJDK/openjdk9-openj9-releases/master/releases.json')
      .then((data) => ({ns: 'adoptopenjdk-openj9', data})),
/*
    node('github-com-adoptopenjdk.js https://raw.githubusercontent.com/AdoptOpenJDK/openjdk10-releases/master/releases.json')
      .then((data) => ({ns: 'adoptopenjdk', data})),
*/
/*
    node('adoptopenjdk-net.js https://api.adoptopenjdk.net/openjdk8/releases')
      .then((data) => ({ns: 'adoptopenjdk', data})),
    node('adoptopenjdk-net.js https://api.adoptopenjdk.net/openjdk8-openj9/releases')
      .then((data) => ({ns: 'adoptopenjdk-openj9', data})),
    node('adoptopenjdk-net.js https://api.adoptopenjdk.net/openjdk9/releases')
      .then((data) => ({ns: 'adoptopenjdk', data})),
    node('adoptopenjdk-net.js https://api.adoptopenjdk.net/openjdk9-openj9/releases')
      .then((data) => ({ns: 'adoptopenjdk-openj9', data})),
    node('adoptopenjdk-net.js https://api.adoptopenjdk.net/openjdk10/releases')
      .then((data) => ({ns: 'adoptopenjdk', data})),
*/
    // todo: Project Amber (https://adoptopenjdk.net/nightly.html?variant=amber)
    node('builds-shipilev-net.js https://builds.shipilev.net/openjdk-shenandoah-jdk8/')
      .then((data) => ({ns: 'openjdk-shenandoah', data})),
    node('builds-shipilev-net.js https://builds.shipilev.net/openjdk-shenandoah-jdk10/')
      .then((data) => ({ns: 'openjdk-shenandoah', data})),
    node('builds-shipilev-net.js https://builds.shipilev.net/openjdk-shenandoah-jdk11/')
      .then((data) => ({ns: 'openjdk-shenandoah', data})),
    node('public-dhe-ibm-com.js')
      .then((data) => ({ns: 'ibm-sdk', data})),
    // todo: Alpine Linux	variant
    // todo: JavaDocs
    node('jdk-java-net.js https://jdk.java.net/10/'),
    node('jdk-java-net.js https://jdk.java.net/11/'),
    node('jdk-java-net.js https://jdk.java.net/12/'),
    node('jdk-java-net.js https://jdk.java.net/valhalla/'),
    // node('jdk-java-net.js https://jdk.java.net/zgc/'), // incorporated in JDK 11-ea+18
    node('jdk-java-net.js https://jdk.java.net/archive/'),
    // todo: https://www.oracle.com/technetwork/java/javase/downloads/tzupdater-download-513681.html
    // todo: https://www.oracle.com/technetwork/java/javase/documentation/jdk10-doc-downloads-4417029.html
    // todo: https://www.oracle.com/technetwork/java/javase/documentation/jdk8-doc-downloads-2133158.html
    node('oracle-com-javase.js https://www.oracle.com/technetwork/java/javase/downloads/java-archive-javase10-4425482.html')
      .then((data) => ({require: ['otn-account'], data})),
    node('oracle-com-javase.js https://www.oracle.com/technetwork/java/javase/downloads/java-archive-javase9-3934878.html')
      .then((data) => ({require: ['otn-account'], data})),
    node('oracle-com-javase.js https://www.oracle.com/technetwork/java/javase/downloads/java-archive-javase8-2177648.html')
      .then((data) => ({require: ['otn-account'], data})),
    node('oracle-com-javase.js https://www.oracle.com/technetwork/java/javase/downloads/java-archive-downloads-javase7-521261.html')
      .then((data) => ({require: ['otn-account'], data})),
    node('oracle-com-javase.js https://www.oracle.com/technetwork/java/javase/downloads/java-archive-downloads-javase6-419409.html')
      .then((data) => ({require: ['otn-account'], data})),
    node('oracle-com-javase.js https://www.oracle.com/technetwork/java/javase/downloads/jdk10-downloads-4416644.html'),
    node('oracle-com-javase.js https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html'),
    node('oracle-com-javase.js https://www.oracle.com/technetwork/java/javase/downloads/sjre10-downloads-4417025.html'),
    node('oracle-com-javase.js https://www.oracle.com/technetwork/java/javase/downloads/server-jre8-downloads-2133154.html'),
    node('support-apple-com.js')
  ]).catch((err) => {
    console.error(err)
    process.exit(1)
  })
  console.log(stringify(m(nn), {
    cmp: (l, r) => naturalSort(r.key, l.key),
    space: 2
  }))
}

function node(cmd) {
  return new Promise((resolve, reject) => {
    exec(`node src/${cmd}`, (err, stdout, stderr) => {
      if (err) {
        return reject(err)
      }
      const errio = stderr.trim()
      if (errio !== '') {
        console.error(`node ${cmd}\n${errio}`)
      }
      try {
        resolve(JSON.parse(stdout))
      } catch (e) {
        reject(new Error(`node ${cmd}: ${e.message}`))
      }
    })
  })
}

if (module.parent == null) {
  module.exports()
}
