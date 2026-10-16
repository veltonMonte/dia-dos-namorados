import test from 'node:test'
import assert from 'node:assert/strict'
import { getNextAnniversary, getRelationshipTime } from '../src/time.js'

test('o contador começa zerado na data inicial', () => {
  assert.deepEqual(getRelationshipTime(new Date(2021, 7, 14)), {
    years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0,
  })
})

test('o contador separa anos, meses, dias e horas', () => {
  const result = getRelationshipTime(new Date(2023, 2, 15, 12, 34, 56))
  assert.equal(result.years, 1)
  assert.equal(result.months, 7)
  assert.equal(result.days, 1)
  assert.equal(result.hours, 12)
  assert.equal(result.minutes, 34)
  assert.equal(result.seconds, 56)
})

test('o próximo aniversário é hoje durante todo o dia 14 de agosto', () => {
  assert.equal(getNextAnniversary(new Date(2026, 7, 14, 23, 30)).daysLeft, 0)
  assert.equal(getNextAnniversary(new Date(2026, 7, 15)).date.getFullYear(), 2027)
})
