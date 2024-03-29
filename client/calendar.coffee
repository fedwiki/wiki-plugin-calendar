###
 * Federated Wiki : Calendar Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-calendar/blob/master/LICENSE.txt
###

months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
spans = ['EARLY', 'LATE', 'DECADE', 'DAY', 'MONTH', 'YEAR']

span = (result, span) ->
	if (m = spans.indexOf result.span) < 0
		result.span = span
	else if (spans.indexOf span) < m
		result.span = span

parse = (text) ->
	rows = []
	for line in text.split /\n/
		result = {}
		words = line.match /\S+/g
		for word, i in words
			if word.match /^\d\d\d\d$/
				result.year = +word
				span result, 'YEAR'
			else if m = word.match /^(\d0)S$/
				result.year = +m[1]+1900
				span result, 'DECADE'
			else if (m = spans.indexOf word) >= 0
				result.span = spans[m]
			else if (m = months.indexOf word[0..2]) >= 0
				result.month = m+1
				span result, 'MONTH'
			else if m = word.match /^([1-3]?[0-9])$/
				result.day = +m[1]
				span result, 'DAY'
			else
				result.label = words[i..999].join ' '
				break
		rows.push result
	rows

apply = (input, output, date, rows) ->
	result = []
	for row in rows
		if input[row.label]?.date?
			date = input[row.label].date
		if output[row.label]?.date?
			date = output[row.label].date
		if row.year?
			date = new Date row.year, 1-1
		if row.month?
			date = new Date date.getYear()+1900, row.month-1
		if row.day?
			date = new Date date.getYear()+1900, date.getMonth(), row.day
		if row.label?
			output[row.label] = {date}
			output[row.label].span = row.span if row.span?
		row.date = date
		radarValue = dateAsValue(row.date, row.span)
		row.units = radarValue.units
		row.value = radarValue.value
		row.precision = radarValue.precision
		result.push row
	result

show = (date, span) ->
	switch span
		when 'YEAR' then date.getFullYear()
		when 'DECADE' then "#{date.getFullYear()}'S"
		when 'EARLY' then "Early #{date.getFullYear()}'S"
		when 'LATE' then "Late #{date.getFullYear()}'S"
		when 'MONTH' then "#{months[date.getMonth()]} #{date.getFullYear()}"
		else "#{date.getDate()} #{months[date.getMonth()]} #{date.getFullYear()}"


format = (rows) ->
	for row in rows
		"""<tr><td>#{show row.date, row.span}<td>#{row.label}"""

precisionFor =
	DAY:		1000 * 60 * 60 * 24
	MONTH:	1000 * 60 * 60 * 24 * 365.25 / 12
	YEAR:		1000 * 60 * 60 * 24 * 365.25
	DECADE:	1000 * 60 * 60 * 24 * 365.25 * 10
	EARLY:	1000 * 60 * 60 * 24 * 365.25 * 10
	LATE:		1000 * 60 * 60 * 24 * 365.25 * 10

unitsFor =
	DAY:		'day'
	MONTH:	'month'
	YEAR:		'year'
	DECADE:	'decade'
	EARLY:	'decade'
	LATE:		'decade'

dateAsValue = (date, span) ->
	precisionInMilliseconds = precisionFor[span] ? precisionFor.DAY
	units : [unitsFor[span] ? unitsFor.DAY]
	value : (Math.floor(date.getTime() / precisionInMilliseconds))
	precision : precisionInMilliseconds

radarSource = ($item, results) ->
	data = {}
	for row in results
		data[row.label] =
			units: row.units
			value: row.value
			precision: row.precision

	$item.addClass 'radar-source'
	$item.get(0).radarData = -> data

module.exports = {parse, apply, format, radarSource} if module?


emit = (div, item) ->
	rows = parse item.text
	# wiki.log 'calendar rows', rows
	results = apply {}, {}, new Date(), rows
	# wiki.log 'calendar results', results
	radarSource div, results
	div.append """
		<table style="width:100%; background:#eee; padding:.8em; margin-bottom:5px;">#{format(results).join ''}</table>
	"""

bind = (div, item) ->
	div.on 'dblclick', () -> wiki.textEditor div, item

window.plugins.calendar = {emit, bind} if window?
