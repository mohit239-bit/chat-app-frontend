import { useState } from 'react'
import './App.css'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import JoinCreateChat from './components/JoinCreateChat';
import Chat from './components/Chat';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <ToastContainer />
      <JoinCreateChat />
    </div>
  )
}

export default App
