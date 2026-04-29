import React, { useState, useMemo } from 'react'

const fmt = (n) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta débito', 'Tarjeta crédito', 'Mercado Pago', 'Otro']

function CajaCard({ caja, ventas, onCerrar, addToast }) {
  const [cerrando, setCerrando] = useState(false)
  const [saldoFinal, setSaldoFinal] = useState('')
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)

  const ventasCaja = useMemo(() =>
    ventas.filter(v => v.caja_id === caja.id && v.estado !== 'anulada'),
    [ventas, caja.id]
  )

  const totalVentas = ventasCaja.reduce((s, v) => s + (v.total || 0), 0)
  const totalEfectivo = ventasCaja.filter(v => v.metodo_pago === 'Efectivo').reduce((s, v) => s + (v.total || 0), 0)
  const efectivoEsperado = (caja.saldo_inicial || 0) + totalEfectivo

  const desglose = useMemo(() => {
    const map = {}
    ventasCaja.forEach(v => {
      const m = v.metodo_pago || 'Otro'
      map[m] = (map[m] || 0) + (v.total || 0)
    })
    return map
  }, [ventasCaja])

  const diferencia = saldoFinal !== '' ? (parseFloat(saldoFinal) || 0) - efectivoEsperado : null

  async function handleCerrar() {
    const sf = parseFloat(saldoFinal)
    if (isNaN(sf) || sf < 0) { addToast('Ingresá el efectivo contado en caja', 'err'); return }
    if (!window.confirm(`¿Cerrar "${caja.nombre || 'Caja'}"? Esta acción no se puede deshacer.`)) return
    setSaving(true)
    try {
      await onCerrar({ cajaId: caja.id, saldo_final: sf, obs_cierre: obs, total_ventas: totalVentas, total_efectivo: totalEfectivo })
      addToast(`✓ Caja "${caja.nombre || ''}" cerrada`)
    } catch (e) { addToast('Error: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  return (
    <div className="cc" style={{ borderTop: '3px solid var(--gn)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--nv)', fontFamily: 'Nunito, sans-serif' }}>
              {caja.nombre || 'Caja'}
            </span>
            {caja.turno && (
              <span style={{ fontSize: 12, background: 'var(--nv3)', color: 'var(--nv)', padding: '2px 9px', borderRadius: 20, fontWeight: 700 }}>
                {caja.turno}
              </span>
            )}
            <span className="badge bpd">● Abierta</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 4 }}>
            {caja.fecha} · apertura {caja.hora_apertura} hs · saldo inicial {fmt(caja.saldo_inicial)}
          </div>
        </div>
        <button className="bg2 bsm" onClick={() => setCerrando(!cerrando)}>
          {cerrando ? '✕ Cancelar' : '🔐 Cerrar caja'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Resumen</div>
          <div className="li"><span className="lin">Tickets registrados</span><span className="lis">{ventasCaja.length}</span></div>
          <div className="li"><span className="lin">Total facturado</span><span className="lip">{fmt(totalVentas)}</span></div>
          <div className="li"><span className="lin">Efectivo esperado en caja</span><span className="lip">{fmt(efectivoEsperado)}</span></div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Por método de pago</div>
          {Object.keys(desglose).length === 0
            ? <p style={{ fontSize: 13, color: 'var(--mu2)', padding: '8px 0' }}>Sin ventas aún</p>
            : METODOS_PAGO.filter(m => desglose[m] > 0).map(m => (
              <div key={m} className="li">
                <span className="lin">{m}</span>
                <span className="lip">{fmt(desglose[m])}</span>
              </div>
            ))
          }
        </div>
      </div>

      {cerrando && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--bd)', paddingTop: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 12 }}>
            Contá el efectivo físico en caja e ingresalo para verificar diferencias.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="fgg">
              <label>Efectivo contado en caja $</label>
              <input type="number" min="0" step="0.01" value={saldoFinal}
                onChange={e => setSaldoFinal(e.target.value)} placeholder="0" autoFocus />
            </div>
            <div className="fgg">
              <label>Observaciones de cierre</label>
              <input type="text" value={obs} onChange={e => setObs(e.target.value)}
                placeholder="Novedades, diferencias, detalles..." />
            </div>
          </div>
          {diferencia !== null && (
            <div style={{
              background: diferencia === 0 ? 'var(--gnb)' : diferencia > 0 ? 'var(--amb)' : 'var(--rdb)',
              border: `1px solid ${diferencia === 0 ? 'var(--gn)' : diferencia > 0 ? 'var(--am)' : 'var(--rd)'}`,
              borderRadius: 10, padding: '10px 14px', marginBottom: 12,
              color: diferencia === 0 ? 'var(--gn)' : diferencia > 0 ? 'var(--am)' : 'var(--rd)',
              fontWeight: 700, fontSize: 14
            }}>
              {diferencia === 0 ? '✓ Sin diferencias' :
                diferencia > 0 ? `⬆ Sobrante: ${fmt(Math.abs(diferencia))}` :
                  `⬇ Faltante: ${fmt(Math.abs(diferencia))}`}
            </div>
          )}
          <button
            className="bp"
            style={{ background: 'var(--rd)', borderColor: 'var(--rd)', width: '100%' }}
            onClick={handleCerrar}
            disabled={saving}
          >
            {saving ? 'Cerrando...' : `🔐 Confirmar cierre de "${caja.nombre || 'Caja'}"`}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Caja({ cajasAbiertas, historial, loading, ventas, onAbrir, onCerrar, addToast }) {
  const [nombre, setNombre] = useState('')
  const [turno, setTurno] = useState('')
  const [saldoInicial, setSaldoInicial] = useState('')
  const [saving, setSaving] = useState(false)
  const [histExpanded, setHistExpanded] = useState({})

  async function handleAbrir() {
    if (saldoInicial === '' || isNaN(parseFloat(saldoInicial)) || parseFloat(saldoInicial) < 0) {
      addToast('Ingresá un saldo inicial válido (puede ser 0)', 'err')
      return
    }
    setSaving(true)
    try {
      await onAbrir({ saldo_inicial: parseFloat(saldoInicial), nombre: nombre.trim() || 'Caja', turno: turno.trim() })
      setNombre(''); setTurno(''); setSaldoInicial('')
      addToast('✓ Caja abierta correctamente')
    } catch (e) { addToast('Error: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  return (
    <div className="sec">
      <div className="ph">
        <div>
          <div className="pt">Caja</div>
          <div className="ps">
            {loading ? 'Cargando...' : cajasAbiertas.length === 0
              ? 'Sin cajas abiertas'
              : `${cajasAbiertas.length} caja${cajasAbiertas.length > 1 ? 's' : ''} abierta${cajasAbiertas.length > 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty"><div className="emj">⏳</div><p>Cargando...</p></div>
      ) : (
        <>
          {/* ── ABRIR NUEVA CAJA ── */}
          <div className="cc" style={{ marginBottom: 24 }}>
            <div className="ct"><div className="ct-icon">🔓</div>Abrir nueva caja</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="fgg">
                <label>Nombre de la caja</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Buffet, Saltos, Entrada..."
                  onKeyDown={e => e.key === 'Enter' && handleAbrir()}
                />
              </div>
              <div className="fgg">
                <label>Turno</label>
                <input
                  type="text"
                  value={turno}
                  onChange={e => setTurno(e.target.value)}
                  placeholder="Ej: Mañana, Tarde, Noche..."
                  onKeyDown={e => e.key === 'Enter' && handleAbrir()}
                />
              </div>
              <div className="fgg">
                <label>Saldo inicial en efectivo $</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={saldoInicial}
                  onChange={e => setSaldoInicial(e.target.value)}
                  placeholder="0"
                  onKeyDown={e => e.key === 'Enter' && handleAbrir()}
                />
              </div>
            </div>
            <button className="bp" onClick={handleAbrir} disabled={saving}>
              {saving ? 'Abriendo...' : '🔓 Abrir caja'}
            </button>
          </div>

          {/* ── CAJAS ABIERTAS ── */}
          {cajasAbiertas.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div className="sdv">Cajas abiertas ({cajasAbiertas.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {cajasAbiertas.map(c => (
                  <CajaCard key={c.id} caja={c} ventas={ventas} onCerrar={onCerrar} addToast={addToast} />
                ))}
              </div>
            </div>
          )}

          {/* ── HISTORIAL ── */}
          {historial.length > 0 && (
            <div>
              <div className="sdv">Historial de cajas cerradas</div>
              <div className="vtable-wrap">
                <table className="vtable">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Turno</th>
                      <th>Fecha</th>
                      <th>Apertura</th>
                      <th>Cierre</th>
                      <th className="num">Saldo inicial</th>
                      <th className="num">Total ventas</th>
                      <th className="num">Efect. esperado</th>
                      <th className="num">Contado</th>
                      <th className="num">Diferencia</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map(c => {
                      const esperado = (c.saldo_inicial || 0) + (c.total_efectivo || 0)
                      const diff = (c.saldo_final || 0) - esperado
                      const expanded = histExpanded[c.id]
                      const ventasCerrada = ventas.filter(v => v.caja_id === c.id && v.estado !== 'anulada')
                      const desglose = {}
                      ventasCerrada.forEach(v => {
                        const m = v.metodo_pago || 'Otro'
                        desglose[m] = (desglose[m] || 0) + (v.total || 0)
                      })
                      return (
                        <React.Fragment key={c.id}>
                          <tr>
                            <td style={{ fontWeight: 600 }}>{c.nombre || '—'}</td>
                            <td style={{ color: 'var(--mu)' }}>{c.turno || '—'}</td>
                            <td style={{ fontWeight: 600 }}>{c.fecha}</td>
                            <td>{c.hora_apertura}</td>
                            <td>{c.hora_cierre}</td>
                            <td className="num">{fmt(c.saldo_inicial)}</td>
                            <td className="num" style={{ color: 'var(--gn)', fontWeight: 700 }}>{fmt(c.total_ventas)}</td>
                            <td className="num">{fmt(esperado)}</td>
                            <td className="num">{fmt(c.saldo_final)}</td>
                            <td className="num" style={{
                              fontWeight: 700,
                              color: diff === 0 ? 'var(--gn)' : diff > 0 ? 'var(--am)' : 'var(--rd)'
                            }}>
                              {diff >= 0 ? '+' : ''}{fmt(diff)}
                            </td>
                            <td>
                              <button
                                className="bg2 bsm"
                                onClick={() => setHistExpanded(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                              >
                                {expanded ? '▲' : '▼ Detalle'}
                              </button>
                            </td>
                          </tr>
                          {expanded && (
                            <tr>
                              <td colSpan={11} style={{ background: 'var(--bg)', padding: '14px 20px' }}>
                                <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
                                  <div>
                                    <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                                      Por método de pago
                                    </div>
                                    {Object.keys(desglose).length === 0
                                      ? <span style={{ fontSize: 13, color: 'var(--mu2)' }}>Sin datos de ventas en el período actual</span>
                                      : METODOS_PAGO.filter(m => desglose[m] > 0).map(m => (
                                        <div key={m} style={{ display: 'flex', gap: 20, marginBottom: 5 }}>
                                          <span style={{ fontSize: 13, color: 'var(--mu)', minWidth: 170 }}>{m}</span>
                                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--nv)' }}>{fmt(desglose[m])}</span>
                                        </div>
                                      ))
                                    }
                                    <div style={{ marginTop: 8, borderTop: '1px solid var(--bd)', paddingTop: 8 }}>
                                      <div style={{ display: 'flex', gap: 20 }}>
                                        <span style={{ fontSize: 13, color: 'var(--mu)', minWidth: 170, fontWeight: 700 }}>Total tickets: {ventasCerrada.length}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {c.obs_cierre && (
                                    <div>
                                      <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                                        Observaciones de cierre
                                      </div>
                                      <span style={{ fontSize: 13, color: 'var(--tx)' }}>{c.obs_cierre}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
