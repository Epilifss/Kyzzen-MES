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
        <div className="com-sidebar page-shell">
            <div>
                <h2 className="page-title">
                    <CiSettings color="#3f4d67" /> Configurações
                </h2>

                <div className="page-toolbar">
                    <div className="muted-text intro-text">
                        Cadastre as conexões com os bancos de dados dos clientes e edite os parâmetros quando necessário.
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="primary-btn"
                    >
                        <CiCirclePlus size={20} /> Nova configuração
                    </button>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Tipo</th>
                            <th>Servidor</th>
                            <th>Usuário</th>
                            <th>Banco</th>
                            <th>Tabela</th>
                            <th>Senha</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {configs.length === 0 && (
                            <tr>
                                <td colSpan="8" className="cell-empty">
                                    Nenhuma configuração cadastrada até o momento.
                                </td>
                            </tr>
                        )}

                        {configs.map((config) => (
                            <tr key={config.id}>
                                <td>{config.name}</td>
                                <td>{(config.db_type || 'postgresql').toUpperCase()}</td>
                                <td>{config.server}</td>
                                <td>{config.username}</td>
                                <td>{config.database_name}</td>
                                <td>{config.custom_query ? 'Query personalizada' : config.table_name}</td>
                                <td>{config.has_password ? 'Configurada' : 'Não informada'}</td>
                                <td className="cell-actions">
                                    <button
                                        onClick={() => openEditModal(config)}
                                        className="outline-btn"
                                    >
                                        <CiEdit /> Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

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