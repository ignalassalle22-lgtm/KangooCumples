import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { fmt } from '../utils'

const EMPTY_FORM = {
  reservante: '', telefono: '', cumple: '', edad: '',
  fecha: '', horaH: '', horaM: '00', horaLibre: '',
  salon: '', tipo: '',
  chi: 0, adu: 0,
  privado: false, obs: '',
  promoId: '',
  pago: 'none', monto: 0, met: '',
  extendido: false,
}

function addMinutesToHora(hora, mins) {
  if (!hora || !/^\d{1,2}:\d{2}$/.test(hora)) return ''
  const [hh, mm] = hora.split(':').map(Number)
  const total = hh * 60 + mm + mins
  const rh = Math.floor(total / 60) % 24
  const rm = total % 60
  return String(rh).padStart(2, '0') + ':' + String(rm).padStart(2, '0')
}

// Compute hora string from form fields
function getHora(form) {
  const libre = form.horaLibre.trim()
  if (libre && /^\d{1,2}:\d{2}$/.test(libre)) return libre
  if (form.horaH) return form.horaH + ':' + form.horaM
  return ''
}

export default function EventoModal({ evento, eventos, config, onSave, onClose, addToast }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [mrows, setMrows] = useState([]) // [{rid, mid, qty}]
  const [extraQtys, setExtraQtys] = useState({}) // {eid: qty}
  const [saving, setSaving] = useState(false)

  // Populate form from evento
  useEffect(() => {
    if (evento) {
      const [hh, mm] = (evento.hora || '').split(':')
      const stdMins = ['00', '15', '30', '45']
      const isStdMin = stdMins.includes(mm)
      setForm({
        reservante: evento.reservante || '',
        telefono: evento.telefono || '',
        cumple: evento.cumple || '',
        edad: evento.edad || '',
        fecha: evento.fecha || '',
        horaH: hh || '',
        horaM: isStdMin ? mm : '00',
        horaLibre: !isStdMin && mm ? (evento.hora || '') : '',
        salon: evento.salon || '',
        tipo: evento.tipo || '',
        chi: evento.chi || 0,
        adu: evento.adu || 0,
        privado: evento.privado || false,
        obs: evento.obs || '',
        promoId: evento.promoId ? String(evento.promoId) : '',
        pago: evento.pago || 'none',
        monto: evento.monto || 0,
        met: evento.met || '',
        extendido: evento.extendido || false,
      })
      // Restore menu rows
      const rows = (evento.mrows || []).map(r => ({ rid: Date.now() + Math.random(), mid: String(r.mid), qty: r.qty || 1 }))
      setMrows(rows.length > 0 ? rows : [{ rid: Date.now(), mid: '', qty: 1 }])
      // Restore extra quantities
      const qtys = {}
      ;(evento.extras || []).forEach(e => { qtys[String(e.eid)] = e.qty || 0 })
      setExtraQtys(qtys)
    } else {
      setForm(EMPTY_FORM)
      setMrows([{ rid: Date.now(), mid: '', qty: 1 }])
      setExtraQtys({})
    }
  }, [evento])

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  // Menu row handlers
  const addMRow = () => setMrows(prev => [...prev, { rid: Date.now() + Math.random(), mid: '', qty: 1 }])
  const removeMRow = rid => setMrows(prev => prev.filter(r => r.rid !== rid))
  const updateMRow = (rid, field, val) => setMrows(prev => prev.map(r => r.rid === rid ? { ...r, [field]: val } : r))

  // Extra quantity handler
  const setExtraQty = (eid, qty) => setExtraQtys(prev => ({ ...prev, [String(eid)]: parseInt(qty) || 0 }))

  // Computed totals
  const calc = useMemo(() => {
    const chi = parseInt(form.chi) || 0
    const adu = parseInt(form.adu) || 0
    const base = chi * (config.pChico || 0) + adu * (config.pAdulto || 0)
    const mTot = 0
    const eTot = Object.entries(extraQtys).reduce((acc, [eid, qty]) => {
      const ex = config.extras.find(x => String(x.id) === String(eid))
      return acc + (ex ? ex.p * (qty || 0) : 0)
    }, 0)
    let dto = 0
    if (form.promoId) {
      const pr = config.promos.find(p => String(p.id) === String(form.promoId))
      if (pr) dto = (base + mTot + eTot) * pr.pct / 100
    }
    const total = base + mTot + eTot - dto
    const monto = parseFloat(form.monto) || 0
    return { base, mTot, eTot, dto, total, monto, rest: Math.max(0, total - monto) }
  }, [form.chi, form.adu, form.promoId, form.monto, extraQtys, config])

  // Duplicate check
  const dupAlert = useMemo(() => {
    const hora = getHora(form)
    if (!form.fecha || !hora || !form.salon) return false
    const key = form.fecha + 'T' + hora
    return eventos.some(ev => (ev.fecha + 'T' + ev.hora) === key && ev.salon === form.salon && ev.id !== evento?.id)
  }, [form.fecha, form.horaH, form.horaM, form.horaLibre, form.salon, eventos, evento])

  // Menu qty mismatch
  const menuAlert = useMemo(() => {
    const chi = parseInt(form.chi) || 0
    if (chi === 0) return null
    const total = mrows.reduce((acc, r) => acc + (parseInt(r.qty) || 0), 0)
    if (total === chi) return null
    const diff = chi - total
    return diff > 0
      ? `⚠ Faltan ${diff} menú${diff !== 1 ? 's' : ''}: tenés ${total} asignado${total !== 1 ? 's' : ''} para ${chi} chico${chi !== 1 ? 's' : ''}.`
      : `⚠ Sobran ${Math.abs(diff)} menú${Math.abs(diff) !== 1 ? 's' : ''}: tenés ${total} asignado${total !== 1 ? 's' : ''} para ${chi} chico${chi !== 1 ? 's' : ''}.`
  }, [form.chi, mrows])

  const handleSave = async () => {
    const hora = getHora(form)
    if (!form.fecha || !hora || !form.salon) {
      addToast('Completá fecha, horario y salón.', 'err')
      return
    }
    if (dupAlert) {
      addToast('Duplicado: ya existe un evento con esa fecha, hora y salón.', 'err')
      return
    }
    const chi = parseInt(form.chi) || 0
    if (chi > 0 && menuAlert) {
      addToast('La cantidad de menús no coincide con los chicos. Corregila antes de guardar.', 'err')
      return
    }

    const mrowsSave = mrows.filter(r => r.mid).map(r => ({ mid: r.mid, qty: parseInt(r.qty) || 0 }))
    const extrasSave = Object.entries(extraQtys)
      .filter(([, qty]) => qty > 0)
      .map(([eid, qty]) => ({ eid, qty }))

    const horaHasta = addMinutesToHora(hora, form.extendido ? 180 : 150)

    const ev = {
      id: evento?.id,
      fecha: form.fecha,
      hora,
      hora_hasta: horaHasta,
      extendido: form.extendido,
      salon: form.salon,
      tipo: form.tipo,
      reservante: form.reservante.trim(),
      telefono: form.telefono.trim(),
      cumple: form.cumple.trim(),
      edad: form.edad.trim(),
      privado: form.privado,
      chi: parseInt(form.chi) || 0,
      adu: parseInt(form.adu) || 0,
      mrows: mrowsSave,
      extras: extrasSave,
      promoId: form.promoId || null,
      obs: form.obs,
      pago: form.pago,
      monto: parseFloat(form.monto) || 0,
      met: form.met,
      total: calc.total,
    }

    setSaving(true)
    try {
      await onSave(ev)
    } catch {
      // onSave already calls addToast on error
    } finally {
      setSaving(false)
    }
  }

  const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

  return (
    <div className="ov op" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="mo">
        {/* Header */}
        <div className="moh">
          <div className="mot">
            <div className="mot-icon">🎂</div>
            <span>{evento ? 'Editar cumpleaños' : 'Nuevo cumpleaños'}</span>
          </div>
          <button className="xcl" onClick={onClose}>✕</button>
        </div>

        {dupAlert && (
          <div className="adp show">Ya existe un evento en ese salón, fecha y horario. Por favor verificá los datos.</div>
        )}

        {/* Datos del reservante */}
        <div className="sdv">Datos del reservante</div>
        <div className="fg" style={{ marginBottom: 14 }}>
          <div className="fgg">
            <label>Nombre del reservante</label>
            <input type="text" value={form.reservante} onChange={e => set('reservante', e.target.value)} placeholder="Ej: María González" />
          </div>
          <div className="fgg">
            <label>Teléfono de contacto</label>
            <input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="Ej: 11 4523-8877" />
          </div>
          <div className="fgg">
            <label>Nombre del cumpleañero/a</label>
            <input type="text" value={form.cumple} onChange={e => set('cumple', e.target.value)} placeholder="Ej: Juanito" />
          </div>
          <div className="fgg">
            <label>Edad que cumple</label>
            <input type="number" value={form.edad} onChange={e => set('edad', e.target.value)} min={1} max={18} placeholder="Ej: 6" />
          </div>
        </div>

        {/* Datos del evento */}
        <div className="sdv">Datos del evento</div>
        <div className="fg" style={{ marginBottom: 14 }}>
          <div className="fgg">
            <label>Fecha</label>
            <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
          </div>
          <div className="fgg" style={{ gridColumn: '1/-1' }}>
            <label>Horario</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--mu)', fontWeight: 700, minWidth: 38 }}>Desde</span>
              <select value={form.horaH} onChange={e => set('horaH', e.target.value)} style={{ flex: 1, minWidth: 60 }}>
                <option value="">HH</option>
                {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <span style={{ color: 'var(--mu)', fontWeight: 700 }}>:</span>
              <select value={form.horaM} onChange={e => set('horaM', e.target.value)} style={{ flex: 1, minWidth: 60 }}>
                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input
                type="text"
                value={form.horaLibre}
                onChange={e => set('horaLibre', e.target.value)}
                placeholder="o escribí HH:MM"
                style={{ flex: 1.4, fontSize: 13, minWidth: 100 }}
                title="También podés escribir la hora manualmente, ej: 14:30"
              />
              {getHora(form) && (
                <>
                  <span style={{ fontSize: 12, color: 'var(--mu)', fontWeight: 700, minWidth: 28 }}>Hasta</span>
                  <span style={{
                    padding: '7px 14px', borderRadius: 8,
                    background: 'var(--bg2, #f0f0f0)', fontWeight: 700,
                    fontSize: 15, color: 'var(--nv)', border: '1.5px solid var(--bd2)',
                    minWidth: 64, textAlign: 'center'
                  }}>
                    {addMinutesToHora(getHora(form), form.extendido ? 180 : 150)}
                  </span>
                </>
              )}
            </div>
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={() => set('extendido', !form.extendido)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '7px 18px', borderRadius: 22,
                  border: `1.5px solid ${form.extendido ? 'var(--nv)' : 'var(--bd2)'}`,
                  background: form.extendido ? 'var(--nv3)' : 'var(--wh)',
                  color: form.extendido ? 'var(--nv)' : 'var(--mu)',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  fontFamily: "'Nunito', sans-serif", transition: 'all .2s',
                }}
              >
                <span style={{ fontSize: 16 }}>{form.extendido ? '⏱' : '⏱'}</span>
                <span>{form.extendido ? 'Extendido (3 hs)' : 'Extendido'}</span>
              </button>
              <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--mu)' }}>
                {form.extendido ? '+30 min adicionales' : 'Duración estándar: 2:30 hs'}
              </span>
            </div>
          </div>
          <div className="fgg">
            <label>Salón</label>
            <select value={form.salon} onChange={e => set('salon', e.target.value)}>
              <option value="">Seleccionar...</option>
              {config.salones.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="fgg">
            <label>Tipo de evento</label>
            <select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="saltos">Saltos</option>
              <option value="parque">Parque aéreo</option>
              <option value="saltos+parque">Saltos + Parque aéreo</option>
            </select>
          </div>
          <div className="fgg">
            <label>Cantidad de chicos</label>
            <input type="number" value={form.chi} min={0} onChange={e => set('chi', e.target.value)} />
          </div>
          <div className="fgg">
            <label>Cantidad de adultos</label>
            <input type="number" value={form.adu} min={0} onChange={e => set('adu', e.target.value)} />
          </div>
          <div className="fgg" style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--mu)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5, fontFamily: "'Nunito', sans-serif" }}>
                Evento privado
              </label>
              <button
                type="button"
                onClick={() => set('privado', !form.privado)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 22,
                  border: `1.5px solid ${form.privado ? 'var(--nv)' : 'var(--bd2)'}`,
                  background: form.privado ? 'var(--nv3)' : 'var(--wh)',
                  color: form.privado ? 'var(--nv)' : 'var(--mu)',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  fontFamily: "'Nunito', sans-serif", transition: 'all .2s',
                }}
              >
                <span style={{ fontSize: 16 }}>{form.privado ? '🔒' : '🔓'}</span>
                <span>{form.privado ? 'Evento privado' : 'Abierto al público'}</span>
              </button>
            </div>
            <div style={{ flex: 2, minWidth: 200 }} className="fgg">
              <label>Observaciones</label>
              <textarea
                value={form.obs}
                onChange={e => set('obs', e.target.value)}
                placeholder="Alergias, pedidos especiales, decoración, referencias del festejado..."
                style={{ minHeight: 52 }}
              />
            </div>
          </div>
        </div>

        {/* Menús */}
        <div className="sdv">Menús por chico</div>
        <div className="mrc">
          {mrows.map(r => (
            <div key={r.rid} className="mr">
              <select
                value={r.mid}
                onChange={e => updateMRow(r.rid, 'mid', e.target.value)}
              >
                <option value="">Seleccionar menú...</option>
                {config.menus.map(m => (
                  <option key={m.id} value={String(m.id)}>{m.n}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={r.qty}
                onChange={e => updateMRow(r.rid, 'qty', e.target.value)}
                placeholder="Cant."
              />
              <button className="bdng" style={{ padding: '5px 10px' }} onClick={() => removeMRow(r.rid)}>✕</button>
            </div>
          ))}
        </div>
        <button className="bg2 bsm" style={{ marginTop: 10 }} onClick={addMRow}>+ Agregar fila de menú</button>

        {menuAlert && (
          <div className="adp show" style={{ marginTop: 10 }}>{menuAlert}</div>
        )}

        {/* Promoción */}
        <div className="sdv">Promoción aplicable</div>
        <div className="fg" style={{ marginBottom: 6 }}>
          <div className="fgg">
            <label>Seleccionar promoción</label>
            <select value={form.promoId} onChange={e => set('promoId', e.target.value)}>
              <option value="">Sin promoción</option>
              {config.promos.map(p => (
                <option key={p.id} value={String(p.id)}>{p.d} ({p.pct}%)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Estado de pago */}
        <div className="sdv">Estado del pago</div>
        <div className="popt">
          {['none', 'sena', 'paid'].map(v => {
            const labels = { none: '✗ Sin pago', sena: '◑ Dejó seña', paid: '✓ Pagado completo' }
            const isActive = form.pago === v
            return (
              <div
                key={v}
                className={`rp${isActive ? ` s${v}` : ''}`}
                onClick={() => set('pago', v)}
              >
                {labels[v]}
              </div>
            )
          })}
        </div>

        {form.pago !== 'none' && (
          <div>
            <div className="fg" style={{ marginBottom: 10 }}>
              <div className="fgg">
                <label>Monto abonado / seña ($)</label>
                <input type="number" min={0} value={form.monto} onChange={e => set('monto', e.target.value)} />
              </div>
              <div className="fgg">
                <label>Método de pago</label>
                <select value={form.met} onChange={e => set('met', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {config.mets.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Extras */}
        <div className="sdv">Extras</div>
        <div className="mrc">
          {config.extras.map(ex => {
            const qty = extraQtys[String(ex.id)] || 0
            const sub = ex.p * qty
            return (
              <div key={ex.id} className="mr">
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nv)' }}>{ex.n}</div>
                <div style={{ fontSize: 12, color: 'var(--mu)', textAlign: 'right' }}>{fmt(ex.p)} c/u</div>
                <input
                  type="number"
                  min={0}
                  value={qty}
                  onChange={e => setExtraQty(ex.id, e.target.value)}
                  style={{ width: 70, textAlign: 'center' }}
                />
                <div className="mrp">{sub > 0 ? fmt(sub) : '$0'}</div>
              </div>
            )
          })}
        </div>
        <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 6 }}>
          Los extras se cargan desde <b>Datos de venta</b>. Ingresá la cantidad de cada ítem a cobrar.
        </div>

        {/* Total box */}
        <div className="tb">
          <div className="tr"><span className="tl">Precio base (chicos + adultos)</span><span className="tv">{fmt(calc.base)}</span></div>
          {calc.eTot > 0 && (
            <div className="tr"><span className="tl">Extras</span><span className="tv">{fmt(calc.eTot)}</span></div>
          )}
          {calc.dto > 0 && (
            <div className="tr">
              <span className="tl">Descuento por promoción</span>
              <span className="tv" style={{ color: 'var(--or2)' }}>-{fmt(calc.dto)}</span>
            </div>
          )}
          <hr className="tsep" />
          <div className="tr big"><span className="tl">Total del evento</span><span className="tv">{fmt(calc.total)}</span></div>
          {form.pago !== 'none' && (
            <>
              <div className="tr"><span className="tl">Abonado / seña</span><span className="tv">{fmt(calc.monto)}</span></div>
              <div className="tr">
                <span className="tl" style={{ color: 'rgba(255,255,255,0.75)' }}>Restante a cobrar</span>
                <span className="tv" style={{ color: '#FFD166', fontSize: 18 }}>{fmt(calc.rest)}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="bg2" onClick={onClose}>Cancelar</button>
          <button className="bp" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : '💾 Guardar evento'}
          </button>
        </div>
      </div>
    </div>
  )
}
