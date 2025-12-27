import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Page Imports
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import JobDetail from './pages/JobDetail';

function App() {
  return (
    <AuthProvider>
      {/* AuthProvider wraps the Router so 'useAuth' 
        can be used inside any page or component 
      */}
      <BrowserRouter>
        <Routes>
          {/* ==============================
              PUBLIC ROUTES 
              (Accessible by anyone)
          =============================== */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ==============================
              PROTECTED ROUTES 
              (Require Login - Checks 'user' state)
          =============================== */}
          <Route element={<ProtectedRoute />}>
            {/* The Hub: Main Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* The Studio: Job Details & Editor */}
            <Route path="/jobs/:id" element={<JobDetail />} />
          </Route>

          {/* ==============================
              FALLBACK ROUTE
              (Redirects unknown URLs to Home)
          =============================== */}
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;