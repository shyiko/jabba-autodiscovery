const page = require('webpage').create()
const system = require('system')

const url = system.args[1]
if (!url) {
  phantom.exit(1)
}

// suppress error output
page.onError = function(msg, trace) {}

page.open(url, function (status) {
  if (status === 'success') {
    const ee = page.evaluate(function() {
      const dd = window.downloads || {}
      return Object.keys(dd).reduce(function (r, k) {
        if (/^jdk-[^-]+-oth/.test(k)) {
          const ff = dd[k].files || {}
          Object.keys(ff).forEach(function (k) {
            const path = ff[k].filepath
            const o =
              ~path.indexOf('macosx-x64') ? {os: 'darwin', arch: 'amd64'} : // jdk-8u111-macosx-x64.dmg
              ~path.indexOf('linux-i586') && !path.match(/.rpm$/) ? {os: 'linux', arch: '386'} : // jdk-8u111-linux-i586.tar.gz
              ~path.indexOf('linux-x64') && !path.match(/.rpm$/) ? {os: 'linux', arch: 'amd64'} : // jdk-8u111-linux-x64.tar.gz
              ~path.indexOf('windows-x64') ? {os: 'windows', arch: 'amd64'} : // jdk-8u111-windows-x64.exe
              null
            if (o) {
              const version = path.match(/jdk-(\d(u\d+)?)-/)[1].split('u')
              o.version = '1.' + version[0] + '.' + (version[1] || 0)
              o.url = path.replace('/otn/', '/otn-pub/')
              r.push(o)
            }
          })
        }
        return r
      }, [])
    })
    console.log(JSON.stringify(ee, null, '  '))
  }
  phantom.exit()
})
