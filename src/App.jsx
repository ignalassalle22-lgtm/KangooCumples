import React, { useState, useCallback, useEffect } from 'react'
import { supabase } from './supabase'

function PinModal({ claves, msg, onConfirm, onCancel }) {
  const [pin, setPin] = React.useState('')
  const [err, setErr] = React.useState(false)
  const hayClaves = Array.isArray(claves) && claves.length > 0

  const tryPin = (val) => {
    if (val.length < 4) return
    const match = (claves || []).find(c => String(c.pin) === val)
    if (match) {
      onConfirm(match.nombre)
    } else {
      setErr(true)
      setPin('')
      setTimeout(() => setErr(false), 1500)
    }
  }

  return (
    <div className="ov op" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="mo" style={{ maxWidth: 380 }}>
        <div className="moh">
          <div className="mot">
            <div className="mot-icon">🔐</div>
            <span>Confirmar acción</span>
          </div>
          <button className="xcl" onClick={onCancel}>✕</button>
        </div>
        {!hayClaves ? (
          <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--mu)', fontSize: 14 }}>
            No hay claves configuradas. Configuralas en <b>Datos de venta</b> antes de continuar.
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="bg2" onClick={onCancel}>Cerrar</button>
            </div>
          </div>
        ) : (
          <>
            {msg && <p style={{ color: 'var(--mu)', fontSize: 14, marginBottom: 16 }}>{msg}</p>}
            <p style={{ color: 'var(--mu)', fontSize: 13, marginBottom: 20 }}>
              Ingresá tu código de 4 dígitos para confirmar. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                autoFocus
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setPin(v)
                  tryPin(v)
                }}
                style={{
                  fontSize: 28, textAlign: 'center', letterSpacing: 14, width: 150,
                  border: `2px solid ${err ? 'var(--rd)' : 'var(--bd2)'}`,
                  borderRadius: 10, padding: '10px 16px',
                  transition: 'border-color .2s',
                }}
                placeholder="••••"
              />
            </div>
            {err && <div style={{ textAlign: 'center', color: 'var(--rd)', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Código incorrecto</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="bg2" onClick={onCancel}>Cancelar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

import Topbar from './components/Topbar'

// Cumpleaños
import EventosList from './components/EventosList'
import EventoModal from './components/EventoModal'
import DetalleModal from './components/DetalleModal'
import CajaEventoModal from './components/CajaEventoModal'
import FinalizarEventoModal from './components/FinalizarEventoModal'
import CalendarioSemana from './components/CalendarioSemana'
import CalendarioMes from './components/CalendarioMes'
import Metricas from './components/Metricas'
import Config from './components/Config'
import { useEventos } from './hooks/useEventos'
import { useConfig } from './hooks/useConfig'

// Ventas
import Productos from './components/Productos'
import ProductoModal from './components/ProductoModal'
import Ventas from './components/Ventas'
import TicketModal from './components/TicketModal'
import Compras from './components/Compras'
import CompraModal from './components/CompraModal'
import Caja from './components/Caja'
import ReportesVentas from './components/ReportesVentas'
import Pedidos from './components/Pedidos'
import Asistencia from './components/Asistencia'
import Cofre from './components/Cofre'
import { useProductos } from './hooks/useProductos'
import { useCofre } from './hooks/useCofre'
import { useCajaGastos } from './hooks/useCajaGastos'
import { useVentas } from './hooks/useVentas'
import { useCompras } from './hooks/useCompras'
import { useCaja } from './hooks/useCaja'
import { useEmpleados } from './hooks/useEmpleados'
import { usePedidos } from './hooks/usePedidos'
import { useProveedores } from './hooks/useProveedores'

export default function App() {
  // ── Cumpleaños ──
  const {
    eventos, loading: evLoading, error,
    saveEvento, deleteEvento,
    saveEventoConsumos, marcarMenusStockAplicado, marcarConsumoCobrado,
    resetConsumoCobrado, resetMenusStockAplicado, finalizarEvento,
  } = useEventos()
  const { config, updateConfig } = useConfig()

  // ── Ventas ──
  const { productos, categorias, loading: prodLoading, saveProducto, deleteProducto, updateStock, updateCosto, bulkUpdatePrecios, saveCategoria } = useProductos()
  const { ventas, loading: ventasLoading, fetchVentas, saveVenta, anularVenta } = useVentas()
  const { compras, loading: comprasLoading, saveCompra, updateCompra, anularCompra } = useCompras()
  const { proveedores, saveProveedor, deleteProveedor } = useProveedores()
  const { cajasAbiertas, historial: cajaHistorial, loading: cajaLoading, abrirCaja, cerrarCaja } = useCaja()
  const cajaActual = cajasAbiertas[0] || null
  const { empleados, saveEmpleado, toggleEmpleado, deleteEmpleado } = useEmpleados()
  const { movimientos: cofreMovimientos, loading: cofreLoading, saldo: cofreSaldo, addMovimiento: addCofreMovimiento } = useCofre()
  const { gastos: cajaGastos, addGasto } = useCajaGastos()

  // Caja seleccionada para ventas: se persiste entre tickets, se limpia si la caja se cierra
  const [cajaSeleccionadaId, setCajaSeleccionadaId] = useState(null)
  useEffect(() => {
    const ids = cajasAbiertas.map(c => c.id)
    if (cajasAbiertas.length === 0) {
      setCajaSeleccionadaId(null)
    } else if (!cajaSeleccionadaId || !ids.includes(cajaSeleccionadaId)) {
      setCajaSeleccionadaId(cajasAbiertas[0].id)
    }
  }, [cajasAbiertas])

  // ── UI State ──
  const [activeSection, setActiveSection] = useState('eventos')
  const [calView, setCalView] = useState('semana')
  const [pinModal, setPinModal] = useState({ show: false, onConfirm: null, msg: '' })
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((msg, type = 'ok') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const logAudit = useCallback(async (accion, clave_nombre) => {
    try {
      await supabase.from('audit_log').insert({ accion, clave_nombre })
    } catch (e) {
      console.warn('audit_log error:', e)
    }
  }, [])

  const askPin = useCallback((msg, onConfirm) => {
    setPinModal({
      show: true,
      msg,
      onConfirm: async (clave_nombre) => {
        await logAudit(msg, clave_nombre)
        await onConfirm(clave_nombre)
      },
    })
  }, [logAudit])

  const handleNavToCofre = useCallback(() => {
    askPin('Acceso al módulo Cofre.', () => {
      setPinModal({ show: false, onConfirm: null, msg: '' })
      setActiveSection('cofre')
    })
  }, [askPin])

  // ── Handlers cofre y gastos ──
  const handleAddCofreIngreso = useCallback(async (mov) => {
    await addCofreMovimiento(mov)
  }, [addCofreMovimiento])

  const handleAddGasto = useCallback(async (gasto) => {
    await addGasto(gasto)
  }, [addGasto])

  // Modals cumpleaños
  const [modalOpen, setModalOpen] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [detalleId, setDetalleId] = useState(null)
  const [cajaEventoId, setCajaEventoId] = useState(null)
  const [finalizarEventoId, setFinalizarEventoId] = useState(null)

  // Modals ventas
  const [productoModalOpen, setProductoModalOpen] = useState(false)
  const [editingProductoId, setEditingProductoId] = useState(null)
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [compraModalOpen, setCompraModalOpen] = useState(false)
  const [editingCompra, setEditingCompra] = useState(null)
  const [pedidoParaCobrar, setPedidoParaCobrar] = useState(null)


  // ── Pedidos (menú digital) ──
  const handleNuevoPedido = useCallback((pedido) => {
    // Beep de notificación via Web Audio API
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(); osc.stop(ctx.currentTime + 0.4)
    } catch (_) {}
    addToast(`🔔 Nuevo pedido #${pedido.numero} — ${pedido.nombre}`, 'ok')
  }, [addToast])

  const { pedidos, loading: pedidosLoading, updateEstado: updateEstadoPedido, marcarCobrado, anularPedido } = usePedidos(handleNuevoPedido)

  const handleAnularPedido = useCallback((id) => {
    const p = pedidos.find(x => x.id === id)
    const info = p ? `Pedido #${p.numero} — ${p.nombre || 'sin nombre'}` : `Pedido #${id}`
    askPin(`Cancelar ${info}.`, async () => {
      setPinModal({ show: false, onConfirm: null, msg: '' })
      try { await anularPedido(id); addToast('Pedido cancelado') }
      catch (e) { addToast('Error: ' + e.message, 'err') }
    })
  }, [anularPedido, addToast, askPin])

  const handleCobrarPedido = useCallback((pedido) => {
    const itemsIniciales = (pedido.pedido_items || []).map(it => ({
      producto_id: it.producto_id || null,
      nombre_producto: it.nombre_producto,
      precio_unitario: it.precio_unitario || 0,
      cantidad: it.cantidad,
      subtotal: it.subtotal || 0,
      maneja_stock: true,
    }))
    setPedidoParaCobrar(pedido)
    setTicketModalOpen(true)
  }, [])

  const handleSaveVentaDesdePedido = useCallback(async (venta, items) => {
    const ventaGuardada = await saveVenta(venta, items, updateStock)
    if (pedidoParaCobrar) {
      await marcarCobrado(pedidoParaCobrar.id, ventaGuardada?.id || null)
      setPedidoParaCobrar(null)
    }
    setTicketModalOpen(false)
    addToast('✓ Pedido cobrado correctamente')
  }, [saveVenta, updateStock, marcarCobrado, pedidoParaCobrar, addToast])

  // ── Handlers cumpleaños ──
  const handleOpenModal = useCallback((id = null) => { setEditingId(id); setModalOpen(true) }, [])
  const handleOpenDetalle = useCallback((id) => { setDetalleId(id); setDetalleOpen(true) }, [])
  const handleAbrirCajaEvento = useCallback((id) => { setCajaEventoId(id); setDetalleOpen(false) }, [])

  const handleSave = useCallback(async (eventoData) => {
    try {
      await saveEvento(eventoData)
      setModalOpen(false)
      addToast(eventoData.id ? '✓ Evento actualizado' : '✓ Evento creado')
    } catch (e) { addToast('Error: ' + e.message, 'err'); throw e }
  }, [saveEvento, addToast])

  const handleDelete = useCallback((id) => {
    const ev = eventos.find(e => e.id === id)
    const info = ev ? `evento de ${ev.cumple || ev.reservante || '?'} — ${ev.fecha}` : `evento #${id}`
    askPin(`Eliminar permanentemente: ${info}.`, async () => {
      setPinModal({ show: false, onConfirm: null, msg: '' })
      try { await deleteEvento(id); addToast('Evento eliminado', 'err') }
      catch (e) { addToast('Error: ' + e.message, 'err') }
    })
  }, [deleteEvento, addToast, askPin])

  // ── Handlers caja de evento ──
  // Solo persiste los consumos en DB — el stock se descuenta al cobrar
  const handleGuardarConsumos = useCallback(async (eventoId, consumos) => {
    await saveEventoConsumos(eventoId, consumos)
  }, [saveEventoConsumos])

  // Función helper: restaura stock de un ítem (y sus componentes si es compuesto)
  const restaurarStockItem = useCallback(async (productoId, qty) => {
    const prod = productos.find(p => p.id === productoId)
    if (prod?.maneja_stock === false) return
    await updateStock(productoId, qty)
    if (prod?.componentes?.length) {
      for (const comp of prod.componentes) {
        await updateStock(comp.producto_id, comp.cantidad * qty)
      }
    }
  }, [updateStock, productos])

  const handleAplicarMenuStock = useCallback(async (eventoId, menuItems) => {
    for (const item of menuItems) {
      await updateStock(item.productoId, -item.qty)
      const prod = productos.find(p => p.id === item.productoId)
      if (prod?.componentes?.length) {
        for (const comp of prod.componentes) {
          await updateStock(comp.producto_id, -(comp.cantidad * item.qty))
        }
      }
    }
    await marcarMenusStockAplicado(eventoId)
  }, [updateStock, marcarMenusStockAplicado, productos])

  const handleDeshacerMenuStock = useCallback((eventoId, menuItems) => {
    const ev = eventos.find(e => e.id === eventoId)
    const info = ev ? `${ev.cumple || ev.reservante || '?'} — ${ev.fecha}` : `#${eventoId}`
    askPin(`Deshacer stock de menús/artículos: evento ${info}.`, async () => {
      setPinModal({ show: false, onConfirm: null, msg: '' })
      for (const item of menuItems) {
        await restaurarStockItem(item.productoId, item.qty)
      }
      await resetMenusStockAplicado(eventoId)
      addToast('✓ Stock de menús restaurado')
    })
  }, [restaurarStockItem, resetMenusStockAplicado, addToast, askPin])

  const handleDeshacerCobro = useCallback((eventoId, consumos) => {
    const ev = eventos.find(e => e.id === eventoId)
    const info = ev ? `${ev.cumple || ev.reservante || '?'} — ${ev.fecha}` : `#${eventoId}`
    askPin(`Deshacer cobro de adicionales: evento ${info}.`, async () => {
      setPinModal({ show: false, onConfirm: null, msg: '' })
      const cobrados = consumos.filter(c => c.cobrado)
      for (const c of cobrados) {
        if (c.productoId) await restaurarStockItem(c.productoId, c.qty)
      }
      const consumosReseteados = consumos.map(c => ({ ...c, cobrado: false }))
      await saveEventoConsumos(eventoId, consumosReseteados)
      addToast('✓ Cobro deshecho · stock restaurado')
    })
  }, [restaurarStockItem, saveEventoConsumos, addToast, askPin])

  const handleCobrarAdicionales = useCallback(async ({ eventoId, consumosPendientes, todosConsumos, total, metodoPago, cajaId }) => {
    const ev = eventos.find(e => e.id === eventoId)
    const ahora = new Date()
    const fecha = ahora.toISOString().split('T')[0]
    const hora = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    const cliente = ev ? `${ev.cumple || ev.reservante || ''} (evento)`.trim() : 'Evento'

    const venta = {
      fecha,
      hora,
      cliente,
      subtotal: total,
      descuento: 0,
      total,
      metodo_pago: metodoPago,
      estado: 'completada',
      caja_id: cajaId,
      obs: `Adicionales evento #${eventoId}`,
    }

    const items = consumosPendientes.map(c => ({
      producto_id: c.productoId,
      nombre_producto: c.nombreProducto,
      precio_unitario: c.precioUnitario || 0,
      cantidad: c.qty,
      subtotal: (c.precioUnitario || 0) * c.qty,
    }))

    // Crear la venta sin que saveVenta descuente stock (pasamos null)
    await saveVenta(venta, items, null)

    // Descontar stock de los ítems pendientes (incluye componentes de productos compuestos)
    for (const c of consumosPendientes) {
      if (c.productoId) await restaurarStockItem(c.productoId, -c.qty)
    }

    // Marcar los pendientes como cobrados y guardar en DB
    const consumosActualizados = todosConsumos.map(c => c.cobrado ? c : { ...c, cobrado: true })
    await saveEventoConsumos(eventoId, consumosActualizados)
  }, [eventos, saveVenta, restaurarStockItem, saveEventoConsumos])

  // ── Finalizar evento ──
  const handleAbrirFinalizar = useCallback((id) => {
    setDetalleOpen(false)
    setFinalizarEventoId(id)
  }, [])

  const handleFinalizarEvento = useCallback(async ({ metodoPago, cajaId, saldoEvento, consumosPendientes, totalFinal }) => {
    const ev = eventos.find(e => e.id === finalizarEventoId)
    if (!ev) return

    const ahora = new Date()
    const fecha = ahora.toISOString().split('T')[0]
    const hora = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    const cliente = ev.reservante || ev.cumple || 'Evento'

    if (totalFinal > 0 && cajaId) {
      const items = []
      if (saldoEvento > 0) {
        items.push({
          producto_id: null,
          nombre_producto: `Saldo evento — ${cliente}`,
          precio_unitario: saldoEvento,
          cantidad: 1,
          subtotal: saldoEvento,
          maneja_stock: false,
        })
      }
      consumosPendientes.forEach(c => {
        items.push({
          producto_id: c.productoId || null,
          nombre_producto: c.nombreProducto,
          precio_unitario: c.precioUnitario || 0,
          cantidad: c.qty,
          subtotal: (c.precioUnitario || 0) * c.qty,
          maneja_stock: !!c.productoId,
        })
        if (c.productoId) restaurarStockItem(c.productoId, -c.qty)
      })

      const venta = {
        fecha, hora, cliente,
        subtotal: totalFinal, descuento: 0, total: totalFinal,
        metodo_pago: metodoPago, estado: 'completada',
        caja_id: cajaId,
        obs: `Finalización evento — ${cliente}`,
      }
      await saveVenta(venta, items, null)
    }

    await finalizarEvento(finalizarEventoId, { monto: ev.total, met: metodoPago })
    setFinalizarEventoId(null)
    addToast('✅ Evento finalizado y cobro registrado en caja')
  }, [eventos, finalizarEventoId, saveVenta, finalizarEvento, restaurarStockItem, addToast])

  // ── Handlers productos ──
  const handleOpenProducto = useCallback((id = null) => { setEditingProductoId(id); setProductoModalOpen(true) }, [])

  const handleSaveProducto = useCallback(async (p) => {
    await saveProducto(p)
    setProductoModalOpen(false)
    addToast(p.id ? '✓ Producto actualizado' : '✓ Producto creado')
  }, [saveProducto, addToast])

  const handleDeleteProducto = useCallback((id) => {
    const prod = productos.find(p => p.id === id)
    const info = prod ? `"${prod.nombre}"` : `#${id}`
    askPin(`Eliminar producto ${info} permanentemente.`, async () => {
      setPinModal({ show: false, onConfirm: null, msg: '' })
      try { await deleteProducto(id); addToast('Producto eliminado', 'err') }
      catch (e) { addToast('Error: ' + e.message, 'err') }
    })
  }, [deleteProducto, addToast, askPin])

  // ── Handlers ventas ──
  const handleSaveVenta = useCallback(async (venta, items) => {
    await saveVenta(venta, items, updateStock)
    setTicketModalOpen(false)
    addToast('✓ Venta registrada correctamente')
  }, [saveVenta, updateStock, addToast])

  const handleAnularVenta = useCallback((id) => {
    const v = ventas.find(x => x.id === id)
    const info = v ? `ticket #${v.numero || id} — ${v.cliente || 'sin cliente'} — $${v.total}` : `#${id}`
    askPin(`Anular venta: ${info}. Se revertirá el stock.`, async () => {
      setPinModal({ show: false, onConfirm: null, msg: '' })
      try { await anularVenta(id, updateStock); addToast('Venta anulada') }
      catch (e) { addToast('Error: ' + e.message, 'err') }
    })
  }, [anularVenta, updateStock, addToast, askPin])

  // ── Handlers compras ──
  const handleSaveCompra = useCallback(async (compra, items, oldItems) => {
    if (compra.id) {
      await updateCompra(compra, items, oldItems || [], updateStock, updateCosto)
      setEditingCompra(null)
      addToast('✓ Compra actualizada · stock y costos recalculados')
    } else {
      await saveCompra(compra, items, updateStock, updateCosto)
      setCompraModalOpen(false)
      addToast('✓ Compra registrada · stock y costos actualizados')
    }
  }, [saveCompra, updateCompra, updateStock, updateCosto, addToast])

  const handleEditarCompra = useCallback((compra) => {
    setEditingCompra(compra)
  }, [])

  const handleAnularCompra = useCallback((compra) => {
    askPin(`Anular compra: ${compra.proveedor || 'sin proveedor'}${compra.numero_remito ? ` remito ${compra.numero_remito}` : ''} — $${compra.total}. Se revertirá el stock.`, async () => {
      setPinModal({ show: false, onConfirm: null, msg: '' })
      try {
        await anularCompra(compra.id, compra.compra_items || [], updateStock)
        addToast('Compra anulada · stock revertido', 'err')
      } catch (e) {
        addToast('Error: ' + e.message, 'err')
      }
    })
  }, [anularCompra, updateStock, addToast, askPin])

  // ── Handlers caja ──
  const handleAbrirCaja = useCallback(async ({ saldo_inicial, nombre, turno }) => {
    await abrirCaja({ saldo_inicial, nombre, turno })
  }, [abrirCaja])

  const handleCerrarCaja = useCallback(async ({ cajaId, ...datos }) => {
    await cerrarCaja({ cajaId, ...datos })
  }, [cerrarCaja])

  const editingEvento = editingId ? eventos.find(e => e.id === editingId) : null
  const detalleEvento = detalleId ? eventos.find(e => e.id === detalleId) : null
  const cajaEvento = cajaEventoId ? eventos.find(e => e.id === cajaEventoId) : null
  const editingProducto = editingProductoId ? productos.find(p => p.id === editingProductoId) : null

  return (
    <>
      <Topbar
        activeSection={activeSection}
        onNav={setActiveSection}
        onNuevo={() => handleOpenModal()}
        cajaActual={cajaActual}
        onNavCofre={handleNavToCofre}
      />

      <div className="content">
        {error && (
          <div style={{ background: 'var(--rdb)', border: '1px solid rgba(163,32,32,.35)', borderRadius: 10, padding: '11px 16px', color: 'var(--rd)', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            ⚠ Supabase no configurado — trabajando en modo local.
          </div>
        )}

        {/* ── CUMPLEAÑOS ── */}
        {activeSection === 'eventos' && (
          <div className="sec">
            <EventosList
              eventos={eventos} loading={evLoading} config={config}
              onEditar={handleOpenModal} onEliminar={handleDelete}
              onNuevo={() => handleOpenModal()} onVerDetalle={handleOpenDetalle}
              onAbrirCaja={handleAbrirCajaEvento} onFinalizar={handleAbrirFinalizar}
            />
          </div>
        )}

        {activeSection === 'calendario' && (
          <div className="sec">
            <div className="ph">
              <div>
                <div className="pt">Calendario</div>
                <div className="ps">{calView === 'semana' ? 'Próximos 7 días' : 'Vista mensual'}</div>
              </div>
              <button className="bp" onClick={() => handleOpenModal()}>＋ Nuevo evento</button>
            </div>
            <div className="cal-topbar">
              <div className="cal-view-toggle">
                <button className={`cal-vbtn${calView === 'semana' ? ' active' : ''}`} onClick={() => setCalView('semana')}>📋 Semana</button>
                <button className={`cal-vbtn${calView === 'mes' ? ' active' : ''}`} onClick={() => setCalView('mes')}>🗓 Mes</button>
              </div>
            </div>
            {calView === 'semana'
              ? <CalendarioSemana eventos={eventos} onEditar={handleOpenModal} onVerDetalle={handleOpenDetalle} />
              : <CalendarioMes eventos={eventos} onEditar={handleOpenModal} onVerDetalle={handleOpenDetalle} />
            }
          </div>
        )}

        {activeSection === 'metricas' && (
          <div className="sec"><Metricas eventos={eventos} /></div>
        )}

        {activeSection === 'config' && (
          <div className="sec">
            <Config config={config} updateConfig={updateConfig} addToast={addToast} productos={productos} categorias={categorias}
              empleados={empleados} saveEmpleado={saveEmpleado} toggleEmpleado={toggleEmpleado} deleteEmpleado={deleteEmpleado} askPin={askPin} />
          </div>
        )}

        {/* ── PEDIDOS ── */}
        {activeSection === 'pedidos' && (
          <Pedidos
            pedidos={pedidos}
            loading={pedidosLoading}
            onUpdateEstado={updateEstadoPedido}
            onCobrar={handleCobrarPedido}
            onAnular={handleAnularPedido}
          />
        )}

        {/* ── ASISTENCIA ── */}
        {activeSection === 'asistencia' && (
          <Asistencia empleados={empleados} />
        )}

        {/* ── VENTAS ── */}
        {activeSection === 'ventas' && (
          <Ventas
            ventas={ventas} loading={ventasLoading} cajaActual={cajaActual}
            onNueva={() => setTicketModalOpen(true)}
            onAnular={handleAnularVenta}
            fetchVentas={fetchVentas}
            empleados={empleados}
          />
        )}

        {activeSection === 'compras' && (
          <Compras
            compras={compras} loading={comprasLoading}
            onNueva={() => setCompraModalOpen(true)}
            onEditar={handleEditarCompra}
            onAnular={handleAnularCompra}
            proveedores={proveedores}
            onSaveProveedor={saveProveedor}
            onDeleteProveedor={deleteProveedor}
            addToast={addToast}
            askPin={askPin}
          />
        )}

        {activeSection === 'caja' && (
          <Caja
            cajasAbiertas={cajasAbiertas} historial={cajaHistorial} loading={cajaLoading}
            ventas={ventas} gastos={cajaGastos} empleados={empleados}
            onAbrir={handleAbrirCaja}
            onCerrar={handleCerrarCaja}
            onAddGasto={handleAddGasto}
            onAddCofreIngreso={handleAddCofreIngreso}
            addToast={addToast}
            askPin={askPin}
          />
        )}

        {activeSection === 'productos' && (
          <Productos
            productos={productos} categorias={categorias} loading={prodLoading}
            onNuevo={() => handleOpenProducto()}
            onEditar={handleOpenProducto}
            onEliminar={handleDeleteProducto}
            addToast={addToast}
            bulkUpdatePrecios={bulkUpdatePrecios}
          />
        )}

        {activeSection === 'reportes' && (
          <ReportesVentas ventas={ventas} />
        )}

        {activeSection === 'cofre' && (
          <Cofre
            movimientos={cofreMovimientos}
            saldo={cofreSaldo}
            loading={cofreLoading}
            onAddRetiro={addCofreMovimiento}
            empleados={empleados}
            askPin={askPin}
            addToast={addToast}
          />
        )}
      </div>

      {/* ── MODALS CUMPLEAÑOS ── */}
      {modalOpen && (
        <EventoModal
          evento={editingEvento} eventos={eventos} config={config} productos={productos}
          onSave={handleSave} onClose={() => setModalOpen(false)} addToast={addToast}
        />
      )}
      {detalleOpen && detalleEvento && (
        <DetalleModal
          evento={detalleEvento} config={config}
          onClose={() => setDetalleOpen(false)}
          onEditar={(id) => { setDetalleOpen(false); handleOpenModal(id) }}
          onAbrirCaja={handleAbrirCajaEvento}
          onFinalizar={handleAbrirFinalizar}
        />
      )}
      {finalizarEventoId && (
        <FinalizarEventoModal
          evento={eventos.find(e => e.id === finalizarEventoId)}
          cajasAbiertas={cajasAbiertas}
          config={config}
          onFinalizar={handleFinalizarEvento}
          onClose={() => setFinalizarEventoId(null)}
        />
      )}
      {cajaEvento && (
        <CajaEventoModal
          evento={cajaEvento}
          config={config}
          productos={productos}
          cajasAbiertas={cajasAbiertas}
          onClose={() => setCajaEventoId(null)}
          onGuardarConsumos={handleGuardarConsumos}
          onAplicarMenuStock={handleAplicarMenuStock}
          onDeshacerMenuStock={handleDeshacerMenuStock}
          onCobrar={handleCobrarAdicionales}
          onDeshacerCobro={handleDeshacerCobro}
          addToast={addToast}
        />
      )}

      {/* ── MODALS VENTAS ── */}
      {productoModalOpen && (
        <ProductoModal
          producto={editingProducto} productos={productos} categorias={categorias}
          onSave={handleSaveProducto} onClose={() => setProductoModalOpen(false)}
          addToast={addToast} onNuevaCat={saveCategoria}
        />
      )}

      {ticketModalOpen && (
        <TicketModal
          productos={productos}
          cajasAbiertas={cajasAbiertas}
          cajaSeleccionadaId={cajaSeleccionadaId}
          onCajaChange={setCajaSeleccionadaId}
          metodosPago={config.mets_caja}
          empleados={empleados}
          itemsIniciales={pedidoParaCobrar ? (pedidoParaCobrar.pedido_items || []).map(it => ({
            producto_id: it.producto_id || null,
            nombre_producto: it.nombre_producto,
            precio_unitario: it.precio_unitario || 0,
            cantidad: it.cantidad,
            subtotal: it.subtotal || 0,
            maneja_stock: true,
          })) : []}
          clienteInicial={pedidoParaCobrar?.nombre || ''}
          onSave={pedidoParaCobrar ? handleSaveVentaDesdePedido : handleSaveVenta}
          onClose={() => { setTicketModalOpen(false); setPedidoParaCobrar(null) }}
          addToast={addToast}
        />
      )}

      {(compraModalOpen || editingCompra) && (
        <CompraModal
          compra={editingCompra}
          productos={productos}
          proveedores={proveedores}
          metodosPago={config.mets_caja}
          onSave={handleSaveCompra}
          onClose={() => { setCompraModalOpen(false); setEditingCompra(null) }}
          addToast={addToast}
        />
      )}

      {pinModal.show && (
        <PinModal
          claves={config.claves || []}
          msg={pinModal.msg}
          onConfirm={pinModal.onConfirm}
          onCancel={() => setPinModal({ show: false, onConfirm: null, msg: '' })}
        />
      )}

      <div id="toast-cont">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </>
  )
}
