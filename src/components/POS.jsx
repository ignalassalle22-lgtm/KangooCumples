import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabase'
import { fechaHoyAR, fechaHoyAR as _f, imprimirTicketBrowser, fmt as fmtUtil } from '../utils'
import { useCaja } from '../hooks/useCaja'
import { useVentas } from '../hooks/useVentas'
import { useProductos } from '../hooks/useProductos'
import { useConfig } from '../hooks/useConfig'
import { useEmpleados } from '../hooks/useEmpleados'

const fmt = (n) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })

function parsearMetodos(metodo_pago, totalVenta) {
  if (!metodo_pago) return { Otro: totalVenta }
  if (metodo_pago.includes('$')) {
    const result = {}
    metodo_pago.split(' + ').forEach(parte => {
      const idx = parte.lastIndexOf('$')
      if (idx === -1) return
      const nombre = parte.slice(0, idx).trim()
      const monto = parseFloat(parte.slice(idx + 1).replace(/\./g, '').replace(',', '.')) || 0
      if (nombre) result[nombre] = (result[nombre] || 0) + monto
    })
    return result
  }
  return { [metodo_pago]: totalVenta }
}

// ── Selector de caja ──────────────────────────────────────────────────────────
function SelectorCaja({ cajasAbiertas, onSelect }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--nv)', fontFamily: 'Nunito, sans-serif' }}>Sistema de Ventas</div>
        <div style={{ fontSize: 15, color: 'var(--mu)', marginTop: 8 }}>Seleccioná la caja en la que vas a trabajar</div>
      </div>

      {cajasAbiertas.length === 0 ? (
        <div style={{
          background: 'var(--wh)', borderRadius: 16, padding: '32px 40px', textAlign: 'center',
          border: '1px solid var(--bd)', boxShadow: 'var(--sh)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--nv)', marginBottom: 8 }}>No hay cajas abiertas</div>
          <div style={{ fontSize: 14, color: 'var(--mu)' }}>Primero abrí una caja desde el módulo Caja del sistema.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800 }}>
          {cajasAbiertas.map(c => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              style={{
                background: 'var(--wh)', border: '2px solid var(--bd)',
                borderRadius: 16, padding: '28px 36px', cursor: 'pointer',
                transition: 'all .15s', textAlign: 'center', minWidth: 200,
                boxShadow: 'var(--sh)',
                fontFamily: 'Nunito, sans-serif',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--or)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--sh2)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--sh)' }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>🧾</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--nv)' }}>{c.nombre || 'Caja'}</div>
              {c.turno && (
                <div style={{ fontSize: 13, background: 'var(--nv3)', color: 'var(--nv)', padding: '3px 12px', borderRadius: 20, fontWeight: 700, display: 'inline-block', marginTop: 6 }}>
                  {c.turno}
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 10 }}>
                Abierta desde {c.hora_apertura} hs
              </div>
              <div style={{ fontSize: 12, color: 'var(--mu)' }}>
                Saldo inicial {fmt(c.saldo_inicial)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Interfaz POS ─────────────────────────────────────────────────────────────
function POSInterface({ caja, ventas, saveVenta, updateStock, productos, categorias, config, empleados, addToast }) {
  const METODOS = config.mets_caja?.length ? config.mets_caja : ['Efectivo', 'Transferencia', 'Tarjeta débito', 'Tarjeta crédito', 'Mercado Pago', 'Otro']

  // Ticket state
  const [items, setItems] = useState([])
  const [busca, setBusca] = useState('')
  const [cliente, setCliente] = useState('')
  const [empleadoId, setEmpleadoId] = useState('')
  const [metodo, setMetodo] = useState('Efectivo')
  const [pagaCon, setPagaCon] = useState('')
  const [descuento, setDescuento] = useState('')
  const [descuentoTipo, setDescuentoTipo] = useState('monto')
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)
  const [ultimaVenta, setUltimaVenta] = useState(null)
  const buscaRef = useRef()

  const empleadosActivos = empleados.filter(e => e.activo !== false)

  // Ventas de esta caja hoy
  const ventasCaja = useMemo(() =>
    ventas.filter(v => v.caja_id === caja.id && v.estado !== 'anulada'),
    [ventas, caja.id]
  )

  const desglose = useMemo(() => {
    const map = {}
    ventasCaja.forEach(v => {
      const metodos = parsearMetodos(v.metodo_pago, v.total || 0)
      Object.entries(metodos).forEach(([met, monto]) => {
        map[met] = (map[met] || 0) + monto
      })
    })
    return map
  }, [ventasCaja])

  const totalVentas = ventasCaja.reduce((s, v) => s + (v.total || 0), 0)
  const totalEfectivo = desglose['Efectivo'] || 0
  const efectivoEsperado = (caja.saldo_inicial || 0) + totalEfectivo

  // Productos filtrados
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

  function limpiarTicket() {
    setItems([]); setCliente(''); setPagaCon(''); setDescuento(''); setObs('')
    setTimeout(() => buscaRef.current?.focus(), 100)
  }

  const subtotal = items.reduce((s, it) => s + it.subtotal, 0)
  const descuentoNum = descuentoTipo === 'pct'
    ? subtotal * (parseFloat(descuento) || 0) / 100
    : parseFloat(descuento) || 0
  const total = Math.max(0, subtotal - descuentoNum)
  const pagaConNum = parseFloat(pagaCon) || 0
  const vuelto = metodo === 'Efectivo' && pagaConNum > 0 ? pagaConNum - total : 0

  async function handleCobrar() {
    if (items.length === 0) { addToast('Agregá al menos un producto', 'err'); return }
    const sinStock = items.filter(it => it._tipo === 'simple' && it.maneja_stock !== false && (it._stockActual || 0) < it.cantidad)
    if (sinStock.length > 0) {
      addToast('Stock insuficiente: ' + sinStock.map(it => it.nombre_producto).join(', '), 'err')
      return
    }
    setSaving(true)
    try {
      const fecha = fechaHoyAR()
      const hora = new Date().toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false })
      const ventaGuardada = await saveVenta(
        {
          fecha, hora, cliente,
          subtotal, descuento: descuentoNum, total,
          metodo_pago: metodo,
          caja_id: caja.id,
          empleado_id: empleadoId ? Number(empleadoId) : null,
          obs,
          estado: 'completada',
        },
        items
      )
      setUltimaVenta({ ...ventaGuardada, venta_items: items })
      addToast('Venta registrada correctamente')
      limpiarTicket()
    } catch (e) {
      addToast('Error: ' + e.message, 'err')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: 'var(--nv)', borderBottom: '3px solid var(--or)',
        padding: '0 24px', height: 60, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Nunito, sans-serif' }}>
            🏪 Sistema de Ventas
          </span>
          <span style={{ background: 'var(--or)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
            {caja.nombre || 'Caja'}{caja.turno ? ` · ${caja.turno}` : ''}
          </span>
        </div>
        <button
          onClick={() => window.close()}
          style={{
            background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          ✕ Salir
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, gap: 0, minHeight: 0 }}>

        {/* Panel izquierdo: ticket */}
        <div style={{ padding: 24, overflowY: 'auto', borderRight: '1px solid var(--bd)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Nuevo ticket</div>

          {/* Buscador */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              ref={buscaRef}
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar producto por nombre o código..."
              autoFocus
              style={{
                width: '100%', border: '2px solid var(--bd2)', borderRadius: 12,
                padding: '12px 16px', fontSize: 15, outline: 'none',
                fontFamily: 'Nunito Sans, sans-serif',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--or)'}
              onBlur={e => e.target.style.borderColor = 'var(--bd2)'}
            />
            {prodsFiltrados.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                background: 'var(--wh)', border: '1px solid var(--bd2)', borderRadius: 12,
                boxShadow: 'var(--sh2)', marginTop: 4, overflow: 'hidden',
              }}>
                {prodsFiltrados.map(p => (
                  <div key={p.id} onClick={() => agregarProducto(p)} style={{
                    padding: '12px 16px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid var(--bd)',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--nv3)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.nombre}</div>
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
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--mu2)', fontSize: 15 }}>
              Buscá un producto para agregar al ticket
            </div>
          ) : (
            <div className="vtable-wrap">
              <table className="vtable">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="num" style={{ width: 80 }}>Cant.</th>
                    <th className="num" style={{ width: 130 }}>✏ Precio unit.</th>
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
                            Stock: {it._stockActual || 0}{(it._stockActual || 0) < it.cantidad ? ' ⚠' : ''}
                          </div>
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
                          style={{ width: 110, textAlign: 'right', border: '1px solid var(--nv2)', borderRadius: 7, padding: '4px 8px', fontSize: 13, background: 'var(--nv3)' }}
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

          {/* Datos del cliente y empleado */}
          {items.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
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
              <div className="fgg">
                <label>Observaciones</label>
                <input value={obs} onChange={e => setObs(e.target.value)} placeholder="Opcional..." />
              </div>
            </div>
          )}
        </div>

        {/* Panel derecho: cobro + resumen de caja */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--wh)', borderLeft: '1px solid var(--bd)' }}>

          {/* Cobro */}
          <div style={{ padding: 20, borderBottom: '1px solid var(--bd)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Cobro</div>

            {/* Descuento */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {['monto', 'pct'].map(t => (
                <button key={t} type="button"
                  className={`rp${descuentoTipo === t ? ' spaid' : ''}`}
                  onClick={() => { setDescuentoTipo(t); setDescuento('') }}
                  style={{ flex: 1, textAlign: 'center', padding: '6px 8px', fontSize: 12 }}
                >
                  {t === 'monto' ? '$ Descuento' : '% Descuento'}
                </button>
              ))}
            </div>
            <input type="number" min="0" value={descuento} onChange={e => setDescuento(e.target.value)}
              placeholder="0" style={{ width: '100%', border: '1px solid var(--bd2)', borderRadius: 8, padding: '7px 12px', fontSize: 13, marginBottom: 12 }} />

            {/* Totales */}
            <div className="tb" style={{ marginBottom: 14 }}>
              <div className="tr"><span className="tl">Subtotal</span><span className="tv">{fmt(subtotal)}</span></div>
              {descuentoNum > 0 && <div className="tr"><span className="tl">Descuento</span><span className="tv" style={{ color: '#ff9f7a' }}>-{fmt(descuentoNum)}</span></div>}
              <hr className="tsep" />
              <div className="tr big"><span className="tl">TOTAL</span><span className="tv">{fmt(total)}</span></div>
            </div>

            {/* Métodos de pago */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {METODOS.map(m => (
                <button key={m} type="button"
                  className={`rp ${metodo === m ? 'spaid' : ''}`}
                  onClick={() => { setMetodo(m); setPagaCon('') }}
                  style={{ textAlign: 'left', padding: '8px 12px', fontSize: 13 }}
                >{m}</button>
              ))}
            </div>

            {/* Paga con / vuelto */}
            {metodo === 'Efectivo' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', display: 'block', marginBottom: 4 }}>¿Con cuánto paga?</label>
                <input type="number" min="0" value={pagaCon} onChange={e => setPagaCon(e.target.value)}
                  placeholder={fmt(total)}
                  style={{ width: '100%', border: '1px solid var(--bd2)', borderRadius: 8, padding: '8px 12px', fontSize: 14 }} />
                {pagaConNum > 0 && (
                  <div style={{
                    marginTop: 8, padding: '8px 12px', borderRadius: 8, textAlign: 'center',
                    background: vuelto >= 0 ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
                    border: `1.5px solid ${vuelto >= 0 ? 'var(--gn)' : 'var(--rd)'}`,
                    fontWeight: 800, fontSize: 16,
                    color: vuelto >= 0 ? 'var(--gn)' : 'var(--rd)',
                  }}>
                    {vuelto >= 0 ? `Vuelto: ${fmt(vuelto)}` : `Falta: ${fmt(Math.abs(vuelto))}`}
                  </div>
                )}
              </div>
            )}

            <button
              className="bp"
              onClick={handleCobrar}
              disabled={saving || items.length === 0}
              style={{ width: '100%', padding: '14px', fontSize: 16, marginBottom: 8 }}
            >
              {saving ? 'Registrando...' : `✓ Cobrar ${total > 0 ? fmt(total) : ''}`}
            </button>
            {items.length > 0 && (
              <button className="bg2" onClick={limpiarTicket} style={{ width: '100%', fontSize: 13 }}>
                Limpiar ticket
              </button>
            )}
          </div>

          {/* Resumen de la caja */}
          <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
              Resumen de caja · {caja.fecha}
            </div>

            <div className="li"><span className="lin">Tickets registrados</span><span className="lis" style={{ fontWeight: 700 }}>{ventasCaja.length}</span></div>
            <div className="li"><span className="lin">Total facturado</span><span className="lip">{fmt(totalVentas)}</span></div>
            <div className="li"><span className="lin">Efectivo esperado</span><span className="lip">{fmt(efectivoEsperado)}</span></div>

            {Object.keys(desglose).length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 16, marginBottom: 10 }}>
                  Por método de pago
                </div>
                {Object.entries(desglose).map(([met, monto]) => (
                  <div key={met} className="li">
                    <span className="lin">{met}</span>
                    <span className="lip">{fmt(monto)}</span>
                  </div>
                ))}
              </>
            )}

            {/* Últimos tickets */}
            {ventasCaja.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 16, marginBottom: 10 }}>
                  Últimos tickets
                </div>
                {[...ventasCaja].slice(0, 8).map(v => (
                  <div key={v.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 0', borderBottom: '1px solid var(--bd)', fontSize: 13,
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--nv)', fontFamily: 'Nunito' }}>{v.numero}</span>
                      <span style={{ color: 'var(--mu)', marginLeft: 8, fontSize: 12 }}>{v.hora}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--gn)' }}>{fmt(v.total)}</span>
                  </div>
                ))}
              </>
            )}

            {/* Última venta registrada */}
            {ultimaVenta && (
              <div style={{ marginTop: 16, background: 'var(--gnb)', border: '1px solid var(--gn)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gn)', marginBottom: 6 }}>Última venta registrada</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{ultimaVenta.numero} · {fmt(ultimaVenta.total)}</div>
                <div style={{ fontSize: 12, color: 'var(--mu)' }}>{ultimaVenta.metodo_pago}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toasts */}
      <POSToasts />
    </div>
  )
}

function POSToasts() { return null } // manejado por el padre via addToast

// ── App POS (raíz de la pestaña) ─────────────────────────────────────────────
export default function POS() {
  const [usuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kf_usuario')) || null } catch { return null }
  })
  const [cajaSeleccionada, setCajaSeleccionada] = useState(null)
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((msg, type = 'ok') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const { cajasAbiertas } = useCaja()
  const { ventas, saveVenta } = useVentas()
  const { productos, categorias, updateStock } = useProductos()
  const { config } = useConfig()
  const { empleados } = useEmpleados()

  if (!usuario) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ background: 'var(--wh)', borderRadius: 16, padding: 40, textAlign: 'center', boxShadow: 'var(--sh2)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--nv)' }}>Sesión no iniciada</div>
          <div style={{ fontSize: 14, color: 'var(--mu)', marginTop: 8 }}>Iniciá sesión en el sistema principal primero.</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {!cajaSeleccionada
        ? <SelectorCaja cajasAbiertas={cajasAbiertas} onSelect={setCajaSeleccionada} />
        : <POSInterface
            caja={cajaSeleccionada}
            ventas={ventas}
            saveVenta={saveVenta}
            updateStock={updateStock}
            productos={productos}
            categorias={categorias}
            config={config}
            empleados={empleados}
            addToast={addToast}
          />
      }
      <div id="toast-cont">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </>
  )
}
