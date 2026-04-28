import React, { useState, useMemo } from 'react'

const fmt = (n) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })

export default function Productos({ productos, categorias, loading, onNuevo, onEditar, onEliminar, addToast, bulkUpdatePrecios }) {
  const [busca, setBusca] = useState('')
  const [catFiltro, setCatFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [bulkData, setBulkData] = useState([])

  const catMap = useMemo(() => Object.fromEntries((categorias || []).map(c => [c.id, c.nombre])), [categorias])

  const filtrados = useMemo(() => {
    let lista = productos || []
    if (busca) lista = lista.filter(p => p.nombre.toLowerCase().includes(busca.toLowerCase()) || (p.codigo || '').toLowerCase().includes(busca.toLowerCase()))
    if (catFiltro) lista = lista.filter(p => String(p.categoria_id) === catFiltro)
    if (tipoFiltro) lista = lista.filter(p => p.tipo === tipoFiltro)
    return lista
  }, [productos, busca, catFiltro, tipoFiltro])

  const stats = useMemo(() => {
    const activos = productos.filter(p => p.activo !== false)
    const stockBajo = activos.filter(p => p.tipo === 'simple' && (p.stock_actual || 0) <= (p.stock_minimo || 0))
    return { total: activos.length, stockBajo: stockBajo.length, compuestos: activos.filter(p => p.tipo === 'compuesto').length }
  }, [productos])

  function abrirBulk() {
    setBulkData(productos.filter(p => p.activo !== false).map(p => ({
      id: p.id, nombre: p.nombre, precio_venta: p.precio_venta || 0, precio_costo: p.precio_costo || 0, _nuevo_venta: '', _nuevo_costo: ''
    })))
    setShowBulk(true)
  }

  async function guardarBulk() {
    const updates = bulkData
      .filter(r => r._nuevo_venta !== '' || r._nuevo_costo !== '')
      .map(r => ({
        id: r.id,
        ...(r._nuevo_venta !== '' ? { precio_venta: parseFloat(r._nuevo_venta) || 0 } : {}),
        ...(r._nuevo_costo !== '' ? { precio_costo: parseFloat(r._nuevo_costo) || 0 } : {}),
      }))
    if (!updates.length) { setShowBulk(false); return }
    try {
      await bulkUpdatePrecios(updates)
      addToast(`✓ ${updates.length} precios actualizados`)
      setShowBulk(false)
    } catch (e) { addToast('Error: ' + e.message, 'err') }
  }

  const stockColor = (p) => {
    if (p.tipo === 'compuesto') return ''
    const s = p.stock_actual || 0, m = p.stock_minimo || 0
    if (s <= 0) return 'rd'
    if (s <= m) return 'am'
    return 'gn'
  }

  return (
    <div className="sec">
      <div className="ph">
        <div>
          <div className="pt">Productos</div>
          <div className="ps">Gestión de artículos, stock y precios</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="bg2" onClick={abrirBulk}>📋 Actualizar precios</button>
          <button className="bp" onClick={() => onNuevo()}>＋ Nuevo producto</button>
        </div>
      </div>

      <div className="sr" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="sc"><div className="sl">Total activos</div><div className="sv">{stats.total}</div></div>
        <div className="sc"><div className="sl">Stock bajo / sin stock</div><div className={`sv ${stats.stockBajo > 0 ? 'am' : 'gn'}`}>{stats.stockBajo}</div></div>
        <div className="sc"><div className="sl">Compuestos</div><div className="sv">{stats.compuestos}</div></div>
      </div>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <input placeholder="Buscar nombre o código..." value={busca} onChange={e => setBusca(e.target.value)} style={{ minWidth: 220 }} />
        <select value={catFiltro} onChange={e => setCatFiltro(e.target.value)}>
          <option value="">Todas las categorías</option>
          {(categorias || []).map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
        </select>
        <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="simple">Simple</option>
          <option value="compuesto">Compuesto</option>
        </select>
      </div>

      {loading ? (
        <div className="empty"><div className="emj">⏳</div><p>Cargando...</p></div>
      ) : filtrados.length === 0 ? (
        <div className="empty">
          <div className="emj">📦</div>
          <p>No hay productos{busca ? ' que coincidan' : ''}.</p>
          <button className="bp" onClick={() => onNuevo()}>＋ Agregar producto</button>
        </div>
      ) : (
        <div className="vtable-wrap">
          <table className="vtable">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Tipo</th>
                <th className="num">Precio venta</th>
                <th className="num">Precio costo</th>
                <th className="num">Stock</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => (
                <tr key={p.id} style={{ opacity: p.activo === false ? 0.5 : 1 }}>
                  <td style={{ color: 'var(--mu)', fontSize: 12 }}>{p.codigo || '—'}</td>
                  <td style={{ fontWeight: 700 }}>{p.nombre}</td>
                  <td>{catMap[p.categoria_id] || '—'}</td>
                  <td>
                    <span className={`badge ${p.tipo === 'compuesto' ? 'bsn' : 'bpd'}`}>
                      {p.tipo === 'compuesto' ? '🔗 Compuesto' : '📦 Simple'}
                    </span>
                  </td>
                  <td className="num" style={{ fontWeight: 700 }}>{fmt(p.precio_venta)}</td>
                  <td className="num" style={{ color: 'var(--mu)' }}>{fmt(p.precio_costo)}</td>
                  <td className="num">
                    {p.tipo === 'simple'
                      ? <span style={{ fontWeight: 700, color: `var(--${stockColor(p)})` }}>{p.stock_actual ?? 0} {p.unidad || ''}</span>
                      : <span style={{ color: 'var(--mu)', fontSize: 12 }}>—</span>
                    }
                  </td>
                  <td>
                    <span className={`badge ${p.activo !== false ? 'bpd' : 'bnp'}`}>
                      {p.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="eact">
                      <button className="bg2 bsm" onClick={() => onEditar(p.id)}>Editar</button>
                      <button className="bdng" onClick={() => onEliminar(p.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal actualización masiva de precios */}
      {showBulk && (
        <div className="ov op" onClick={e => e.target === e.currentTarget && setShowBulk(false)}>
          <div className="mo" style={{ maxWidth: 860 }}>
            <div className="moh">
              <div className="mot"><div className="mot-icon">📋</div>Actualización masiva de precios</div>
              <button className="xcl" onClick={() => setShowBulk(false)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 16 }}>
              Ingresá los nuevos precios sólo en los productos que querés modificar. Dejá vacío lo que no cambia.
            </p>
            <div className="vtable-wrap" style={{ maxHeight: 420, overflowY: 'auto' }}>
              <table className="vtable">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="num">Precio venta actual</th>
                    <th className="num">Nuevo precio venta</th>
                    <th className="num">Precio costo actual</th>
                    <th className="num">Nuevo precio costo</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkData.map((r, i) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.nombre}</td>
                      <td className="num">{fmt(r.precio_venta)}</td>
                      <td className="num">
                        <input
                          type="number" min="0" placeholder="—"
                          value={r._nuevo_venta}
                          onChange={e => setBulkData(prev => prev.map((x, j) => j === i ? { ...x, _nuevo_venta: e.target.value } : x))}
                          style={{ width: 110, textAlign: 'right', border: '1px solid var(--bd2)', borderRadius: 7, padding: '5px 8px', fontSize: 13 }}
                        />
                      </td>
                      <td className="num">{fmt(r.precio_costo)}</td>
                      <td className="num">
                        <input
                          type="number" min="0" placeholder="—"
                          value={r._nuevo_costo}
                          onChange={e => setBulkData(prev => prev.map((x, j) => j === i ? { ...x, _nuevo_costo: e.target.value } : x))}
                          style={{ width: 110, textAlign: 'right', border: '1px solid var(--bd2)', borderRadius: 7, padding: '5px 8px', fontSize: 13 }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="bg2" onClick={() => setShowBulk(false)}>Cancelar</button>
              <button className="bp" onClick={guardarBulk}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
