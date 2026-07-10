import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import MenuPublico from './components/MenuPublico'
import PedidoEstado from './components/PedidoEstado'
import POS from './components/POS'
import './index.css'

const path = window.location.pathname
const params = new URLSearchParams(window.location.search)
const isMenu = path.startsWith('/menu')
const isPedido = path.startsWith('/pedido')
const isPOS = params.get('mode') === 'pos'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isPOS ? <POS /> : isMenu ? <MenuPublico /> : isPedido ? <PedidoEstado /> : <App />}
  </React.StrictMode>
)
