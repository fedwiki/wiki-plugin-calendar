report = require '../client/calendar'
expect = require 'expect.js'

describe 'calendar plugin', ->

	describe 'parsing', ->

		it 'recognizes decades', ->
			expect(report.parse "1960 DECADE").to.eql [{year: 1960, span:'DECADE'}]
			expect(report.parse "DECADE 1960").to.eql [{year: 1960, span:'DECADE'}]
			expect(report.parse "60S").to.eql [{year: 1960, span:'DECADE'}]

		it 'recognizes half decades', ->
			expect(report.parse "60S EARLY").to.eql [{year: 1960, span:'EARLY'}]
			expect(report.parse "EARLY 60S").to.eql [{year: 1960, span:'EARLY'}]
			expect(report.parse "LATE 60S").to.eql [{year: 1960, span:'LATE'}]

		it 'recognizes years', ->
			expect(report.parse "1960").to.eql [{year: 1960, span:'YEAR'}]

		it 'recognizes months', ->
			expect(report.parse "1960 MAR").to.eql [{year: 1960, month:3, span:'MONTH'}]
			expect(report.parse "MAR 1960").to.eql [{year: 1960, month:3, span:'MONTH'}]
			expect(report.parse "MARCH 1960").to.eql [{year: 1960, month:3, span:'MONTH'}]

		it 'recognizes days', ->
			expect(report.parse "MAR 5 1960").to.eql [{year: 1960, month:3, day: 5, span:'DAY'}]
			expect(report.parse "1960 MAR 5").to.eql [{year: 1960, month:3, day: 5, span:'DAY'}]
			expect(report.parse "5 MAR 1960").to.eql [{year: 1960, month:3, day: 5, span:'DAY'}]

		it 'recognizes labels', ->
			expect(report.parse "Ward's CHM Interview").to.eql [{label: "Ward's CHM Interview"}]
			expect(report.parse "APRIL 24 2006 Ward's CHM Interview").to.eql [{year: 2006, month:4, day: 24, span:'DAY', label: "Ward's CHM Interview"}]
			expect(report.parse " APRIL  24  2006\tWard's  CHM  Interview  ").to.eql [{year: 2006, month:4, day: 24, span:'DAY', label: "Ward's CHM Interview"}]

	describe 'applying', ->

		today = new Date 2013, 2-1, 3
		interview = new Date 2006, 4-1, 24

		it 'recalls input', ->
			input = {interview: {date: interview}}
			output = {}
			rows = report.parse "interview"
			expect(report.apply input, output, today, rows).to.eql [{date: interview, label:'interview'}]

		it 'extends today', ->
			input = {}
			output = {}
			rows = report.parse "APRIL 1 April Fools Day"
			results = report.apply input, output, today, rows
			expect(results).to.eql [{date: new Date(2013, 4-1), month: 4, day: 1, span:'DAY', label: 'April Fools Day'}]
			expect(output).to.eql {'April Fools Day': {date: new Date(2013, 4-1), span:'DAY'}}

	describe 'radarSource', ->
		label = 'Starts Now'
		mock = {}
		beforeEach ->
			mock.el = {}
			mock.$el =
				addClass : (c) -> mock.actualClass = c
				get : (n) -> mock.el
			report.radarSource(mock.$el, [label: label, date: new Date('2015-09-01')])

		it 'calls addClass with "radar-source"', ->
			expect(mock.actualClass).to.be 'radar-source'

		it 'adds radarData() to the DOM element', ->
			expect(mock.el).to.have.key 'radarData'

		it 'uses the labels as keys in the radarData', ->
			expect(mock.el.radarData()).to.have.key label

		it 'puts the days since the Epoch into the values in the radarData', ->
			data = mock.el.radarData()
			expect(data[label]).to.have.key 'value'
			expect(data[label].value).to.eql 16679

		it 'uses "weeks" as the units of the values in the radarData', ->
			data = mock.el.radarData()
			expect(data[label]).to.have.key 'units'
			expect(data[label].units).to.eql ['days']
	

	# describe 'formatting', ->
	# 	it 'returns an array of strings', ->
	# 		rows = report.format report.parse ""
	# 		expect(rows).to.eql []