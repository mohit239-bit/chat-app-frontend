import React from 'react'
import { Routes, Route } from 'react-router-dom'
import App from '../App'
import Chat from '../components/Chat'

export const AppRoutes = () => {
  return (
    <Routes>
        <Route path="/" element={<App />} />   
        <Route path="/chat" element={<Chat />} />
    </Routes>
  )
}
