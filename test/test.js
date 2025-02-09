import { calendar as report } from '../src/client/calendar.js'
import expect from 'expect.js'

describe('calendar plugin', function () {
  describe('parsing', function () {
    it('recognizes decades', function () {
      expect(report.parse('1960 DECADE')).to.eql([{ year: 1960, span: 'DECADE' }])
      expect(report.parse('DECADE 1960')).to.eql([{ year: 1960, span: 'DECADE' }])
      expect(report.parse('60S')).to.eql([{ year: 1960, span: 'DECADE' }])
    })

    it('recognizes half decades', function () {
      expect(report.parse('60S EARLY')).to.eql([{ year: 1960, span: 'EARLY' }])
      expect(report.parse('EARLY 60S')).to.eql([{ year: 1960, span: 'EARLY' }])
      expect(report.parse('LATE 60S')).to.eql([{ year: 1960, span: 'LATE' }])
    })

    it('recognizes years', () => expect(report.parse('1960')).to.eql([{ year: 1960, span: 'YEAR' }]))

    it('recognizes months', function () {
      expect(report.parse('1960 MAR')).to.eql([{ year: 1960, month: 3, span: 'MONTH' }])
      expect(report.parse('MAR 1960')).to.eql([{ year: 1960, month: 3, span: 'MONTH' }])
      expect(report.parse('MARCH 1960')).to.eql([{ year: 1960, month: 3, span: 'MONTH' }])
    })

    it('recognizes days', function () {
      expect(report.parse('MAR 5 1960')).to.eql([{ year: 1960, month: 3, day: 5, span: 'DAY' }])
      expect(report.parse('1960 MAR 5')).to.eql([{ year: 1960, month: 3, day: 5, span: 'DAY' }])
      expect(report.parse('5 MAR 1960')).to.eql([{ year: 1960, month: 3, day: 5, span: 'DAY' }])
    })

    return it('recognizes labels', function () {
      expect(report.parse("Ward's CHM Interview")).to.eql([{ label: "Ward's CHM Interview" }])
      expect(report.parse("APRIL 24 2006 Ward's CHM Interview")).to.eql([
        { year: 2006, month: 4, day: 24, span: 'DAY', label: "Ward's CHM Interview" },
      ])
      expect(report.parse(" APRIL  24  2006\tWard's  CHM  Interview  ")).to.eql([
        { year: 2006, month: 4, day: 24, span: 'DAY', label: "Ward's CHM Interview" },
      ])
    })
  })

  describe('applying', function () {
    const today = new Date(2013, 2 - 1, 3)
    const interview = new Date(2006, 4 - 1, 24)
    const oneDayInMS = 24 * 60 * 60 * 1000

    it('recalls input', function () {
      const input = { interview: { date: interview } }
      const output = {}
      const rows = report.parse('interview')
      expect(report.apply(input, output, today, rows)).to.eql([
        {
          date: interview,
          label: 'interview',
          units: ['day'],
          value: Math.floor(interview.getTime() / oneDayInMS),
          precision: oneDayInMS,
        },
      ])
    })

    return it('extends today', function () {
      const input = {}
      const output = {}
      const rows = report.parse('APRIL 1 April Fools Day')
      const results = report.apply(input, output, today, rows)
      expect(results).to.eql([
        {
          date: new Date(2013, 4 - 1, 1),
          month: 4,
          day: 1,
          span: 'DAY',
          label: 'April Fools Day',
          units: ['day'],
          value: Math.floor(new Date(2013, 4 - 1, 1).getTime() / oneDayInMS),
          precision: oneDayInMS,
        },
      ])
      expect(output).to.eql({ 'April Fools Day': { date: new Date(2013, 4 - 1, 1), span: 'DAY' } })
    })
  })

  return describe('radarSource', function () {
    const mock = {}
    beforeEach(function () {
      mock.el = {}
      mock.$el = {
        addClass(c) {
          return (mock.actualClass = c)
        },
        get(n) {
          return mock.el
        },
      }
      const results = report.apply(
        {},
        {},
        new Date(),
        report.parse(`\
          2015 SEP 1 Starts Now
          LATE 90S Some languages were born\
`),
      )
      return report.radarSource(mock.$el, results)
    })

    it('calls addClass with "radar-source"', () => expect(mock.actualClass).to.be('radar-source'))

    it('adds radarData() to the DOM element', () => expect(mock.el).to.have.key('radarData'))

    it('uses the labels as keys in the radarData', () => expect(mock.el.radarData()).to.have.key('Starts Now'))

    it('puts the distance from the Epoch into the values in the radarData', function () {
      const data = mock.el.radarData()
      const daysSinceEpoch = Math.floor(new Date(2015, 8, 1).getTime() / (24 * 60 * 60 * 1000)) // 16,679
      expect(data['Starts Now']).to.have.key('value')
      return expect(data['Starts Now'].value).to.eql(daysSinceEpoch)
    })

    it('specifies units & precision with values in the radarData', function () {
      const data = mock.el.radarData()
      const oneDayInMS = 24 * 60 * 60 * 1000 // 86,400,000
      expect(data['Starts Now']).to.have.key('units')
      expect(data['Starts Now'].units).to.eql(['day'])
      expect(data['Starts Now']).to.have.key('precision')
      expect(data['Starts Now'].precision).to.eql(oneDayInMS)
    })

    return it('chooses units & precision to match the report.parsed span of the date', function () {
      const data = mock.el.radarData()
      const oneDecadeInMS = 10 * 365.25 * 24 * 60 * 60 * 1000 // 315,576,000,000
      expect(data['Some languages were born']).to.have.key('units')
      expect(data['Some languages were born'].units).to.eql(['decade'])
      expect(data['Some languages were born']).to.have.key('precision')
      expect(data['Some languages were born'].precision).to.eql(oneDecadeInMS)
    })
  })
})

// describe 'formatting', ->
// 	it 'returns an array of strings', ->
// 		rows = report.format report.parse ""
// 		expect(rows).to.eql []
