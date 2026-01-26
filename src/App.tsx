import { PrimeReactProvider } from "primereact/api";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login/Login";
import Home from "./pages/Home";
// import SemesterManagement from './pages/SemesterManagement';
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";

function App() {
  return (
    <PrimeReactProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:teamId" element={<TeamDetail />} />
          {/* <Route element={<ProtectedRoute allowedRoles={['HOD']} />}>
            <Route path="/semesters" element={<SemesterManagement />} />
          </Route> */}
        </Routes>
      </BrowserRouter>
    </PrimeReactProvider>
  );
}

export default App;
