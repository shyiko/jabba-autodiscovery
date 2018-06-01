module.exports =
  new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'}).compare
