import React, { useEffect, useState } from "react";
import api from './api';
import { CiCirclePlus, CiUser, CiTrash } from "react-icons/ci";
import { LuGroup } from "react-icons/lu";
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
        <div className="com-sidebar page-shell">
            <div>
                <h2 className="page-title">
                    <LuGroup color="#3f4d67" /> Setores
                </h2>

                <div className="actions-right">
                    <button variant='primary' onClick={() => setShowWorkstationModal(true)} className="primary-btn"> <CiCirclePlus size={20} /> Novo Setor </button>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Setor</th>
                            <th>Encarregado</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workstations.map((op, index) => (
                            <tr key={index}>
                                <td>{op.id}</td>
                                <td>{op.name}</td>
                                <td>{op.head}</td>
                                <td className="cell-actions" onClick={() => confirmDelete(op.id)} style={{ color: 'red', cursor: 'pointer' }}><CiTrash /></td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

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
                mensagem={"Ao deletar o setor, os usuários que fazem parte dele também serão deletados."}
            />
        </div>
    );
}


export default Workstations;