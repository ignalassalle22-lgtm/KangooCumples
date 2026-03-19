import React, { useState, useMemo } from 'react'
import { fmt, cumpleDisplay } from '../utils'

function getMonthKey(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha + 'T12:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(key) {
  const [y, mo] = key.split('-')
  const label = new Date(y, mo - 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function EventosList({ eventos, loading, onEditar, onEliminar, onNuevo, onVerDetalle }) {
  const [search, setSearch] = useState('')
  const [filterPago, setFilterPago] = useState('')
  const [filterFecha, setFilterFecha] = useState('')
  const [filterMes, setFilterMes] = useState('')

  const now = new Date()
  const thisM = now.getMonth()
  const thisY = now.getFullYear()

  // Stats
  const stats = useMemo(() => {
    let mesMes = 0, cobrado = 0, pend = 0, chicos = 0
    eventos.forEach(ev => {
      if (ev.fecha) {
        const d = new Date(ev.fecha + 'T12:00:00')
        if (d.getMonth() === thisM && d.getFullYear() === thisY) {
          mesMes++
          chicos += ev.chi || 0
        }
      }
      if (ev.pago === 'paid') cobrado += ev.total || 0
      else if (ev.pago === 'sena') { cobrado += ev.monto || 0; pend += (ev.total || 0) - (ev.monto || 0) }
      else pend += ev.total || 0
    })
    return { mesMes, cobrado, pend, chicos }
  }, [eventos, thisM, thisY])

  // Month options
  const monthOptions = useMemo(() => {
    const months = new Set()
    eventos.forEach(ev => { if (ev.fecha) months.add(getMonthKey(ev.fecha)) })
    return [...months].sort().reverse()
  }, [eventos])

  // Filtered events
  const filtered = useMemo(() => {
    const srch = search.toLowerCase()
    return eventos.filter(ev => {
      const mesKey = getMonthKey(ev.fecha)
      const matchText = (ev.salon || '').toLowerCase().includes(srch)
        || (ev.obs || '').toLowerCase().includes(srch)
        || (ev.reservante || '').toLowerCase().includes(srch)
        || (cumpleDisplay(ev) || '').toLowerCase().includes(srch)
      const matchPago = !filterPago || ev.pago === filterPago
      const matchMes = !filterMes || mesKey === filterMes
      const matchFecha = !filterFecha || ev.fecha === filterFecha
      return matchText && matchPago && matchMes && matchFecha
    }).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.hora || '').localeCompare(b.hora || ''))
  }, [eventos, search, filterPago, filterFecha, filterMes])

  if (loading) {
    return (
      <div className="sec">
        <div className="empty"><div className="emj">⏳</div><p>Cargando eventos...</p></div>
      </div>
    )
  }

  return (
    <>
      <div className="ph">
        <div>
          <div className="pt">Cumpleaños agendados</div>
          <div className="ps">
            {eventos.length === 0 ? 'No hay eventos cargados' : `${eventos.length} evento(s) registrado(s)`}
          </div>
        </div>
        <button className="bp" onClick={onNuevo}>＋ Nuevo evento</button>
      </div>

      <div className="sr">
        <div className="sc"><div className="sl">Eventos este mes</div><div className="sv">{stats.mesMes}</div></div>
        <div className="sc"><div className="sl">Total cobrado</div><div className="sv gn">{fmt(stats.cobrado)}</div></div>
        <div className="sc"><div className="sl">Pendiente de cobro</div><div className="sv am">{fmt(stats.pend)}</div></div>
        <div className="sc"><div className="sl">Chicos este mes</div><div className="sv">{stats.chicos}</div></div>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Buscar por salón u observaciones..."
        />
        <select value={filterPago} onChange={e => setFilterPago(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="none">Sin pago</option>
          <option value="sena">Seña dejada</option>
          <option value="paid">Pagado</option>
        </select>
        <input
          type="date"
          value={filterFecha}
          onChange={e => setFilterFecha(e.target.value)}
          title="Filtrar por día específico"
          style={{ minWidth: 0, width: 160 }}
        />
        {filterFecha && (
          <button className="bg2 bsm" onClick={() => setFilterFecha('')}>✕ Fecha</button>
        )}
        <select value={filterMes} onChange={e => setFilterMes(e.target.value)}>
          <option value="">Todos los meses</option>
          {monthOptions.map(m => (
            <option key={m} value={m}>{getMonthLabel(m)}</option>
          ))}
        </select>
      </div>

      <div className="el">
        {filtered.length === 0 ? (
          eventos.length === 0 ? (
            <div className="empty">
              <div className="emj">🎂</div>
              <p>No hay cumpleaños agendados todavía.</p>
              <button className="bp" onClick={onNuevo}>+ Crear primer evento</button>
            </div>
          ) : (
            <div className="empty">
              <div className="emj">🔍</div>
              <p>No se encontraron eventos con esos filtros.</p>
            </div>
          )
        ) : (
          filtered.map(ev => {
            const isPast = ev.fecha && new Date(ev.fecha + 'T12:00:00') < now
            const bc = ev.pago === 'paid' ? 'bpd' : ev.pago === 'sena' ? 'bsn' : 'bnp'
            const bt = ev.pago === 'paid' ? '✓ Pagado' : ev.pago === 'sena' ? '◑ Seña' : '✗ Sin pago'
            const rest = (ev.total || 0) - (ev.monto || 0)
            const cd = cumpleDisplay(ev)
            return (
              <div key={ev.id} className={`ec${isPast ? ' past' : ' upcoming'}`}>
                <div>
                  <div className="dday">
                    {ev.fecha
                      ? new Date(ev.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </div>
                  <div className="dtime">
                    🕐 {ev.hora || '—'} hs{cd ? ` · 🎂 ${cd}` : ''}
                  </div>
                </div>
                <div>
                  <div className="dsalon">🏠 {ev.salon}</div>
                  <div className="dpers">
                    👦 {ev.chi || 0} chicos · 👤 {ev.adu || 0} adultos{ev.reservante ? ` · ${ev.reservante}` : ''}
                  </div>
                </div>
                <div>
                  <div className="dtot">{fmt(ev.total || 0)}</div>
                  <div>
                    {ev.pago === 'paid'
                      ? <span className="drest ok">Sin deuda pendiente</span>
                      : <span className="drest pend">Resta: {fmt(rest)}</span>
                    }
                  </div>
                </div>
                <div><span className={`badge ${bc}`}>{bt}</span></div>
                <div className="eact">
                  <button className="bg2 bsm" title="Ver detalle" onClick={() => onVerDetalle(ev.id)}>👁</button>
                  <button className="bg2 bsm" onClick={() => onEditar(ev.id)}>✏ Editar</button>
                  <button className="bdng" onClick={() => onEliminar(ev.id)}>🗑</button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
