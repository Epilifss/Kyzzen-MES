import React, { useEffect, useState } from "react";
import api from './api';
import { CiCirclePlus, CiUser, CiTrash } from "react-icons/ci";
import { ModalNewUser, ConfirmDelItem } from "./modais";

function Users() {
    const [users, setusers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showDelModal, setShowDelModal] = useState(false);
    const [userIdSelected, setUserIdSelected] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('./users/');
            setusers(response.data);
        } catch (error) {
            console.error("Erro ao buscar usuários", error)
        }
    }

    const confirmDelete = (id) => {
        setUserIdSelected(id);
        setShowDelModal(true);
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
        <div style={{ width: '100%', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>


            <div>


                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3f4d67' }}>
                    <CiUser color="#3f4d67" /> Usuários
                </h2>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button variant='primary' onClick={() => setShowUserModal(true)} style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#3f4d67', fontSize: '15px' }}> <CiCirclePlus /> Novo Usuário </button>
                </div>

                <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #3f4d67', textAlign: 'left', color: '#3f4d67' }}>
                            <th style={{ padding: '10px' }}>ID</th>
                            <th style={{ padding: '10px' }}>Nome</th>
                            <th style={{ padding: '10px' }}>Setor</th>
                            <th style={{ padding: '10px' }}>Função</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((op, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #3f4d67', color: '#3f4d67' }}>
                                <td style={{ padding: '10px' }}>{op.id}</td>
                                <td style={{ padding: '10px' }}>{op.username}</td>
                                <td style={{ padding: '10px' }}>{op.workstation_name}</td>
                                <td style={{ padding: '10px', fontWeight: 'bold' }}>{op.role}</td>
                                <td onClick={() => confirmDelete(op.id)} style={{ color: 'red', cursor: 'pointer' }}><CiTrash /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            </div>

            <ModalNewUser
                show={showUserModal}
                handleClose={() => setShowUserModal(false)}
                refreshList={fetchUsers}
            />

            <ConfirmDelItem
                show={showDelModal}
                handleClose={() => setShowDelModal(false)}
                onConfirm={handleExecuteDelete}
            />
        </div>
    );
}


export default Users;