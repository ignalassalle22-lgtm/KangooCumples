import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const C = {
  or: '#E8621A', or2: '#F5874A', or3: '#FFF3EB',
  nv: '#1B3A6B', nv2: '#2B5299',
  bg: '#F7F4F0', wh: '#FFFFFF',
  tx: '#1B3A6B', mu: '#6B7A99',
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
        if (!c.activo) { setError('El menú no está disponible en este momento.'); setLoading(false); return }

        setCfg(c)

        const ids = c.productosIds || []
        const prods = (prodRes.data || []).filter(p => ids.includes(p.id))
        const cats = catRes.data || []

        const mapa = {}
        for (const prod of prods) {
          const cat = cats.find(ct => ct.id === prod.categoria_id)
          const key = cat ? cat.nombre : 'Otros'
          if (!mapa[key]) mapa[key] = { nombre: key, items: [] }
          mapa[key].items.push(prod)
        }
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

  const logoSrc = cfg?.logoUrl || '/logo.jpg'

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/logo.jpg" alt="Kangaroo Fun" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: 20, opacity: 0.8 }} />
        <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: C.mu, fontSize: 15 }}>Cargando menú...</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ textAlign: 'center', padding: '0 32px' }}>
        <img src="/logo.jpg" alt="Kangaroo Fun" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: 20, opacity: 0.6 }} />
        <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: C.mu, fontSize: 15 }}>{error}</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, overflowX: 'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{ position: 'relative', background: C.or, overflow: 'hidden', paddingBottom: 32 }}>

        {/* Círculos decorativos de fondo */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(27,58,107,0.15)', pointerEvents: 'none' }} />

        {/* Barra superior azul */}
        <div style={{ background: C.nv, height: 8, width: '100%' }} />

        <div style={{ textAlign: 'center', padding: '28px 24px 0' }}>
          {/* Logo */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
            <div style={{
              width: 110, height: 110, borderRadius: '50%',
              background: C.wh,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
              border: `4px solid ${C.nv}`,
              overflow: 'hidden',
            }}>
              <img
                src={logoSrc}
                alt="Kangaroo Fun"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none' }}
              />
            </div>
          </div>

          {/* Nombre */}
          <h1 style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 32,
            color: C.wh,
            letterSpacing: '-0.5px',
            margin: '0 0 6px',
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            textTransform: 'uppercase',
          }}>
            Kangaroo <span style={{ color: C.nv, WebkitTextStroke: '1px rgba(255,255,255,0.3)' }}>Fun</span>
          </h1>

          {/* Subtítulo */}
          <p style={{
            fontFamily: "'Nunito Sans', sans-serif",
            fontSize: 14,
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
            fontWeight: 600,
            letterSpacing: '.04em',
          }}>
            {cfg.subtitulo || 'Nuestros productos y precios'}
          </p>
        </div>

        {/* Wave inferior */}
        <svg viewBox="0 0 1440 48" style={{ display: 'block', marginTop: 28, width: '100%' }} preserveAspectRatio="none" height="48">
          <path d="M0,32 C360,0 1080,64 1440,32 L1440,48 L0,48 Z" fill={C.bg} />
        </svg>
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '8px 16px 64px' }}>

        {grupos.length === 0 && (
          <div style={{ textAlign: 'center', color: C.mu, padding: '48px 0' }}>
            <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 15 }}>No hay productos disponibles por el momento.</p>
          </div>
        )}

        {grupos.map((grupo, gi) => (
          <div key={grupo.nombre} style={{ marginBottom: 32 }}>

            {/* Encabezado de categoría */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              margin: '28px 0 14px',
            }}>
              <div style={{
                background: C.nv,
                color: C.wh,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                padding: '5px 14px 5px 12px',
                borderRadius: '0 20px 20px 0',
                marginLeft: -16,
                boxShadow: '2px 2px 8px rgba(27,58,107,0.18)',
              }}>
                {grupo.nombre}
              </div>
              <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${C.nv} 0%, transparent 100%)`, marginLeft: 8, opacity: 0.15 }} />
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grupo.items.map((prod, pi) => (
                <div key={prod.id} style={{
                  background: C.wh,
                  borderRadius: 16,
                  padding: '14px 16px 14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  boxShadow: '0 2px 10px rgba(27,58,107,0.07)',
                  borderLeft: `5px solid ${pi % 2 === 0 ? C.or : C.nv}`,
                  transition: 'transform .15s',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: C.tx,
                      fontFamily: "'Nunito', sans-serif",
                      lineHeight: 1.3,
                    }}>
                      {prod.nombre}
                    </div>
                  </div>
                  <div style={{
                    background: `linear-gradient(135deg, ${C.or} 0%, ${C.or2} 100%)`,
                    color: C.wh,
                    fontWeight: 900,
                    fontSize: 15,
                    fontFamily: "'Nunito', sans-serif",
                    padding: '6px 12px',
                    borderRadius: 10,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(232,98,26,0.3)',
                  }}>
                    {fmt(prod.precio_venta)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        background: C.nv,
        padding: '24px 16px',
        textAlign: 'center',
      }}>
        <img src="/logo.jpg" alt="Kangaroo Fun" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.or}`, marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900,
          color: C.or2,
          fontSize: 16,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          marginBottom: 4,
        }}>
          Kangaroo Fun
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: "'Nunito Sans', sans-serif" }}>
          Los precios pueden variar · Consultá en caja
        </div>
      </div>
    </div>
  )
}
