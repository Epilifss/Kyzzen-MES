import React, { useEffect, useState } from "react";
import api from './api';
import { LogOut, Activity } from 'lucide-react';
import { CiUser } from "react-icons/ci";
import ModalNewUser from "./modais";

function AdmPanel() {
    const [users, setusers] = useState([]);
    const [showModal, setShowModal] = useState(false);

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

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Kyzzen <span style={{ color: '#2563eb' }}>MES</span></h1>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <LogOut size={18} /> Sair
                </button>
            </header>


            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#2563eb' }}>

                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CiUser color="#f59e0b" /> Usuários
                </h2>
                <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>ID</th>
                            <th style={{ padding: '10px' }}>Nome</th>
                            <th style={{ padding: '10px' }}>Setor</th>
                            <th style={{ padding: '10px' }}>Função</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((op, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px' }}>{op.id}</td>
                                <td style={{ padding: '10px' }}>{op.username}</td>
                                <td style={{ padding: '10px' }}>{op.workstation_name}</td>
                                <td style={{ padding: '10px', fontWeight: 'bold' }}>{op.role}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button variant='primary' onClick={() => setShowModal(true)} style={{ margin: ('0px', '10px'), padding: '10px' }}>Novo usuário</button>
            </div>

            <ModalNewUser show={showModal} handleClose={() => setShowModal(false)} refreshList={fetchUsers}/>
        </div>
    );
}


export default AdmPanel;