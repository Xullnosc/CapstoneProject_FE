
import { PrimeReactProvider } from 'primereact/api';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import AppRouter from './routers';

function App() {
  return (
    <PrimeReactProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </PrimeReactProvider>
  )
}

export default App
