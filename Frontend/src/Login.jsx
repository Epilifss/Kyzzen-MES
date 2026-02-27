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
            alert('Login realizado com sucesso!');
            window.location.href = '/dashboard';
        } catch (error) {
            alert('Falha no login: ' + error.response?.data?.detail);
        }
    };

    return (
    <div style={{ padding: '20px', maxWidth: '300px' }}>
      <h2>Kyzzen MES - Login</h2>
      <form onSubmit={handleLogin}>
        <input 
          type="text" placeholder="Usuário" 
          onChange={(e) => setUsername(e.target.value)} 
          style={{ display: 'block', marginBottom: '10px', width: '100%' }}
        />
        <input 
          type="password" placeholder="Senha" 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ display: 'block', marginBottom: '10px', width: '100%' }}
        />
        <button type="submit" style={{ width: '100%' }}>Entrar</button>
      </form>
    </div>
  );

}

export default Login;