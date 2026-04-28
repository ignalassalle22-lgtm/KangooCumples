import React, { useState, useMemo } from 'react'

const fmt = (n) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })

export default function Compras({ compras, loading, onNueva }) {
  const [busca, setBusca] = useState('')
  const [showDetalle, setShowDetalle] = useState(null)

  const filtradas = useMemo(() => {
    if (!busca) return compras
    return compras.filter(c =>
      (c.proveedor || '').toLowerCase().includes(busca.toLowerCase()) ||
      (c.numero_remito || '').toLowerCase().includes(busca.toLowerCase())
    )
  }, [compras, busca])

  const stats = useMemo(() => {
    const total = compras.reduce((s, c) => s + (c.total || 0), 0)
    const proveedores = new Set(compras.map(c => c.proveedor).filter(Boolean)).size
    return { count: compras.length, total, proveedores }
  }, [compras])

  return (
    <div className="sec">
      <div className="ph">
        <div>
          <div className="pt">Compras</div>
          <div className="ps">Registro de remitos · actualiza stock automáticamente</div>
        </div>
        <button className="bp" onClick={onNueva}>＋ Nueva compra</button>
      </div>

      <div className="sr" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="sc"><div className="sl">Total compras</div><div className="sv">{stats.count}</div></div>
        <div className="sc"><div className="sl">Monto total</div><div className="sv">{fmt(stats.total)}</div></div>
        <div className="sc"><div className="sl">Proveedores</div><div className="sv">{stats.proveedores}</div></div>
      </div>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <input placeholder="Buscar proveedor o remito..." value={busca} onChange={e => setBusca(e.target.value)} style={{ minWidth: 260 }} />
      </div>

      {loading ? (
        <div className="empty"><div className="emj">⏳</div><p>Cargando...</p></div>
      ) : filtradas.length === 0 ? (
        <div className="empty">
          <div className="emj">📥</div>
          <p>No hay compras registradas.</p>
          <button className="bp" onClick={onNueva}>＋ Registrar compra</button>
        </div>
      ) : (
        <div className="vtable-wrap">
          <table className="vtable">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>N° Remito</th>
                <th>Productos</th>
                <th className="num">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.fecha}</td>
                  <td style={{ fontWeight: 700 }}>{c.proveedor || <span style={{ color: 'var(--mu2)' }}>—</span>}</td>
                  <td style={{ fontSize: 13, color: 'var(--mu)' }}>{c.numero_remito || '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--mu)' }}>
                    {(c.compra_items || []).length} {(c.compra_items || []).length === 1 ? 'artículo' : 'artículos'}
                  </td>
                  <td className="num" style={{ fontWeight: 800, color: 'var(--nv)' }}>{fmt(c.total)}</td>
                  <td>
                    <button className="bg2 bsm" onClick={() => setShowDetalle(c)}>Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detalle */}
      {showDetalle && (
        <div className="ov op" onClick={e => e.target === e.currentTarget && setShowDetalle(null)}>
          <div className="dm" style={{ maxWidth: 500 }}>
            <div className="moh">
              <div className="mot"><div className="mot-icon">📥</div>Detalle de compra</div>
              <button className="xcl" onClick={() => setShowDetalle(null)}>✕</button>
            </div>
            <div style={{ marginTop: 14 }}>
              <div className="dm-row"><span className="dm-label">Fecha</span><span className="dm-val">{showDetalle.fecha}</span></div>
              <div className="dm-row"><span className="dm-label">Proveedor</span><span className="dm-val">{showDetalle.proveedor || '—'}</span></div>
              <div className="dm-row"><span className="dm-label">N° Remito</span><span className="dm-val">{showDetalle.numero_remito || '—'}</span></div>
              {showDetalle.obs && <div className="dm-row"><span className="dm-label">Obs.</span><span className="dm-val">{showDetalle.obs}</span></div>}
              <div className="sdv" style={{ marginTop: 14 }}>Artículos</div>
              {(showDetalle.compra_items || []).map((it, i) => (
                <div key={i} className="dm-row">
                  <span className="dm-label">{it.nombre_producto} ×{it.cantidad}</span>
                  <span className="dm-val" style={{ fontWeight: 700 }}>{fmt(it.subtotal)}</span>
                </div>
              ))}
              <div className="tb" style={{ marginTop: 14 }}>
                <div className="tr big"><span className="tl">TOTAL</span><span className="tv">{fmt(showDetalle.total)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
