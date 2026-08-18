// lib/arca.js — WSAA signing + WSFE logic (server-side only)
import forge from 'node-forge'

// ── TRA (Ticket de Requerimiento de Acceso) ────────────────────────────────
export function buildTRA(service) {
  const now = new Date()
  const gen = new Date(now.getTime() - 10 * 60 * 1000)
  const exp = new Date(now.getTime() + 10 * 60 * 1000)
  const uid = Math.floor(now.getTime() / 1000)
  // Convert UTC to Argentina time (UTC-3) for the timestamp, then label it -03:00
  const fmt = d => {
    const ar = new Date(d.getTime() - 3 * 60 * 60 * 1000)
    return ar.toISOString().slice(0, 19) + '-03:00'
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uid}</uniqueId>
    <generationTime>${fmt(gen)}</generationTime>
    <expirationTime>${fmt(exp)}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`
}

// ── PKCS7 sign ─────────────────────────────────────────────────────────────
export function signTRA(traXml, certPem, keyPem) {
  const cert = forge.pki.certificateFromPem(certPem)
  const key  = forge.pki.privateKeyFromPem(keyPem)

  const p7 = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(traXml, 'utf8')
  p7.addCertificate(cert)
  p7.addSigner({
    key,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: []
  })
  p7.sign({ detached: false })

  const der = forge.asn1.toDer(p7.toAsn1()).getBytes()
  return Buffer.from(der, 'binary').toString('base64')
}

// ── WSAA SOAP call ──────────────────────────────────────────────────────────
export async function callWSAA(signedCms, ambiente) {
  const url = ambiente === 'produccion'
    ? 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
    : 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms'

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Body>
    <loginCms xmlns="http://wsaa.view.sua.dvadac.desein.afip.gov">
      <in0>${signedCms}</in0>
    </loginCms>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml;charset=UTF-8', 'SOAPAction': '' },
    body
  })
  let text = await resp.text()

  // WSAA devuelve el loginTicketResponse dentro de HTML entities escapadas
  // ej: &lt;token&gt;...&lt;/token&gt; → decodificar para poder parsear
  text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')

  const token = xmlTag(text, 'token')
  const sign  = xmlTag(text, 'sign')
  const expStr = xmlTag(text, 'expirationTime')

  if (!token || !sign) {
    const fault = xmlTag(text, 'faultstring') || xmlTag(text, 'Msg') || text.slice(0, 500) || 'Error WSAA desconocido'
    throw new Error(fault)
  }

  const expiration = expStr
    ? new Date(expStr).toISOString()
    : new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()

  return { token, sign, expiration }
}

// ── WSFEv1 SOAP call ────────────────────────────────────────────────────────
export async function callWSFE(action, bodyContent, ambiente) {
  const url = ambiente === 'produccion'
    ? 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
    : 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx'

  const soap = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soap:Body>${bodyContent}</soap:Body>
</soap:Envelope>`

  // Usar https nativo para compatibilidad con TLS legacy de AFIP
  const https = await import('node:https')
  const { URL } = await import('node:url')
  const parsed = new URL(url)

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': `http://ar.gov.afip.dif.FEV1/${action}`,
        'Content-Length': Buffer.byteLength(soap, 'utf8'),
      },
      rejectUnauthorized: true,
      timeout: 25000,
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(`WSFEv1 HTTP ${res.statusCode}: ${data.slice(0, 200)}`))
        else resolve(data)
      })
    })
    req.on('error', (e) => reject(new Error(`WSFEv1 connection error: ${e.message} (code: ${e.code})`)))
    req.on('timeout', () => { req.destroy(); reject(new Error('WSFEv1 timeout')) })
    req.write(soap)
    req.end()
  })
}

// ── XML helper ──────────────────────────────────────────────────────────────
export function xmlTag(xml, tag) {
  return xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.trim() ?? null
}
