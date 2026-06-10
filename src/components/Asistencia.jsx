import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAsistencia } from '../hooks/useAsistencia'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['D','L','M','X','J','V','S']
const AÑOS = Array.from({ length: 7 }, (_, i) => 2024 + i) // 2024-2030

function diasEnMes(año, mes) { return new Date(año, mes, 0).getDate() }
function fechaStr(año, mes, dia) {
  return `${año}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
}
function diaSemana(año, mes, dia) { return new Date(año, mes - 1, dia).getDay() }

const ESTADO_CICLO   = { null: 'presente', presente: 'vacaciones', vacaciones: null }
const ESTADO_LABEL   = { presente: '✓', vacaciones: '🏖' }
const ESTADO_BG      = { presente: '#1A7A45', vacaciones: '#2B5299' }
const ESTADO_COLOR   = { presente: '#fff', vacaciones: '#fff' }
const ESTADO_TITLE   = { null: 'Ausente · clic → Presente', presente: 'Presente · clic → Vacaciones', vacaciones: 'Vacaciones · clic → Ausente' }

export default function Asistencia({ empleados = [] }) {
  const hoy = new Date()
  const [año, setAño] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const { asistencias, observaciones, loading, fetchMes, toggleAsistencia, saveObs } = useAsistencia()

  const empleadosActivos = useMemo(() => empleados.filter(e => e.activo !== false), [empleados])
  const totalDias = diasEnMes(año, mes)
  const dias = Array.from({ length: totalDias }, (_, i) => i + 1)
  const esActual = año === hoy.getFullYear() && mes === (hoy.getMonth() + 1)
  const diaLimite = esActual ? hoy.getDate() : totalDias

  useEffect(() => { fetchMes(año, mes) }, [año, mes, fetchMes])

  function getEstado(empleadoId, dia) {
    const f = fechaStr(año, mes, dia)
    const r = asistencias.find(a => a.empleado_id === empleadoId && a.fecha === f)
    return r?.estado ?? null
  }

  function getObs(empleadoId) {
    return observaciones.find(o => o.empleado_id === empleadoId && o.año === año && o.mes === mes)?.obs || ''
  }

  function handleToggle(empleadoId, dia) {
    if (dia > diaLimite) return
    const f = fechaStr(año, mes, dia)
    const actual = getEstado(empleadoId, dia)
    toggleAsistencia(empleadoId, f, actual)
  }

  // Stats por empleado: vacaciones no cuentan como ausencia
  function statsEmpleado(emp) {
    const diasContables = Math.min(totalDias, diaLimite)
    let presentes = 0, vacacs = 0
    dias.forEach(d => {
      if (d > diaLimite) return
      const e = getEstado(emp.id, d)
      if (e === 'presente') presentes++
      if (e === 'vacaciones') vacacs++
    })
    const base = diasContables - vacacs
    const pct = base > 0 ? Math.round(presentes / base * 100) : 100
    return { presentes, vacacs, diasContables, base, pct }
  }

  const statsGlobal = useMemo(() => {
    if (!empleadosActivos.length) return { pct: 0, presentes: 0, base: 0 }
    let totalPresentes = 0, totalBase = 0
    empleadosActivos.forEach(emp => {
      const s = statsEmpleado(emp)
      totalPresentes += s.presentes
      totalBase += s.base
    })
    return { pct: totalBase > 0 ? Math.round(totalPresentes / totalBase * 100) : 0, presentes: totalPresentes, base: totalBase }
  }, [asistencias, empleadosActivos, año, mes])

  const colorPct = p => p >= 80 ? '#1A7A45' : p >= 50 ? '#A86200' : '#A32020'
  const bgPct    = p => p >= 80 ? '#E8F5EE' : p >= 50 ? '#FFF3D4' : '#FDEAEA'

  const [obsEditing, setObsEditing] = useState({}) // {empleadoId: texto}

  const handleObsChange = useCallback((empId, val) => {
    setObsEditing(prev => ({ ...prev, [empId]: val }))
  }, [])

  const handleObsBlur = useCallback((empId) => {
    const val = obsEditing[empId]
    if (val !== undefined) saveObs(empId, año, mes, val)
  }, [obsEditing, año, mes, saveObs])

  // Inicializar obsEditing cuando cambia el mes
  useEffect(() => { setObsEditing({}) }, [año, mes])

  return (
    <div className="sec">
      <div className="ph">
        <div>
          <div className="pt">Asistencia</div>
          <div className="ps">Presencialidad mensual del personal</div>
        </div>
      </div>

      {/* Selectores de mes/año */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select
          value={mes}
          onChange={e => setMes(Number(e.target.value))}
          style={{ border: '1px solid var(--bd2)', borderRadius: 10, padding: '9px 14px', fontSize: 14, fontWeight: 700, color: 'var(--nv)', background: 'var(--wh)', cursor: 'pointer', minWidth: 140 }}
        >
          {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select
          value={año}
          onChange={e => setAño(Number(e.target.value))}
          style={{ border: '1px solid var(--bd2)', borderRadius: 10, padding: '9px 14px', fontSize: 14, fontWeight: 700, color: 'var(--nv)', background: 'var(--wh)', cursor: 'pointer', minWidth: 100 }}
        >
          {AÑOS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Resumen global */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: bgPct(statsGlobal.pct), borderRadius: 10, padding: '8px 16px', border: `1px solid ${colorPct(statsGlobal.pct)}33` }}>
          <span style={{ fontSize: 16 }}>📊</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: colorPct(statsGlobal.pct) }}>Presencialidad general: {statsGlobal.pct}%</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 600 }}>{statsGlobal.presentes} asistencias de {statsGlobal.base} días hábiles</div>
          </div>
        </div>

        {/* Leyenda */}
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {[['#fff','var(--bd2)','','Ausente'],['#1A7A45','#1A7A45','✓','Presente'],['#2B5299','#2B5299','🏖','Vacaciones']].map(([bg, border, icon, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--mu)', fontWeight: 600 }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: bg, border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: bg === '#fff' ? 'transparent' : '#fff' }}>{icon}</div>
              {label}
            </div>
          ))}
        </div>
      </div>

      {empleadosActivos.length === 0 ? (
        <div className="empty"><div className="emj">👥</div><p>No hay empleados activos. Cargalos desde Config.</p></div>
      ) : loading ? (
        <div className="empty"><div className="emj">⏳</div><p>Cargando...</p></div>
      ) : (
        <>
          {/* Tabla de asistencia */}
          <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 12px rgba(27,58,107,0.09)', background: 'var(--wh)', border: '1px solid var(--bd)' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: `${200 + totalDias * 36 + 80}px` }}>
              <thead>
                <tr style={{ background: 'var(--nv3)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: 'var(--nv)', width: 180, minWidth: 180, borderRight: '2px solid var(--bd)' }}>
                    Empleado
                  </th>
                  {dias.map(d => {
                    const ds = diaSemana(año, mes, d)
                    const esFind = ds === 0 || ds === 6
                    const esFut = d > diaLimite
                    return (
                      <th key={d} style={{ width: 36, minWidth: 36, textAlign: 'center', padding: '6px 2px', borderRight: '1px solid var(--bd)', background: esFind ? 'rgba(232,98,26,0.08)' : undefined, opacity: esFut ? 0.35 : 1 }}>
                        <div style={{ fontSize: 10, color: esFind ? 'var(--or)' : 'var(--mu)', fontWeight: 700 }}>{DIAS_SEMANA[ds]}</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--nv)' }}>{d}</div>
                      </th>
                    )
                  })}
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--nv)', width: 80, borderLeft: '2px solid var(--bd)' }}>
                    % Mes
                  </th>
                </tr>
              </thead>
              <tbody>
                {empleadosActivos.map((emp, idx) => {
                  const { presentes, vacacs, base, pct } = statsEmpleado(emp)
                  return (
                    <tr key={emp.id} style={{ background: idx % 2 === 0 ? 'var(--wh)' : 'var(--bg)', borderBottom: '1px solid var(--bd)' }}>
                      <td style={{ padding: '8px 16px', fontWeight: 700, fontSize: 13, color: 'var(--tx)', borderRight: '2px solid var(--bd)', whiteSpace: 'nowrap' }}>
                        {emp.nombre}
                      </td>
                      {dias.map(d => {
                        const ds = diaSemana(año, mes, d)
                        const esFind = ds === 0 || ds === 6
                        const esFut = d > diaLimite
                        const estado = getEstado(emp.id, d)
                        return (
                          <td key={d} style={{ textAlign: 'center', padding: '4px 2px', borderRight: '1px solid var(--bd)', background: esFind ? 'rgba(232,98,26,0.05)' : undefined }}>
                            <button
                              onClick={() => handleToggle(emp.id, d)}
                              disabled={esFut}
                              title={ESTADO_TITLE[estado ?? 'null']}
                              style={{
                                width: 28, height: 28, borderRadius: 7,
                                border: estado ? 'none' : '1.5px solid var(--bd2)',
                                background: estado ? ESTADO_BG[estado] : 'var(--wh)',
                                color: estado ? ESTADO_COLOR[estado] : 'transparent',
                                fontSize: estado === 'vacaciones' ? 13 : 15,
                                cursor: esFut ? 'default' : 'pointer',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all .12s', opacity: esFut ? 0.25 : 1,
                                fontWeight: 900,
                              }}
                            >
                              {estado ? ESTADO_LABEL[estado] : ''}
                            </button>
                          </td>
                        )
                      })}
                      <td style={{ textAlign: 'center', padding: '8px 10px', borderLeft: '2px solid var(--bd)' }}>
                        <div style={{ display: 'inline-block', borderRadius: 8, padding: '4px 10px', background: bgPct(pct), color: colorPct(pct), fontSize: 13, fontWeight: 900 }}>
                          {pct}%
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 2, fontWeight: 600 }}>
                          {presentes}/{base}d
                          {vacacs > 0 && <span style={{ color: '#2B5299' }}> · {vacacs}🏖</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Observaciones por empleado */}
          <div style={{ marginTop: 28 }}>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--nv)', marginBottom: 14 }}>
              📝 Observaciones del mes
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {empleadosActivos.map(emp => {
                const val = obsEditing[emp.id] !== undefined ? obsEditing[emp.id] : getObs(emp.id)
                const { presentes, vacacs, base, pct } = statsEmpleado(emp)
                return (
                  <div key={emp.id} style={{ background: 'var(--wh)', borderRadius: 12, padding: '14px 16px', boxShadow: '0 2px 8px rgba(27,58,107,0.08)', borderLeft: `4px solid ${colorPct(pct)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--tx)' }}>{emp.nombre}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: colorPct(pct) }}>{pct}%</span>
                        <span style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 600 }}>{presentes}/{base}d{vacacs > 0 ? ` · ${vacacs}🏖` : ''}</span>
                      </div>
                    </div>
                    {/* Barra */}
                    <div style={{ height: 5, background: 'var(--bd)', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: colorPct(pct), borderRadius: 3, transition: 'width .4s' }} />
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Ej: Ausente 3 días por enfermedad, presentó certificado médico..."
                      value={val}
                      onChange={e => handleObsChange(emp.id, e.target.value)}
                      onBlur={() => handleObsBlur(emp.id)}
                      style={{ width: '100%', border: '1px solid var(--bd2)', borderRadius: 8, padding: '8px 10px', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', color: 'var(--tx)', background: 'var(--bg)', boxSizing: 'border-box' }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
