
import { PrimeReactProvider } from 'primereact/api';
import { BrowserRouter } from 'react-router-dom';
import { ChatProvider } from './contexts/ChatContext';
import './App.css';
import AppRouter from './routers';

function App() {
  return (
    <PrimeReactProvider>
      <ChatProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </ChatProvider>
    </PrimeReactProvider>
  )
}

export default App
