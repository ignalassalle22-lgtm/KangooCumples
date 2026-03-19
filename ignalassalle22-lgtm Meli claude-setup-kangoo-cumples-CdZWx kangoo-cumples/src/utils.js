export const fmt = n => '$' + Math.round(n).toLocaleString('es-AR')

export const cumpleDisplay = ev =>
  ev.cumple ? (ev.edad ? `${ev.cumple}, ${ev.edad} años` : ev.cumple) : ''

export const fmtFechaHora = (fecha, hora) => {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T12:00:00')
  const ds = d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  return ds + (hora ? ' · ' + hora : '')
}

export const DEFAULT_CONFIG = {
  menus: [
    { id: 1, n: 'Menú Clásico' },
    { id: 2, n: 'Menú Vegano' },
    { id: 3, n: 'Menú Sin TACC' },
  ],
  salones: ['Salón Naranja', 'Salón Azul', 'Salón Verde'],
  promos: [
    { id: 1, d: 'Cumple entre semana -10%', pct: 10 },
    { id: 2, d: 'Grupo +20 chicos -15%', pct: 15 },
  ],
  mets: ['Efectivo', 'Transferencia', 'Tarjeta débito', 'Tarjeta crédito', 'Mercado Pago'],
  extras: [
    { id: 1, n: 'Bebidas', p: 500 },
    { id: 2, n: 'Medias', p: 400 },
    { id: 3, n: 'Hora extra', p: 8000 },
    { id: 4, n: 'Saltos adicionales', p: 2000 },
    { id: 5, n: 'Parque aéreo adicional', p: 3000 },
    { id: 6, n: 'Comida extra', p: 1500 },
  ],
  pChico: 5000,
  pAdulto: 2500,
}
