import './App.css'
import JoinCreateChat from './components/JoinCreateChat';
import { Navigate } from 'react-router-dom';
import useChatContext from './context/ChatContext';

function App() {
  const { roomId, connected } = useChatContext();

  if (connected && roomId) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="app-shell">
      <JoinCreateChat />
    </div>
  )
}

export default App
