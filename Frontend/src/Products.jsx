import React, { useEffect, useState } from "react";
import api from './api';
import { CiTrash } from "react-icons/ci";
import { LuUserRoundPlus, LuBoxes, LuPencil } from "react-icons/lu";
import { ModalNewProduct, ConfirmDelItem } from "./modais";

function Products() {
    const [products, setproducts] = useState([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showDelModal, setShowDelModal] = useState(false);
    const [productIdSelected, setproductIdSelected] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products/');
            setproducts(response.data);
        } catch (error) {
            console.error("Erro ao buscar produtos", error)
        }
    }

    const confirmDelete = (id) => {
        setproductIdSelected(id);
        setShowDelModal(true);
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setShowProductModal(true);
    };

    const handleExecuteDelete = async () => {
        if (productIdSelected) {
            await DeleteProduct(productIdSelected);
            setShowDelModal(false);
            setProductIdSelected(null);
        }
    };

    const DeleteProduct = async (product_id) => {

        try {
            console.log(product_id);
            const response = await api.delete('/products/' + product_id);

            if (response.status === 201 || response.status === 200) {
                fetchProducts();
            }
        } catch (error) {
            alert('Erro ao obter o id: ' + error.response?.data?.detail);
        }

    };

    return (
        <div className="com-sidebar page-shell">
            <div>
                <h2 className="page-title">
                    <LuBoxes color="#3f4d67" /> Produtos
                </h2>

                <div className="actions-right">
                    <button
                        variant='primary'
                        onClick={() => {
                            setSelectedProduct(null);
                            setShowProductModal(true);
                        }}
                        className="primary-btn"
                    >
                        <LuBoxes size={20} /> Novo Produto
                    </button>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Descrição</th>
                            <th>Linha</th>
                            <th>Pontos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((op) => (
                            <tr key={op.id}>
                                <td>{op.cod}</td>
                                <td>{op.desc}</td>
                                <td>{op.line}</td>
                                <td>{op.base_points}</td>
                                <td className="cell-actions">
                                    <LuPencil
                                    size={18}
                                    style={{ cursor: 'pointer', color: '#3f4d67' }}
                                    onClick={() => handleEdit(op)}
                                />
                                <CiTrash
                                    size={18}
                                    style={{ cursor: 'pointer', color: 'red' }}
                                    onClick={() => confirmDelete(op.id)}
                                />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

            </div>

            <ModalNewProduct
                key={selectedProduct?.id ?? 'new-product'}
                show={showProductModal}
                handleClose={() => {
                    setShowProductModal(false);
                    setSelectedProduct(null);
                }}
                refreshList={fetchProducts}
                initialData={selectedProduct}
            />

            <ConfirmDelItem
                show={showDelModal}
                handleClose={() => setShowDelModal(false)}
                onConfirm={handleExecuteDelete}
                mensagem={"Esta ação não poderá ser desfeita."}
            />
        </div>
    );
}


export default Products;