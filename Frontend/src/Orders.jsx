import React, { useEffect, useState } from "react";
import api from './api';
import { LuBookPlus, LuRefreshCw } from "react-icons/lu";

function Orders() {
    const [orders, setOrders] = useState([]);
    const [orderFields, setOrderFields] = useState([]);
    const [configName, setConfigName] = useState('');
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [ordersError, setOrdersError] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoadingOrders(true);
        setOrdersError('');
        try {
            const response = await api.get('./orders/external/');
            setOrders(response.data.rows || []);
            setOrderFields(response.data.fields || []);
            setConfigName(response.data.config_name || '');
        } catch (error) {
            setOrders([]);
            setOrderFields([]);
            setConfigName('');
            setOrdersError(error.response?.data?.detail || 'Erro ao buscar pedidos externos');
            console.error("Erro ao buscar pedidos", error)
        } finally {
            setLoadingOrders(false);
        }
    };

    return (
        <div className="com-sidebar page-shell">
            <div>
                <h2 className="page-title">
                    <LuBookPlus color="#3f4d67" /> Pedidos
                </h2>

                <div className="page-toolbar">
                    <div className="muted-text intro-text">
                        {configName ? `Exibindo dados externos da configuração ${configName}.` : 'Configure e selecione campos na aba de configurações para carregar os pedidos externos.'}
                    </div>
                    <button onClick={fetchOrders} disabled={loadingOrders} className="primary-btn">
                        <LuRefreshCw size={20} /> {loadingOrders ? 'Atualizando...' : 'Atualizar pedidos'}
                    </button>
                </div>

                {ordersError && (
                    <div className="alert-error">
                        {ordersError}
                    </div>
                )}

                <div className="table-wrapper">
                    <table className="data-table">
                    <thead>
                        <tr>
                            {orderFields.map((field) => (
                                <th key={field}>{field}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan={Math.max(orderFields.length, 1)} className="cell-empty">
                                    {loadingOrders ? 'Carregando pedidos...' : 'Nenhum pedido encontrado para os campos selecionados.'}
                                </td>
                            </tr>
                        )}

                        {orders.map((order, index) => (
                            <tr key={index}>
                                {orderFields.map((field) => (
                                    <td key={`${index}-${field}`} className={field === 'pedido' ? 'cell-strong' : ''}>
                                        {order[field] === null || order[field] === undefined ? '' : String(order[field])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}


export default Orders;