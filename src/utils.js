export const fmt = n => '$' + Math.round(n).toLocaleString('es-AR')

// Extrae texto plano de un HTML (sin tags)
function htmlATexto(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  // Eliminar style/script/head para que no aparezcan como texto
  div.querySelectorAll('style, script, head').forEach(el => el.remove())
  div.querySelectorAll('tr').forEach(tr => tr.insertAdjacentText('afterend', '\n'))
  div.querySelectorAll('td').forEach((td) => {
    const row = td.parentElement
    if (row && row.children.length === 2 && td === row.children[1]) {
      td.insertAdjacentText('beforebegin', ' ')
    }
  })
  // Adjuntar al DOM para que innerText funcione correctamente
  div.style.cssText = 'position:absolute;left:-9999px;visibility:hidden'
  document.body.appendChild(div)
  const texto = div.innerText || div.textContent || ''
  document.body.removeChild(div)
  return texto
}

// Imprime en ticketera ESC/POS vía servidor local.
// Si el servidor no está disponible, cae al window.print() del browser.
// IMPORTANTE para fallback: en Chrome desactivar "Encabezados y pies de página".
export function imprimirTicket(html) {
  // Intentar servidor ESC/POS local primero
  const texto = htmlATexto(html)
  fetch('http://localhost:5001/print/texto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  }).then(r => {
    if (!r.ok) throw new Error('servidor respondió error')
    // OK: el servidor imprimió, no hacemos nada más
  }).catch(() => {
    // Servidor no disponible → fallback al browser
    _imprimirConBrowser(html)
  })
}

export function imprimirTicketBrowser(html) { _imprimirConBrowser(html) }

function _imprimirConBrowser(html) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:80mm;height:1px;border:none;visibility:hidden'
  document.body.appendChild(iframe)

  function escribir(contenido) {
    iframe.contentDocument.open()
    iframe.contentDocument.write(contenido)
    iframe.contentDocument.close()
  }

  escribir(html)

  setTimeout(() => {
    try {
      const doc = iframe.contentDocument
      const ruler = doc.createElement('div')
      ruler.style.cssText = 'position:absolute;width:10mm;height:0;visibility:hidden'
      doc.body.appendChild(ruler)
      const oneMmPx = ruler.getBoundingClientRect().width / 10
      doc.body.removeChild(ruler)
      const heightMm = Math.ceil(doc.body.scrollHeight / oneMmPx) + 6

      const htmlFinal = html.replace(
        '</head>',
        `<style>@page{size:80mm ${heightMm}mm;margin:3mm}</style></head>`
      )
      escribir(htmlFinal)

      setTimeout(() => {
        try { iframe.contentWindow.focus(); iframe.contentWindow.print() } catch (_) {}
        setTimeout(() => { try { document.body.removeChild(iframe) } catch (_) {} }, 3000)
      }, 400)
    } catch (_) {
      setTimeout(() => { try { document.body.removeChild(iframe) } catch (_) {} }, 3000)
    }
  }, 500)
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
