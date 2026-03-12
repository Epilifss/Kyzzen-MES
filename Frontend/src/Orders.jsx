import React, { useEffect, useState } from "react";
import api from './api';
import { CiCirclePlus, CiBoxList, CiTrash } from "react-icons/ci";
import { LuBookPlus } from "react-icons/lu";
import { ModalNewUser, ConfirmDelItem } from "./modais";

function Orders() {
    const [orders, setOrders] = useState([]);
    const [ShowOrderModal, setShowOrderModal] = useState(false);
    const [showDelModal, setshowDelModal] = useState(false);
    const [orderIdSelected, setorderIdSelected] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('./orders/');
            setOrders(response.data);
        } catch (error) {
            console.error("Erro ao buscar pedidos", error)
        }
    }

    // const confirmDelete = (id) => {
    //     setorderIdSelected(id);
    //     setshowDelModal(true);
    // };

    // const handleExecuteDelete = async () => {
    //     if (orderIdSelected) {
    //         await DeleteUser(orderIdSelected);
    //         setshowDelModal(false);
    //         setorderIdSelected(null);
    //     }
    // };

    // const DeleteUser = async (user_id) => {

    //     try {
    //         console.log(user_id);
    //         const response = await api.delete('/users/' + user_id);

    //         if (response.status === 201 || response.status === 200) {
    //             fetchUsers();
    //         }
    //     } catch (error) {
    //         alert('Erro ao obter o id: ' + error.response?.data?.detail);
    //     }

    // };

    return (
        <div style={{ width: '100%', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>


            <div>


                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3f4d67' }}>
                    <LuBookPlus color="#3f4d67" /> Pedidos
                </h2>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button variant='primary' onClick={() => setShowOrderModal(true)} style={{ display: 'flex', alignItems: 'center', padding: '10px', borderRadius: '10px', backgroundColor: '#3f4d67', color: '#fff' , fontSize: '15px' }}> <CiCirclePlus size={20} /> Novo Pedido </button>
                </div>

                <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #3f4d67', textAlign: 'left', color: '#3f4d67' }}>
                            <th style={{ padding: '10px' }}>Pedido</th>
                            <th style={{ padding: '10px' }}>Emissão</th>
                            <th style={{ padding: '10px' }}>Entrega</th>
                            <th style={{ padding: '10px' }}>Cliente</th>
                            <th style={{ padding: '10px' }}>Filial</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((op, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #3f4d67', color: '#3f4d67' }}>
                                <td style={{ padding: '10px', fontWeight: 'bold' }}>{op.pedido}</td>
                                <td style={{ padding: '10px' }}>{op.dt_emissao}</td>
                                <td style={{ padding: '10px' }}>{op.dt_entrega}</td>
                                <td style={{ padding: '10px' }}>{op.cliente}</td>
                                <td style={{ padding: '10px' }}>{op.filial}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            </div>

            <ModalNewUser
                show={ShowOrderModal}
                handleClose={() => setShowOrderModal(false)}
                refreshList={fetchOrders}
            />

            <ConfirmDelItem
                show={showDelModal}
                handleClose={() => setshowDelModal(false)}
                // onConfirm={handleExecuteDelete}
                mensagem={"Esta ação não poderá ser desfeita."}
            />
        </div>
    );
}


export default Orders;