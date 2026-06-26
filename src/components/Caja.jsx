import React, { useState, useMemo } from 'react'
import { imprimirTicket, imprimirTicketBrowser } from '../utils'

const fmt = (n) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
const fmtNum = (n) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta débito', 'Tarjeta crédito', 'Mercado Pago', 'Otro']

function imprimirCierre({ caja, horaCierre, empleado, ticketsCount, totalVentas, totalEfectivo, desglose, gastos, totalGastos, efectivoEsperado, saldoFinal, diferencia, obs }) {
  fetch('http://localhost:5001/print/cierre_caja', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      caja,
      horaCierre,
      empleado,
      ticketsCount,
      totalVentas,
      totalEfectivo,
      desglose,
      gastos,
      totalGastos,
      efectivoEsperado,
      saldoFinal,
      saldoInicial: caja.saldo_inicial || 0,
      diferencia,
      obs,
    }),
  }).catch(() => {
    // fallback: impresion browser
    const fmtP = (n) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
    const signo = (n) => n >= 0 ? '+' : ''
    const difColor = diferencia === 0 ? '#16a34a' : diferencia > 0 ? '#d97706' : '#dc2626'
    const totalOnline = totalVentas - totalEfectivo
    const onlineMetodos = METODOS_PAGO.filter(m => m !== 'Efectivo' && desglose[m] > 0)
    const gastosRows = gastos.map(g =>
      `<tr><td style="padding:1px 0 1px 12px;color:#555">${g.detalle || '—'}${g.persona ? ` (${g.persona})` : ''}</td><td style="text-align:right;color:#dc2626">−${fmtP(g.monto)}</td></tr>`
    ).join('')
    const onlineRows = onlineMetodos.map(m =>
      `<tr><td style="padding:1px 0 1px 12px;color:#555">${m}</td><td style="text-align:right">${fmtP(desglose[m])}</td></tr>`
    ).join('')
    const sep = '--------------------------------'; const sep2 = '================================'
    imprimirTicketBrowser(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title></title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:8px;color:#000;background:#fff;width:74mm}
h1{font-size:10px;font-weight:bold;text-align:center;letter-spacing:1px;margin-bottom:2px}.sub{text-align:center;font-size:8px;margin-bottom:3px}
pre{font-family:inherit;font-size:8px;margin:2px 0;color:#555}table{width:100%;border-collapse:collapse}td{padding:1px 0;vertical-align:top;font-size:8px}
td.r{text-align:right;white-space:nowrap}.section{font-size:8px;font-weight:bold;text-transform:uppercase;margin:3px 0 1px}
.bold td{font-weight:bold}.big td{font-size:9px;font-weight:bold;padding-top:2px}.dif td{font-size:9px;font-weight:bold;color:${difColor}}
.foot{text-align:center;font-size:7px;color:#666;margin-top:4px}</style></head><body>
<h1>CIERRE DE CAJA</h1><div class="sub">Kangaroo Fun</div><pre>${sep2}</pre>
<table><tr><td>Caja</td><td class="r"><b>${caja.nombre||'Caja'}</b></td></tr>
${caja.turno?`<tr><td>Turno</td><td class="r">${caja.turno}</td></tr>`:''}
<tr><td>Fecha</td><td class="r">${caja.fecha||''}</td></tr>
<tr><td>Apertura</td><td class="r">${caja.hora_apertura||'—'} hs</td></tr>
<tr><td>Cierre</td><td class="r">${horaCierre} hs</td></tr>
${empleado?`<tr><td>Responsable</td><td class="r"><b>${empleado}</b></td></tr>`:''}</table>
<pre>${sep}</pre><div class="section">Ventas</div>
<table><tr><td>Tickets</td><td class="r">${ticketsCount}</td></tr>
<tr class="bold"><td>Total ventas</td><td class="r">${fmtP(totalVentas)}</td></tr>
<tr><td>Efectivo</td><td class="r">${fmtP(totalEfectivo)}</td></tr>
<tr><td>Online</td><td class="r">${fmtP(totalOnline)}</td></tr>${onlineRows}</table>
${totalGastos>0?`<pre>${sep}</pre><div class="section">Gastos</div><table><tr class="bold"><td>Total gastos</td><td class="r">−${fmtP(totalGastos)}</td></tr>${gastosRows}</table>`:''}
<pre>${sep2}</pre><div class="section">Balance</div>
<table><tr><td>Saldo inicial</td><td class="r">${fmtP(caja.saldo_inicial)}</td></tr>
<tr><td>+ Efectivo cobrado</td><td class="r">+${fmtP(totalEfectivo)}</td></tr>
${totalGastos>0?`<tr><td>− Gastos</td><td class="r">−${fmtP(totalGastos)}</td></tr>`:''}
<tr class="big"><td>Total teorico</td><td class="r">${fmtP(efectivoEsperado)}</td></tr>
<tr class="big"><td>Total real</td><td class="r">${fmtP(saldoFinal)}</td></tr>
<tr class="dif"><td>Diferencia</td><td class="r">${signo(diferencia)}${fmtP(diferencia)}</td></tr></table>
<pre>${sep2}</pre><div class="foot">${new Date().toLocaleString('es-AR')}</div></body></html>`)
  })
}

function ticketVentaHtml(venta) {
  const f = (n) => '$' + Math.round(Number(n || 0)).toLocaleString('es-AR')
  const items = (venta.venta_items || []).map(it =>
    `<tr><td>${it.nombre_producto} ×${it.cantidad}</td><td style="text-align:right">${f(it.subtotal)}</td></tr>`
  ).join('')
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title></title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:8px;width:74mm}
h1{font-size:10px;font-weight:bold;text-align:center;margin-bottom:2px}
.sub{text-align:center;font-size:8px;margin-bottom:3px}
table{width:100%;border-collapse:collapse}td{padding:1px 0;font-size:8px;vertical-align:top}
.sep{letter-spacing:0;font-size:8px;margin:2px 0}
.total td{font-size:10px;font-weight:bold;border-top:1px solid #000;padding-top:2px}
.foot{text-align:center;font-size:7px;color:#666;margin-top:4px}
</style></head><body>
<h1>KANGOO CUMPLES</h1>
<div class="sub">Ticket #${venta.numero || ''}</div>
<pre class="sep">--------------------------------</pre>
<table>
<tr><td>Fecha</td><td style="text-align:right">${venta.fecha || ''} ${venta.hora || ''}</td></tr>
${venta.cliente ? `<tr><td>Cliente</td><td style="text-align:right">${venta.cliente}</td></tr>` : ''}
<tr><td>Pago</td><td style="text-align:right">${venta.metodo_pago || '—'}</td></tr>
</table>
<pre class="sep">--------------------------------</pre>
<table>${items}</table>
<pre class="sep">--------------------------------</pre>
<table>
${venta.descuento > 0 ? `<tr><td>Subtotal</td><td style="text-align:right">${f(venta.subtotal)}</td></tr><tr><td>Descuento</td><td style="text-align:right">-${f(venta.descuento)}</td></tr>` : ''}
<tr class="total"><td>TOTAL</td><td style="text-align:right">${f(venta.total)}</td></tr>
</table>
${venta.obs ? `<p style="font-size:7px;margin-top:4px">${venta.obs}</p>` : ''}
<div class="foot">Gracias por su compra!</div>
</body></html>`
}

function imprimirVentaCaja(venta) {
  fetch('http://localhost:5001/print/venta_caja', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(venta),
  }).then(r => {
    if (!r.ok) imprimirTicketBrowser(ticketVentaHtml(venta))
  }).catch(() => {
    imprimirTicketBrowser(ticketVentaHtml(venta))
  })
}

function TicketDetalle({ venta, onClose }) {
  const fmt2 = (n) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
  return (
    <div className="ov op" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dm" style={{ maxWidth: 420 }}>
        <div className="moh">
          <div className="mot"><div className="mot-icon">🧾</div>Ticket {venta.numero}</div>
          <button className="xcl" onClick={onClose}>✕</button>
        </div>
        <div style={{ marginTop: 14 }}>
          <div className="dm-row"><span className="dm-label">Fecha / Hora</span><span className="dm-val">{venta.fecha} {venta.hora}</span></div>
          {venta.cliente && <div className="dm-row"><span className="dm-label">Cliente</span><span className="dm-val">{venta.cliente}</span></div>}
          <div className="dm-row"><span className="dm-label">Método de pago</span><span className="dm-val">{venta.metodo_pago || '—'}</span></div>
          <div className="sdv" style={{ marginTop: 14 }}>Artículos</div>
          {(venta.venta_items || []).map((it, i) => (
            <div key={i} className="dm-row">
              <span className="dm-label">{it.nombre_producto} ×{it.cantidad}</span>
              <span className="dm-val" style={{ color: 'var(--gn)', fontWeight: 700 }}>{fmt2(it.subtotal)}</span>
            </div>
          ))}
          <div className="tb" style={{ marginTop: 14 }}>
            <div className="tr"><span className="tl">Subtotal</span><span className="tv">{fmt2(venta.subtotal)}</span></div>
            {venta.descuento > 0 && <div className="tr"><span className="tl">Descuento</span><span className="tv" style={{ color: '#ff9f7a' }}>-{fmt2(venta.descuento)}</span></div>}
            <hr className="tsep" />
            <div className="tr big"><span className="tl">TOTAL</span><span className="tv">{fmt2(venta.total)}</span></div>
          </div>
          {venta.obs && <p style={{ marginTop: 12, fontSize: 13, color: 'var(--mu)' }}>{venta.obs}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="bg2" onClick={onClose}>Cerrar</button>
          <button className="bp" onClick={() => { imprimirVentaCaja(venta) }}>🖨 Imprimir</button>
        </div>
      </div>
    </div>
  )
}

function CajaCard({ caja, ventas, gastos = [], empleados = [], onCerrar, onAddGasto, onAddCofreIngreso, addToast, askPin }) {
  const [cerrando, setCerrando] = useState(false)
  const [saldoFinal, setSaldoFinal] = useState('')
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)
  const [verTickets, setVerTickets] = useState(false)
  const [ticketDetalle, setTicketDetalle] = useState(null)
  const [showGastos, setShowGastos] = useState(false)
  const [showCofre, setShowCofre] = useState(false)
  const [verGastos, setVerGastos] = useState(false)
  // Gasto form
  const [empleadoCierre, setEmpleadoCierre] = useState('')
  const [gastoMonto, setGastoMonto] = useState('')
  const [gastoDetalle, setGastoDetalle] = useState('')
  const [gastoPersona, setGastoPersona] = useState('')
  // Cofre form
  const [cofreMonto, setCofreMonto] = useState('')
  const [cofrePersona, setCofrePersona] = useState('')
  const [cofreObs, setCofreObs] = useState('')

  const ventasCaja = useMemo(() =>
    ventas.filter(v => v.caja_id === caja.id && v.estado !== 'anulada'),
    [ventas, caja.id]
  )

  const totalVentas = ventasCaja.reduce((s, v) => s + (v.total || 0), 0)
  const totalEfectivo = ventasCaja.filter(v => v.metodo_pago === 'Efectivo').reduce((s, v) => s + (v.total || 0), 0)
  const totalGastos = gastos.reduce((s, g) => s + (g.monto || 0), 0)
  const efectivoEsperado = (caja.saldo_inicial || 0) + totalEfectivo - totalGastos

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
    if (!empleadoCierre) { addToast('Seleccioná el empleado que realiza el cierre', 'err'); return }
    askPin(`Cerrar caja "${caja.nombre || 'Caja'}"${caja.turno ? ` (${caja.turno})` : ''} — efectivo contado: $${sf}.`, async () => {
      setSaving(true)
      const horaCierre = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      try {
        await onCerrar({ cajaId: caja.id, saldo_final: sf, obs_cierre: obs, total_ventas: totalVentas, total_efectivo: totalEfectivo, empleado_cierre: empleadoCierre })
        addToast(`✓ Caja "${caja.nombre || ''}" cerrada`)
        imprimirCierre({
          caja,
          horaCierre,
          empleado: empleadoCierre,
          ticketsCount: ventasCaja.length,
          totalVentas,
          totalEfectivo,
          desglose,
          gastos,
          totalGastos,
          efectivoEsperado,
          saldoFinal: sf,
          diferencia: sf - efectivoEsperado,
          obs,
        })
      } catch (e) { addToast('Error: ' + e.message, 'err') }
      finally { setSaving(false) }
    })
  }

  function handleAddGasto() {
    const m = parseFloat(gastoMonto)
    if (!m || m <= 0) { addToast('Ingresá un monto válido', 'err'); return }
    if (!gastoDetalle.trim()) { addToast('Ingresá el detalle del gasto', 'err'); return }
    if (!gastoPersona) { addToast('Indicá quién realiza el gasto', 'err'); return }
    if (m > efectivoEsperado) { addToast(`El monto supera el efectivo disponible en caja (${fmt(efectivoEsperado)})`, 'err'); return }
    askPin(`Gasto en caja "${caja.nombre || 'Caja'}": $${m} — "${gastoDetalle.trim()}" — responsable: ${gastoPersona.trim()}.`, async () => {
      try {
        await onAddGasto({ caja_id: caja.id, monto: m, detalle: gastoDetalle.trim(), persona: gastoPersona.trim() })
        setGastoMonto(''); setGastoDetalle(''); setGastoPersona('')
        addToast('✓ Gasto registrado')
      } catch (e) { addToast('Error: ' + e.message, 'err') }
    })
  }

  function handleTraspasarCofre() {
    const m = parseFloat(cofreMonto)
    if (!m || m <= 0) { addToast('Ingresá un monto válido', 'err'); return }
    if (!cofrePersona) { addToast('Indicá quién realiza el traspaso', 'err'); return }
    if (m > efectivoEsperado) { addToast(`El monto supera el efectivo disponible en caja (${fmt(efectivoEsperado)})`, 'err'); return }
    askPin(`Traspaso al cofre desde "${caja.nombre || 'Caja'}": $${m} — responsable: ${cofrePersona.trim()}.`, async () => {
      try {
        const obsText = cofreObs.trim()
        await onAddCofreIngreso({ tipo: 'ingreso', monto: m, persona: cofrePersona.trim(), obs: obsText || `Traspaso desde ${caja.nombre || 'Caja'}` })
        await onAddGasto({ caja_id: caja.id, monto: m, detalle: `Traspaso al cofre${obsText ? ': ' + obsText : ''}`, persona: cofrePersona.trim() })
        setCofreMonto(''); setCofrePersona(''); setCofreObs('')
        setShowCofre(false)
        addToast('✓ Traspaso al cofre registrado')
      } catch (e) { addToast('Error: ' + e.message, 'err') }
    })
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="bg2 bsm" onClick={() => setVerTickets(!verTickets)}>
            {verTickets ? '▲ Ocultar tickets' : `🧾 Ver tickets (${ventasCaja.length})`}
          </button>
          {gastos.length > 0 && (
            <button className="bg2 bsm" onClick={() => setVerGastos(f => !f)}>
              {verGastos ? '▲ Ocultar gastos' : `💸 Ver gastos (${gastos.length})`}
            </button>
          )}
          <button className="bg2 bsm" onClick={() => { setShowGastos(f => !f); setShowCofre(false) }}>
            {showGastos ? '✕ Cancelar gasto' : '🧾 Registrar gasto'}
          </button>
          <button className="bg2 bsm" onClick={() => { setShowCofre(f => !f); setShowGastos(false) }}>
            {showCofre ? '✕ Cancelar traspaso' : '🔒 Traspasar al cofre'}
          </button>
          <button className="bg2 bsm" onClick={() => setCerrando(!cerrando)}>
            {cerrando ? '✕ Cancelar' : '🔐 Cerrar caja'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Resumen</div>
          <div className="li"><span className="lin">Tickets registrados</span><span className="lis">{ventasCaja.length}</span></div>
          <div className="li"><span className="lin">Total facturado</span><span className="lip">{fmt(totalVentas)}</span></div>
          {totalGastos > 0 && (
            <div className="li"><span className="lin">Gastos / traspasos</span><span style={{ fontWeight: 700, color: 'var(--rd)' }}>−{fmt(totalGastos)}</span></div>
          )}
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

      {/* ── DETALLE GASTOS ── */}
      {verGastos && gastos.length > 0 && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--bd)', paddingTop: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
            Gastos registrados en esta caja
          </div>
          <div className="vtable-wrap">
            <table className="vtable">
              <thead>
                <tr>
                  <th>Detalle</th>
                  <th>Responsable</th>
                  <th style={{ fontSize: 11 }}>Fecha / Hora</th>
                  <th className="num">Monto</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map(g => (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 600 }}>{g.detalle || '—'}</td>
                    <td>{g.persona || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--mu)' }}>
                      {g.created_at ? new Date(g.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="num" style={{ fontWeight: 800, color: 'var(--rd)' }}>−{fmt(g.monto)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="num" style={{ fontSize: 12 }}>Total gastos</td>
                  <td className="num" style={{ fontWeight: 800, color: 'var(--rd)' }}>−{fmt(totalGastos)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── FORM GASTO ── */}
      {showGastos && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--bd)', paddingTop: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
            Registrar gasto desde caja
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="fgg">
              <label>Monto $</label>
              <input type="number" min="0" value={gastoMonto} onChange={e => setGastoMonto(e.target.value)} placeholder="0" autoFocus />
            </div>
            <div className="fgg">
              <label>Detalle del gasto</label>
              <input type="text" value={gastoDetalle} onChange={e => setGastoDetalle(e.target.value)} placeholder="Ej: Bolsas, limpieza, etc." />
            </div>
            <div className="fgg">
              <label>Responsable</label>
              <select value={gastoPersona} onChange={e => setGastoPersona(e.target.value)}>
                <option value="">Seleccionar...</option>
                {empleados.filter(e => e.activo !== false).map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
              </select>
            </div>
          </div>
          <button className="bp" style={{ background: 'var(--am)', borderColor: 'var(--am)' }} onClick={handleAddGasto}>
            ✓ Registrar gasto
          </button>
        </div>
      )}

      {/* ── FORM TRASPASO COFRE ── */}
      {showCofre && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--bd)', paddingTop: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
            Traspasar efectivo al cofre
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="fgg">
              <label>Monto a traspasar $</label>
              <input type="number" min="0" value={cofreMonto} onChange={e => setCofreMonto(e.target.value)} placeholder="0" autoFocus />
            </div>
            <div className="fgg">
              <label>Responsable del traspaso</label>
              <select value={cofrePersona} onChange={e => setCofrePersona(e.target.value)}>
                <option value="">Seleccionar...</option>
                {empleados.filter(e => e.activo !== false).map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
              </select>
            </div>
            <div className="fgg">
              <label>Observaciones</label>
              <input type="text" value={cofreObs} onChange={e => setCofreObs(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <button className="bp" style={{ background: 'var(--nv)', borderColor: 'var(--nv)' }} onClick={handleTraspasarCofre}>
            🔒 Confirmar traspaso al cofre
          </button>
        </div>
      )}

      {verTickets && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--bd)', paddingTop: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
            Tickets de esta caja
          </div>
          {ventasCaja.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--mu2)' }}>Sin ventas registradas aún.</p>
          ) : (
            <div className="vtable-wrap">
              <table className="vtable">
                <thead>
                  <tr>
                    <th>N° Ticket</th>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Método</th>
                    <th>Items</th>
                    <th className="num">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ventasCaja.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 700, color: 'var(--nv)', fontFamily: 'Nunito' }}>{v.numero}</td>
                      <td style={{ fontSize: 12, color: 'var(--mu)' }}>{v.hora}</td>
                      <td>{v.cliente || <span style={{ color: 'var(--mu2)' }}>—</span>}</td>
                      <td style={{ fontSize: 13 }}>{v.metodo_pago || '—'}</td>
                      <td style={{ fontSize: 13, color: 'var(--mu)' }}>{(v.venta_items || []).length} art.</td>
                      <td className="num" style={{ fontWeight: 800, color: 'var(--gn)' }}>{fmt(v.total)}</td>
                      <td>
                        <button className="bg2 bsm" onClick={() => setTicketDetalle(v)}>Ver</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="num" style={{ fontSize: 12 }}>Total</td>
                    <td className="num">{fmt(totalVentas)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {ticketDetalle && <TicketDetalle venta={ticketDetalle} onClose={() => setTicketDetalle(null)} />}

      {cerrando && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--bd)', paddingTop: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 12 }}>
            Contá el efectivo físico en caja e ingresalo para verificar diferencias.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="fgg">
              <label>Empleado que cierra</label>
              <select value={empleadoCierre} onChange={e => setEmpleadoCierre(e.target.value)} autoFocus>
                <option value="">Seleccionar...</option>
                {empleados.filter(e => e.activo !== false).map(e => (
                  <option key={e.id} value={e.nombre}>{e.nombre}</option>
                ))}
              </select>
            </div>
            <div className="fgg">
              <label>Efectivo contado en caja $</label>
              <input type="number" min="0" step="0.01" value={saldoFinal}
                onChange={e => setSaldoFinal(e.target.value)} placeholder="0" />
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

export default function Caja({ cajasAbiertas, historial, loading, ventas, gastos = [], empleados = [], onAbrir, onCerrar, onAddGasto, onAddCofreIngreso, addToast, askPin }) {
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
                <select value={turno} onChange={e => setTurno(e.target.value)}>
                  <option value="">Sin turno</option>
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                </select>
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
                  <CajaCard
                    key={c.id} caja={c} ventas={ventas}
                    gastos={gastos.filter(g => g.caja_id === c.id)}
                    empleados={empleados}
                    onCerrar={onCerrar} onAddGasto={onAddGasto} onAddCofreIngreso={onAddCofreIngreso}
                    addToast={addToast} askPin={askPin}
                  />
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
                      <th>Responsable</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map(c => {
                      const gastosCaja = gastos.filter(g => g.caja_id === c.id)
                      const totalGastosCaja = gastosCaja.reduce((s, g) => s + (g.monto || 0), 0)
                      const esperado = (c.saldo_inicial || 0) + (c.total_efectivo || 0) - totalGastosCaja
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
                            <td style={{ fontSize: 13, color: 'var(--mu)', fontWeight: c.empleado_cierre ? 600 : 400 }}>
                              {c.empleado_cierre || '—'}
                            </td>
                            <td style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                              <button
                                className="bg2 bsm"
                                onClick={() => setHistExpanded(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                              >
                                {expanded ? '▲' : '▼ Detalle'}
                              </button>
                              <button
                                className="bg2 bsm"
                                title="Reimprimir ticket de cierre"
                                onClick={() => imprimirCierre({
                                  caja: c,
                                  horaCierre: c.hora_cierre || '—',
                                  empleado: c.empleado_cierre || '',
                                  ticketsCount: ventasCerrada.length,
                                  totalVentas: c.total_ventas || 0,
                                  totalEfectivo: c.total_efectivo || 0,
                                  desglose,
                                  gastos: gastosCaja,
                                  totalGastos: totalGastosCaja,
                                  efectivoEsperado: esperado,
                                  saldoFinal: c.saldo_final || 0,
                                  diferencia: diff,
                                  obs: c.obs_cierre || '',
                                })}
                              >
                                🖨
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
