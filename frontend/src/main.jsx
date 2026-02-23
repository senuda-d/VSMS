import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SPAL from '../src/pages/SPAL/SPALModule.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SPAL />
  </StrictMode>,
)
