export const fmt = n => '$' + Math.round(n).toLocaleString('es-AR')

// Imprime HTML en tiktetera de 80mm midiendo el alto real del contenido
// para evitar hoja en blanco cuando la impresora está configurada en A4.
export function imprimirTicket(html) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:80mm;height:1px;border:none;visibility:hidden'
  document.body.appendChild(iframe)
  iframe.contentDocument.open()
  iframe.contentDocument.write(html)
  iframe.contentDocument.close()
  setTimeout(() => {
    try {
      const doc = iframe.contentDocument
      // Medir 1mm en px usando un ruler — independiente del DPI de la pantalla
      const ruler = doc.createElement('div')
      ruler.style.cssText = 'position:absolute;width:10mm;height:0;visibility:hidden'
      doc.body.appendChild(ruler)
      const oneMmPx = ruler.getBoundingClientRect().width / 10
      doc.body.removeChild(ruler)
      const heightMm = Math.ceil(doc.body.scrollHeight / oneMmPx) + 5
      // Inyectar @page con el alto exacto del contenido
      const style = doc.createElement('style')
      style.textContent = `@page { size: 80mm ${heightMm}mm !important; margin: 2mm 3mm !important; }`
      doc.head.appendChild(style)
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    } catch (_) {}
    setTimeout(() => { try { document.body.removeChild(iframe) } catch (_) {} }, 2000)
  }, 600)
}

// Descarga rows como CSV compatible con Excel (BOM UTF-8)
export function downloadCSV(rows, filename) {
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = rows.map(r => r.map(escape).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

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
    { id: 1, n: 'Menú Clásico', p: 0 },
    { id: 2, n: 'Menú Vegano', p: 0 },
    { id: 3, n: 'Menú Sin TACC', p: 0 },
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
  pin: '',
  claves: [],
  notas_calendario: [],
  mets_caja: ['Efectivo', 'Transferencia', 'Tarjeta débito', 'Tarjeta crédito', 'Mercado Pago', 'Otro'],
  menu_digital: {
    activo: false,
    titulo: 'Kangaroo Fun',
    subtitulo: '',
    logoUrl: '',
    productosIds: [],
  },
}
