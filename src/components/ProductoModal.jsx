import React, { useState, useEffect } from 'react'

const EMPTY = {
  codigo: '', nombre: '', categoria_id: '', tipo: 'simple',
  precio_venta: '', precio_costo: '', unidad: 'unidad',
  stock_actual: '', stock_minimo: '', activo: true, componentes: []
}

export default function ProductoModal({ producto, productos, categorias, onSave, onClose, addToast, onNuevaCat }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [nuevaCat, setNuevaCat] = useState('')
  const [showNuevaCat, setShowNuevaCat] = useState(false)
  const [compSearch, setCompSearch] = useState('')
  const [compSelectedId, setCompSelectedId] = useState('')
  const [compQty, setCompQty] = useState(1)

  useEffect(() => {
    if (producto) {
      setForm({
        ...EMPTY,
        ...producto,
        precio_venta: producto.precio_venta ?? '',
        precio_costo: producto.precio_costo ?? '',
        stock_actual: producto.stock_actual ?? '',
        stock_minimo: producto.stock_minimo ?? '',
        componentes: producto.componentes || [],
      })
    } else {
      setForm(EMPTY)
    }
  }, [producto])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const agregarComponente = () => {
    if (!compSelectedId) return
    const prod = productos.find(p => p.id === Number(compSelectedId))
    if (!prod) return
    if (form.componentes.some(c => c.producto_id === prod.id)) {
      addToast('Ya está en los componentes', 'err'); return
    }
    set('componentes', [...form.componentes, { producto_id: prod.id, nombre: prod.nombre, cantidad: Number(compQty) || 1 }])
    setCompSelectedId(''); setCompQty(1); setCompSearch('')
  }

  const quitarComponente = (pid) => set('componentes', form.componentes.filter(c => c.producto_id !== pid))

  const productosFiltrados = productos.filter(p =>
    p.tipo === 'simple' &&
    (!compSearch || p.nombre.toLowerCase().includes(compSearch.toLowerCase())) &&
    (!producto || p.id !== producto.id)
  )

  async function agregarCat() {
    if (!nuevaCat.trim()) return
    try {
      await onNuevaCat(nuevaCat.trim())
      addToast('✓ Categoría creada')
      setNuevaCat(''); setShowNuevaCat(false)
    } catch (e) { addToast('Error: ' + e.message, 'err') }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { addToast('El nombre es obligatorio', 'err'); return }
    if (form.tipo === 'compuesto' && form.componentes.length === 0) { addToast('Agregá al menos un componente', 'err'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        precio_venta: parseFloat(form.precio_venta) || 0,
        precio_costo: parseFloat(form.precio_costo) || 0,
        stock_actual: form.tipo === 'simple' ? (parseFloat(form.stock_actual) || 0) : 0,
        stock_minimo: form.tipo === 'simple' ? (parseFloat(form.stock_minimo) || 0) : 0,
        categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
      }
      await onSave(payload)
    } catch (e) {
      addToast('Error: ' + e.message, 'err')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ov op" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo">
        <div className="moh">
          <div className="mot">
            <div className="mot-icon">📦</div>
            {producto ? 'Editar producto' : 'Nuevo producto'}
          </div>
          <button className="xcl" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tipo */}
          <div className="sdv">Tipo de producto</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {['simple', 'compuesto'].map(t => (
              <button
                key={t} type="button"
                className={`rp ${form.tipo === t ? 'spaid' : ''}`}
                onClick={() => set('tipo', t)}
                style={{ flex: 1, textAlign: 'center', textTransform: 'capitalize' }}
              >
                {t === 'simple' ? '📦 Simple' : '🔗 Compuesto'}
              </button>
            ))}
          </div>

          {/* Datos básicos */}
          <div className="sdv">Datos del producto</div>
          <div className="fg">
            <div className="fgg">
              <label>Nombre *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Gaseosa 500ml" required />
            </div>
            <div className="fgg">
              <label>Código / SKU</label>
              <input value={form.codigo} onChange={e => set('codigo', e.target.value)} placeholder="Ej: PRD-001" />
            </div>
            <div className="fgg">
              <label>Categoría</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <select value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)} style={{ flex: 1 }}>
                  <option value="">Sin categoría</option>
                  {(categorias || []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <button type="button" className="bg2 bsm" onClick={() => setShowNuevaCat(v => !v)} title="Nueva categoría">＋</button>
              </div>
              {showNuevaCat && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input value={nuevaCat} onChange={e => setNuevaCat(e.target.value)} placeholder="Nombre categoría" style={{ flex: 1 }} />
                  <button type="button" className="bp bsm" onClick={agregarCat}>Agregar</button>
                </div>
              )}
            </div>
            <div className="fgg">
              <label>Unidad</label>
              <select value={form.unidad} onChange={e => set('unidad', e.target.value)}>
                {['unidad', 'kg', 'g', 'l', 'ml', 'porción', 'docena', 'caja', 'pack'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Precios */}
          <div className="sdv">Precios</div>
          <div className="fg">
            <div className="fgg">
              <label>Precio de venta $</label>
              <input type="number" min="0" step="0.01" value={form.precio_venta} onChange={e => set('precio_venta', e.target.value)} placeholder="0" />
            </div>
            <div className="fgg">
              <label>Precio de costo $</label>
              <input type="number" min="0" step="0.01" value={form.precio_costo} onChange={e => set('precio_costo', e.target.value)} placeholder="0" />
            </div>
          </div>

          {/* Stock (solo simple) */}
          {form.tipo === 'simple' && (
            <>
              <div className="sdv">Stock</div>
              <div className="fg">
                <div className="fgg">
                  <label>Stock actual</label>
                  <input type="number" min="0" step="0.01" value={form.stock_actual} onChange={e => set('stock_actual', e.target.value)} placeholder="0" />
                </div>
                <div className="fgg">
                  <label>Stock mínimo (alerta)</label>
                  <input type="number" min="0" step="0.01" value={form.stock_minimo} onChange={e => set('stock_minimo', e.target.value)} placeholder="0" />
                </div>
              </div>
            </>
          )}

          {/* Componentes (solo compuesto) */}
          {form.tipo === 'compuesto' && (
            <>
              <div className="sdv">Componentes</div>
              <p style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 12 }}>
                Un producto compuesto descuenta stock de cada componente al venderse.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-end' }}>
                <div className="fgg" style={{ flex: 2 }}>
                  <label>Buscar producto simple</label>
                  <input
                    value={compSearch}
                    onChange={e => { setCompSearch(e.target.value); setCompSelectedId('') }}
                    placeholder="Nombre del componente..."
                  />
                  {compSearch && productosFiltrados.length > 0 && (
                    <div style={{ border: '1px solid var(--bd2)', borderRadius: 8, background: 'var(--wh)', position: 'absolute', zIndex: 10, maxHeight: 160, overflowY: 'auto', marginTop: 2, minWidth: 260 }}>
                      {productosFiltrados.slice(0, 8).map(p => (
                        <div key={p.id}
                          onClick={() => { setCompSelectedId(String(p.id)); setCompSearch(p.nombre) }}
                          style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--nv3)'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                        >
                          {p.nombre} <span style={{ color: 'var(--mu)', fontSize: 12 }}>· stock: {p.stock_actual || 0}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="fgg" style={{ flex: 1 }}>
                  <label>Cantidad</label>
                  <input type="number" min="0.01" step="0.01" value={compQty} onChange={e => setCompQty(e.target.value)} />
                </div>
                <button type="button" className="bn bsm" style={{ flexShrink: 0 }} onClick={agregarComponente}>Agregar</button>
              </div>
              {form.componentes.length > 0 ? (
                <div className="mrc">
                  {form.componentes.map(c => (
                    <div key={c.producto_id} className="mr" style={{ gridTemplateColumns: '1fr 80px auto' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{c.nombre}</span>
                      <input
                        type="number" min="0.01" step="0.01" value={c.cantidad}
                        onChange={e => set('componentes', form.componentes.map(x => x.producto_id === c.producto_id ? { ...x, cantidad: Number(e.target.value) } : x))}
                        style={{ textAlign: 'center' }}
                      />
                      <button type="button" className="bdng" onClick={() => quitarComponente(c.producto_id)}>✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--mu2)', fontStyle: 'italic' }}>Sin componentes aún.</p>
              )}
            </>
          )}

          {/* Estado */}
          <div className="sdv">Estado</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[{ v: true, l: '✓ Activo' }, { v: false, l: '✗ Inactivo' }].map(({ v, l }) => (
              <button key={String(v)} type="button"
                className={`rp ${form.activo === v ? 'spaid' : ''}`}
                onClick={() => set('activo', v)}
                style={{ flex: 1, textAlign: 'center' }}
              >{l}</button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <button type="button" className="bg2" onClick={onClose}>Cancelar</button>
            <button type="submit" className="bp" disabled={saving}>
              {saving ? 'Guardando...' : (producto ? 'Guardar cambios' : 'Crear producto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
