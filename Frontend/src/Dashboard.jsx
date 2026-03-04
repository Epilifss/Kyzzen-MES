import React, { useEffect, useState } from 'react';
import api from './api';
import { Trophy, Package, LogOut, Activity } from 'lucide-react';

function Dashboard() {
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      const response = await api.get('/ranking/');
      setRanking(response.data);
    } catch (error) {
      console.error("Erro ao buscar ranking", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Kyzzen <span style={{ color: '#2563eb' }}>MES</span></h1>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
          <LogOut size={18} /> Sair
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Card de Ranking */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#2563eb' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy color="#f59e0b" /> Meu ranking de Produtividade
          </h2>
          <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Nome</th>
                <th style={{ padding: '10px' }}>Setor</th>
                <th style={{ padding: '10px' }}>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((op, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{op.username}</td>
                  <td style={{ padding: '10px' }}>{op.workstation_name}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{op.points} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card de Ações Rápidas (Placeholder) */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
          <h2><Activity color="#2563eb" /> Ações do Sistema</h2>
          <p>Selecione uma operação abaixo para iniciar:</p>
          <button style={{ margin: '5px', padding: '10px' }}>Registrar Produção</button>
          <button style={{ margin: '5px', padding: '10px' }}>Cadastrar Produto</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;