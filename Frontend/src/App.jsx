import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './Login';
import Dashboard from './Dashboard';
import Users from './Users';
import Orders from './Orders';
import Workstations from './Workstations';
import Sidebar from './Sidebar';
import Configs from './Configs';
import Roles from './Roles';

// Função para proteger as rotas
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

// Componente de Layout para incluir a Sidebar lateralmente
const MainLayout = ({ children }) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        {children}
      </div>
    </div>
  );
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
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <PrivateRoute>
              <MainLayout>
                <Orders />
              </MainLayout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <MainLayout>
                <Users />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/workstations"
          element={
            <PrivateRoute>
              <MainLayout>
                <Workstations />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/configs"
          element={
            <PrivateRoute>
              <MainLayout>
                <Configs />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/roles"
          element={
            <PrivateRoute>
              <MainLayout>
                <Roles />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;