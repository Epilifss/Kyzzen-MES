import React from 'react';
import { Home, Users, Settings, Group, LogOut, BookPlus } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {

  const handleLogout = () => {
    localStorage.removeItem('token');
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
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'menu-link active-link' : 'menu-link')}>
            <div className="menu-item active">
              <Home size={20} />
              <span>Início</span>
            </div>
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => (isActive ? 'menu-link active-link' : 'menu-link')}>
            <div className="menu-item">
              <BookPlus size={20} />
              <span>Pedidos</span>
            </div>
          </NavLink>
        </div>

        <div className="menu-section">
          <p className="section-title">CONFIGURAÇÕES</p>
          <NavLink to="/users" className={({ isActive }) => (isActive ? 'menu-link active-link' : 'menu-link')}>
            <div className="menu-item">
              <Users size={20} />
              <span>Usuários</span>
            </div>
          </NavLink>
          <NavLink to="/workstations" className={({ isActive }) => (isActive ? 'menu-link active-link' : 'menu-link')}>
            <div className="menu-item">
              <Group size={20} />
              <span>Setores</span>
            </div>
          </NavLink>
          <NavLink to="/configs" className={({ isActive }) => (isActive ? 'menu-link active-link' : 'menu-link')}>
            <div className="menu-item">
              <Settings size={20} />
              <span>Configurações</span>
            </div>
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="menu-item logout" style={{ cursor: 'pointer' }}>
          <LogOut size={20} />
          <span onClick={handleLogout}>Sair</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;