import React from 'react';
import { Home, Users, Settings, Group, LogOut, BookPlus, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const getPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem('permissions') || '[]');
  } catch {
    return [];
  }
};

const Sidebar = () => {
  const permissions = getPermissions();
  const can = (key) => permissions.includes(key);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('permissions');
    window.location.href = '/';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h2>KYZZEN-MES</h2>
      </div>

      <nav className="sidebar-nav">
        <div className="menu-section">
          <p className="section-title">CENTRAL</p>
          {can('dashboard') && (
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'menu-link active-link' : 'menu-link')}>
              <div className="menu-item active">
                <Home size={20} />
                <span>Início</span>
              </div>
            </NavLink>
          )}
          {can('orders') && (
            <NavLink to="/orders" className={({ isActive }) => (isActive ? 'menu-link active-link' : 'menu-link')}>
              <div className="menu-item">
                <BookPlus size={20} />
                <span>Pedidos</span>
              </div>
            </NavLink>
          )}
        </div>

        <div className="menu-section">
          <p className="section-title">CONFIGURAÇÕES</p>
          {can('users') && (
            <NavLink to="/users" className={({ isActive }) => (isActive ? 'menu-link active-link' : 'menu-link')}>
              <div className="menu-item">
                <Users size={20} />
                <span>Usuários</span>
              </div>
            </NavLink>
          )}
          {can('workstations') && (
            <NavLink to="/workstations" className={({ isActive }) => (isActive ? 'menu-link active-link' : 'menu-link')}>
              <div className="menu-item">
                <Group size={20} />
                <span>Setores</span>
              </div>
            </NavLink>
          )}
          {can('roles') && (
            <NavLink to="/roles" className={({ isActive }) => (isActive ? 'menu-link active-link' : 'menu-link')}>
              <div className="menu-item">
                <ShieldCheck size={20} />
                <span>Funções</span>
              </div>
            </NavLink>
          )}
          {can('configs') && (
            <NavLink to="/configs" className={({ isActive }) => (isActive ? 'menu-link active-link' : 'menu-link')}>
              <div className="menu-item">
                <Settings size={20} />
                <span>Configurações</span>
              </div>
            </NavLink>
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="menu-item logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Sair</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;