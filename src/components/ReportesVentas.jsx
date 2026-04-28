import React, { useState, useMemo } from 'react'

const fmt = (n) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })

function primerDiaMes() {
  const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10)
}
function hoy() { return new Date().toISOString().slice(0, 10) }

export default function ReportesVentas({ ventas }) {
  const [desde, setDesde] = useState(primerDiaMes())
  const [hasta, setHasta] = useState(hoy())

  const ventasFiltradas = useMemo(() => {
    return ventas.filter(v =>
      v.estado !== 'anulada' &&
      v.fecha >= desde && v.fecha <= hasta
    )
  }, [ventas, desde, hasta])

  // KPIs
  const kpis = useMemo(() => {
    const total = ventasFiltradas.reduce((s, v) => s + (v.total || 0), 0)
    const count = ventasFiltradas.length
    const ticket = count ? total / count : 0
    const descuentos = ventasFiltradas.reduce((s, v) => s + (v.descuento || 0), 0)
    return { total, count, ticket, descuentos }
  }, [ventasFiltradas])

  // Por producto
  const porProducto = useMemo(() => {
    const map = {}
    for (const v of ventasFiltradas) {
      for (const it of (v.venta_items || [])) {
        if (!map[it.nombre_producto]) map[it.nombre_producto] = { nombre: it.nombre_producto, cantidad: 0, total: 0 }
        map[it.nombre_producto].cantidad += it.cantidad
        map[it.nombre_producto].total += it.subtotal
      }
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [ventasFiltradas])

  // Por día
  const porDia = useMemo(() => {
    const map = {}
    for (const v of ventasFiltradas) {
      if (!map[v.fecha]) map[v.fecha] = { fecha: v.fecha, count: 0, total: 0 }
      map[v.fecha].count++
      map[v.fecha].total += v.total || 0
    }
    return Object.values(map).sort((a, b) => a.fecha.localeCompare(b.fecha))
  }, [ventasFiltradas])

  // Por método de pago
  const porMetodo = useMemo(() => {
    const map = {}
    for (const v of ventasFiltradas) {
      const m = v.metodo_pago || 'Sin especificar'
      if (!map[m]) map[m] = { metodo: m, count: 0, total: 0 }
      map[m].count++
      map[m].total += v.total || 0
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [ventasFiltradas])

  const maxDia = porDia.reduce((m, d) => Math.max(m, d.total), 0) || 1
  const maxProd = porProducto[0]?.total || 1

  return (
    <div className="sec">
      <div className="ph">
        <div>
          <div className="pt">Reportes de ventas</div>
          <div className="ps">Análisis por artículo, período y método de pago</div>
        </div>
      </div>

      {/* Filtro de fecha */}
      <div className="met-filter-bar">
        <div className="met-filter-group">
          <label>Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
        </div>
        <div className="met-filter-group">
          <label>Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
        </div>
      </div>

      {/* KPIs */}
      <div className="met-kpis">
        <div className="met-kpi">
          <div className="met-kpi-label">Total facturado</div>
          <div className="met-kpi-val gn">{fmt(kpis.total)}</div>
          <div className="met-kpi-sub">{kpis.count} ventas</div>
        </div>
        <div className="met-kpi">
          <div className="met-kpi-label">Ticket promedio</div>
          <div className="met-kpi-val">{fmt(kpis.ticket)}</div>
          <div className="met-kpi-sub">por venta</div>
        </div>
        <div className="met-kpi">
          <div className="met-kpi-label">Descuentos otorgados</div>
          <div className="met-kpi-val am">{fmt(kpis.descuentos)}</div>
          <div className="met-kpi-sub">total período</div>
        </div>
        <div className="met-kpi">
          <div className="met-kpi-label">Artículos vendidos</div>
          <div className="met-kpi-val or">
            {ventasFiltradas.reduce((s, v) => s + (v.venta_items || []).reduce((a, it) => a + it.cantidad, 0), 0)}
          </div>
          <div className="met-kpi-sub">unidades</div>
        </div>
      </div>

      <div className="met-row2" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Ventas por día */}
        <div className="met-dist-wrap">
          <div className="met-chart-title">Ventas por día</div>
          {porDia.length === 0
            ? <p style={{ fontSize: 13, color: 'var(--mu2)' }}>Sin datos en el período.</p>
            : porDia.map(d => (
              <div key={d.fecha} className="met-bar-row">
                <div className="met-bar-label">{d.fecha}</div>
                <div className="met-bar-track">
                  <div className="met-bar-fill or" style={{ width: `${(d.total / maxDia) * 100}%` }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--nv)', fontWeight: 700, width: 90, textAlign: 'right', fontFamily: 'Nunito' }}>
                  {fmt(d.total)}
                </div>
                <div className="met-bar-count">{d.count}v</div>
              </div>
            ))}
        </div>

        {/* Por método de pago */}
        <div className="met-dist-wrap">
          <div className="met-chart-title">Por método de pago</div>
          {porMetodo.length === 0
            ? <p style={{ fontSize: 13, color: 'var(--mu2)' }}>Sin datos.</p>
            : porMetodo.map(m => (
              <div key={m.metodo} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{m.metodo}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--nv)', fontFamily: 'Nunito' }}>{fmt(m.total)}</span>
                </div>
                <div className="met-bar-track">
                  <div className="met-bar-fill gn" style={{ width: `${(m.total / kpis.total) * 100}%` }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>{m.count} ventas · {kpis.total > 0 ? Math.round((m.total / kpis.total) * 100) : 0}%</div>
              </div>
            ))}
        </div>
      </div>

      {/* Top productos */}
      <div className="met-table-wrap">
        <div className="met-chart-title">Ventas por artículo</div>
        {porProducto.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--mu2)' }}>Sin datos en el período.</p>
        ) : (
          <table className="met-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th className="num">Unidades vendidas</th>
                <th className="num">Total</th>
                <th style={{ width: 180 }}>Participación</th>
              </tr>
            </thead>
            <tbody>
              {porProducto.map((p, i) => (
                <tr key={p.nombre}>
                  <td style={{ color: 'var(--mu)', fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ fontWeight: 700 }}>{p.nombre}</td>
                  <td className="num">{p.cantidad}</td>
                  <td className="num tot">{fmt(p.total)}</td>
                  <td>
                    <div className="met-bar-track" style={{ height: 8 }}>
                      <div className="met-bar-fill or" style={{ width: `${(p.total / maxProd) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>Total</td>
                <td className="num">{porProducto.reduce((s, p) => s + p.cantidad, 0)}</td>
                <td className="num tot">{fmt(kpis.total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Detalle de ventas */}
      <div className="met-table-wrap">
        <div className="met-chart-title">Detalle de ventas del período</div>
        {ventasFiltradas.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--mu2)' }}>Sin ventas en el período seleccionado.</p>
        ) : (
          <table className="met-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Método</th>
                <th className="num">Subtotal</th>
                <th className="num">Descuento</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.map(v => (
                <tr key={v.id}>
                  <td style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13 }}>{v.numero}</td>
                  <td>{v.fecha} {v.hora}</td>
                  <td>{v.cliente || '—'}</td>
                  <td>{v.metodo_pago}</td>
                  <td className="num">{fmt(v.subtotal)}</td>
                  <td className="num" style={{ color: v.descuento > 0 ? 'var(--am)' : 'var(--mu2)' }}>
                    {v.descuento > 0 ? `-${fmt(v.descuento)}` : '—'}
                  </td>
                  <td className="num tot">{fmt(v.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>Total ({ventasFiltradas.length} ventas)</td>
                <td className="num">{fmt(ventasFiltradas.reduce((s, v) => s + (v.subtotal || 0), 0))}</td>
                <td className="num">{fmt(kpis.descuentos)}</td>
                <td className="num tot">{fmt(kpis.total)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
