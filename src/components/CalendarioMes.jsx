import React, { useState } from 'react'
import { cumpleDisplay } from '../utils'

const DOWS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const pad = n => String(n).padStart(2, '0')

export default function CalendarioMes({ eventos, onEditar, onVerDetalle }) {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }
  const goToday = () => { setCalYear(now.getFullYear()); setCalMonth(now.getMonth()) }

  const labelDate = new Date(calYear, calMonth, 1)
  const label = labelDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const labelCap = label.charAt(0).toUpperCase() + label.slice(1)

  // Build cells: start from Monday of first week
  const firstDay = new Date(calYear, calMonth, 1)
  const lastDay = new Date(calYear, calMonth + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // Mon=0

  const cells = []
  for (let i = 0; i < startDow; i++) {
    const d = new Date(firstDay)
    d.setDate(d.getDate() - (startDow - i))
    cells.push({ date: d, cur: false })
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    cells.push({ date: new Date(calYear, calMonth, i), cur: true })
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    const d = new Date(last)
    d.setDate(last.getDate() + 1)
    cells.push({ date: d, cur: false })
  }

  const monthEvs = eventos.filter(ev => {
    if (!ev.fecha) return false
    const d = new Date(ev.fecha + 'T12:00:00')
    return d.getFullYear() === calYear && d.getMonth() === calMonth
  })

  return (
    <>
      <div className="cal-month-nav" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
        <div className="cal-month-label">{labelCap}</div>
        <button className="cal-nav-btn" onClick={nextMonth}>›</button>
        <button className="bg2 bsm" onClick={goToday} style={{ marginLeft: 8 }}>Hoy</button>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--mu)' }}>
          {monthEvs.length} evento{monthEvs.length !== 1 ? 's' : ''} en {labelCap}
        </span>
      </div>

      <div className="cal-month-grid">
        <div className="cal-month-header">
          {DOWS.map((d, i) => (
            <div key={d} className={`cal-month-dow${i >= 5 ? ' weekend' : ''}`}>{d}</div>
          ))}
        </div>
        <div className="cal-month-body">
          {cells.map(({ date, cur }, idx) => {
            const ds = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
            const isToday = ds === todayStr
            const evs = eventos
              .filter(ev => ev.fecha === ds)
              .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
            const hasEvs = evs.length > 0
            const maxShow = 3

            let cls = ''
            if (!cur) cls += ' other-month'
            if (isToday) cls += ' is-today'
            if (hasEvs) cls += ' has-events'

            return (
              <div key={idx} className={`cal-month-cell${cls}`}>
                <div className="cal-cell-num">{date.getDate()}</div>
                {evs.slice(0, maxShow).map(ev => {
                  const name = cumpleDisplay(ev) || ev.reservante || '(sin nombre)'
                  const pClass = ev.pago === 'paid' ? 'paid' : ev.pago === 'sena' ? 'sena' : 'none'
                  return (
                    <button
                      key={ev.id}
                      className={`cal-cell-ev ${pClass}`}
                      onClick={() => onVerDetalle(ev.id)}
                      title={`${name}${ev.hora ? ' · ' + ev.hora : ''}${ev.salon ? ' · ' + ev.salon : ''}`}
                    >
                      {ev.hora ? ev.hora + ' ' : ''}{name}
                    </button>
                  )
                })}
                {evs.length > maxShow && (
                  <div
                    className="cal-cell-more"
                    onClick={() => {
                      const names = evs.map(ev => `• ${ev.hora || '—'} ${ev.reservante || cumpleDisplay(ev) || '(sin nombre)'}`).join('\n')
                      alert(`Eventos del ${ds}:\n${names}`)
                    }}
                  >
                    +{evs.length - maxShow} más
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
