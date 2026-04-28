import React, { useState, useMemo } from 'react'

const fmt = (n) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
const hoy = () => new Date().toISOString().slice(0, 10)

export default function Ventas({ ventas, loading, cajaActual, onNueva, onAnular, fetchVentas }) {
  const [desde, setDesde] = useState(hoy())
  const [hasta, setHasta] = useState(hoy())
  const [filtroEstado, setFiltroEstado] = useState('')
  const [busca, setBusca] = useState('')
  const [showDetalle, setShowDetalle] = useState(null)

  function aplicarFiltro() {
    fetchVentas(desde, hasta)
  }

  const filtradas = useMemo(() => {
    let lista = ventas
    if (filtroEstado) lista = lista.filter(v => v.estado === filtroEstado)
    if (busca) lista = lista.filter(v =>
      (v.numero || '').toLowerCase().includes(busca.toLowerCase()) ||
      (v.cliente || '').toLowerCase().includes(busca.toLowerCase())
    )
    return lista
  }, [ventas, filtroEstado, busca])

  const stats = useMemo(() => {
    const activas = filtradas.filter(v => v.estado !== 'anulada')
    const total = activas.reduce((s, v) => s + (v.total || 0), 0)
    const efectivo = activas.filter(v => v.metodo_pago === 'Efectivo').reduce((s, v) => s + (v.total || 0), 0)
    return { count: activas.length, total, efectivo, ticket: activas.length ? total / activas.length : 0 }
  }, [filtradas])

  const estadoBadge = (estado) => {
    if (estado === 'anulada') return <span className="badge bnp">Anulada</span>
    return <span className="badge bpd">Completada</span>
  }

  return (
    <div className="sec">
      <div className="ph">
        <div>
          <div className="pt">Ventas</div>
          <div className="ps">Tickets de venta · {cajaActual ? `Caja abierta desde ${cajaActual.hora_apertura}` : 'Sin caja abierta'}</div>
        </div>
        <button className="bp" onClick={onNueva} disabled={!cajaActual} title={!cajaActual ? 'Abrí una caja primero' : ''}>
          {!cajaActual ? '🔒 Nueva venta' : '＋ Nueva venta'}
        </button>
      </div>

      {!cajaActual && (
        <div style={{ background: 'var(--amb)', border: '1px solid rgba(168,98,0,.3)', borderRadius: 10, padding: '11px 16px', color: 'var(--am)', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          ⚠ Para registrar ventas primero tenés que abrir una caja desde el módulo Caja.
        </div>
      )}

      <div className="sr" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        <div className="sc"><div className="sl">Ventas</div><div className="sv">{stats.count}</div></div>
        <div className="sc"><div className="sl">Total facturado</div><div className="sv gn">{fmt(stats.total)}</div></div>
        <div className="sc"><div className="sl">Ticket promedio</div><div className="sv">{fmt(stats.ticket)}</div></div>
        <div className="sc"><div className="sl">Efectivo</div><div className="sv">{fmt(stats.efectivo)}</div></div>
      </div>

      <div className="filter-bar" style={{ marginBottom: 16, background: 'var(--wh)', border: '1px solid var(--bd)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={{ border: '1px solid var(--bd2)', borderRadius: 8, padding: '7px 11px', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={{ border: '1px solid var(--bd2)', borderRadius: 8, padding: '7px 11px', fontSize: 13 }} />
        </div>
        <button className="bn bsm" onClick={aplicarFiltro} style={{ marginTop: 18 }}>Filtrar</button>
        <input placeholder="Buscar ticket o cliente..." value={busca} onChange={e => setBusca(e.target.value)} style={{ border: '1px solid var(--bd2)', borderRadius: 8, padding: '8px 12px', fontSize: 13, minWidth: 200, marginTop: 18 }} />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ border: '1px solid var(--bd2)', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginTop: 18 }}>
          <option value="">Todos</option>
          <option value="completada">Completadas</option>
          <option value="anulada">Anuladas</option>
        </select>
      </div>

      {loading ? (
        <div className="empty"><div className="emj">⏳</div><p>Cargando...</p></div>
      ) : filtradas.length === 0 ? (
        <div className="empty">
          <div className="emj">🧾</div>
          <p>No hay ventas en este período.</p>
          {cajaActual && <button className="bp" onClick={onNueva}>＋ Nueva venta</button>}
        </div>
      ) : (
        <div className="vtable-wrap">
          <table className="vtable">
            <thead>
              <tr>
                <th>N° Ticket</th>
                <th>Fecha / Hora</th>
                <th>Cliente</th>
                <th>Items</th>
                <th>Método</th>
                <th className="num">Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(v => (
                <tr key={v.id} style={{ opacity: v.estado === 'anulada' ? 0.55 : 1 }}>
                  <td style={{ fontWeight: 700, fontFamily: 'Nunito', color: 'var(--nv)' }}>{v.numero}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{v.fecha}</div>
                    <div style={{ fontSize: 12, color: 'var(--mu)' }}>{v.hora}</div>
                  </td>
                  <td>{v.cliente || <span style={{ color: 'var(--mu2)' }}>—</span>}</td>
                  <td style={{ fontSize: 13, color: 'var(--mu)' }}>
                    {(v.venta_items || []).length} {(v.venta_items || []).length === 1 ? 'artículo' : 'artículos'}
                  </td>
                  <td><span style={{ fontSize: 13 }}>{v.metodo_pago || '—'}</span></td>
                  <td className="num" style={{ fontWeight: 800, fontSize: 15, color: v.estado === 'anulada' ? 'var(--rd)' : 'var(--gn)' }}>
                    {fmt(v.total)}
                  </td>
                  <td>{estadoBadge(v.estado)}</td>
                  <td>
                    <div className="eact">
                      <button className="bg2 bsm" onClick={() => setShowDetalle(v)}>Ver</button>
                      {v.estado !== 'anulada' && (
                        <button className="bdng" onClick={() => {
                          if (window.confirm('¿Anular esta venta? Se revertirá el stock.')) onAnular(v.id)
                        }}>Anular</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detalle de venta */}
      {showDetalle && (
        <div className="ov op" onClick={e => e.target === e.currentTarget && setShowDetalle(null)}>
          <div className="dm" style={{ maxWidth: 500 }}>
            <div className="moh">
              <div className="mot"><div className="mot-icon">🧾</div>Ticket {showDetalle.numero}</div>
              <button className="xcl" onClick={() => setShowDetalle(null)}>✕</button>
            </div>
            <div style={{ marginTop: 14 }}>
              <div className="dm-row"><span className="dm-label">Fecha</span><span className="dm-val">{showDetalle.fecha} {showDetalle.hora}</span></div>
              <div className="dm-row"><span className="dm-label">Cliente</span><span className="dm-val">{showDetalle.cliente || '—'}</span></div>
              <div className="dm-row"><span className="dm-label">Método de pago</span><span className="dm-val">{showDetalle.metodo_pago}</span></div>
              <div className="dm-row"><span className="dm-label">Estado</span><span className="dm-val">{estadoBadge(showDetalle.estado)}</span></div>
              <div className="sdv" style={{ marginTop: 14 }}>Artículos</div>
              {(showDetalle.venta_items || []).map((it, i) => (
                <div key={i} className="dm-row">
                  <span className="dm-label">{it.nombre_producto} ×{it.cantidad}</span>
                  <span className="dm-val" style={{ color: 'var(--gn)', fontWeight: 700 }}>{fmt(it.subtotal)}</span>
                </div>
              ))}
              <div className="tb" style={{ marginTop: 14 }}>
                <div className="tr"><span className="tl">Subtotal</span><span className="tv">{fmt(showDetalle.subtotal)}</span></div>
                {showDetalle.descuento > 0 && <div className="tr"><span className="tl">Descuento</span><span className="tv" style={{ color: '#ff9f7a' }}>-{fmt(showDetalle.descuento)}</span></div>}
                <hr className="tsep" />
                <div className="tr big"><span className="tl">TOTAL</span><span className="tv">{fmt(showDetalle.total)}</span></div>
              </div>
              {showDetalle.obs && <p style={{ marginTop: 12, fontSize: 13, color: 'var(--mu)' }}>{showDetalle.obs}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
