import React, { useState } from 'react'

const fmt = (n) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
const hoy = () => new Date().toISOString().slice(0, 10)

export default function CompraModal({ productos, metodosPago = [], onSave, onClose, addToast }) {
  const [proveedor, setProveedor] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [remito, setRemito] = useState('')
  const [metodo, setMetodo] = useState('Efectivo')
  const [obs, setObs] = useState('')
  const [items, setItems] = useState([])
  const [busca, setBusca] = useState('')
  const [saving, setSaving] = useState(false)

  const prodsFiltrados = productos.filter(p =>
    p.activo !== false && p.tipo === 'simple' &&
    (busca.length === 0 || p.nombre.toLowerCase().includes(busca.toLowerCase()) || (p.codigo || '').toLowerCase().includes(busca.toLowerCase()))
  ).slice(0, 8)

  function agregarProducto(prod) {
    if (items.find(it => it.producto_id === prod.id)) {
      addToast('Ya está en la lista', 'err'); return
    }
    setItems(prev => [...prev, {
      producto_id: prod.id,
      nombre_producto: prod.nombre,
      precio_unitario: prod.precio_costo || 0,
      cantidad: 1,
      subtotal: prod.precio_costo || 0,
    }])
    setBusca('')
  }

  function cambiar(pid, campo, valor) {
    setItems(prev => prev.map(it => {
      if (it.producto_id !== pid) return it
      const upd = { ...it, [campo]: parseFloat(valor) || 0 }
      upd.subtotal = upd.cantidad * upd.precio_unitario
      return upd
    }))
  }

  const total = items.reduce((s, it) => s + it.subtotal, 0)

  async function handleGuardar() {
    if (items.length === 0) { addToast('Agregá al menos un producto', 'err'); return }
    setSaving(true)
    try {
      await onSave({ proveedor, fecha, numero_remito: remito, total, metodo_pago: metodo, obs }, items)
    } catch (e) {
      addToast('Error: ' + e.message, 'err')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ov op" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo" style={{ maxWidth: 800 }}>
        <div className="moh">
          <div className="mot"><div className="mot-icon">📥</div>Nueva compra</div>
          <button className="xcl" onClick={onClose}>✕</button>
        </div>

        <div className="sdv">Datos del remito</div>
        <div className="fg">
          <div className="fgg">
            <label>Proveedor</label>
            <input value={proveedor} onChange={e => setProveedor(e.target.value)} placeholder="Nombre del proveedor" />
          </div>
          <div className="fgg">
            <label>N° Remito / Factura</label>
            <input value={remito} onChange={e => setRemito(e.target.value)} placeholder="Ej: 0001-00012345" />
          </div>
          <div className="fgg">
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div className="fgg">
            <label>Método de pago</label>
            <select value={metodo} onChange={e => setMetodo(e.target.value)}>
              {(metodosPago.length ? metodosPago : ['Efectivo', 'Transferencia', 'Tarjeta débito', 'Tarjeta crédito', 'Mercado Pago', 'Otro']).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="fgg">
            <label>Observaciones</label>
            <input value={obs} onChange={e => setObs(e.target.value)} placeholder="Opcional..." />
          </div>
        </div>

        <div className="sdv">Productos recibidos</div>
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar producto simple para agregar..."
            style={{ width: '100%', border: '1px solid var(--bd2)', borderRadius: 10, padding: '10px 14px', fontSize: 14 }}
          />
          {busca && prodsFiltrados.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
              background: 'var(--wh)', border: '1px solid var(--bd2)', borderRadius: 10,
              boxShadow: 'var(--sh2)', marginTop: 4, overflow: 'hidden'
            }}>
              {prodsFiltrados.map(p => (
                <div key={p.id}
                  onClick={() => agregarProducto(p)}
                  style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bd)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--nv3)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{p.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--mu)' }}>Stock actual: {p.stock_actual || 0}</div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--mu)' }}>Costo: {fmt(p.precio_costo)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--mu2)', fontSize: 13 }}>
            Buscá productos para agregar a la compra
          </div>
        ) : (
          <div className="vtable-wrap">
            <table className="vtable">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="num">Cantidad</th>
                  <th className="num">Precio unit. (costo)</th>
                  <th className="num">Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.producto_id}>
                    <td style={{ fontWeight: 700 }}>{it.nombre_producto}</td>
                    <td className="num">
                      <input type="number" min="0.01" step="0.01" value={it.cantidad}
                        onChange={e => cambiar(it.producto_id, 'cantidad', e.target.value)}
                        style={{ width: 80, textAlign: 'right', border: '1px solid var(--bd2)', borderRadius: 7, padding: '4px 8px', fontSize: 13 }}
                      />
                    </td>
                    <td className="num">
                      <input type="number" min="0" step="0.01" value={it.precio_unitario}
                        onChange={e => cambiar(it.producto_id, 'precio_unitario', e.target.value)}
                        style={{ width: 110, textAlign: 'right', border: '1px solid var(--bd2)', borderRadius: 7, padding: '4px 8px', fontSize: 13 }}
                      />
                    </td>
                    <td className="num" style={{ fontWeight: 700 }}>{fmt(it.subtotal)}</td>
                    <td>
                      <button className="bdng" onClick={() => setItems(prev => prev.filter(x => x.producto_id !== it.producto_id))}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="tb" style={{ marginTop: 16 }}>
          <div className="tr big"><span className="tl">TOTAL COMPRA</span><span className="tv">{fmt(total)}</span></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button className="bg2" onClick={onClose}>Cancelar</button>
          <button className="bp" onClick={handleGuardar} disabled={saving || items.length === 0}>
            {saving ? 'Guardando...' : '✓ Registrar compra'}
          </button>
        </div>
      </div>
    </div>
  )
}
