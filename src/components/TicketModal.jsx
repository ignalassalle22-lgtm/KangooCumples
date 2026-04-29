import React, { useState, useMemo, useRef } from 'react'

const fmt = (n) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
const hoy = () => new Date().toISOString().slice(0, 10)
const hora = () => new Date().toTimeString().slice(0, 5)

const METODOS = ['Efectivo', 'Transferencia', 'Tarjeta débito', 'Tarjeta crédito', 'Mercado Pago', 'Otro']

export default function TicketModal({ productos, cajasAbiertas = [], cajaSeleccionadaId, onCajaChange, onSave, onClose, addToast }) {
  const [items, setItems] = useState([])
  const [busca, setBusca] = useState('')
  const [cliente, setCliente] = useState('')
  const [descuento, setDescuento] = useState('')
  const [metodo, setMetodo] = useState('Efectivo')
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)
  const buscaRef = useRef()

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
        _stockActual: prod.stock_actual,
        _tipo: prod.tipo,
      }])
    }
    setBusca('')
    buscaRef.current?.focus()
  }

  function cambiarCantidad(pid, valor) {
    const qty = parseFloat(valor) || 0
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
  const descuentoNum = parseFloat(descuento) || 0
  const total = Math.max(0, subtotal - descuentoNum)

  async function handleGuardar() {
    if (items.length === 0) { addToast('Agregá al menos un producto', 'err'); return }
    // Validar stock de simples
    for (const it of items) {
      if (it._tipo === 'simple' && (it._stockActual || 0) < it.cantidad) {
        addToast(`Sin stock suficiente: ${it.nombre_producto} (disponible: ${it._stockActual || 0})`, 'err')
        return
      }
    }
    setSaving(true)
    try {
      await onSave(
        { fecha: hoy(), hora: hora(), cliente, subtotal, descuento: descuentoNum, total, metodo_pago: metodo, caja_id: cajaSeleccionadaId || null, obs },
        items
      )
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
                      <th className="num" style={{ width: 110 }}>Precio unit.</th>
                      <th className="num" style={{ width: 110 }}>Subtotal</th>
                      <th style={{ width: 36 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(it => (
                      <tr key={it.producto_id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{it.nombre_producto}</div>
                          {it._tipo === 'simple' && (
                            <div style={{ fontSize: 11, color: (it._stockActual || 0) < it.cantidad ? 'var(--rd)' : 'var(--mu)' }}>
                              Stock: {it._stockActual || 0}
                            </div>
                          )}
                        </td>
                        <td className="num">
                          <input type="number" min="0.01" step="0.01" value={it.cantidad}
                            onChange={e => cambiarCantidad(it.producto_id, e.target.value)}
                            style={{ width: 70, textAlign: 'right', border: '1px solid var(--bd2)', borderRadius: 7, padding: '4px 8px', fontSize: 13 }}
                          />
                        </td>
                        <td className="num">
                          <input type="number" min="0" step="0.01" value={it.precio_unitario}
                            onChange={e => cambiarPrecio(it.producto_id, e.target.value)}
                            style={{ width: 100, textAlign: 'right', border: '1px solid var(--bd2)', borderRadius: 7, padding: '4px 8px', fontSize: 13 }}
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

            <div className="sdv">Pago</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {METODOS.map(m => (
                <button key={m} type="button"
                  className={`rp ${metodo === m ? 'spaid' : ''}`}
                  onClick={() => setMetodo(m)}
                  style={{ textAlign: 'left', padding: '8px 14px' }}
                >{m}</button>
              ))}
            </div>

            <div className="sdv">Descuento $</div>
            <input type="number" min="0" step="0.01" value={descuento}
              onChange={e => setDescuento(e.target.value)}
              placeholder="0"
              style={{ border: '1px solid var(--bd2)', borderRadius: 10, padding: '9px 13px', fontSize: 14 }}
            />

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
