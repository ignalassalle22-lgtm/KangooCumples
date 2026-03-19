import React, { useState, useCallback } from 'react'
import Topbar from './components/Topbar'
import EventosList from './components/EventosList'
import EventoModal from './components/EventoModal'
import DetalleModal from './components/DetalleModal'
import CalendarioSemana from './components/CalendarioSemana'
import CalendarioMes from './components/CalendarioMes'
import Metricas from './components/Metricas'
import Config from './components/Config'
import { useEventos } from './hooks/useEventos'
import { useConfig } from './hooks/useConfig'

export default function App() {
  const { eventos, loading, error, saveEvento, deleteEvento } = useEventos()
  const { config, updateConfig } = useConfig()

  const [activeSection, setActiveSection] = useState('eventos')
  const [modalOpen, setModalOpen] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [detalleId, setDetalleId] = useState(null)
  const [toasts, setToasts] = useState([])
  const [calView, setCalView] = useState('semana')

  const addToast = useCallback((msg, type = 'ok') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const handleOpenModal = useCallback((id = null) => {
    setEditingId(id)
    setModalOpen(true)
  }, [])

  const handleOpenDetalle = useCallback((id) => {
    setDetalleId(id)
    setDetalleOpen(true)
  }, [])

  const handleSave = useCallback(async (eventoData) => {
    try {
      await saveEvento(eventoData)
      setModalOpen(false)
      addToast(eventoData.id ? '✓ Evento actualizado correctamente' : '✓ Evento creado correctamente')
    } catch (e) {
      addToast('Error al guardar: ' + e.message, 'err')
      throw e
    }
  }, [saveEvento, addToast])

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('¿Eliminás este evento? Esta acción no se puede deshacer.')) return
    try {
      await deleteEvento(id)
      addToast('Evento eliminado', 'err')
    } catch (e) {
      addToast('Error al eliminar: ' + e.message, 'err')
    }
  }, [deleteEvento, addToast])

  const editingEvento = editingId ? eventos.find(e => e.id === editingId) : null
  const detalleEvento = detalleId ? eventos.find(e => e.id === detalleId) : null

  return (
    <>
      <Topbar
        activeSection={activeSection}
        onNav={setActiveSection}
        onNuevo={() => handleOpenModal()}
      />

      <div className="content">
        {error && (
          <div style={{ background: 'var(--rdb)', border: '1px solid rgba(163,32,32,.35)', borderRadius: 10, padding: '11px 16px', color: 'var(--rd)', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            ⚠ Supabase no configurado — trabajando en modo local. Completá el archivo .env con tus credenciales.
          </div>
        )}

        {activeSection === 'eventos' && (
          <div className="sec">
            <EventosList
              eventos={eventos}
              loading={loading}
              config={config}
              onEditar={handleOpenModal}
              onEliminar={handleDelete}
              onNuevo={() => handleOpenModal()}
              onVerDetalle={handleOpenDetalle}
            />
          </div>
        )}

        {activeSection === 'calendario' && (
          <div className="sec">
            <div className="ph">
              <div>
                <div className="pt">Calendario</div>
                <div className="ps">
                  {calView === 'semana' ? 'Próximos 7 días' : 'Vista mensual'}
                </div>
              </div>
              <button className="bp" onClick={() => handleOpenModal()}>＋ Nuevo evento</button>
            </div>
            <div className="cal-topbar">
              <div className="cal-view-toggle">
                <button
                  className={`cal-vbtn${calView === 'semana' ? ' active' : ''}`}
                  onClick={() => setCalView('semana')}
                >📋 Semana</button>
                <button
                  className={`cal-vbtn${calView === 'mes' ? ' active' : ''}`}
                  onClick={() => setCalView('mes')}
                >🗓 Mes</button>
              </div>
            </div>
            {calView === 'semana'
              ? <CalendarioSemana eventos={eventos} onEditar={handleOpenModal} onVerDetalle={handleOpenDetalle} />
              : <CalendarioMes eventos={eventos} onEditar={handleOpenModal} onVerDetalle={handleOpenDetalle} />
            }
          </div>
        )}

        {activeSection === 'metricas' && (
          <div className="sec">
            <Metricas eventos={eventos} />
          </div>
        )}

        {activeSection === 'config' && (
          <div className="sec">
            <Config config={config} updateConfig={updateConfig} addToast={addToast} />
          </div>
        )}
      </div>

      {modalOpen && (
        <EventoModal
          evento={editingEvento}
          eventos={eventos}
          config={config}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
          addToast={addToast}
        />
      )}

      {detalleOpen && detalleEvento && (
        <DetalleModal
          evento={detalleEvento}
          config={config}
          onClose={() => setDetalleOpen(false)}
          onEditar={(id) => { setDetalleOpen(false); handleOpenModal(id) }}
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
