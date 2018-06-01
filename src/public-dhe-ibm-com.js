const fetch = require('node-fetch')
const fetch2xx = _ => _.ok ? _ : _.buffer().then(_ => { throw new Error(`${_.status}`) })
const domino = require('domino')

async function list(url) {
  const html = await fetch(url).then(fetch2xx).then(_ => _.text())
  const window = domino.createWindow(html, url)
  const document = window.document
  const nodeList = document.querySelectorAll('img[alt="[DIR]"],[alt="[   ]"]')
  const r = []
  for (const node of nodeList) {
    if (node.nextElementSibling) {
      r.push(node.nextElementSibling.href)
    }
  }
  return r
}

(async (baseURL) => {
  const links = await list(baseURL)
  const ee = await links.reduce((p, r) => {
    const m = r.match(/(\d+.\d+.\d+.\d+)\//)
    if (m) {
      const version = m[1]
      return p
        .then((state) =>
          list(`${baseURL}${version}/linux/x86_64/`)
            .catch(() => list(`${baseURL}${version}/linux/x64/`))
            .then(
              (links) => {
                const ll = links.filter((v) => v.includes('/ibm-java-sdk-'))
                if (ll.length !== 1) {
                  console.error(`length(${links[0]}) != 1`)
                  process.exit(1)
                }
                return state.concat({
                  os: 'linux',
                  arch: 'amd64',
                  version,
                  url: ll[0]
                })
              },
              () => state
            )
        )
        .then((state) =>
          list(`${baseURL}${version}/linux/i386/`)
            .catch(() => list(`${baseURL}${version}/linux/x86/`))
            .then(
              (links) => {
                const ll = links.filter((v) => v.includes('/ibm-java-sdk-'))
                if (ll.length !== 1) {
                  console.error(`length(${links[0]}) != 1`)
                  process.exit(1)
                }
                return state.concat({
                  os: 'linux',
                  arch: '386',
                  version,
                  url: ll[0]
                })
              },
              () => state
            )
        )
    }
    return p
  }, Promise.resolve([]))
  console.log(JSON.stringify(ee, null, '  '))
})('http://public.dhe.ibm.com/ibmdl/export/pub/systems/cloud/runtimes/java/')
