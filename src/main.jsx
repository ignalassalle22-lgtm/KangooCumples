import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import MenuPublico from './components/MenuPublico'
import './index.css'

const isMenu = window.location.pathname.startsWith('/menu')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isMenu ? <MenuPublico /> : <App />}
  </React.StrictMode>
)
