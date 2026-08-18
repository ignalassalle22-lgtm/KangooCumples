// api/arca-debug.js — Endpoint temporal para diagnosticar WSAA
import { buildTRA, signTRA, xmlTag } from '../lib/arca.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })

  const cert = process.env.ARCA_CERT
  const key = process.env.ARCA_KEY
  const ambiente = process.env.ARCA_AMBIENTE || 'homologacion'

  const url = ambiente === 'produccion'
    ? 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
    : 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms'

  const tra = buildTRA('wsfe')
  const cms = signTRA(tra, cert, key)

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Body>
    <loginCms xmlns="http://wsaa.view.sua.dvadac.desein.afip.gov">
      <in0>${cms}</in0>
    </loginCms>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml;charset=UTF-8', 'SOAPAction': '' },
    body
  })

  let text = await resp.text()
  const rawText = text

  // Decodificar HTML entities
  text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')

  const token = xmlTag(text, 'token')
  const sign = xmlTag(text, 'sign')
  const expStr = xmlTag(text, 'expirationTime')
  const fault = xmlTag(text, 'faultstring')

  // Si hay token, guardarlo en Supabase
  if (token && sign) {
    const sbUrl = process.env.VITE_SUPABASE_URL
    const sbKey = process.env.VITE_SUPABASE_ANON_KEY
    const expiration = expStr ? new Date(expStr).toISOString() : new Date(Date.now() + 12 * 3600000).toISOString()
    if (sbUrl && sbKey) {
      await fetch(`${sbUrl}/rest/v1/arca_tokens?id=eq.wsfe`, {
        method: 'PATCH',
        headers: {
          apikey: sbKey, Authorization: `Bearer ${sbKey}`,
          'Content-Type': 'application/json', Prefer: 'return=minimal'
        },
        body: JSON.stringify({ token, sign, expiration })
      })
    }
    return res.json({ status: 'ok', token: token.slice(0, 20) + '...', sign: sign.slice(0, 20) + '...', expiration: expStr, saved: true })
  }

  return res.json({ status: 'error', fault, raw: rawText.slice(0, 1000) })
}
