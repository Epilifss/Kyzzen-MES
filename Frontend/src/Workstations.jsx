import React, { useEffect, useState } from "react";
import api from './api';
import { CiCirclePlus, CiUser, CiTrash } from "react-icons/ci";
import { ModalNewWorkstation, ConfirmDelItem } from "./modais";

function Workstations() {
    const [workstations, setWorkatstions] = useState([]);
    const [showWorkstationModal, setShowWorkstationModal] = useState(false);
    const [showDelModal, setShowDelModal] = useState(false);
    const [workstationIdSelected, setWorkstationIdSelected] = useState(null);

    useEffect(() => {
        fetchWorkstations();
    }, []);

    const fetchWorkstations = async () => {
        try {
            const response = await api.get('./workstations/');
            setWorkatstions(response.data);
        } catch (error) {
            console.error("Erro ao buscar usuários", error)
        }
    }

    const confirmDelete = (id) => {
        setWorkstationIdSelected(id);
        setShowDelModal(true);
    };

    const handleExecuteDelete = async () => {
        if (workstationIdSelected) {
            await DeleteWorkstation(workstationIdSelected);
            setShowDelModal(false);
            setWorkstationIdSelected(null);
        }
    };

    const DeleteWorkstation = async (user_id) => {

        try {
            console.log(user_id);
            const response = await api.delete('/workstations/' + user_id);

            if (response.status === 201 || response.status === 200) {
                fetchWorkstations();
            }
        } catch (error) {
            alert('Erro ao obter o id: ' + error.response?.data?.detail);
        }

    };

    return (
        <div style={{ width: '100%', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>


            <div>


                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3f4d67' }}>
                    <CiUser color="#3f4d67" /> Setores
                </h2>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button variant='primary' onClick={() => setShowWorkstationModal(true)} style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#3f4d67', fontSize: '15px' }}> <CiCirclePlus /> Novo Setor </button>
                </div>

                <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #3f4d67', textAlign: 'left', color: '#3f4d67' }}>
                            <th style={{ padding: '10px' }}>ID</th>
                            <th style={{ padding: '10px' }}>Setor</th>
                            <th style={{ padding: '10px' }}>Encarregado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workstations.map((op, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #3f4d67', color: '#3f4d67' }}>
                                <td style={{ padding: '10px' }}>{op.id}</td>
                                <td style={{ padding: '10px' }}>{op.name}</td>
                                <td style={{ padding: '10px' }}>{op.head}</td>
                                <td onClick={() => confirmDelete(op.id)} style={{ color: 'red', cursor: 'pointer' }}><CiTrash /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            </div>

            <ModalNewWorkstation
                show={showWorkstationModal}
                handleClose={() => setShowWorkstationModal(false)}
                refreshList={fetchWorkstations}
            />

            <ConfirmDelItem
                show={showDelModal}
                handleClose={() => setShowDelModal(false)}
                onConfirm={handleExecuteDelete}
            />
        </div>
    );
}


export default Workstations;