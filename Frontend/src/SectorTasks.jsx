import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from './api';
import { Factory, UserRoundCheck } from 'lucide-react';

function SectorTasks() {
  const [workstations, setWorkstations] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedWorkstation, setSelectedWorkstation] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchWorkstations = useCallback(async () => {
    try {
      const response = await api.get('/workstations/');
      const list = response.data || [];
      setWorkstations(list);
      if (!selectedWorkstation && list.length > 0) {
        setSelectedWorkstation(String(list[0].id));
      }
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  }, [selectedWorkstation]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar operadores:', error);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedWorkstation) params.append('workstation_id', selectedWorkstation);
      if (statusFilter) params.append('status', statusFilter);
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/production/tasks/${query}`);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar fila do setor:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedWorkstation, statusFilter]);

  useEffect(() => {
    fetchWorkstations();
    fetchUsers();
  }, [fetchWorkstations, fetchUsers]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const usersByWorkstation = useMemo(
    () => users.filter((user) => String(user.workstation_id) === String(selectedWorkstation)),
    [users, selectedWorkstation]
  );

  const assignTask = async (taskId, userId) => {
    if (!userId) return;
    try {
      await api.post(`/production/tasks/${taskId}/assign`, { user_id: parseInt(userId, 10) });
      await fetchTasks();
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro ao atribuir tarefa');
    }
  };

  const startTask = async (task) => {
    const effectiveUserId = task.assigned_user_id;
    if (!effectiveUserId) {
      alert('Atribua um operador antes de iniciar a tarefa.');
      return;
    }

    try {
      await api.post(`/production/tasks/${task.id}/start`, { user_id: effectiveUserId });
      await fetchTasks();
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro ao iniciar tarefa');
    }
  };

  const finishTask = async (task) => {
    try {
      await api.post(`/production/tasks/${task.id}/finish`, { user_id: task.assigned_user_id || null });
      await fetchTasks();
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro ao finalizar tarefa');
    }
  };

  return (
    <div className="com-sidebar page-shell">
      <h2 className="page-title">
        <Factory color="#3f4d67" /> Fila do Setor
      </h2>

      <div className="page-toolbar">
        <div className="actions-row" style={{ flex: 1 }}>
          <select
            className="form-select"
            value={selectedWorkstation}
            onChange={(e) => setSelectedWorkstation(e.target.value)}
            style={{ maxWidth: 260 }}
          >
            {workstations.map((workstation) => (
              <option key={workstation.id} value={workstation.id}>
                {workstation.name}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ maxWidth: 220 }}
          >
            <option value="">Todos os status</option>
            <option value="queued">queued</option>
            <option value="assigned">assigned</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Pedido</th>
              <th>Produto</th>
              <th>Qtd</th>
              <th>Status</th>
              <th>Operador</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="cell-empty">Carregando fila...</td>
              </tr>
            )}

            {!loading && tasks.length === 0 && (
              <tr>
                <td colSpan={7} className="cell-empty">Nenhuma tarefa encontrada para os filtros selecionados.</td>
              </tr>
            )}

            {!loading && tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td className="cell-strong">{task.external_order_id}</td>
                <td>{task.product_id}</td>
                <td>{task.quantity}</td>
                <td><span className={`status-badge status-${task.status}`}>{task.status}</span></td>
                <td>
                  <select
                    className="form-select"
                    value={task.assigned_user_id || ''}
                    onChange={(e) => assignTask(task.id, e.target.value)}
                  >
                    <option value="">Selecionar operador</option>
                    {usersByWorkstation.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.username}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="cell-actions">
                  <button className="outline-btn" onClick={() => startTask(task)}>
                    <UserRoundCheck size={16} /> Iniciar
                  </button>
                  <button className="outline-btn" onClick={() => finishTask(task)}>
                    Finalizar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SectorTasks;
