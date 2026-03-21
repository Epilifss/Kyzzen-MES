import React, { useState } from "react";
import api from './api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/token', formData);
      localStorage.setItem('token', response.data.access_token);
      const permissions = response.data.permissions || [];
      localStorage.setItem('permissions', JSON.stringify(permissions));

      const ORDERED_ROUTES = [
        { permission: 'dashboard', route: 'dashboard' },
        { permission: 'orders', route: 'orders' },
        { permission: 'sector_tasks', route: 'sector-tasks' },
        { permission: 'operator_panel', route: 'operator-panel' },
        { permission: 'registrations', route: 'registrations' },
        { permission: 'users', route: 'users' },
        { permission: 'workstations', route: 'workstations' },
        { permission: 'configs', route: 'configs' },
        { permission: 'roles', route: 'roles' },
      ];
      const firstRoute = ORDERED_ROUTES.find((item) => permissions.includes(item.permission))?.route ?? 'dashboard';
      window.location.href = `/${firstRoute}`;
    } catch (error) {
      alert('Falha no login: ' + error.response?.data?.detail);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="itens_container-login">
      <h2 className="logo-login">Kyzzen MES</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="text" placeholder="Usuário"
          onChange={(e) => setUsername(e.target.value)}
          className="login-input"
        />
        <input
          type="password" placeholder="Senha"
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
        />
        <button type="submit" className="primary-btn login-submit">Entrar</button>
      </form>
    </div>
    </div>
  );
}

export default Login;