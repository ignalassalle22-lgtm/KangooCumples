import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import MenuPublico from './components/MenuPublico'
import PedidoEstado from './components/PedidoEstado'
import './index.css'

const path = window.location.pathname
const isMenu = path.startsWith('/menu')
const isPedido = path.startsWith('/pedido')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isMenu ? <MenuPublico /> : isPedido ? <PedidoEstado /> : <App />}
  </React.StrictMode>
)
