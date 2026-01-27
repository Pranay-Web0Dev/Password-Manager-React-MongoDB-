import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import GSAPWrapper from './components/GSAPWrapper'; // Add this


ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <GSAPWrapper>
    <App />
    </GSAPWrapper>,
  // </React.StrictMode>,
)