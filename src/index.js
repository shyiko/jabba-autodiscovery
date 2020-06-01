const stringify = require('json-stable-stringify')
const naturalSort = require('./natural-sort')
const exec = require('child_process').exec

process.on('unhandledRejection', (e) => { throw e }) // fail process

module.exports = async (m = _ => _) => {
  const nn = await Promise.all([
    node('github-com-graalvm.js oracle/graal'),
    node('github-com-graalvm.js graalvm/graalvm-ce-builds'),
    node('oracle-com-labs.js')
      .then((data) => ({ns: 'graalvm-ee', require: ['otn-account'], data})),
    node('github-com-shyiko-jabba-index-zulu.js')
      .then((data) => ({ns: 'zulu', data})),
    node('azul-com.js'),
    node('github-com-corretto.js corretto/corretto-8')
      .then((data) => ({ns: 'amazon-corretto', data})),
    node('github-com-corretto.js corretto/corretto-11')
      .then((data) => ({ns: 'amazon-corretto', data})),
    node('github-com-bell-sw-liberica.js')
      .then((data) => ({ns: 'liberica', data})),
    node('adoptopenjdk-net-v2.js https://api.adoptopenjdk.net/v2/info/releases/openjdk8'),
    node('adoptopenjdk-net-v2.js https://api.adoptopenjdk.net/v2/info/releases/openjdk9'),
    node('adoptopenjdk-net-v2.js https://api.adoptopenjdk.net/v2/info/releases/openjdk10'),
    node('adoptopenjdk-net-v2.js https://api.adoptopenjdk.net/v2/info/releases/openjdk11'),
    node('adoptopenjdk-net-v2.js https://api.adoptopenjdk.net/v2/info/releases/openjdk12'),
    node('adoptopenjdk-net-v2.js https://api.adoptopenjdk.net/v2/info/releases/openjdk13'),
    node('adoptopenjdk-net-v2.js https://api.adoptopenjdk.net/v2/info/releases/openjdk14'),
    // todo: Project Amber (https://adoptopenjdk.net/nightly.html?variant=amber)
    node('builds-shipilev-net.js https://builds.shipilev.net/openjdk-shenandoah-jdk8/')
      .then((data) => ({ns: 'openjdk-shenandoah', data})),
    node('builds-shipilev-net.js https://builds.shipilev.net/openjdk-shenandoah-jdk11/')
      .then((data) => ({ns: 'openjdk-shenandoah', data})),
    node('public-dhe-ibm-com.js')
      .then((data) => ({ns: 'ibm-sdk', data})),
    // todo: Alpine Linux	variant
    // todo: JavaDocs
    // node('jdk-java-net.js https://jdk.java.net/10/'),
    // node('jdk-java-net.js https://jdk.java.net/11/'),
    // node('jdk-java-net.js https://jdk.java.net/12/'),
    node('jdk-java-net.js https://jdk.java.net/13/'),
    node('jdk-java-net.js https://jdk.java.net/14/'),
    // node('jdk-java-net.js https://jdk.java.net/valhalla/'),
    // node('jdk-java-net.js https://jdk.java.net/zgc/'), // incorporated in JDK 11-ea+18
    node('jdk-java-net.js https://jdk.java.net/archive/'),
    // openjdk-ri (reference implementation)
    node('jdk-java-net-ri.js https://jdk.java.net/java-se-ri/12'),
    node('jdk-java-net-ri.js https://jdk.java.net/java-se-ri/11'),
    node('jdk-java-net-ri.js https://jdk.java.net/java-se-ri/10'),
    node('jdk-java-net-ri.js https://jdk.java.net/java-se-ri/9'),
    node('jdk-java-net-ri.js https://jdk.java.net/java-se-ri/8-MR3'),
    node('jdk-java-net-ri.js https://jdk.java.net/java-se-ri/7'),
    node('support-apple-com.js')
  ]).catch((err) => {
    console.error(err)
    process.exit(1)
  })
  // oracle.com is scraped sequentially, otherwise we may get 403
  for (const sync of [
    () => node('oracle-com-java.js https://www.oracle.com/technetwork/java/javase/downloads/jdk13-downloads-5672538.html'),

    // archive (require OTN account)
    // () => node('oracle-com-java.js https://www.oracle.com/technetwork/java/javase/downloads/jdk11-downloads-5066655.html')
    //   .then((data) => ({require: ['otn-account'], data})),

    // () => node('oracle-com-java.js https://www.oracle.com/technetwork/java/javase/downloads/java-archive-javase10-4425482.html')
    //   .then((data) => ({require: ['otn-account'], data})),

    // () => node('oracle-com-java.js https://www.oracle.com/technetwork/java/javase/downloads/java-archive-javase9-3934878.html')
    //   .then((data) => ({require: ['otn-account'], data})),

    // () => node('oracle-com-java.js https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html')
    //   .then((data) => ({require: ['otn-account'], data})),
    // () => node('oracle-com-java.js https://www.oracle.com/technetwork/java/javase/downloads/server-jre8-downloads-2133154.html')
    //   .then((data) => ({require: ['otn-account'], data})),
    // () => node('oracle-com-java.js https://www.oracle.com/technetwork/java/javase/downloads/java-archive-javase8-2177648.html')
    //   .then((data) => ({ require: ['otn-account'], data })),

    // () => node('oracle-com-java.js https://www.oracle.com/technetwork/java/javase/downloads/java-archive-downloads-javase7-521261.html')
    //   .then((data) => ({ require: ['otn-account'], data })),

    // () => node('oracle-com-java.js https://www.oracle.com/technetwork/java/javase/downloads/java-archive-downloads-javase6-419409.html')
    //   .then((data) => ({require: ['otn-account'], data}))
  ]) {
    nn.push(await sync())
  }
  // todo: https://www.oracle.com/technetwork/java/javase/downloads/tzupdater-download-513681.html
  // todo: https://www.oracle.com/technetwork/java/javase/documentation/jdk10-doc-downloads-4417029.html
  // todo: https://www.oracle.com/technetwork/java/javase/documentation/jdk8-doc-downloads-2133158.html
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
