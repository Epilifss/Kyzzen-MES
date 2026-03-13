import React, { useEffect, useState } from 'react';
import api from './api';
import { CiTrash } from 'react-icons/ci';
import { LuShieldCheck, LuPencil } from 'react-icons/lu';
import { ModalRole, ALL_PERMISSIONS } from './modais';
import { ConfirmDelItem } from './modais';

function Roles() {
    const [roles, setRoles] = useState([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showDelModal, setShowDelModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [roleIdToDelete, setRoleIdToDelete] = useState(null);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles/');
            setRoles(response.data);
        } catch (error) {
            console.error('Erro ao buscar funções:', error);
        }
    };

    const handleNew = () => {
        setSelectedRole(null);
        setShowRoleModal(true);
    };

    const handleEdit = (role) => {
        setSelectedRole(role);
        setShowRoleModal(true);
    };

    const confirmDelete = (id) => {
        setRoleIdToDelete(id);
        setShowDelModal(true);
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/roles/${roleIdToDelete}`);
            fetchRoles();
            setShowDelModal(false);
            setRoleIdToDelete(null);
        } catch (error) {
            alert('Erro ao excluir função: ' + error.response?.data?.detail);
        }
    };

    const getPermissionLabels = (permissions) =>
        (permissions || [])
            .map(key => ALL_PERMISSIONS.find(p => p.key === key)?.label ?? key)
            .join(', ') || '—';

    return (
        <div className="com-sidebar page-shell">
            <h2 className="page-title">
                <LuShieldCheck color="#3f4d67" /> Funções
            </h2>

            <div className="actions-right">
                <button
                    onClick={handleNew}
                    className="primary-btn"
                >
                    <LuShieldCheck size={18} /> Nova Função
                </button>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Permissões</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {roles.map((r) => (
                        <tr key={r.id}>
                            <td>{r.id}</td>
                            <td className="cell-strong">{r.name}</td>
                            <td className="cell-muted cell-small">
                                {getPermissionLabels(r.permissions)}
                            </td>
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
                    {roles.length === 0 && (
                        <tr>
                            <td colSpan={4} className="cell-empty">
                                Nenhuma função cadastrada. Crie uma clicando em "Nova Função".
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>

            <ModalRole
                show={showRoleModal}
                handleClose={() => setShowRoleModal(false)}
                initialData={selectedRole}
                onSaved={fetchRoles}
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

export default Roles;
