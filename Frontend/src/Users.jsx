import React, { useEffect, useState } from "react";
import api from './api';
import { CiTrash } from "react-icons/ci";
import { LuUserRoundPlus, LuUsers, LuPencil } from "react-icons/lu";
import { ModalNewUser, ConfirmDelItem } from "./modais";

function Users() {
    const [users, setusers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showDelModal, setShowDelModal] = useState(false);
    const [userIdSelected, setUserIdSelected] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/');
            setusers(response.data);
        } catch (error) {
            console.error("Erro ao buscar usuários", error)
        }
    }

    const confirmDelete = (id) => {
        setUserIdSelected(id);
        setShowDelModal(true);
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    const handleExecuteDelete = async () => {
        if (userIdSelected) {
            await DeleteUser(userIdSelected);
            setShowDelModal(false);
            setUserIdSelected(null);
        }
    };

    const DeleteUser = async (user_id) => {

        try {
            console.log(user_id);
            const response = await api.delete('/users/' + user_id);

            if (response.status === 201 || response.status === 200) {
                fetchUsers();
            }
        } catch (error) {
            alert('Erro ao obter o id: ' + error.response?.data?.detail);
        }

    };

    return (
        <div className="com-sidebar page-shell">
            <div>
                <h2 className="page-title">
                    <LuUsers color="#3f4d67" /> Usuários
                </h2>

                <div className="actions-right">
                    <button
                        variant='primary'
                        onClick={() => {
                            setSelectedUser(null);
                            setShowUserModal(true);
                        }}
                        className="primary-btn"
                    >
                        <LuUserRoundPlus size={20} /> Novo Usuário
                    </button>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Setor</th>
                            <th>Função</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((op) => (
                            <tr key={op.id}>
                                <td>{op.id}</td>
                                <td>{op.username}</td>
                                <td>{op.workstation_name}</td>
                                <td className="cell-strong">{op.role}</td>
                                <td className="cell-actions">
                                    <LuPencil
                                    size={18}
                                    style={{ cursor: 'pointer', color: '#3f4d67' }}
                                    onClick={() => handleEdit(op)}
                                />
                                <CiTrash
                                    size={18}
                                    style={{ cursor: 'pointer', color: 'red' }}
                                    onClick={() => confirmDelete(op.id)}
                                />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

            </div>

            <ModalNewUser
                key={selectedUser?.id ?? 'new-user'}
                show={showUserModal}
                handleClose={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                }}
                refreshList={fetchUsers}
                initialData={selectedUser}
            />

            <ConfirmDelItem
                show={showDelModal}
                handleClose={() => setShowDelModal(false)}
                onConfirm={handleExecuteDelete}
                mensagem={"Esta ação não poderá ser desfeita."}
            />
        </div>
    );
}


export default Users;