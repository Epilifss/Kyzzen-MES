import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from './api';
import { PlayCircle, StopCircle, IdCard } from 'lucide-react';

function OperatorPanel() {
  const [users, setUsers] = useState([]);
  const [operatorCode, setOperatorCode] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar operadores:', error);
    }
  }, []);

  const findOperator = () => {
    const normalized = operatorCode.trim().toLowerCase();
    const found = users.find((user) =>
      String(user.username || '').toLowerCase() === normalized ||
      String(user.id) === normalized
    );

    if (!found) {
      alert('Operador não encontrado para a matrícula informada.');
      return;
    }

    setSelectedUser(found);
  };

  const fetchTasks = useCallback(async (userId) => {
    try {
      const response = await api.get(`/production/tasks/?user_id=${userId}`);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas do operador:', error);
      setTasks([]);
    }
  }, []);

  const fetchSummary = useCallback(async (userId) => {
    try {
      const response = await api.get(`/production/operators/${userId}/summary`);
      setSummary(response.data || null);
    } catch (error) {
      console.error('Erro ao carregar resumo do operador:', error);
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (selectedUser?.id) {
      fetchTasks(selectedUser.id);
      fetchSummary(selectedUser.id);
    }
  }, [selectedUser?.id, fetchTasks, fetchSummary]);

  const startTask = async (taskId) => {
    if (!selectedUser?.id) return;
    try {
      await api.post(`/production/tasks/${taskId}/start`, { user_id: selectedUser.id });
      await fetchTasks(selectedUser.id);
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro ao iniciar tarefa');
    }
  };

  const finishTask = async (taskId) => {
    if (!selectedUser?.id) return;
    try {
      await api.post(`/production/tasks/${taskId}/finish`, { user_id: selectedUser.id });
      await fetchTasks(selectedUser.id);
      await fetchSummary(selectedUser.id);
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro ao finalizar tarefa');
    }
  };

  const requestMaterial = async (taskId) => {
    if (!selectedUser?.id) return;

    const quantityText = window.prompt('Quantidade para requisição de material:');
    const quantity = parseFloat(quantityText || '0');
    if (Number.isNaN(quantity) || quantity <= 0) {
        alert('Informe uma quantidade válida maior que zero.');
        return;
    }

    const notes = window.prompt('Observações da requisição (opcional):') || '';

    try {
      await api.post('/production/material-requests/', {
        task_id: taskId,
        requested_by_user_id: selectedUser.id,
        quantity,
        notes,
      });
      alert('Requisição de material enviada com sucesso.');
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro ao solicitar material');
    }
  };

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status === 'assigned' || task.status === 'in_progress'),
    [tasks]
  );

  return (
    <div className="com-sidebar page-shell">
      <h2 className="page-title">
        <IdCard color="#3f4d67" /> Painel do Operador
      </h2>

      <div className="card-panel" style={{ marginBottom: '1rem' }}>
        <p className="muted-text">Informe sua matrícula (username ou ID) para acessar suas tarefas.</p>
        <div className="actions-row">
          <input
            className="form-control"
            value={operatorCode}
            onChange={(e) => setOperatorCode(e.target.value)}
            placeholder="Matrícula do operador"
            style={{ maxWidth: 280 }}
          />
          <button className="primary-btn" onClick={findOperator}>Acessar</button>
        </div>
      </div>

      {selectedUser && (
        <>
          <div className="orders-report-grid" style={{ marginBottom: '1rem' }}>
            <div className="report-card"><span>Operador</span><strong>{selectedUser.full_name || selectedUser.username}</strong></div>
            <div className="report-card"><span>Pontos no mês</span><strong>{summary?.month_points || 0}</strong></div>
            <div className="report-card"><span>Pontos totais</span><strong>{summary?.total_points || 0}</strong></div>
            <div className="report-card"><span>Tarefas concluídas</span><strong>{summary?.completed_tasks || 0}</strong></div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tarefa</th>
                  <th>Pedido</th>
                  <th>Produto</th>
                  <th>Qtd</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="cell-empty">Nenhuma tarefa ativa para este operador.</td>
                  </tr>
                )}

                {activeTasks.map((task) => (
                  <tr key={task.id}>
                    <td className="cell-strong">#{task.id}</td>
                    <td>{task.external_order_id}</td>
                    <td>{task.product_id}</td>
                    <td>{task.quantity}</td>
                    <td><span className={`status-badge status-${task.status}`}>{task.status}</span></td>
                    <td className="cell-actions">
                      <button className="outline-btn" onClick={() => startTask(task.id)}>
                        <PlayCircle size={16} /> Iniciar
                      </button>
                      <button className="outline-btn" onClick={() => finishTask(task.id)}>
                        <StopCircle size={16} /> Finalizar
                      </button>
                      <button className="outline-btn" onClick={() => requestMaterial(task.id)}>
                        Solicitar material
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default OperatorPanel;
