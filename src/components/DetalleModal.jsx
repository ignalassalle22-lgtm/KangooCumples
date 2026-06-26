import React, { useState } from 'react'
import { fmt, cumpleDisplay, fmtFechaHora } from '../utils'

const TIPO_LABEL = { saltos: 'Saltos', parque: 'Parque aéreo', 'saltos+parque': 'Saltos + Parque aéreo' }
const PRINT_URL = 'http://localhost:5000/print/venta'

function Row({ label, val, valStyle }) {
  if (!val && val !== 0) return null
  return (
    <div className="dm-row">
      <span className="dm-label">{label}</span>
      <span className="dm-val" style={valStyle}>{val}</span>
    </div>
  )
}

<<<<<<< HEAD:src/components/DetalleModal.jsx
export default function DetalleModal({ evento: ev, config, onClose, onEditar, onAbrirCaja, onFinalizar }) {
=======
export default function DetalleModal({ evento: ev, config, onClose, onEditar }) {
  const [printing, setPrinting] = useState(false)

>>>>>>> 8e14698 (feat: impresión de tickets ESC/POS via servidor local):ignalassalle22-lgtm Meli claude-setup-kangoo-cumples-CdZWx kangoo-cumples/src/components/DetalleModal.jsx
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
        if (e.custom) {
          return e.desc ? `${e.desc} ×${e.qty} = ${fmt((e.p || 0) * e.qty)}` : null
        }
        const ex = config.extras.find(x => String(x.id) === String(e.eid))
        if (!ex) return null
        const price = e.p !== undefined ? e.p : ex.p
        return `${ex.n} ×${e.qty} = ${fmt(price * e.qty)}`
      }).filter(Boolean).join(' | ')
    : null

  const promo = ev.promoId ? config.promos.find(p => String(p.id) === String(ev.promoId)) : null

<<<<<<< HEAD:src/components/DetalleModal.jsx
  const bc = ev.pago === 'paid' ? 'bpd' : ev.pago === 'sena' ? 'bsn' : ev.pago === 'cancelado' ? 'bcn' : 'bnp'
  const bt = ev.pago === 'paid' ? '✓ Pagado completo' : ev.pago === 'sena' ? '◑ Seña dejada' : ev.pago === 'cancelado' ? '✕ Cancelado' : '✗ Sin pago'
=======
  async function handlePrint() {
    setPrinting(true)
    try {
      // Armar lista de items para el ticket
      const items = []

      // Precio base chicos/adultos
      if (ev.chi > 0) items.push({ n: `Chicos (${ev.chi})`, qty: ev.chi, total: ev.chi * (config.pChico || 0) })
      if (ev.adu > 0) items.push({ n: `Adultos (${ev.adu})`, qty: ev.adu, total: ev.adu * (config.pAdulto || 0) })

      // Menús
      if (ev.mrows) ev.mrows.forEach(r => {
        const m = config.menus.find(x => String(x.id) === String(r.mid))
        if (m) items.push({ n: m.n, qty: r.qty, total: m.p * r.qty })
      })

      // Extras
      if (ev.extras) ev.extras.forEach(e => {
        const ex = config.extras.find(x => String(x.id) === String(e.eid))
        if (ex) items.push({ n: ex.n, qty: e.qty, total: ex.p * e.qty })
      })

      const subtotal = items.reduce((s, i) => s + i.total, 0)
      const descuento = promo ? Math.round(subtotal * promo.pct / 100) : 0

      await fetch(PRINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: ev.fecha,
          hora: ev.hora,
          reservante: ev.reservante,
          telefono: ev.telefono,
          cumple: ev.cumple,
          edad: ev.edad,
          salon: ev.salon,
          chi: ev.chi,
          adu: ev.adu,
          items,
          subtotal,
          descuento,
          promo: promo ? `${promo.d}` : '',
          total: ev.total || 0,
          pago: ev.pago,
          monto: ev.monto || 0,
          met: ev.met || '',
        }),
      })
    } catch {
      alert('No se pudo conectar con el servidor de impresión.\nAsegurate de que kangoo_print_server.py esté corriendo.')
    } finally {
      setPrinting(false)
    }
  }

  const bc = ev.pago === 'paid' ? 'bpd' : ev.pago === 'sena' ? 'bsn' : 'bnp'
  const bt = ev.pago === 'paid' ? '✓ Pagado completo' : ev.pago === 'sena' ? '◑ Seña dejada' : '✗ Sin pago'
>>>>>>> 8e14698 (feat: impresión de tickets ESC/POS via servidor local):ignalassalle22-lgtm Meli claude-setup-kangoo-cumples-CdZWx kangoo-cumples/src/components/DetalleModal.jsx

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

        {/* Adicionales consumidos (si los hay) */}
        {ev.consumos && ev.consumos.length > 0 && (
          <div className="dm-row">
            <span className="dm-label">🛒 Adicionales</span>
            <span className="dm-val">
              {ev.consumos.length} ítem(s)
              {ev.consumos_cobrados
                ? <span style={{ marginLeft: 8, fontSize: 11, background: 'rgba(34,197,94,.15)', color: 'var(--gn)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>✓ Cobrados</span>
                : <span style={{ marginLeft: 8, fontSize: 11, background: 'var(--amb)', color: 'var(--am)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>Pendiente de cobro</span>
              }
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexWrap: 'wrap' }}>
          <button className="bg2" onClick={onClose}>Cerrar</button>
<<<<<<< HEAD:src/components/DetalleModal.jsx
          {onAbrirCaja && (
            <button className="bn" onClick={() => onAbrirCaja(ev.id)}>💰 Caja del evento</button>
          )}
          {onFinalizar && ev.pago !== 'paid' && ev.pago !== 'cancelado' && (
            <button
              className="bp"
              onClick={() => onFinalizar(ev.id)}
              style={{ background: '#1A7A45', border: 'none' }}
            >
              ✅ Finalizar evento
            </button>
          )}
=======
          <button className="bg2" onClick={handlePrint} disabled={printing}>
            {printing ? 'Imprimiendo…' : '🖨 Imprimir ticket'}
          </button>
>>>>>>> 8e14698 (feat: impresión de tickets ESC/POS via servidor local):ignalassalle22-lgtm Meli claude-setup-kangoo-cumples-CdZWx kangoo-cumples/src/components/DetalleModal.jsx
          <button className="bp" onClick={() => onEditar(ev.id)}>✏ Editar</button>
        </div>
      </div>
    </div>
  )
}
