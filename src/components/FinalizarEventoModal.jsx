import React, { useState } from 'react'
import { fmt } from '../utils'

export default function FinalizarEventoModal({ evento: ev, cajasAbiertas, config, onFinalizar, onClose }) {
  if (!ev) return null

  const saldoEvento = (ev.total || 0) - (ev.monto || 0)
  const consumosPendientes = (ev.consumos || []).filter(c => !c.cobrado)
  const totalConsumos = consumosPendientes.reduce((s, c) => s + (c.precioUnitario || 0) * c.qty, 0)
  const totalFinal = saldoEvento + totalConsumos

  const [metodoPago, setMetodoPago] = useState((config?.mets || [])[0] || 'Efectivo')
  const [cajaId, setCajaId] = useState(cajasAbiertas[0]?.id || null)
  const [cargando, setCargando] = useState(false)

  async function handleConfirmar() {
    if (!cajaId) return
    setCargando(true)
    try {
      await onFinalizar({ metodoPago, cajaId, saldoEvento, consumosPendientes, totalFinal })
    } finally {
      setCargando(false)
    }
  }

  const cliente = ev.reservante || ev.cumple || 'Evento'

  return (
    <div className="ov op" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dm" style={{ maxWidth: 480 }}>
        <div className="moh">
          <div className="mot">
            <div className="mot-icon">✅</div>
            <span>Finalizar evento</span>
          </div>
          <button className="xcl" onClick={onClose}>✕</button>
        </div>

        {/* Resumen */}
        <div style={{ background: 'var(--nv3)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--nv)', marginBottom: 10 }}>
            📋 {cliente}
          </div>

          {/* Saldo evento */}
          {saldoEvento > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: consumosPendientes.length > 0 ? '1px solid var(--bd)' : 'none' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--tx)' }}>Saldo del evento</div>
                <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 1 }}>
                  Total {fmt(ev.total || 0)} — seña {fmt(ev.monto || 0)}
                </div>
              </div>
              <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--nv)' }}>{fmt(saldoEvento)}</span>
            </div>
          )}

          {saldoEvento === 0 && (
            <div style={{ fontSize: 12, color: 'var(--gn)', fontWeight: 700, padding: '4px 0', borderBottom: consumosPendientes.length > 0 ? '1px solid var(--bd)' : 'none' }}>
              ✓ Evento ya abonado completo
            </div>
          )}

          {/* Consumos pendientes */}
          {consumosPendientes.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                🛒 Adicionales pendientes ({consumosPendientes.length})
              </div>
              {consumosPendientes.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--tx)', padding: '3px 0' }}>
                  <span>{c.nombreProducto} ×{c.qty}</span>
                  <span style={{ fontWeight: 700 }}>{fmt((c.precioUnitario || 0) * c.qty)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: totalFinal > 0 ? 'rgba(232,98,26,0.08)' : 'rgba(34,197,94,0.08)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, border: `1px solid ${totalFinal > 0 ? 'rgba(232,98,26,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            {totalFinal > 0 ? 'Total a cobrar ahora' : 'Sin saldo pendiente'}
          </span>
          <span style={{ fontWeight: 900, fontSize: 22, color: totalFinal > 0 ? 'var(--or)' : 'var(--gn)' }}>
            {fmt(totalFinal)}
          </span>
        </div>

        {totalFinal > 0 && (
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', display: 'block', marginBottom: 5 }}>
                Método de pago
              </label>
              <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
                style={{ width: '100%', border: '1px solid var(--bd2)', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
                {(config?.mets || ['Efectivo', 'Débito', 'Crédito', 'Transferencia']).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', display: 'block', marginBottom: 5 }}>
                Acreditar en caja
              </label>
              <select value={cajaId || ''} onChange={e => setCajaId(Number(e.target.value))}
                style={{ width: '100%', border: '1px solid var(--bd2)', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
                {cajasAbiertas.length === 0
                  ? <option value="">Sin cajas abiertas</option>
                  : cajasAbiertas.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.turno ? ` — ${c.turno}` : ''}</option>)
                }
              </select>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="bg2" onClick={onClose}>Cancelar</button>
          <button
            className="bp"
            onClick={handleConfirmar}
            disabled={cargando || (totalFinal > 0 && !cajaId)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {cargando ? 'Procesando...' : totalFinal > 0 ? `✅ Cobrar ${fmt(totalFinal)} y finalizar` : '✅ Marcar como finalizado'}
          </button>
        </div>
      </div>
    </div>
  )
}
