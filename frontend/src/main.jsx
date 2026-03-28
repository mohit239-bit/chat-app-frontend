import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppRoutes } from './config/Routes.jsx'
import Chat from './components/Chat.jsx'
import { ChatProvider } from './context/ChatContext.jsx'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <Toaster />
      <ChatProvider>
        <AppRoutes />
      </ChatProvider>
    </BrowserRouter>
  
)
