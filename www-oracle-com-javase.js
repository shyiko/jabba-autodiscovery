const path = require('path')
const childProcess = require('child_process')
const phantomjs = require('phantomjs-prebuilt')

childProcess.execFile(phantomjs.path, [
  path.join(__dirname, 'www-oracle-com-javase-phantomjs.js'),
  process.argv[2]
], function(err, stdout, stderr) {
  if (err) {
    console.error(stdout)
    process.exit(1)
  }
  console.log(stdout)
})
