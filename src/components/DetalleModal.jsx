import React from 'react'
import { fmt, cumpleDisplay, fmtFechaHora } from '../utils'

const TIPO_LABEL = { saltos: 'Saltos', parque: 'Parque aéreo', 'saltos+parque': 'Saltos + Parque aéreo' }

function Row({ label, val, valStyle }) {
  if (!val && val !== 0) return null
  return (
    <div className="dm-row">
      <span className="dm-label">{label}</span>
      <span className="dm-val" style={valStyle}>{val}</span>
    </div>
  )
}

export default function DetalleModal({ evento: ev, config, onClose, onEditar }) {
  if (!ev) return null

  const rest = (ev.total || 0) - (ev.monto || 0)
  const cd = cumpleDisplay(ev)

  const menuRows = ev.mrows && ev.mrows.length
    ? ev.mrows.map(r => {
        const m = config.menus.find(x => String(x.id) === String(r.mid))
        if (!m) return null
        return m.p ? `${m.n} ×${r.qty} = ${fmt(m.p * r.qty)}` : `${m.n} ×${r.qty}`
      }).filter(Boolean).join(' | ')
    : '—'

  const extrasDetail = ev.extras && ev.extras.length
    ? ev.extras.map(e => {
        const ex = config.extras.find(x => String(x.id) === String(e.eid))
        return ex ? `${ex.n} ×${e.qty} = ${fmt(ex.p * e.qty)}` : null
      }).filter(Boolean).join(' | ')
    : null

  const promo = ev.promoId ? config.promos.find(p => String(p.id) === String(ev.promoId)) : null

  const bc = ev.pago === 'paid' ? 'bpd' : ev.pago === 'sena' ? 'bsn' : ev.pago === 'cancelado' ? 'bcn' : 'bnp'
  const bt = ev.pago === 'paid' ? '✓ Pagado completo' : ev.pago === 'sena' ? '◑ Seña dejada' : ev.pago === 'cancelado' ? '✕ Cancelado' : '✗ Sin pago'

  return (
    <div className="ov op" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dm">
        <div className="moh">
          <div className="mot">
            <div className="mot-icon">👁</div>
            <span>Detalle del evento</span>
          </div>
          <button className="xcl" onClick={onClose}>✕</button>
        </div>

        {ev.reservante && (
          <div className="dm-row">
            <span className="dm-label">👤 Reservante</span>
            <span className="dm-val">
              {ev.reservante}
              {ev.privado && (
                <span style={{ background: 'var(--nv3)', color: 'var(--nv)', fontSize: 11, padding: '2px 7px', borderRadius: 5, fontWeight: 700, marginLeft: 6 }}>
                  🔒 Privado
                </span>
              )}
            </span>
          </div>
        )}

        {ev.telefono && (
          <div className="dm-row">
            <span className="dm-label">📞 Teléfono</span>
            <span className="dm-val">
              <a href={`tel:${ev.telefono}`} style={{ color: 'var(--nv2)' }}>{ev.telefono}</a>
            </span>
          </div>
        )}

        {cd && <Row label="🎂 Cumpleañero/a" val={cd} />}

        <div className="dm-row">
          <span className="dm-label">📅 Fecha y hora</span>
          <span className="dm-val">
            {fmtFechaHora(ev.fecha, ev.hora)} hs
            {ev.hora_hasta && ` — ${ev.hora_hasta} hs`}
            {ev.extendido && <span style={{ marginLeft: 8, fontSize: 11, background: 'var(--nv3)', color: 'var(--nv)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>Extendido</span>}
          </span>
        </div>

        <Row label="🏠 Salón" val={ev.salon} />
        {ev.tipo && <Row label="🏋 Tipo de evento" val={TIPO_LABEL[ev.tipo] || ev.tipo} />}

        <div className="dm-row">
          <span className="dm-label">👥 Asistentes</span>
          <span className="dm-val">{ev.chi || 0} chicos · {ev.adu || 0} adultos</span>
        </div>

        <div className="dm-row">
          <span className="dm-label">🍔 Menús</span>
          <span className="dm-val" style={{ lineHeight: 1.6 }}>{menuRows}</span>
        </div>

        {extrasDetail && (
          <div className="dm-row">
            <span className="dm-label">⭐ Extras</span>
            <span className="dm-val" style={{ lineHeight: 1.6 }}>{extrasDetail}</span>
          </div>
        )}

        <div className="dm-row">
          <span className="dm-label">🎁 Promoción</span>
          <span className="dm-val">{promo ? `${promo.d} (${promo.pct}% off)` : 'Sin promoción'}</span>
        </div>

        {ev.obs && <Row label="📝 Observaciones" val={ev.obs} />}

        <div className="dm-row">
          <span className="dm-label">💰 Total evento</span>
          <span className="dm-val" style={{ fontSize: 18, fontWeight: 800, color: 'var(--nv)' }}>{fmt(ev.total || 0)}</span>
        </div>

        <div className="dm-row">
          <span className="dm-label">Estado pago</span>
          <span className="dm-val"><span className={`badge ${bc}`}>{bt}</span></span>
        </div>

        {ev.pago !== 'none' && (
          <div className="dm-row">
            <span className="dm-label">Abonado</span>
            <span className="dm-val" style={{ color: 'var(--gn)', fontWeight: 700 }}>{fmt(ev.monto || 0)}</span>
          </div>
        )}

        {ev.pago !== 'paid' && (
          <div className="dm-row">
            <span className="dm-label">Restante</span>
            <span className="dm-val" style={{ color: 'var(--am)', fontWeight: 700 }}>{fmt(rest)}</span>
          </div>
        )}

        {ev.met && <Row label="Método de pago" val={ev.met} />}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="bg2" onClick={onClose}>Cerrar</button>
          <button className="bp" onClick={() => onEditar(ev.id)}>✏ Editar</button>
        </div>
      </div>
    </div>
  )
}
