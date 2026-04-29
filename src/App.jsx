import React, { useState, useCallback, useEffect } from 'react'
import Topbar from './components/Topbar'

// Cumpleaños
import EventosList from './components/EventosList'
import EventoModal from './components/EventoModal'
import DetalleModal from './components/DetalleModal'
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
import { useProductos } from './hooks/useProductos'
import { useVentas } from './hooks/useVentas'
import { useCompras } from './hooks/useCompras'
import { useCaja } from './hooks/useCaja'

export default function App() {
  // ── Cumpleaños ──
  const { eventos, loading: evLoading, error, saveEvento, deleteEvento } = useEventos()
  const { config, updateConfig } = useConfig()

  // ── Ventas ──
  const { productos, categorias, loading: prodLoading, saveProducto, deleteProducto, updateStock, bulkUpdatePrecios, saveCategoria } = useProductos()
  const { ventas, loading: ventasLoading, fetchVentas, saveVenta, anularVenta } = useVentas()
  const { compras, loading: comprasLoading, saveCompra } = useCompras()
  const { cajasAbiertas, historial: cajaHistorial, loading: cajaLoading, abrirCaja, cerrarCaja } = useCaja()
  const cajaActual = cajasAbiertas[0] || null

  // Caja seleccionada para ventas: se persiste entre tickets, se limpia si la caja se cierra
  const [cajaSeleccionadaId, setCajaSeleccionadaId] = useState(null)
  useEffect(() => {
    const ids = cajasAbiertas.map(c => c.id)
    if (cajasAbiertas.length === 0) {
      setCajaSeleccionadaId(null)
    } else if (!cajaSeleccionadaId || !ids.includes(cajaSeleccionadaId)) {
      // Si la caja seleccionada se cerró o no hay ninguna, tomar la primera disponible
      setCajaSeleccionadaId(cajasAbiertas[0].id)
    }
  }, [cajasAbiertas])

  // ── UI State ──
  const [activeSection, setActiveSection] = useState('eventos')
  const [calView, setCalView] = useState('semana')

  // Modals cumpleaños
  const [modalOpen, setModalOpen] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [detalleId, setDetalleId] = useState(null)

  // Modals ventas
  const [productoModalOpen, setProductoModalOpen] = useState(false)
  const [editingProductoId, setEditingProductoId] = useState(null)
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [compraModalOpen, setCompraModalOpen] = useState(false)

  const [toasts, setToasts] = useState([])

  const addToast = useCallback((msg, type = 'ok') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  // ── Handlers cumpleaños ──
  const handleOpenModal = useCallback((id = null) => { setEditingId(id); setModalOpen(true) }, [])
  const handleOpenDetalle = useCallback((id) => { setDetalleId(id); setDetalleOpen(true) }, [])

  const handleSave = useCallback(async (eventoData) => {
    try {
      await saveEvento(eventoData)
      setModalOpen(false)
      addToast(eventoData.id ? '✓ Evento actualizado' : '✓ Evento creado')
    } catch (e) { addToast('Error: ' + e.message, 'err'); throw e }
  }, [saveEvento, addToast])

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('¿Eliminás este evento? Esta acción no se puede deshacer.')) return
    try { await deleteEvento(id); addToast('Evento eliminado', 'err') }
    catch (e) { addToast('Error: ' + e.message, 'err') }
  }, [deleteEvento, addToast])

  // ── Handlers productos ──
  const handleOpenProducto = useCallback((id = null) => { setEditingProductoId(id); setProductoModalOpen(true) }, [])

  const handleSaveProducto = useCallback(async (p) => {
    await saveProducto(p)
    setProductoModalOpen(false)
    addToast(p.id ? '✓ Producto actualizado' : '✓ Producto creado')
  }, [saveProducto, addToast])

  const handleDeleteProducto = useCallback(async (id) => {
    if (!window.confirm('¿Eliminás este producto?')) return
    try { await deleteProducto(id); addToast('Producto eliminado', 'err') }
    catch (e) { addToast('Error: ' + e.message, 'err') }
  }, [deleteProducto, addToast])

  // ── Handlers ventas ──
  const handleSaveVenta = useCallback(async (venta, items) => {
    await saveVenta(venta, items, updateStock)
    setTicketModalOpen(false)
    addToast('✓ Venta registrada correctamente')
  }, [saveVenta, updateStock, addToast])

  const handleAnularVenta = useCallback(async (id) => {
    try { await anularVenta(id, updateStock); addToast('Venta anulada') }
    catch (e) { addToast('Error: ' + e.message, 'err') }
  }, [anularVenta, updateStock, addToast])

  // ── Handlers compras ──
  const handleSaveCompra = useCallback(async (compra, items) => {
    await saveCompra(compra, items, updateStock)
    setCompraModalOpen(false)
    addToast('✓ Compra registrada · stock actualizado')
  }, [saveCompra, updateStock, addToast])

  // ── Handlers caja ──
  const handleAbrirCaja = useCallback(async ({ saldo_inicial, nombre, turno }) => {
    await abrirCaja({ saldo_inicial, nombre, turno })
  }, [abrirCaja])

  const handleCerrarCaja = useCallback(async ({ cajaId, ...datos }) => {
    await cerrarCaja({ cajaId, ...datos })
  }, [cerrarCaja])

  const editingEvento = editingId ? eventos.find(e => e.id === editingId) : null
  const detalleEvento = detalleId ? eventos.find(e => e.id === detalleId) : null
  const editingProducto = editingProductoId ? productos.find(p => p.id === editingProductoId) : null

  return (
    <>
      <Topbar
        activeSection={activeSection}
        onNav={setActiveSection}
        onNuevo={() => handleOpenModal()}
        cajaActual={cajaActual}
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
          <div className="sec"><Config config={config} updateConfig={updateConfig} addToast={addToast} /></div>
        )}

        {/* ── VENTAS ── */}
        {activeSection === 'ventas' && (
          <Ventas
            ventas={ventas} loading={ventasLoading} cajaActual={cajaActual}
            onNueva={() => setTicketModalOpen(true)}
            onAnular={handleAnularVenta}
            fetchVentas={fetchVentas}
          />
        )}

        {activeSection === 'compras' && (
          <Compras
            compras={compras} loading={comprasLoading}
            onNueva={() => setCompraModalOpen(true)}
          />
        )}

        {activeSection === 'caja' && (
          <Caja
            cajasAbiertas={cajasAbiertas} historial={cajaHistorial} loading={cajaLoading}
            ventas={ventas}
            onAbrir={handleAbrirCaja}
            onCerrar={handleCerrarCaja}
            addToast={addToast}
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
      </div>

      {/* ── MODALS CUMPLEAÑOS ── */}
      {modalOpen && (
        <EventoModal
          evento={editingEvento} eventos={eventos} config={config}
          onSave={handleSave} onClose={() => setModalOpen(false)} addToast={addToast}
        />
      )}
      {detalleOpen && detalleEvento && (
        <DetalleModal
          evento={detalleEvento} config={config}
          onClose={() => setDetalleOpen(false)}
          onEditar={(id) => { setDetalleOpen(false); handleOpenModal(id) }}
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
          onSave={handleSaveVenta}
          onClose={() => setTicketModalOpen(false)}
          addToast={addToast}
        />
      )}

      {compraModalOpen && (
        <CompraModal
          productos={productos}
          metodosPago={config.mets_caja}
          onSave={handleSaveCompra} onClose={() => setCompraModalOpen(false)}
          addToast={addToast}
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
