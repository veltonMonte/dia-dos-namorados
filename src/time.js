export const START_DATE = new Date(2021, 7, 14)

const calendarDay = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
const DAY_MS = 86_400_000

export function getRelationshipTime(now = new Date()) {
  if (now < START_DATE) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 }

  let years = now.getFullYear() - START_DATE.getFullYear()
  let cursor = new Date(START_DATE.getFullYear() + years, 7, 14)
  if (cursor > now) {
    years -= 1
    cursor = new Date(START_DATE.getFullYear() + years, 7, 14)
  }

  let months = 0
  while (months < 11) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 14)
    if (next > now) break
    cursor = next
    months += 1
  }

  let days = 0
  while (days < 31) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    if (next > now) break
    cursor = next
    days += 1
  }

  return {
    years, months, days,
    hours: now.getHours(),
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
    totalDays: Math.round((calendarDay(now) - calendarDay(START_DATE)) / DAY_MS),
  }
}

export function getNextAnniversary(now = new Date()) {
  const nextYear = now.getFullYear() + (now.getMonth() > 7 || (now.getMonth() === 7 && now.getDate() > 14) ? 1 : 0)
  const date = new Date(nextYear, 7, 14)
  return { date, daysLeft: Math.round((calendarDay(date) - calendarDay(now)) / DAY_MS) }
}
