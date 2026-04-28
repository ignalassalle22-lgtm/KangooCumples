import React, { useState, useMemo } from 'react'

const fmt = (n) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })

export default function Caja({ cajaActual, historial, loading, ventas, onAbrir, onCerrar, addToast }) {
  const [saldoInicial, setSaldoInicial] = useState('')
  const [saldoFinal, setSaldoFinal] = useState('')
  const [obsCierre, setObsCierre] = useState('')
  const [saving, setSaving] = useState(false)

  // Ventas de la caja actual
  const ventasCaja = useMemo(() => {
    if (!cajaActual) return []
    return ventas.filter(v => v.caja_id === cajaActual.id && v.estado !== 'anulada')
  }, [ventas, cajaActual])

  const totalVentas = ventasCaja.reduce((s, v) => s + (v.total || 0), 0)
  const totalEfectivo = ventasCaja.filter(v => v.metodo_pago === 'Efectivo').reduce((s, v) => s + (v.total || 0), 0)

  async function handleAbrir() {
    const si = parseFloat(saldoInicial)
    if (isNaN(si) || si < 0) { addToast('Ingresá un saldo inicial válido', 'err'); return }
    setSaving(true)
    try {
      await onAbrir(si)
      setSaldoInicial('')
      addToast('✓ Caja abierta correctamente')
    } catch (e) { addToast('Error: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  async function handleCerrar() {
    const sf = parseFloat(saldoFinal)
    if (isNaN(sf) || sf < 0) { addToast('Ingresá el saldo final (efectivo en caja)', 'err'); return }
    if (!window.confirm('¿Cerrar la caja? Esta acción no se puede deshacer.')) return
    setSaving(true)
    try {
      await onCerrar({ saldo_final: sf, obs_cierre: obsCierre, total_ventas: totalVentas, total_efectivo: totalEfectivo })
      setSaldoFinal(''); setObsCierre('')
      addToast('✓ Caja cerrada correctamente')
    } catch (e) { addToast('Error: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  const diferenciaEfectivo = cajaActual
    ? (parseFloat(saldoFinal) || 0) - ((cajaActual.saldo_inicial || 0) + totalEfectivo)
    : 0

  return (
    <div className="sec">
      <div className="ph">
        <div>
          <div className="pt">Caja</div>
          <div className="ps">Control de efectivo diario</div>
        </div>
        <div>
          <span className={`badge ${cajaActual ? 'bpd' : 'bnp'}`} style={{ fontSize: 13, padding: '6px 14px' }}>
            {cajaActual ? '● Caja abierta' : '○ Caja cerrada'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="empty"><div className="emj">⏳</div><p>Cargando...</p></div>
      ) : cajaActual ? (
        /* ─── CAJA ABIERTA ─── */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div className="cc" style={{ marginBottom: 16 }}>
              <div className="ct"><div className="ct-icon">📊</div>Resumen de la caja actual</div>
              <div className="li">
                <span className="lin">Fecha apertura</span>
                <span className="lis">{cajaActual.fecha} — {cajaActual.hora_apertura}</span>
              </div>
              <div className="li">
                <span className="lin">Saldo inicial</span>
                <span className="lip">{fmt(cajaActual.saldo_inicial)}</span>
              </div>
              <div className="li">
                <span className="lin">Ventas registradas</span>
                <span className="lis">{ventasCaja.length} tickets</span>
              </div>
              <div className="li">
                <span className="lin">Total facturado</span>
                <span className="lip">{fmt(totalVentas)}</span>
              </div>
              <div className="li">
                <span className="lin">Efectivo recibido</span>
                <span className="lip">{fmt(totalEfectivo)}</span>
              </div>
              <div className="li">
                <span className="lin">Efectivo esperado en caja</span>
                <span style={{ fontWeight: 700, fontFamily: 'Nunito', color: 'var(--nv)', fontSize: 16 }}>
                  {fmt((cajaActual.saldo_inicial || 0) + totalEfectivo)}
                </span>
              </div>
            </div>

            {/* Desglose por método */}
            <div className="cc">
              <div className="ct"><div className="ct-icon">💳</div>Ventas por método de pago</div>
              {['Efectivo', 'Transferencia', 'Tarjeta débito', 'Tarjeta crédito', 'Mercado Pago', 'Otro'].map(met => {
                const monto = ventasCaja.filter(v => v.metodo_pago === met).reduce((s, v) => s + (v.total || 0), 0)
                if (monto === 0) return null
                return (
                  <div key={met} className="li">
                    <span className="lin">{met}</span>
                    <span className="lip">{fmt(monto)}</span>
                  </div>
                )
              })}
              {ventasCaja.length === 0 && <p style={{ fontSize: 13, color: 'var(--mu2)', marginTop: 8 }}>Sin ventas aún.</p>}
            </div>
          </div>

          {/* Cierre de caja */}
          <div className="cc">
            <div className="ct"><div className="ct-icon">🔐</div>Cerrar caja</div>
            <p style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 16 }}>
              Contá el efectivo físico en caja e ingresalo para verificar diferencias.
            </p>
            <div className="fgg" style={{ marginBottom: 14 }}>
              <label>Efectivo contado en caja $</label>
              <input type="number" min="0" step="0.01" value={saldoFinal}
                onChange={e => setSaldoFinal(e.target.value)}
                placeholder="0" />
            </div>
            {saldoFinal !== '' && (
              <div style={{
                background: diferenciaEfectivo === 0 ? 'var(--gnb)' : diferenciaEfectivo > 0 ? 'var(--amb)' : 'var(--rdb)',
                border: `1px solid ${diferenciaEfectivo === 0 ? 'var(--gn)' : diferenciaEfectivo > 0 ? 'var(--am)' : 'var(--rd)'}`,
                borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                color: diferenciaEfectivo === 0 ? 'var(--gn)' : diferenciaEfectivo > 0 ? 'var(--am)' : 'var(--rd)',
                fontWeight: 700, fontSize: 14
              }}>
                {diferenciaEfectivo === 0 ? '✓ Sin diferencias' :
                  diferenciaEfectivo > 0 ? `⬆ Sobrante: ${fmt(Math.abs(diferenciaEfectivo))}` :
                    `⬇ Faltante: ${fmt(Math.abs(diferenciaEfectivo))}`}
              </div>
            )}
            <div className="fgg" style={{ marginBottom: 20 }}>
              <label>Observaciones de cierre</label>
              <textarea value={obsCierre} onChange={e => setObsCierre(e.target.value)}
                placeholder="Detalles, novedades, etc." rows={3}
                style={{ border: '1px solid var(--bd2)', borderRadius: 10, padding: '9px 13px', fontSize: 13, width: '100%', resize: 'vertical' }}
              />
            </div>
            <button className="bp" style={{ width: '100%', background: 'var(--rd)' }}
              onClick={handleCerrar} disabled={saving}>
              {saving ? 'Cerrando...' : '🔐 Cerrar caja'}
            </button>
          </div>
        </div>
      ) : (
        /* ─── CAJA CERRADA ─── */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="cc">
            <div className="ct"><div className="ct-icon">🔓</div>Abrir nueva caja</div>
            <p style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 16 }}>
              Ingresá el efectivo con el que arrancás el día.
            </p>
            <div className="fgg" style={{ marginBottom: 20 }}>
              <label>Saldo inicial en efectivo $</label>
              <input type="number" min="0" step="0.01" value={saldoInicial}
                onChange={e => setSaldoInicial(e.target.value)}
                placeholder="0" autoFocus />
            </div>
            <button className="bp" style={{ width: '100%' }} onClick={handleAbrir} disabled={saving}>
              {saving ? 'Abriendo...' : '🔓 Abrir caja'}
            </button>
          </div>

          <div className="cc">
            <div className="ct"><div className="ct-icon">ℹ️</div>Estado</div>
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--mu)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>No hay una caja abierta.</p>
              <p style={{ fontSize: 13, marginTop: 6 }}>Abrí una caja para poder registrar ventas.</p>
            </div>
          </div>
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className="sdv">Historial de cajas cerradas</div>
          <div className="vtable-wrap">
            <table className="vtable">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Apertura</th>
                  <th>Cierre</th>
                  <th className="num">Saldo inicial</th>
                  <th className="num">Total ventas</th>
                  <th className="num">Efectivo esperado</th>
                  <th className="num">Contado</th>
                  <th className="num">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {historial.map(c => {
                  const esperado = (c.saldo_inicial || 0) + (c.total_efectivo || 0)
                  const diff = (c.saldo_final || 0) - esperado
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.fecha}</td>
                      <td>{c.hora_apertura}</td>
                      <td>{c.hora_cierre}</td>
                      <td className="num">{fmt(c.saldo_inicial)}</td>
                      <td className="num" style={{ color: 'var(--gn)', fontWeight: 700 }}>{fmt(c.total_ventas)}</td>
                      <td className="num">{fmt(esperado)}</td>
                      <td className="num">{fmt(c.saldo_final)}</td>
                      <td className="num" style={{ fontWeight: 700, color: diff === 0 ? 'var(--gn)' : diff > 0 ? 'var(--am)' : 'var(--rd)' }}>
                        {diff >= 0 ? '+' : ''}{fmt(diff)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
