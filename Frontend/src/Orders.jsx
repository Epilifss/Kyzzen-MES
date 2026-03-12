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
        <div style={{ width: '100%', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>


            <div>


                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3f4d67' }}>
                    <LuBookPlus color="#3f4d67" /> Pedidos
                </h2>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ color: '#5f6c81' }}>
                        {configName ? `Exibindo dados externos da configuração ${configName}.` : 'Configure e selecione campos na aba de configurações para carregar os pedidos externos.'}
                    </div>
                    <button onClick={fetchOrders} disabled={loadingOrders} style={{ display: 'flex', alignItems: 'center', padding: '10px', borderRadius: '10px', backgroundColor: '#3f4d67', color: '#fff', fontSize: '15px' }}>
                        <LuRefreshCw size={20} /> {loadingOrders ? 'Atualizando...' : 'Atualizar pedidos'}
                    </button>
                </div>

                {ordersError && (
                    <div style={{ padding: '12px', backgroundColor: '#fef3f2', color: '#b42318', borderRadius: '8px', marginBottom: '12px' }}>
                        {ordersError}
                    </div>
                )}

                <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #3f4d67', textAlign: 'left', color: '#3f4d67' }}>
                            {orderFields.map((field) => (
                                <th key={field} style={{ padding: '10px' }}>{field}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan={Math.max(orderFields.length, 1)} style={{ padding: '20px', color: '#5f6c81', textAlign: 'center' }}>
                                    {loadingOrders ? 'Carregando pedidos...' : 'Nenhum pedido encontrado para os campos selecionados.'}
                                </td>
                            </tr>
                        )}

                        {orders.map((order, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #3f4d67', color: '#3f4d67' }}>
                                {orderFields.map((field) => (
                                    <td key={`${index}-${field}`} style={{ padding: '10px', fontWeight: field === 'pedido' ? 'bold' : 'normal' }}>
                                        {order[field] === null || order[field] === undefined ? '' : String(order[field])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

            </div>
        </div>
    );
}


export default Orders;