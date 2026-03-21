import React, { useEffect, useState } from 'react';
import api from './api';
import { CiTrash } from 'react-icons/ci';
import { LuShieldCheck, LuPencil } from 'react-icons/lu';
import { ModalNewComponent, ALL_PERMISSIONS } from './modais';
import { ConfirmDelItem } from './modais';

function Components() {
    const [Components, setComponents] = useState([]);
    const [showComponentModal, setShowComponentModal] = useState(false);
    const [showDelModal, setShowDelModal] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [componentIdToDelete, setComponentIdToDelete] = useState(null);

    useEffect(() => {
        fetchComponents();
    }, []);

    const fetchComponents = async () => {
        try {
            const response = await api.get('/components/');
            setComponents(response.data);
        } catch (error) {
            console.error('Erro ao buscar componentes:', error);
        }
    };

    const handleNew = () => {
        setSelectedComponent(null);
        setShowComponentModal(true);
    };

    const handleCloseComponentModal = () => {
        setShowComponentModal(false);
        setSelectedComponent(null);
    };

    const handleEdit = (role) => {
        setSelectedComponent(role);
        setShowComponentModal(true);
    };

    const confirmDelete = (id) => {
        setComponentIdToDelete(id);
        setShowDelModal(true);
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/components/${componentIdToDelete}`);
            fetchComponents();
            setShowDelModal(false);
            setComponentIdToDelete(null);
        } catch (error) {
            alert('Erro ao excluir componente: ' + error.response?.data?.detail);
        }
    };

    const getPermissionLabels = (permissions) =>
        (permissions || [])
            .map(key => ALL_PERMISSIONS.find(p => p.key === key)?.label ?? key)
            .join(', ') || '—';

    return (
        <div className="com-sidebar page-shell">
            <h2 className="page-title">
                <LuShieldCheck color="#3f4d67" /> Componentes
            </h2>

            <div className="actions-right">
                <button
                    onClick={handleNew}
                    className="primary-btn"
                >
                    <LuShieldCheck size={18} /> Novo Componente
                </button>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Código</th>
                        <th>Descrição</th>
                        <th>Linha</th>
                        <th>Pontos</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {Components.map((r) => (
                        <tr key={r.id}>
                            <td>{r.id}</td>
                            <td className="cell-strong">{r.cod}</td>
                            <td className="cell-strong">{r.desc}</td>
                            <td className="cell-strong">{r.line}</td>
                            <td className="cell-strong">{r.base_points}</td>
                            <td className="cell-actions">
                                <LuPencil
                                    size={18}
                                    style={{ cursor: 'pointer', color: '#3f4d67' }}
                                    onClick={() => handleEdit(r)}
                                />
                                <CiTrash
                                    size={20}
                                    style={{ cursor: 'pointer', color: 'red' }}
                                    onClick={() => confirmDelete(r.id)}
                                />
                            </td>
                        </tr>
                    ))}
                    {Components.length === 0 && (
                        <tr>
                            <td colSpan={4} className="cell-empty">
                                Nenhuma função cadastrada. Crie uma clicando em "Nova Função".
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>

            <ModalNewComponent
                show={showComponentModal}
                handleClose={handleCloseComponentModal}
                initialData={selectedComponent}
                refreshList={fetchComponents}
                onSaved={fetchComponents}
            />

            <ConfirmDelItem
                show={showDelModal}
                handleClose={() => setShowDelModal(false)}
                onConfirm={handleDelete}
                mensagem="Tem certeza que deseja excluir esta função? Os usuários vinculados perderão suas permissões de acesso."
            />
        </div>
    );
}

export default Components;
