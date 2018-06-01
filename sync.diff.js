const util = require('util')
const fs = require('fs')
const readFile = util.promisify(fs.readFile)

const diff = (l, r) => {
  const changed = new Map()
  for (const os of Object.keys(l)) {
    for (const arch of Object.keys(l[os])) {
      for (const provider of Object.keys(l[os][arch])) {
        if (JSON.stringify(l[os][arch][provider]) !==
            JSON.stringify(((r[os] || {})[arch] || {})[provider])) {
          changed.set(provider, true)
        }
      }
    }
  }
  return changed
}

;(async (lf, rf) => {
  const [l, r] = [JSON.parse(await readFile(lf)), JSON.parse(await readFile(rf))]
  console.log(Array.from(
    new Map(Array.from(diff(l, r)).concat(Array.from(diff(r, l)))).keys()
  ).sort().join(", "))
})(process.argv[2], process.argv[3])
