const puppeteer = require('puppeteer')

// e.g. http://www.oracle.com/technetwork/java/javase/downloads/jdk10-downloads-4416644.html
;(async (url) => {
  const browser = await puppeteer.launch({args: ['--no-sandbox']})
  const page = await browser.newPage()
  await page.goto(url, {waitUntil: ['load', 'networkidle0']})
  let downloads
  try {
    downloads = await page.evaluate(() => {
      const d = window.downloads
      const objectify = (v) =>
        Object.keys(v).reduce((r, k) => { r[k] = v[k]; return r }, {})
      return Object.keys(d).reduce((r, k) => {
        const entry = objectify(d[k])
        entry.files = objectify(entry.files)
        r[k] = entry
        return r
      }, {})
    })
  } finally {
    await browser.close()
  }
  const ee = []
  for (const entry of Object.values(downloads)) {
    for (const file of Object.values(entry.files || {})) {
      // e.g. http://download.oracle.com/otn-pub/java/jdk/10.0.1+10/fb4372174a714e6b8c52526dc134031e/jdk-10.0.1_windows-x64_bin.exe
      const url = file.filepath
      const checksum = file.SHA256 ? `sha256:${file.SHA256}` : undefined
      if (!url.endsWith(".zip") &&
          !url.endsWith(".tar.gz") &&
          !url.endsWith(".dmg") &&
          !url.endsWith(".bin") &&
          !url.endsWith(".exe") ||
          !url.match(/\/(jdk|server-jre|serverjre|sjre)[^\/]/) ||
          url.includes('-iftw') ||
          url.includes('solaris') ||
          url.endsWith("-rpm.bin")) {
        if (!url.includes('/jre') && !url.includes('solaris') && !url.endsWith("-rpm.bin") && !url.endsWith('.rpm')) {
          console.error(`skip(prefix/ext): ${url}`)
        }
        continue
      }
      const os =
        url.includes('linux') ? 'linux' :
        url.includes('win') ? 'windows' :
        url.includes('mac') || url.includes('osx') ? 'darwin' :
        null
      const arch =
        url.includes('x86_64') || url.includes('x64') || url.includes('amd64') ? 'amd64' :
        url.includes('i686') || url.includes('i586') || url.includes('x86') ? '386' :
        url.includes('aarch64') || url.includes('arm64') ? 'arm64' :
        url.includes('aarch32hf') || url.includes('arm32') || url.includes('arm-vfp-hf') ? 'arm' :
        null
      const versionMatch = url.match(/jdk\/([^\/]*)\//)
      if (!os || !arch || !versionMatch) {
        if (!url.includes('-ia64')) {
          console.error(`skip(url): ${url}`)
        }
        continue
      }
      const version = versionMatch[1].replace(/^(\d+u\d+)b$/, '$1')
      if (version.includes('-demos') || version.endsWith('-p2')) {
        continue
      }
      const ns = url.match(/(server-jre|serverjre|sjre)/) ? 'oracle-server-jre' : 'oracle-jdk'
      ee.push({ns, os, arch, version, url, checksum})
    }
  }
  console.log(JSON.stringify(ee, null, '  '))
})(process.argv[2])
