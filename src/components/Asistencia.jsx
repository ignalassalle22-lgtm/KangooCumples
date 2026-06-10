import React, { useState, useEffect, useMemo } from 'react'
import { useAsistencia } from '../hooks/useAsistencia'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['D','L','M','X','J','V','S']

// Genera opciones de mes/año desde 2024 hasta 2030
function generarOpciones() {
  const opts = []
  for (let a = 2024; a <= 2030; a++) {
    for (let m = 1; m <= 12; m++) {
      opts.push({ año: a, mes: m, label: `${MESES[m-1]} ${a}` })
    }
  }
  return opts
}

function diasEnMes(año, mes) {
  return new Date(año, mes, 0).getDate()
}

function fechaStr(año, mes, dia) {
  return `${año}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
}

function diaSemana(año, mes, dia) {
  return new Date(año, mes - 1, dia).getDay() // 0=Dom, 6=Sab
}

export default function Asistencia({ empleados = [] }) {
  const hoy = new Date()
  const [año, setAño] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const { asistencias, loading, fetchMes, toggleAsistencia } = useAsistencia()

  const opciones = useMemo(() => generarOpciones(), [])
  const empleadosActivos = useMemo(() => empleados.filter(e => e.activo !== false), [empleados])
  const totalDias = diasEnMes(año, mes)
  const dias = Array.from({ length: totalDias }, (_, i) => i + 1)

  // Límite: no marcar días futuros en el mes actual
  const esHoy = año === hoy.getFullYear() && mes === (hoy.getMonth() + 1)
  const diaLimite = esHoy ? hoy.getDate() : totalDias

  useEffect(() => { fetchMes(año, mes) }, [año, mes, fetchMes])

  function getPresente(empleadoId, dia) {
    const f = fechaStr(año, mes, dia)
    const r = asistencias.find(a => a.empleado_id === empleadoId && a.fecha === f)
    return r ? r.presente : false
  }

  function handleToggle(empleadoId, dia) {
    if (dia > diaLimite) return
    const f = fechaStr(año, mes, dia)
    const actual = getPresente(empleadoId, dia)
    toggleAsistencia(empleadoId, f, actual)
  }

  function handleSelectChange(val) {
    const [a, m] = val.split('-').map(Number)
    setAño(a); setMes(m)
  }

  // Stats por empleado
  function statsEmpleado(emp) {
    const diasContables = Math.min(totalDias, diaLimite)
    const presentes = dias.filter(d => d <= diaLimite && getPresente(emp.id, d)).length
    const pct = diasContables > 0 ? Math.round(presentes / diasContables * 100) : 0
    return { presentes, diasContables, pct }
  }

  // Stats globales
  const statsGlobal = useMemo(() => {
    if (empleadosActivos.length === 0) return { pct: 0, presentes: 0, total: 0 }
    const diasContables = Math.min(totalDias, diaLimite)
    let totalPresentes = 0
    empleadosActivos.forEach(emp => {
      totalPresentes += dias.filter(d => d <= diaLimite && getPresente(emp.id, d)).length
    })
    const total = empleadosActivos.length * diasContables
    const pct = total > 0 ? Math.round(totalPresentes / total * 100) : 0
    return { pct, presentes: totalPresentes, total }
  }, [asistencias, empleadosActivos, año, mes])

  const colorPct = pct => pct >= 80 ? '#1A7A45' : pct >= 50 ? '#A86200' : '#A32020'
  const bgPct    = pct => pct >= 80 ? '#E8F5EE' : pct >= 50 ? '#FFF3D4' : '#FDEAEA'

  return (
    <div className="sec">
      <div className="ph">
        <div>
          <div className="pt">Asistencia</div>
          <div className="ps">Presencialidad mensual del personal</div>
        </div>
      </div>

      {/* Selector de mes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select
          value={`${año}-${mes}`}
          onChange={e => handleSelectChange(e.target.value)}
          style={{ border: '1px solid var(--bd2)', borderRadius: 10, padding: '9px 14px', fontSize: 14, fontWeight: 700, color: 'var(--nv)', background: 'var(--wh)', cursor: 'pointer', minWidth: 180 }}
        >
          {opciones.map(o => (
            <option key={`${o.año}-${o.mes}`} value={`${o.año}-${o.mes}`}>{o.label}</option>
          ))}
        </select>

        {/* Resumen global */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: bgPct(statsGlobal.pct), borderRadius: 10, padding: '8px 16px', border: `1px solid ${colorPct(statsGlobal.pct)}33` }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: colorPct(statsGlobal.pct) }}>
              Presencialidad general: {statsGlobal.pct}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 600 }}>
              {statsGlobal.presentes} asistencias de {statsGlobal.total} esperadas
            </div>
          </div>
        </div>
      </div>

      {empleadosActivos.length === 0 ? (
        <div className="empty"><div className="emj">👥</div><p>No hay empleados activos. Cargalos desde Config.</p></div>
      ) : loading ? (
        <div className="empty"><div className="emj">⏳</div><p>Cargando...</p></div>
      ) : (
        <>
          {/* Tabla */}
          <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 12px rgba(27,58,107,0.09)', background: 'var(--wh)', border: '1px solid var(--bd)' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: `${200 + totalDias * 36 + 80}px` }}>
              <thead>
                {/* Fila días de semana */}
                <tr style={{ background: 'var(--nv3)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: 'var(--nv)', width: 180, minWidth: 180, borderRight: '2px solid var(--bd)' }}>
                    Empleado
                  </th>
                  {dias.map(d => {
                    const ds = diaSemana(año, mes, d)
                    const esFinDeSemana = ds === 0 || ds === 6
                    const esFuturo = d > diaLimite
                    return (
                      <th key={d} style={{
                        width: 36, minWidth: 36, textAlign: 'center', padding: '6px 2px',
                        borderRight: '1px solid var(--bd)',
                        background: esFinDeSemana ? 'rgba(232,98,26,0.08)' : undefined,
                        opacity: esFuturo ? 0.35 : 1,
                      }}>
                        <div style={{ fontSize: 10, color: esFinDeSemana ? 'var(--or)' : 'var(--mu)', fontWeight: 700 }}>
                          {DIAS_SEMANA[ds]}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--nv)' }}>{d}</div>
                      </th>
                    )
                  })}
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--nv)', width: 72, borderLeft: '2px solid var(--bd)' }}>
                    % Mes
                  </th>
                </tr>
              </thead>
              <tbody>
                {empleadosActivos.map((emp, idx) => {
                  const { presentes, diasContables, pct } = statsEmpleado(emp)
                  return (
                    <tr key={emp.id} style={{ background: idx % 2 === 0 ? 'var(--wh)' : 'var(--bg)', borderBottom: '1px solid var(--bd)' }}>
                      <td style={{ padding: '8px 16px', fontWeight: 700, fontSize: 13, color: 'var(--tx)', borderRight: '2px solid var(--bd)', whiteSpace: 'nowrap' }}>
                        {emp.nombre}
                      </td>
                      {dias.map(d => {
                        const ds = diaSemana(año, mes, d)
                        const esFinDeSemana = ds === 0 || ds === 6
                        const esFuturo = d > diaLimite
                        const presente = getPresente(emp.id, d)
                        return (
                          <td key={d} style={{
                            textAlign: 'center', padding: '4px 2px',
                            borderRight: '1px solid var(--bd)',
                            background: esFinDeSemana ? 'rgba(232,98,26,0.05)' : undefined,
                          }}>
                            <button
                              onClick={() => handleToggle(emp.id, d)}
                              disabled={esFuturo}
                              title={esFuturo ? 'Día futuro' : presente ? 'Presente — clic para marcar ausente' : 'Ausente — clic para marcar presente'}
                              style={{
                                width: 28, height: 28, borderRadius: 7,
                                border: presente ? 'none' : '1.5px solid var(--bd2)',
                                background: presente ? 'var(--gn)' : 'var(--wh)',
                                color: presente ? '#fff' : 'var(--mu2)',
                                fontSize: 14, cursor: esFuturo ? 'default' : 'pointer',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all .1s', opacity: esFuturo ? 0.3 : 1,
                                fontWeight: 900,
                              }}
                            >
                              {presente ? '✓' : ''}
                            </button>
                          </td>
                        )
                      })}
                      <td style={{ textAlign: 'center', padding: '8px 12px', borderLeft: '2px solid var(--bd)' }}>
                        <div style={{
                          display: 'inline-block', borderRadius: 8, padding: '4px 10px',
                          background: bgPct(pct), color: colorPct(pct),
                          fontSize: 13, fontWeight: 900,
                        }}>
                          {pct}%
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 2, fontWeight: 600 }}>
                          {presentes}/{diasContables}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Resumen por empleado */}
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {empleadosActivos.map(emp => {
              const { presentes, diasContables, pct } = statsEmpleado(emp)
              return (
                <div key={emp.id} style={{ background: 'var(--wh)', borderRadius: 12, padding: '14px 16px', boxShadow: '0 2px 8px rgba(27,58,107,0.08)', borderLeft: `4px solid ${colorPct(pct)}` }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--tx)', marginBottom: 6 }}>{emp.nombre}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: colorPct(pct) }}>{pct}%</span>
                    <span style={{ fontSize: 12, color: 'var(--mu)', fontWeight: 600 }}>{presentes} de {diasContables} días</span>
                  </div>
                  {/* Barra de progreso */}
                  <div style={{ height: 6, background: 'var(--bd)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: colorPct(pct), borderRadius: 3, transition: 'width .4s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
