import React, { useEffect, useState } from "react";
import api from './api';
import { LuBookPlus, LuRefreshCw, LuDownload } from "react-icons/lu";
import { ModalOrderDetails } from "./modais";
import "./Orders.css";

function Orders() {
    const [activeTab, setActiveTab] = useState("external");
    const [externalOrders, setExternalOrders] = useState([]);
    const [importedOrders, setImportedOrders] = useState([]);
    const [orderFields, setOrderFields] = useState([]);
    const [configName, setConfigName] = useState('');
    const [configId, setConfigId] = useState(null);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [ordersError, setOrdersError] = useState('');
    const [selectedOrders, setSelectedOrders] = useState(new Set());
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [report, setReport] = useState(null);

    useEffect(() => {
        fetchExternalOrders();
        fetchImportedOrders();
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            const response = await api.get('./orders/reports/summary');
            setReport(response.data || null);
        } catch (error) {
            console.error("Erro ao buscar relatório de pedidos:", error);
        }
    };

    const fetchExternalOrders = async () => {
        setLoadingOrders(true);
        setOrdersError('');
        try {
            const response = await api.get('./orders/external/');
            setExternalOrders(response.data.rows || []);
            setOrderFields(response.data.fields || []);
            setConfigName(response.data.config_name || '');
            setConfigId(response.data.config_id || null);
            setSelectedOrders(new Set());
        } catch (error) {
            setExternalOrders([]);
            setOrderFields([]);
            setConfigName('');
            setOrdersError(error.response?.data?.detail || 'Erro ao buscar pedidos externos');
        } finally {
            setLoadingOrders(false);
        }
    };

    const fetchImportedOrders = async () => {
        try {
            const response = await api.get('./orders/imported/');
            setImportedOrders(response.data || []);
        } catch (error) {
            console.error("Erro ao buscar pedidos importados:", error);
        }
    };

    const toggleOrderSelection = (index) => {
        const newSelected = new Set(selectedOrders);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedOrders(newSelected);
    };

    const toggleAllOrders = () => {
        if (selectedOrders.size === externalOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(externalOrders.map((_, i) => i)));
        }
    };

    const handleImportOrders = async () => {
        if (selectedOrders.size === 0) {
            alert("Selecione ao menos um pedido para importar");
            return;
        }

        try {
            const selectedPayload = Array.from(selectedOrders).map(idx => externalOrders[idx]);

            const validationResponse = await api.post('./orders/external/validate', {
                config_id: configId,
                orders: selectedPayload,
            });

            if ((validationResponse.data?.invalid_count || 0) > 0) {
                const firstIssue = validationResponse.data?.issues?.[0]?.reason || 'Há pedidos inválidos na seleção';
                alert(`Não foi possível importar. ${firstIssue}`);
                return;
            }

            const response = await api.post('./orders/import/', {
                config_id: configId,
                orders: selectedPayload,
            });

            alert(response.data.detail || "Pedidos importados com sucesso");
            setSelectedOrders(new Set());
            await fetchImportedOrders();
            await fetchExternalOrders();
            await fetchReport();
        } catch (error) {
            alert(error.response?.data?.detail || "Erro ao importar pedidos");
        }
    };

    const moveToProduction = async (orderId) => {
        try {
            await api.post(`./orders/imported/${orderId}/queue-production`);
            await fetchImportedOrders();
            await fetchReport();
        } catch (error) {
            alert(error.response?.data?.detail || "Erro ao enviar pedido para produção");
        }
    };

    const completeOrder = async (orderId) => {
        try {
            await api.post(`./orders/imported/${orderId}/complete`);
            await fetchImportedOrders();
            await fetchReport();
        } catch (error) {
            alert(error.response?.data?.detail || "Erro ao concluir pedido");
        }
    };

    const handleViewDetails = (order) => {
        setSelectedOrderDetails(order);
        setShowDetailsModal(true);
    };

    return (
        <div className="com-sidebar page-shell">
            <div>
                <h2 className="page-title">
                    <LuBookPlus color="#3f4d67" /> Pedidos
                </h2>

                {report && (
                    <div className="orders-report-grid">
                        <div className="report-card"><span>Total Importados</span><strong>{report.total_imported}</strong></div>
                        <div className="report-card"><span>Pendentes</span><strong>{report.pending}</strong></div>
                        <div className="report-card"><span>Em Produção</span><strong>{report.processing}</strong></div>
                        <div className="report-card"><span>Concluídos</span><strong>{report.completed}</strong></div>
                        <div className="report-card"><span>Importados Hoje</span><strong>{report.today_imported}</strong></div>
                    </div>
                )}

                {/* Tabs */}
                <div className="orders-tabs">
                    <button
                        className={`tab-button ${activeTab === 'external' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('external')}
                    >
                        Pedidos Externos
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'imported' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('imported')}
                    >
                        Pedidos Importados ({importedOrders.length})
                    </button>
                </div>

                {/* TAB: PEDIDOS EXTERNOS */}
                {activeTab === 'external' && (
                    <>
                        <div className="page-toolbar">
                            <div className="muted-text intro-text">
                                {configName ? `Exibindo dados externos da configuração ${configName}.` : 'Configure e selecione campos na aba de configurações para carregar os pedidos externos.'}
                            </div>
                            <button onClick={fetchExternalOrders} disabled={loadingOrders} className="primary-btn">
                                <LuRefreshCw size={20} /> {loadingOrders ? 'Atualizando...' : 'Atualizar'}
                            </button>
                        </div>

                        {ordersError && (
                            <div className="alert-error">
                                {ordersError}
                            </div>
                        )}

                        {externalOrders.length > 0 && (
                            <div className="actions-toolbar">
                                <label className="checkbox-all">
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.size === externalOrders.length && externalOrders.length > 0}
                                        onChange={toggleAllOrders}
                                    />
                                    <span>Selecionar todos ({selectedOrders.size}/{externalOrders.length})</span>
                                </label>
                                {selectedOrders.size > 0 && (
                                    <button onClick={handleImportOrders} className="primary-btn">
                                        <LuDownload size={18} /> Importar {selectedOrders.size}
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th className="cell-checkbox"></th>
                                        {orderFields.map((field) => (
                                            <th key={field}>{field}</th>
                                        ))}
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {externalOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={Math.max(orderFields.length + 2, 1)} className="cell-empty">
                                                {loadingOrders ? 'Carregando pedidos...' : 'Nenhum pedido encontrado para os campos selecionados.'}
                                            </td>
                                        </tr>
                                    )}

                                    {externalOrders.map((order, index) => (
                                        <tr key={index}>
                                            <td className="cell-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOrders.has(index)}
                                                    onChange={() => toggleOrderSelection(index)}
                                                />
                                            </td>
                                            {orderFields.map((field) => (
                                                <td key={`${index}-${field}`} className={field === 'pedido' ? 'cell-strong' : ''}>
                                                    {order[field] === null || order[field] === undefined ? '' : String(order[field])}
                                                </td>
                                            ))}
                                            <td className="cell-actions">
                                                <button
                                                    className="outline-btn"
                                                    onClick={() => handleViewDetails(order)}
                                                    title="Ver detalhes"
                                                >
                                                    Detalhes
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* TAB: PEDIDOS IMPORTADOS */}
                {activeTab === 'imported' && (
                    <>
                        <div className="page-toolbar">
                            <div className="muted-text intro-text">
                                Pedidos que foram importados do sistema externo para o banco de dados interno.
                            </div>
                        </div>

                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID Externo</th>
                                        <th>Status</th>
                                        <th>Data de Importação</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {importedOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="cell-empty">
                                                Nenhum pedido importado ainda. Selecione pedidos externos e clique em "Importar".
                                            </td>
                                        </tr>
                                    )}

                                    {importedOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="cell-strong">{order.external_id.substring(0, 16)}</td>
                                            <td>
                                                <span className={`status-badge status-${order.import_status}`}>
                                                    {order.import_status}
                                                </span>
                                            </td>
                                            <td>{new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
                                            <td className="cell-actions">
                                                <button
                                                    className="outline-btn"
                                                    onClick={() => handleViewDetails({ _details: order.order_data, _items: order.order_items || [] })}
                                                    title="Ver detalhes"
                                                >
                                                    Detalhes
                                                </button>
                                                {order.import_status !== 'processing' && order.import_status !== 'completed' && (
                                                    <button className="outline-btn" onClick={() => moveToProduction(order.id)}>
                                                        Produção
                                                    </button>
                                                )}
                                                {order.import_status === 'processing' && (
                                                    <button className="outline-btn" onClick={() => completeOrder(order.id)}>
                                                        Concluir
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            <ModalOrderDetails
                show={showDetailsModal}
                handleClose={() => setShowDetailsModal(false)}
                orderData={selectedOrderDetails}
            />
        </div>
    );
}

export default Orders;