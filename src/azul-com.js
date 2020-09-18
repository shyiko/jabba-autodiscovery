const fetch = require('node-fetch')
const fetch2xx = _ => _.ok ? _ : _.buffer().then(_ => { throw new Error(`${_.status}`) })
const domino = require('domino')

// e.g. https://www.azul.com/downloads/zulu/zulu-linux/
;(async (url) => {
  const json1 = await fetch('https://www.azul.com/wp-admin/admin-ajax.php', {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Referer': 'https://www.azul.com/downloads/zulu-community/?&show-old-builds=true',
      'Origin': 'https://www.azul.com',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36',
      'Sec-Fetch-Mode': 'cors',
      'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary8CwqgxTBhiPFAAKA',
    },
    body: '------WebKitFormBoundary8CwqgxTBhiPFAAKA\r\nContent-Disposition: form-data; name="latest"\r\n\r\n1\r\n------WebKitFormBoundary8CwqgxTBhiPFAAKA\r\nContent-Disposition: form-data; name="action"\r\n\r\nsearch_bundles\r\n------WebKitFormBoundary8CwqgxTBhiPFAAKA--\r\n'
  }).then(fetch2xx).then(_ => _.json())
  const json2 = await fetch('https://www.azul.com/wp-admin/admin-ajax.php', {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Referer': 'https://www.azul.com/downloads/zulu-community/?&show-old-builds=true',
      'Origin': 'https://www.azul.com',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36',
      'Sec-Fetch-Mode': 'cors',
      'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryYbl0vhUAXTA1gyzj',
    },
    body: '------WebKitFormBoundaryYbl0vhUAXTA1gyzj\r\nContent-Disposition: form-data; name="action"\r\n\r\nsearch_bundles\r\n------WebKitFormBoundaryYbl0vhUAXTA1gyzj--\r\n'
  }).then(fetch2xx).then(_ => _.json())
  const mm = new Map()
  const ee = []
  for (const json of [json1, json2]) {
    for (const node of json.reverse()) {
      // e.g. https://cdn.azul.com/zulu/bin/zulu10.2+3-jdk10.0.1-linux_x64.tar.gz
      const bundleMap = node.bundles.reduce((r, e) => {
        r[e.extension] = e
        return r
      }, {})
      const url = (bundleMap['tar.gz'] || bundleMap['zip'] || bundleMap['dmg'] || bundleMap['msi'] || bundleMap['rpm'] || {}).link
      if (!url) {
        console.error(JSON.stringify(bundleMap))
        process.exit(1)
      }
      if (node.packaging_slug != 'jdk' || url.includes('linux_musl')) {
        continue
      }
      const os =
        url.includes('linux') ? 'linux' :
          url.includes('win') ? 'windows' :
            url.includes('mac') ? 'darwin' :
              null
      const arch =
        node.arch_slug == 'x86-64-bit' || url.includes('x86_64') || url.includes('x64') || url.includes('amd64') || url.includes('win64') ? 'amd64' :
          url.includes('i686') || url.includes('x86') ? '386' :
            url.includes('aarch64') ? 'arm64' :
              url.includes('aarch32hf') ? 'arm' :
                null
      const versionMatch = url.match(/(?:jdk)(\d[^-]*)-(?:linux|win|mac)/) ||
        url.match(/(?:zulu)(\d[^-]*)-.*(?:linux|win|mac)/)
      if (!os || !arch || !versionMatch) {
        console.error(`skip(url): ${url}\n\t(${JSON.stringify(node)})`)
        continue
      }
      const version = versionMatch[1]
        .replace(/^([678])[.]0[.]/, '$1u')
        .replace(/^1.([678])[.]0_(\d+).*/, '$1u$2')
        .replace(/^1.([678])[.]0$/, '$1')
        .replace(/-ca$/, '')
        .replace(/-c2$/, '') +
        (url.includes('-ea-') ? '-ea' : '')
      const key = `${os}${arch}${version}`
      if (!mm.has(key)) {
        // zip/tar.gz - first one wins
        mm.set(key, url)
        ee.push({ ns: 'zulu', os, arch, version, url })
      } else if (url !== mm.get(key)) {
        console.error(`skip(dup): ${url} (keeping ${mm.get(key)})`)
      }
    }
  }
  console.log(JSON.stringify(ee, null, '  '))
})(process.argv[2])
