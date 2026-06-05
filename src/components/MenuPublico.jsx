import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const C = {
  or: '#E8621A', or2: '#F5874A',
  nv: '#1B3A6B', nv2: '#2B5299',
  bg: '#F5F3EF', wh: '#FFFFFF',
  tx: '#1B3A6B', mu: '#6B7A99', mu2: '#A8B3C8',
}

const fmt = n => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })

export default function MenuPublico() {
  const [cfg, setCfg] = useState(null)
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [cfgRes, prodRes, catRes] = await Promise.all([
          supabase.from('configuracion').select('valor').eq('clave', 'menu_digital').maybeSingle(),
          supabase.from('productos').select('*').eq('activo', true).order('nombre'),
          supabase.from('categorias').select('*').order('nombre'),
        ])

        if (!cfgRes.data?.valor) { setError('Menú no disponible.'); setLoading(false); return }
        const c = cfgRes.data.valor
        if (!c.activo) { setError('El menú digital no está activo en este momento.'); setLoading(false); return }

        setCfg(c)

        const ids = c.productosIds || []
        const prods = (prodRes.data || []).filter(p => ids.includes(p.id))
        const cats = catRes.data || []

        // Agrupar por categoría
        const mapa = {}
        for (const prod of prods) {
          const cat = cats.find(ct => ct.id === prod.categoria_id)
          const key = cat ? cat.nombre : 'Otros'
          if (!mapa[key]) mapa[key] = { nombre: key, items: [] }
          mapa[key].items.push(prod)
        }
        // Ordenar: categorías con nombre primero, "Otros" al final
        const ordenados = Object.values(mapa).sort((a, b) => {
          if (a.nombre === 'Otros') return 1
          if (b.nombre === 'Otros') return -1
          return a.nombre.localeCompare(b.nombre)
        })
        setGrupos(ordenados)
      } catch (e) {
        setError('Error al cargar el menú.')
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ textAlign: 'center', color: C.mu }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🦘</div>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>Cargando menú...</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ textAlign: 'center', color: C.mu, padding: '0 32px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 16 }}>{error}</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(150deg, ${C.nv} 0%, ${C.nv2} 55%, ${C.or} 100%)`,
        padding: '40px 24px 56px',
        textAlign: 'center',
      }}>
        {cfg.logoUrl
          ? <img src={cfg.logoUrl} alt="Logo" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: `3px solid rgba(255,255,255,0.4)`, display: 'block', margin: '0 auto 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }} />
          : <div style={{ width: 88, height: 88, borderRadius: '50%', background: C.or, border: `3px solid rgba(255,255,255,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, margin: '0 auto 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>🦘</div>
        }
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, fontFamily: "'Nunito', sans-serif", margin: '0 0 8px', letterSpacing: '-0.3px', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          {cfg.titulo || 'Menú'}
        </h1>
        {cfg.subtitulo && (
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, margin: 0, fontFamily: "'Nunito Sans', sans-serif" }}>
            {cfg.subtitulo}
          </p>
        )}
      </div>

      {/* Wave */}
      <div style={{ height: 28, background: `linear-gradient(150deg, ${C.nv} 0%, ${C.nv2} 55%, ${C.or} 100%)`, borderRadius: '0 0 32px 32px', marginTop: -1 }} />

      {/* Contenido */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 16px 64px' }}>
        {grupos.length === 0 && (
          <div style={{ textAlign: 'center', color: C.mu, padding: '48px 0' }}>
            <p style={{ fontFamily: "'Nunito Sans', sans-serif" }}>No hay productos en el menú por el momento.</p>
          </div>
        )}

        {grupos.map(grupo => (
          <div key={grupo.nombre} style={{ marginBottom: 36 }}>
            {/* Título de categoría */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.or} 0%, transparent 100%)` }} />
              <span style={{
                fontSize: 12, fontWeight: 800, color: C.or, letterSpacing: '.12em',
                textTransform: 'uppercase', fontFamily: "'Nunito', sans-serif",
                padding: '0 4px', whiteSpace: 'nowrap',
              }}>
                {grupo.nombre}
              </span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent 0%, ${C.or} 100%)` }} />
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grupo.items.map(prod => (
                <div key={prod.id} style={{
                  background: C.wh, borderRadius: 16, padding: '14px 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                  boxShadow: '0 2px 10px rgba(27,58,107,0.07)',
                  borderLeft: `4px solid ${C.or}`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.tx, fontFamily: "'Nunito', sans-serif", lineHeight: 1.3 }}>
                      {prod.nombre}
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 900, fontSize: 19, color: C.nv,
                    fontFamily: "'Nunito', sans-serif", whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {fmt(prod.precio_venta)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        background: C.nv, padding: '20px 16px',
        textAlign: 'center',
      }}>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: C.or2, fontSize: 15, marginBottom: 4 }}>
          🦘 {cfg.titulo}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontFamily: "'Nunito Sans', sans-serif" }}>
          Los precios pueden variar. Consultá en caja.
        </div>
      </div>
    </div>
  )
}
