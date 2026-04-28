import React from 'react'

const TABS_VENTAS = [
  { id: 'ventas',    label: '🧾 Ventas' },
  { id: 'compras',   label: '📥 Compras' },
  { id: 'caja',      label: '💰 Caja' },
  { id: 'productos', label: '📦 Productos' },
  { id: 'reportes',  label: '📊 Reportes' },
]

const TABS_CUMPLES = [
  { id: 'eventos',    label: '🎂 Eventos' },
  { id: 'calendario', label: '📅 Calendario' },
  { id: 'metricas',   label: '📈 Métricas' },
  { id: 'config',     label: '⚙️ Config' },
]

export default function Topbar({ activeSection, onNav, onNuevo, cajaActual }) {
  const isVentas = TABS_VENTAS.some(t => t.id === activeSection)

  return (
    <div className="topbar" style={{ height: 'auto', padding: '0 28px', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
      {/* Fila superior */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div className="logo-wrap">
          <div className="logo-emoji">🦘</div>
          <div className="logo-texts">
            <div className="logo-name">Kangoo<span>Cumples</span></div>
            <div className="logo-sub">Sistema de gestión</div>
          </div>
        </div>

        {/* Selector de módulo */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '4px 6px' }}>
          <button
            className={`nb${!isVentas ? ' on' : ''}`}
            onClick={() => onNav('eventos')}
            style={{ fontSize: 12, padding: '6px 16px' }}
          >🎂 Cumpleaños</button>
          <button
            className={`nb${isVentas ? ' on' : ''}`}
            onClick={() => onNav('ventas')}
            style={{ fontSize: 12, padding: '6px 16px' }}
          >🧾 Ventas</button>
        </div>

        {/* Acción rápida */}
        {!isVentas
          ? <button className="bp" onClick={onNuevo}>＋ Nuevo evento</button>
          : <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {cajaActual && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 8 }}>
                  🟢 Caja abierta {cajaActual.hora_apertura}
                </span>
              )}
            </div>
        }
      </div>

      {/* Fila inferior: tabs del módulo activo */}
      <div style={{ display: 'flex', gap: 2, paddingBottom: 0, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {(isVentas ? TABS_VENTAS : TABS_CUMPLES).map(t => (
          <button
            key={t.id}
            className={`nb${activeSection === t.id ? ' on' : ''}`}
            onClick={() => onNav(t.id)}
            style={{ fontSize: 12, padding: '8px 16px', borderRadius: '8px 8px 0 0' }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
