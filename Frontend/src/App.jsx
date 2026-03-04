import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import AdmPanel from './admPanel';
import 'bootstrap/dist/css/bootstrap.min.css';

// Função simples para proteger as rotas
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route
          path="/admin"
          element={
              <AdmPanel />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;