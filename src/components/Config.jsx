import React, { useState } from 'react'


export default function Config({ config, updateConfig, addToast, productos = [] }) {
  const [nmN, setNmN] = useState('')
  const [nmP, setNmP] = useState('')
  const [nsN, setNsN] = useState('')
  const [npD, setNpD] = useState('')
  const [npP, setNpP] = useState('')
  const [nmetN, setNmetN] = useState('')
  const [nmetCajaN, setNmetCajaN] = useState('')
  const [neN, setNeN] = useState('')
  const [neP, setNeP] = useState('')
  const [cfgPc, setCfgPc] = useState(config.pChico)
  const [cfgPa, setCfgPa] = useState(config.pAdulto)
  const [pricesOk, setPricesOk] = useState(false)
  const [menuExpandido, setMenuExpandido] = useState(null)
  const [compProdSearch, setCompProdSearch] = useState('')
  const [compProdSel, setCompProdSel] = useState(null)
  const [compCant, setCompCant] = useState(1)

  // Productos simples disponibles para componentes de menú
  const productosSimples = productos.filter(p => p.activo !== false)
  const compProdsFiltrados = compProdSearch.trim() && !compProdSel
    ? productosSimples.filter(p =>
        p.nombre.toLowerCase().includes(compProdSearch.toLowerCase()) ||
        (p.codigo || '').toLowerCase().includes(compProdSearch.toLowerCase())
      ).slice(0, 6)
    : []

  // ── Menús ──
  const addMenu = () => {
    const n = nmN.trim()
    if (!n) { addToast('Completá el nombre del menú', 'err'); return }
    const p = parseFloat(nmP) || 0
    const updated = [...config.menus, { id: Date.now(), n, p, componentes: [] }]
    updateConfig('menus', updated)
    setNmN(''); setNmP('')
    addToast('Menú agregado ✓')
  }
  const delMenu = id => { updateConfig('menus', config.menus.filter(m => m.id !== id)); addToast('Menú eliminado') }
  const updateMenuPrice = (id, val) => {
    updateConfig('menus', config.menus.map(m => m.id === id ? { ...m, p: parseFloat(val) || 0 } : m))
    addToast('Precio de menú actualizado ✓')
  }

  const addCompToMenu = (menuId) => {
    if (!compProdSel) { addToast('Seleccioná un producto', 'err'); return }
    if (!compCant || compCant <= 0) { addToast('Cantidad inválida', 'err'); return }
    const menu = config.menus.find(m => m.id === menuId)
    const comps = menu.componentes || []
    if (comps.find(c => c.productoId === compProdSel.id)) {
      addToast('Ese producto ya está en los componentes del menú', 'err'); return
    }
    const newComps = [...comps, { productoId: compProdSel.id, nombre: compProdSel.nombre, cantidad: Number(compCant) }]
    updateConfig('menus', config.menus.map(m => m.id === menuId ? { ...m, componentes: newComps } : m))
    setCompProdSel(null); setCompProdSearch(''); setCompCant(1)
    addToast('Componente agregado ✓')
  }

  const delCompFromMenu = (menuId, productoId) => {
    const menu = config.menus.find(m => m.id === menuId)
    const newComps = (menu.componentes || []).filter(c => c.productoId !== productoId)
    updateConfig('menus', config.menus.map(m => m.id === menuId ? { ...m, componentes: newComps } : m))
    addToast('Componente eliminado')
  }

  // ── Salones ──
  const addSalon = () => {
    const n = nsN.trim()
    if (!n) return
    if (config.salones.includes(n)) { addToast('Ese salón ya existe', 'err'); return }
    updateConfig('salones', [...config.salones, n])
    setNsN('')
    addToast('Salón agregado ✓')
  }
  const delSalon = s => { updateConfig('salones', config.salones.filter(x => x !== s)); addToast('Salón eliminado') }

  // ── Promos ──
  const addPromo = () => {
    const d = npD.trim(); const p = parseFloat(npP)
    if (!d || !p) { addToast('Completá descripción y porcentaje', 'err'); return }
    updateConfig('promos', [...config.promos, { id: Date.now(), d, pct: p }])
    setNpD(''); setNpP('')
    addToast('Promoción agregada ✓')
  }
  const delPromo = id => { updateConfig('promos', config.promos.filter(p => p.id !== id)); addToast('Promo eliminada') }

  // ── Métodos pago (cumpleaños) ──
  const addMet = () => {
    const n = nmetN.trim()
    if (!n) return
    if (config.mets.includes(n)) { addToast('Ese método ya existe', 'err'); return }
    updateConfig('mets', [...config.mets, n])
    setNmetN('')
    addToast('Método de pago agregado ✓')
  }
  const delMet = m => { updateConfig('mets', config.mets.filter(x => x !== m)); addToast('Método eliminado') }

  // ── Métodos pago (caja/ventas) ──
  const metsCaja = config.mets_caja || []
  const addMetCaja = () => {
    const n = nmetCajaN.trim()
    if (!n) return
    if (metsCaja.includes(n)) { addToast('Ese método ya existe', 'err'); return }
    updateConfig('mets_caja', [...metsCaja, n])
    setNmetCajaN('')
    addToast('Método de pago agregado ✓')
  }
  const delMetCaja = m => { updateConfig('mets_caja', metsCaja.filter(x => x !== m)); addToast('Método eliminado') }

  // ── Extras ──
  const addExtra = () => {
    const n = neN.trim(); const p = parseFloat(neP)
    if (!n || isNaN(p)) { addToast('Completá nombre y precio del extra', 'err'); return }
    updateConfig('extras', [...config.extras, { id: Date.now(), n, p }])
    setNeN(''); setNeP('')
    addToast('Extra agregado ✓')
  }
  const delExtra = id => { updateConfig('extras', config.extras.filter(e => e.id !== id)); addToast('Extra eliminado') }
  const updateExtraPrice = (id, val) => {
    updateConfig('extras', config.extras.map(e => e.id === id ? { ...e, p: parseFloat(val) || 0 } : e))
    addToast('Precio actualizado ✓')
  }

  // ── Precios base ──
  const savePrices = () => {
    updateConfig('pChico', parseFloat(cfgPc) || 0)
    updateConfig('pAdulto', parseFloat(cfgPa) || 0)
    setPricesOk(true)
    setTimeout(() => setPricesOk(false), 3000)
    addToast('Precios guardados ✓')
  }

  return (
    <>
      <div className="ph">
        <div>
          <div className="pt">Datos de venta</div>
          <div className="ps">Precios, menús, extras, salones, promociones y métodos de pago</div>
        </div>
      </div>

      <div className="cg">
        {/* Menús */}
        <div className="cc">
          <div className="ct"><div className="ct-icon">🍔</div>Menús disponibles</div>
          <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 10 }}>
            Hacé clic en un menú para editar sus componentes de stock (qué se descuenta del inventario por cada unidad).
          </div>
          {config.menus.length === 0
            ? <div style={{ fontSize: 13, color: 'var(--mu)', padding: '8px 0' }}>Sin menús cargados</div>
            : config.menus.map(m => {
              const isExpanded = menuExpandido === m.id
              const comps = m.componentes || []
              return (
                <div key={m.id} style={{ border: '1px solid var(--bd2)', borderRadius: 8, marginBottom: 8 }}>
                  <div className="li" style={{ borderBottom: isExpanded ? '1px solid var(--bd2)' : 'none', cursor: 'pointer' }} onClick={() => setMenuExpandido(isExpanded ? null : m.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--mu)' }}>{isExpanded ? '▾' : '▸'}</span>
                      <span className="lin">{m.n}</span>
                      {comps.length > 0 && (
                        <span style={{ fontSize: 11, background: 'var(--nv3)', color: 'var(--nv)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                          {comps.length} componente{comps.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                      <input
                        type="number"
                        defaultValue={m.p || 0}
                        min={0}
                        style={{ width: 110, border: '1px solid var(--bd2)', borderRadius: 7, padding: '5px 9px', fontSize: 13, background: 'var(--bg)' }}
                        onBlur={ev => updateMenuPrice(m.id, ev.target.value)}
                        title="Precio por chico con este menú"
                      />
                      <button className="bdng" onClick={() => delMenu(m.id)}>✕</button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '12px 14px', background: 'var(--bg2)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--mu)' }}>
                        Componentes de stock por unidad de menú
                      </div>
                      {comps.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 10 }}>Sin componentes cargados — agregá productos del inventario.</div>
                      ) : (
                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginBottom: 10 }}>
                          <thead>
                            <tr style={{ color: 'var(--mu)', borderBottom: '1px solid var(--bd2)' }}>
                              <th style={{ textAlign: 'left', padding: '3px 4px' }}>Producto</th>
                              <th style={{ textAlign: 'right', padding: '3px 4px' }}>Cant/menú</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {comps.map(c => (
                              <tr key={c.productoId} style={{ borderBottom: '1px solid var(--bd2)' }}>
                                <td style={{ padding: '5px 4px' }}>{c.nombre}</td>
                                <td style={{ padding: '5px 4px', textAlign: 'right' }}>{c.cantidad}</td>
                                <td style={{ padding: '5px 4px', textAlign: 'right' }}>
                                  <button className="bdng" style={{ fontSize: 11, padding: '1px 6px' }} onClick={() => delCompFromMenu(m.id, c.productoId)}>✕</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Agregar componente */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: '1 1 180px', position: 'relative' }}>
                          <input
                            type="text"
                            value={compProdSel ? compProdSel.nombre : compProdSearch}
                            onChange={e => { setCompProdSearch(e.target.value); setCompProdSel(null) }}
                            placeholder="Buscar producto de inventario..."
                            style={{ width: '100%', fontSize: 12 }}
                          />
                          {compProdsFiltrados.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg)', border: '1px solid var(--bd2)', borderRadius: 7, zIndex: 99, boxShadow: '0 4px 12px rgba(0,0,0,.12)', maxHeight: 160, overflowY: 'auto' }}>
                              {compProdsFiltrados.map(p => (
                                <div
                                  key={p.id}
                                  style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid var(--bd2)' }}
                                  onMouseDown={() => { setCompProdSel(p); setCompProdSearch(p.nombre) }}
                                >
                                  {p.nombre}
                                  {p.unidad && <span style={{ color: 'var(--mu)', marginLeft: 6 }}>({p.unidad})</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: '0 0 90px' }}>
                          <input
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={compCant}
                            onChange={e => setCompCant(e.target.value)}
                            placeholder="Cant"
                            style={{ width: '100%', fontSize: 12 }}
                          />
                        </div>
                        <button className="bp bsm" style={{ fontSize: 12 }} onClick={() => addCompToMenu(m.id)}>
                          + Agregar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          }
          <div className="ar">
            <input type="text" value={nmN} onChange={e => setNmN(e.target.value)} placeholder="Nombre del menú" style={{ flex: 2 }} />
            <input type="number" value={nmP} onChange={e => setNmP(e.target.value)} placeholder="$ precio" style={{ width: 120, flex: 'none' }} />
            <button className="bp bsm" onClick={addMenu}>+ Agregar</button>
          </div>
        </div>

        {/* Precio base + Salones */}
        <div className="cc">
          <div className="ct"><div className="ct-icon">💰</div>Precio base</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="fgg">
              <label>Por chico</label>
              <input type="number" value={cfgPc} onChange={e => setCfgPc(e.target.value)} placeholder="$" />
            </div>
            <div className="fgg">
              <label>Por adulto</label>
              <input type="number" value={cfgPa} onChange={e => setCfgPa(e.target.value)} placeholder="$" />
            </div>
          </div>
          <button className="bn bsm" onClick={savePrices} style={{ width: '100%' }}>💾 Guardar precios</button>
          {pricesOk && (
            <div style={{ fontSize: 13, color: 'var(--gn)', marginTop: 8, fontWeight: 600 }}>✓ Precios guardados correctamente</div>
          )}

          <div className="ct" style={{ marginTop: 22 }}><div className="ct-icon">🏠</div>Salones</div>
          {config.salones.length === 0
            ? <div style={{ fontSize: 13, color: 'var(--mu)', padding: '8px 0' }}>Sin salones</div>
            : config.salones.map(s => (
              <div key={s} className="li">
                <span className="lin">{s}</span>
                <button className="bdng" onClick={() => delSalon(s)}>✕</button>
              </div>
            ))
          }
          <div className="ar">
            <input type="text" value={nsN} onChange={e => setNsN(e.target.value)} placeholder="Nombre del salón" />
            <button className="bp bsm" onClick={addSalon}>+ Agregar</button>
          </div>
        </div>

        {/* Promos */}
        <div className="cc">
          <div className="ct"><div className="ct-icon">🎁</div>Promociones</div>
          {config.promos.length === 0
            ? <div style={{ fontSize: 13, color: 'var(--mu)', padding: '8px 0' }}>Sin promociones</div>
            : config.promos.map(p => (
              <div key={p.id} className="li">
                <span>{p.d}<span className="pbg">{p.pct}% off</span></span>
                <button className="bdng" onClick={() => delPromo(p.id)}>✕</button>
              </div>
            ))
          }
          <div className="ar">
            <input type="text" value={npD} onChange={e => setNpD(e.target.value)} placeholder="Descripción de la promo" style={{ flex: 2 }} />
            <input type="number" value={npP} onChange={e => setNpP(e.target.value)} placeholder="% dto" style={{ width: 90, flex: 'none' }} />
            <button className="bp bsm" onClick={addPromo}>+ Agregar</button>
          </div>
        </div>

        {/* Métodos pago cumpleaños */}
        <div className="cc">
          <div className="ct"><div className="ct-icon">💳</div>Métodos de pago (cumpleaños)</div>
          {config.mets.map(m => (
            <div key={m} className="li">
              <span className="lin">{m}</span>
              <button className="bdng" onClick={() => delMet(m)}>✕</button>
            </div>
          ))}
          <div className="ar">
            <input type="text" value={nmetN} onChange={e => setNmetN(e.target.value)} placeholder="Ej: Efectivo, Transferencia..." />
            <button className="bp bsm" onClick={addMet}>+ Agregar</button>
          </div>
        </div>

        {/* Métodos pago caja/ventas */}
        <div className="cc">
          <div className="ct"><div className="ct-icon">🏧</div>Métodos de pago (caja / ventas)</div>
          <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 10 }}>
            Usados en ventas de caja y compras a proveedores.
          </div>
          {metsCaja.length === 0
            ? <div style={{ fontSize: 13, color: 'var(--mu)', padding: '8px 0' }}>Sin métodos cargados</div>
            : metsCaja.map(m => (
              <div key={m} className="li">
                <span className="lin">{m}</span>
                <button className="bdng" onClick={() => delMetCaja(m)}>✕</button>
              </div>
            ))
          }
          <div className="ar">
            <input type="text" value={nmetCajaN} onChange={e => setNmetCajaN(e.target.value)} placeholder="Ej: Efectivo, Transferencia..." />
            <button className="bp bsm" onClick={addMetCaja}>+ Agregar</button>
          </div>
        </div>

        {/* Extras */}
        <div className="cc" style={{ gridColumn: '1/-1' }}>
          <div className="ct"><div className="ct-icon">⭐</div>Extras disponibles para cobrar</div>
          <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 12 }}>
            Estos ítems aparecerán en cada evento para sumar al total. Podés editar el precio desde acá y se actualiza en todos los eventos nuevos.
          </div>
          {config.extras.length === 0
            ? <div style={{ fontSize: 13, color: 'var(--mu)', padding: '8px 0' }}>Sin extras cargados</div>
            : config.extras.map(e => (
              <div key={e.id} className="li">
                <span className="lin">{e.n}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    defaultValue={e.p}
                    min={0}
                    style={{ width: 110, border: '1px solid var(--bd2)', borderRadius: 7, padding: '5px 9px', fontSize: 13, background: 'var(--bg)' }}
                    onBlur={ev => updateExtraPrice(e.id, ev.target.value)}
                    title="Cambiar precio"
                  />
                  <button className="bdng" onClick={() => delExtra(e.id)}>✕</button>
                </div>
              </div>
            ))
          }
          <div className="ar">
            <input type="text" value={neN} onChange={e => setNeN(e.target.value)} placeholder="Nombre del extra" style={{ flex: 2 }} />
            <input type="number" value={neP} onChange={e => setNeP(e.target.value)} placeholder="$ precio unitario" style={{ width: 160, flex: 'none' }} />
            <button className="bp bsm" onClick={addExtra}>+ Agregar extra</button>
          </div>
        </div>
      </div>
    </>
  )
}
