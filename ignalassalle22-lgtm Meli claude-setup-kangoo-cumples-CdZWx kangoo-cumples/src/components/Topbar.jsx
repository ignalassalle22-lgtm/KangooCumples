import React from 'react'

const TABS = [
  { id: 'eventos', label: '🎂 Eventos' },
  { id: 'calendario', label: '📅 Calendario' },
  { id: 'metricas', label: '📊 Métricas' },
  { id: 'config', label: '💼 Datos de venta' },
]

export default function Topbar({ activeSection, onNav, onNuevo }) {
  return (
    <div className="topbar">
      <div className="logo-wrap">
        <div className="logo-emoji">🦘</div>
        <div className="logo-texts">
          <div className="logo-name">Kangoo<span>Cumples</span></div>
          <div className="logo-sub">Kangaroo Fun</div>
        </div>
      </div>
      <div className="nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`nb${activeSection === t.id ? ' on' : ''}`}
            onClick={() => onNav(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button className="bp" onClick={onNuevo}>＋ Nuevo evento</button>
    </div>
  )
}
