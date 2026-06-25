import React, { useState, useMemo, useRef } from 'react'
import { imprimirTicket } from '../utils'

const fmt = (n) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
const hoy = () => new Date().toISOString().slice(0, 10)
const hora = () => new Date().toTimeString().slice(0, 5)

function imprimirVenta({ numero, fecha, horaStr, cliente, items, subtotal, descuento, total, metodoPago }) {
  const sep = '--------------------------------'
  const itemRows = items.map(it =>
    `<tr>
      <td>${it.nombre_producto}</td>
      <td class="r">${it.cantidad} x ${fmt(it.precio_unitario)}</td>
    </tr>
    <tr><td colspan="2" class="r sub">${fmt(it.subtotal)}</td></tr>`
  ).join('')

  function copia(label) {
    return `
    <div class="copy">
      <h1>KANGAROO FUN</h1>
      <div class="sub2">Ticket de venta</div>
      <pre>${sep}</pre>
      <table>
        <tr><td>Nº</td><td class="r"><b>${numero}</b></td></tr>
        <tr><td>Fecha</td><td class="r">${fecha} ${horaStr}</td></tr>
        ${cliente ? `<tr><td>Cliente</td><td class="r">${cliente}</td></tr>` : ''}
      </table>
      <pre>${sep}</pre>
      <table>${itemRows}</table>
      <pre>${sep}</pre>
      <table>
        ${descuento > 0 ? `<tr><td>Subtotal</td><td class="r">${fmt(subtotal)}</td></tr>
        <tr><td>Descuento</td><td class="r">-${fmt(descuento)}</td></tr>` : ''}
        <tr class="big"><td>TOTAL</td><td class="r">${fmt(total)}</td></tr>
        <tr><td>Pago</td><td class="r">${metodoPago}</td></tr>
      </table>
      <pre>${sep}</pre>
      <div class="foot label">${label}</div>
      <div class="foot">Gracias por tu visita!</div>
    </div>`
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title></title>
<style>
  @page { size: 80mm 200mm; margin: 3mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 8px; color: #000; background: #fff; width: 74mm; }
  h1 { font-size: 10px; font-weight: bold; text-align: center; letter-spacing: 1px; margin-bottom: 2px; }
  .sub2 { text-align: center; font-size: 7px; margin-bottom: 2px; }
  pre { font-family: inherit; font-size: 8px; margin: 2px 0; color: #555; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; font-size: 8px; }
  td.r { text-align: right; white-space: nowrap; }
  td.sub { color: #444; font-size: 7px; padding-bottom: 2px; }
  .big td { font-size: 9px; font-weight: bold; padding-top: 2px; }
  .foot { text-align: center; font-size: 7px; color: #666; margin-top: 4px; }
  .label { font-size: 9px; font-weight: bold; color: #000; letter-spacing: 1px; margin-bottom: 1px; }
  .copy { page-break-after: always; padding-bottom: 4px; }
  .copy:last-child { page-break-after: avoid; }
</style>
</head>
<body>
  ${copia('** CLIENTE **')}
  ${copia('** COCINA **')}
</body></html>`

  imprimirTicket(html)
}

const METODOS_DEFAULT = ['Efectivo', 'Transferencia', 'Tarjeta débito', 'Tarjeta crédito', 'Mercado Pago', 'Otro']

export default function TicketModal({ productos, cajasAbiertas = [], cajaSeleccionadaId, onCajaChange, metodosPago, empleados = [], itemsIniciales = [], clienteInicial = '', onSave, onClose, addToast }) {
  const METODOS = metodosPago?.length ? metodosPago : METODOS_DEFAULT
  const [items, setItems] = useState(() => itemsIniciales.length ? itemsIniciales : [])
  const [busca, setBusca] = useState('')
  const [cliente, setCliente] = useState(clienteInicial)
  const [empleadoId, setEmpleadoId] = useState('')
  const [descuento, setDescuento] = useState('')
  const [descuentoTipo, setDescuentoTipo] = useState('monto')
  const [metodo, setMetodo] = useState('Efectivo')
  const [pagaCon, setPagaCon] = useState('')
  const [multiMetodo, setMultiMetodo] = useState(false)
  const [metodosPagados, setMetodosPagados] = useState([{ id: 1, met: 'Efectivo', monto: '' }])
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)
  const buscaRef = useRef()

  const empleadosActivos = empleados.filter(e => e.activo !== false)

  function handleCajaChange(id) {
    const parsed = id ? Number(id) : null
    if (onCajaChange) onCajaChange(parsed)
  }

  const prodsFiltrados = useMemo(() => {
    if (!busca) return []
    return productos.filter(p =>
      p.activo !== false &&
      (p.nombre.toLowerCase().includes(busca.toLowerCase()) || (p.codigo || '').toLowerCase().includes(busca.toLowerCase()))
    ).slice(0, 8)
  }, [busca, productos])

  function agregarProducto(prod) {
    const existe = items.find(it => it.producto_id === prod.id)
    if (existe) {
      setItems(prev => prev.map(it => it.producto_id === prod.id
        ? { ...it, cantidad: it.cantidad + 1, subtotal: (it.cantidad + 1) * it.precio_unitario }
        : it
      ))
    } else {
      setItems(prev => [...prev, {
        producto_id: prod.id,
        nombre_producto: prod.nombre,
        precio_unitario: prod.precio_venta || 0,
        cantidad: 1,
        subtotal: prod.precio_venta || 0,
        componentes: prod.componentes || [],
        maneja_stock: prod.maneja_stock ?? true,
        _stockActual: prod.stock_actual,
        _tipo: prod.tipo,
      }])
    }
    setBusca('')
    buscaRef.current?.focus()
  }

  function cambiarCantidad(pid, valor) {
    const qty = Math.max(1, Math.round(parseFloat(valor) || 1))
    setItems(prev => prev.map(it => it.producto_id === pid
      ? { ...it, cantidad: qty, subtotal: qty * it.precio_unitario }
      : it
    ))
  }

  function cambiarPrecio(pid, valor) {
    const p = parseFloat(valor) || 0
    setItems(prev => prev.map(it => it.producto_id === pid
      ? { ...it, precio_unitario: p, subtotal: it.cantidad * p }
      : it
    ))
  }

  function quitarItem(pid) {
    setItems(prev => prev.filter(it => it.producto_id !== pid))
  }

  const subtotal = items.reduce((s, it) => s + it.subtotal, 0)
  const descuentoNum = descuentoTipo === 'pct'
    ? subtotal * (parseFloat(descuento) || 0) / 100
    : parseFloat(descuento) || 0
  const total = Math.max(0, subtotal - descuentoNum)

  // Vuelto en modo single Efectivo
  const pagaConNum = parseFloat(pagaCon) || 0
  const vuelto = metodo === 'Efectivo' && pagaConNum > 0 ? pagaConNum - total : 0

  // Multi-método
  function addMetodoPago() {
    setMetodosPagados(prev => [...prev, { id: Date.now(), met: 'Efectivo', monto: '' }])
  }
  function removeMetodoPago(id) {
    setMetodosPagados(prev => prev.filter(m => m.id !== id))
  }
  function updateMetodoPago(id, field, val) {
    setMetodosPagados(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m))
  }

  const totalCubierto = metodosPagados.reduce((s, m) => s + (parseFloat(m.monto) || 0), 0)
  const restante = total - totalCubierto

  // Vuelto en modo multi: sumar lo pagado en efectivo y comparar
  const efectivoMulti = metodosPagados.filter(m => m.met === 'Efectivo').reduce((s, m) => s + (parseFloat(m.monto) || 0), 0)
  const vueltoMulti = multiMetodo && efectivoMulti > 0 && totalCubierto > total
    ? efectivoMulti - Math.max(0, efectivoMulti - (efectivoMulti - (totalCubierto - total)))
    : 0

  function toggleMultiMetodo() {
    if (!multiMetodo) {
      // Al activar multi: preinicializar con el método actual
      setMetodosPagados([{ id: 1, met: metodo, monto: '' }])
      setMultiMetodo(true)
    } else {
      setMultiMetodo(false)
      setMetodosPagados([{ id: 1, met: 'Efectivo', monto: '' }])
    }
  }

  async function handleGuardar() {
    if (items.length === 0) { addToast('Agregá al menos un producto', 'err'); return }

    if (multiMetodo) {
      const vacíos = metodosPagados.some(m => !m.monto || parseFloat(m.monto) <= 0)
      if (vacíos) { addToast('Completá los montos de cada método de pago.', 'err'); return }
      if (metodosPagados.length < 2) { addToast('Usá al menos 2 métodos, o desactivá el modo multi.', 'err'); return }
    }

    // Bloquear venta cuando hay stock insuficiente
    const sinStock = items.filter(it => it._tipo === 'simple' && it.maneja_stock !== false && (it._stockActual || 0) < it.cantidad)
    if (sinStock.length > 0) {
      const lista = sinStock.map(it => `• ${it.nombre_producto} (stock: ${it._stockActual || 0}, pedido: ${it.cantidad})`).join('\n')
      addToast(`Stock insuficiente:\n${lista}`, 'err')
      return
    }

    if (!cajaSeleccionadaId) {
      const ok = window.confirm('No hay ninguna caja seleccionada.\n\n¿Querés registrar la venta igualmente sin asignarla a una caja?')
      if (!ok) return
    }

    // Armar string de método de pago
    let metodoPagoFinal
    if (multiMetodo) {
      metodoPagoFinal = metodosPagados.map(m => `${m.met} ${fmt(parseFloat(m.monto) || 0)}`).join(' + ')
    } else {
      metodoPagoFinal = metodo
    }

    setSaving(true)
    try {
      const fechaStr = hoy()
      const horaStr = hora()
      const ventaGuardada = await onSave(
        {
          fecha: fechaStr, hora: horaStr, cliente,
          subtotal, descuento: descuentoNum, total,
          metodo_pago: metodoPagoFinal,
          caja_id: cajaSeleccionadaId || null,
          empleado_id: empleadoId ? Number(empleadoId) : null,
          obs,
        },
        items
      )
      if (ventaGuardada) {
        imprimirVenta({
          numero: ventaGuardada.numero,
          fecha: fechaStr,
          horaStr,
          cliente,
          items,
          subtotal,
          descuento: descuentoNum,
          total,
          metodoPago: metodoPagoFinal,
        })
      }
    } catch (e) {
      addToast('Error: ' + e.message, 'err')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ov op" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo" style={{ maxWidth: 860 }}>
        <div className="moh">
          <div className="mot"><div className="mot-icon">🧾</div>Nueva venta</div>
          <button className="xcl" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginTop: 4 }}>
          {/* Panel izquierdo: buscador + items */}
          <div>
            <div className="sdv">Agregar productos</div>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input
                ref={buscaRef}
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por nombre o código..."
                style={{ width: '100%', border: '1px solid var(--bd2)', borderRadius: 10, padding: '10px 14px', fontSize: 14 }}
                autoFocus
              />
              {prodsFiltrados.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                  background: 'var(--wh)', border: '1px solid var(--bd2)', borderRadius: 10,
                  boxShadow: 'var(--sh2)', marginTop: 4, overflow: 'hidden'
                }}>
                  {prodsFiltrados.map(p => (
                    <div key={p.id}
                      onClick={() => agregarProducto(p)}
                      style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bd)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--nv3)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{p.nombre}</div>
                        <div style={{ fontSize: 12, color: 'var(--mu)' }}>
                          {p.tipo === 'simple' ? `Stock: ${p.stock_actual || 0}` : 'Compuesto'}
                          {p.codigo ? ` · ${p.codigo}` : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gn)' }}>{fmt(p.precio_venta)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Items del ticket */}
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--mu2)', fontSize: 14 }}>
                Buscá un producto para agregar al ticket
              </div>
            ) : (
              <div>
                <table className="vtable">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="num" style={{ width: 80 }}>Cant.</th>
                      <th className="num" style={{ width: 120 }}>✏ Precio unit.</th>
                      <th className="num" style={{ width: 110 }}>Subtotal</th>
                      <th style={{ width: 36 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(it => (
                      <tr key={it.producto_id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{it.nombre_producto}</div>
                          {it._tipo === 'simple' && it.maneja_stock !== false && (
                            <div style={{ fontSize: 11, color: (it._stockActual || 0) < it.cantidad ? 'var(--am)' : 'var(--mu)' }}>
                              Stock: {it._stockActual || 0}{(it._stockActual || 0) < it.cantidad ? ' ⚠ insuficiente' : ''}
                            </div>
                          )}
                          {it.maneja_stock === false && (
                            <div style={{ fontSize: 11, color: 'var(--mu2)' }}>Sin control de stock</div>
                          )}
                        </td>
                        <td className="num">
                          <input type="number" min="1" step="1" value={it.cantidad}
                            onChange={e => cambiarCantidad(it.producto_id, e.target.value)}
                            style={{ width: 70, textAlign: 'right', border: '1px solid var(--bd2)', borderRadius: 7, padding: '4px 8px', fontSize: 13 }}
                          />
                        </td>
                        <td className="num">
                          <input type="number" min="0" step="0.01" value={it.precio_unitario}
                            onChange={e => cambiarPrecio(it.producto_id, e.target.value)}
                            style={{ width: 100, textAlign: 'right', border: '1px solid var(--nv2)', borderRadius: 7, padding: '4px 8px', fontSize: 13, background: 'var(--nv3)' }}
                            title="Podés cambiar el precio para esta venta"
                          />
                        </td>
                        <td className="num" style={{ fontWeight: 700 }}>{fmt(it.subtotal)}</td>
                        <td>
                          <button className="bdng" style={{ padding: '3px 8px' }} onClick={() => quitarItem(it.producto_id)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Panel derecho: resumen */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="sdv">Datos del cliente</div>
            <div className="fgg">
              <label>Cliente (opcional)</label>
              <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nombre o número" />
            </div>

            {empleadosActivos.length > 0 && (
              <div className="fgg">
                <label>Empleado</label>
                <select value={empleadoId} onChange={e => setEmpleadoId(e.target.value)}
                  style={{ border: '1px solid var(--bd2)', borderRadius: 10, padding: '9px 13px', fontSize: 13, background: 'var(--bg)', color: 'var(--tx)', width: '100%' }}>
                  <option value="">Sin asignar</option>
                  {empleadosActivos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
            )}

            {cajasAbiertas.length > 0 && (
              <>
                <div className="sdv">Caja</div>
                <select
                  value={cajaSeleccionadaId || ''}
                  onChange={e => handleCajaChange(e.target.value)}
                  style={{ border: '1px solid var(--bd2)', borderRadius: 10, padding: '9px 13px', fontSize: 13, background: 'var(--bg)', color: 'var(--tx)', width: '100%' }}
                >
                  <option value="">Sin caja</option>
                  {cajasAbiertas.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre || 'Caja'}{c.turno ? ` · ${c.turno}` : ''}
                    </option>
                  ))}
                </select>
              </>
            )}

            <div className="sdv" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Pago</span>
              <button
                type="button"
                onClick={toggleMultiMetodo}
                style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  border: `1.5px solid ${multiMetodo ? 'var(--nv)' : 'var(--bd2)'}`,
                  background: multiMetodo ? 'var(--nv3)' : 'transparent',
                  color: multiMetodo ? 'var(--nv)' : 'var(--mu)',
                  cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                }}
              >
                {multiMetodo ? '✓ Múltiple' : '+ Más de un método'}
              </button>
            </div>

            {!multiMetodo ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {METODOS.map(m => (
                    <button key={m} type="button"
                      className={`rp ${metodo === m ? 'spaid' : ''}`}
                      onClick={() => { setMetodo(m); setPagaCon('') }}
                      style={{ textAlign: 'left', padding: '8px 14px' }}
                    >{m}</button>
                  ))}
                </div>

                {/* Paga con / Vuelto - solo para Efectivo */}
                {metodo === 'Efectivo' && (
                  <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      ¿Con cuánto paga?
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={pagaCon}
                      onChange={e => setPagaCon(e.target.value)}
                      placeholder={fmt(total)}
                      style={{ border: '1px solid var(--bd2)', borderRadius: 8, padding: '8px 12px', fontSize: 15, width: '100%' }}
                    />
                    {pagaConNum > 0 && (
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', borderRadius: 8,
                        background: vuelto >= 0 ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
                        border: `1.5px solid ${vuelto >= 0 ? 'var(--gn)' : 'var(--rd, #ef4444)'}`,
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: vuelto >= 0 ? 'var(--gn)' : 'var(--rd, #ef4444)' }}>
                          {vuelto >= 0 ? 'Vuelto' : 'Falta'}
                        </span>
                        <span style={{ fontSize: 17, fontWeight: 800, color: vuelto >= 0 ? 'var(--gn)' : 'var(--rd, #ef4444)' }}>
                          {fmt(Math.abs(vuelto))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Modo multi-método */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {metodosPagados.map((mp, idx) => (
                  <div key={mp.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <select
                      value={mp.met}
                      onChange={e => updateMetodoPago(mp.id, 'met', e.target.value)}
                      style={{ flex: 1, border: '1px solid var(--bd2)', borderRadius: 8, padding: '8px 10px', fontSize: 13, background: 'var(--bg)', color: 'var(--tx)' }}
                    >
                      {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={mp.monto}
                      onChange={e => updateMetodoPago(mp.id, 'monto', e.target.value)}
                      placeholder="Monto"
                      style={{ width: 100, border: '1px solid var(--bd2)', borderRadius: 8, padding: '8px 10px', fontSize: 13, textAlign: 'right' }}
                    />
                    {metodosPagados.length > 1 && (
                      <button className="bdng" style={{ padding: '5px 8px' }} onClick={() => removeMetodoPago(mp.id)}>✕</button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="bg2 bsm"
                  onClick={addMetodoPago}
                  style={{ alignSelf: 'flex-start', marginTop: 2 }}
                >
                  + Agregar método
                </button>

                {/* Resumen cubierto */}
                <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--mu)', fontWeight: 600 }}>Cubierto</span>
                    <span style={{ fontWeight: 700 }}>{fmt(totalCubierto)}</span>
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800,
                    color: restante <= 0 ? 'var(--gn)' : 'var(--am)',
                  }}>
                    <span>{restante <= 0 ? (restante < 0 ? 'Vuelto (efectivo)' : 'Cubierto exacto') : 'Falta cubrir'}</span>
                    <span>{fmt(Math.abs(restante))}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="sdv">Descuento</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              {['monto', 'pct'].map(t => (
                <button key={t} type="button"
                  className={`rp${descuentoTipo === t ? ' spaid' : ''}`}
                  onClick={() => { setDescuentoTipo(t); setDescuento('') }}
                  style={{ flex: 1, textAlign: 'center', padding: '7px 8px', fontSize: 13 }}
                >
                  {t === 'monto' ? '$ Monto fijo' : '% Porcentaje'}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <input type="number" min="0" step="0.01" value={descuento}
                onChange={e => setDescuento(e.target.value)}
                placeholder="0"
                style={{ border: '1px solid var(--bd2)', borderRadius: 10, padding: '9px 36px 9px 13px', fontSize: 14, width: '100%' }}
              />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--mu)', fontWeight: 700, pointerEvents: 'none' }}>
                {descuentoTipo === 'pct' ? '%' : '$'}
              </span>
            </div>
            {descuentoTipo === 'pct' && descuento > 0 && subtotal > 0 && (
              <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 4 }}>
                = {fmt(descuentoNum)} de descuento
              </div>
            )}

            <div className="fgg">
              <label>Observaciones</label>
              <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Opcional..." rows={2}
                style={{ border: '1px solid var(--bd2)', borderRadius: 10, padding: '9px 13px', fontSize: 13, resize: 'vertical' }}
              />
            </div>

            {/* Total */}
            <div className="tb">
              <div className="tr"><span className="tl">Subtotal</span><span className="tv">{fmt(subtotal)}</span></div>
              {descuentoNum > 0 && <div className="tr"><span className="tl">Descuento</span><span className="tv" style={{ color: '#ff9f7a' }}>-{fmt(descuentoNum)}</span></div>}
              <hr className="tsep" />
              <div className="tr big"><span className="tl">TOTAL</span><span className="tv">{fmt(total)}</span></div>
            </div>

            <button className="bp" onClick={handleGuardar} disabled={saving || items.length === 0}
              style={{ width: '100%', padding: '13px', fontSize: 15 }}>
              {saving ? 'Guardando...' : '✓ Confirmar venta'}
            </button>
            <button className="bg2" onClick={onClose} style={{ width: '100%' }}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
