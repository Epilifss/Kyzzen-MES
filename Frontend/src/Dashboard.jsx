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
    <div className="com-sidebar page-shell">
      <header className="page-header">
        <h1 className="brand-title">Kyzzen <span>MES</span></h1>
        <button onClick={handleLogout} className="secondary-btn">
          <LogOut size={18} /> Sair
        </button>
      </header>

      <div className="cards-grid">
        {/* Card de Ranking */}
        <div className="card-panel card-primary">
          <h2 className="panel-title panel-title-light">
            <Trophy color="#f59e0b" /> Ranking de Produtividade
          </h2>
          <div className="table-wrapper">
            <table className="data-table data-table-light">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Setor</th>
                <th>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((op, index) => (
                <tr key={index}>
                  <td>{op.username}</td>
                  <td>{op.workstation_name}</td>
                  <td className="cell-strong">{op.points} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Card de Ações Rápidas (Placeholder) */}
        <div className="card-panel">
          <h2 className="panel-title"><Activity color="#2563eb" /> Ações do Sistema</h2>
          <p className="muted-text">Selecione uma operação abaixo para iniciar:</p>
          <div className="actions-row">
            <button className="secondary-btn">Registrar Produção</button>
            <button className="secondary-btn">Cadastrar Produto</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;