/*
 * Federated Wiki : Calendar Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-calendar/blob/master/LICENSE.txt
 */

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const spans = ['EARLY', 'LATE', 'DECADE', 'DAY', 'MONTH', 'YEAR']

const span = function (result, span) {
  let m
  if ((m = spans.indexOf(result.span)) < 0) {
    return (result.span = span)
  } else if (spans.indexOf(span) < m) {
    return (result.span = span)
  }
}

const parse = function (text) {
  const rows = []
  for (var line of text.split(/\n/)) {
    var result = {}
    var words = line.match(/\S+/g)
    for (var i = 0; i < words.length; i++) {
      var m
      var word = words[i]
      if (word.match(/^\d\d\d\d$/)) {
        result.year = +word
        span(result, 'YEAR')
      } else if ((m = word.match(/^(\d0)S$/))) {
        result.year = +m[1] + 1900
        span(result, 'DECADE')
      } else if ((m = spans.indexOf(word)) >= 0) {
        result.span = spans[m]
      } else if ((m = months.indexOf(word.slice(0, 3))) >= 0) {
        result.month = m + 1
        span(result, 'MONTH')
      } else if ((m = word.match(/^([1-3]?[0-9])$/))) {
        result.day = +m[1]
        span(result, 'DAY')
      } else {
        result.label = words.slice(i, 1000).join(' ')
        break
      }
    }
    rows.push(result)
  }
  return rows
}

const apply = function (input, output, date, rows) {
  const result = []
  for (var row of rows) {
    if (input[row.label]?.date) {
      date = input[row.label].date
    }
    if (output[row.label]?.date) {
      date = output[row.label].date
    }
    if (row.year) {
      date = new Date(row.year, 1 - 1)
    }
    if (row.month) {
      date = new Date(date.getYear() + 1900, row.month - 1)
    }
    if (row.day) {
      date = new Date(date.getYear() + 1900, date.getMonth(), row.day)
    }
    if (row.label) {
      output[row.label] = { date }
      if (row.span) {
        output[row.label].span = row.span
      }
    }
    row.date = date
    var radarValue = dateAsValue(row.date, row.span)
    row.units = radarValue.units
    row.value = radarValue.value
    row.precision = radarValue.precision
    result.push(row)
  }
  return result
}

const show = function (date, span) {
  switch (span) {
    case 'YEAR':
      return date.getFullYear()
    case 'DECADE':
      return `${date.getFullYear()}'S`
    case 'EARLY':
      return `Early ${date.getFullYear()}'S`
    case 'LATE':
      return `Late ${date.getFullYear()}'S`
    case 'MONTH':
      return `${months[date.getMonth()]} ${date.getFullYear()}`
    default:
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }
}

const format = rows => rows.map(row => `<tr><td>${show(row.date, row.span)}<td>${row.label}`)

const precisionFor = {
  DAY: 1000 * 60 * 60 * 24,
  MONTH: (1000 * 60 * 60 * 24 * 365.25) / 12,
  YEAR: 1000 * 60 * 60 * 24 * 365.25,
  DECADE: 1000 * 60 * 60 * 24 * 365.25 * 10,
  EARLY: 1000 * 60 * 60 * 24 * 365.25 * 10,
  LATE: 1000 * 60 * 60 * 24 * 365.25 * 10,
}

const unitsFor = {
  DAY: 'day',
  MONTH: 'month',
  YEAR: 'year',
  DECADE: 'decade',
  EARLY: 'decade',
  LATE: 'decade',
}

var dateAsValue = function (date, span) {
  const precisionInMilliseconds = precisionFor[span] != null ? precisionFor[span] : precisionFor.DAY
  return {
    units: [unitsFor[span] != null ? unitsFor[span] : unitsFor.DAY],
    value: Math.floor(date.getTime() / precisionInMilliseconds),
    precision: precisionInMilliseconds,
  }
}

const radarSource = function ($item, results) {
  const data = {}
  for (var row of results) {
    data[row.label] = {
      units: row.units,
      value: row.value,
      precision: row.precision,
    }
  }

  $item.addClass('radar-source')
  return ($item.get(0).radarData = () => data)
}

const emit = function (div, item) {
  const rows = parse(item.text)
  // wiki.log 'calendar rows', rows
  const results = apply({}, {}, new Date(), rows)
  // wiki.log 'calendar results', results
  radarSource(div, results)
  div.append(`\
<table style="width:100%; background:#eee; padding:.8em; margin-bottom:5px;">${format(results).join('')}</table>\
`)
}

const bind = (div, item) => div.on('dblclick', () => wiki.textEditor(div, item))

if (typeof window !== 'undefined' && window !== null) {
  window.plugins.calendar = { emit, bind }
}

export const calendar = typeof window == 'undefined' ? { parse, apply, format, radarSource } : undefined
