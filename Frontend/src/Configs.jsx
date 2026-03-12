import React, { useEffect, useState } from "react";
import api from './api';
import { CiCirclePlus, CiEdit, CiSettings } from "react-icons/ci";
import { ModalDatabaseConfig } from "./modais";

function Configs() {
    const [configs, setConfigs] = useState([]);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState(null);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const response = await api.get('./configs/');
            setConfigs(response.data);
        } catch (error) {
            console.error("Erro ao buscar configurações", error)
        }
    };

    const openCreateModal = () => {
        setSelectedConfig(null);
        setShowConfigModal(true);
    };

    const openEditModal = (config) => {
        setSelectedConfig(config);
        setShowConfigModal(true);
    };

    return (
        <div style={{ width: '100%', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>


            <div>


                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3f4d67' }}>
                    <CiSettings color="#3f4d67" /> Configurações
                </h2>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '12px' }}>
                    <div style={{ color: '#5f6c81' }}>
                        Cadastre as conexões com os bancos de dados dos clientes e edite os parâmetros quando necessário.
                    </div>

                    <button
                        onClick={openCreateModal}
                        style={{ display: 'flex', alignItems: 'center', padding: '10px', borderRadius: '10px', backgroundColor: '#3f4d67', color: '#fff', fontSize: '15px' }}
                    >
                        <CiCirclePlus size={20} /> Nova configuração
                    </button>
                </div>

                <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #3f4d67', textAlign: 'left', color: '#3f4d67' }}>
                            <th style={{ padding: '10px' }}>Nome</th>
                            <th style={{ padding: '10px' }}>Tipo</th>
                            <th style={{ padding: '10px' }}>Servidor</th>
                            <th style={{ padding: '10px' }}>Usuário</th>
                            <th style={{ padding: '10px' }}>Banco</th>
                            <th style={{ padding: '10px' }}>Tabela</th>
                            <th style={{ padding: '10px' }}>Senha</th>
                            <th style={{ padding: '10px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {configs.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ padding: '20px', color: '#5f6c81', textAlign: 'center' }}>
                                    Nenhuma configuração cadastrada até o momento.
                                </td>
                            </tr>
                        )}

                        {configs.map((config) => (
                            <tr key={config.id} style={{ borderBottom: '1px solid #d7deea', color: '#3f4d67' }}>
                                <td style={{ padding: '10px' }}>{config.name}</td>
                                <td style={{ padding: '10px' }}>{(config.db_type || 'postgresql').toUpperCase()}</td>
                                <td style={{ padding: '10px' }}>{config.server}</td>
                                <td style={{ padding: '10px' }}>{config.username}</td>
                                <td style={{ padding: '10px' }}>{config.database_name}</td>
                                <td style={{ padding: '10px' }}>{config.table_name}</td>
                                <td style={{ padding: '10px' }}>{config.has_password ? 'Configurada' : 'Não informada'}</td>
                                <td style={{ padding: '10px' }}>
                                    <button
                                        onClick={() => openEditModal(config)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#eef2f8', color: '#3f4d67', border: '1px solid #cbd5e1' }}
                                    >
                                        <CiEdit /> Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            </div>

            <ModalDatabaseConfig
                show={showConfigModal}
                handleClose={() => setShowConfigModal(false)}
                refreshList={fetchConfigs}
                initialData={selectedConfig}
            />
        </div>
    );
}


export default Configs;