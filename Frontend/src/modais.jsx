// import { useState } from 'react';
import React, { useState, useEffect } from "react";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import api from './api';

const resetDatabaseConfigForm = (setFormData, initialValue = null) => {
    setFormData({
        id: initialValue?.id ?? null,
        name: initialValue?.name ?? '',
        db_type: initialValue?.db_type ?? 'postgresql',
        server: initialValue?.server ?? '',
        username: initialValue?.username ?? '',
        password: '',
        database_name: initialValue?.database_name ?? '',
        table_name: initialValue?.table_name ?? '',
        custom_query: initialValue?.custom_query ?? '',
        has_password: initialValue?.has_password ?? false,
        selected_fields: initialValue?.selected_fields ?? [],
        distinct_column: initialValue?.distinct_column ?? null,
        order_detail_fields: initialValue?.order_detail_fields ?? [],
        order_item_fields: initialValue?.order_item_fields ?? [],
    });
};

export const ALL_PERMISSIONS = [
    { key: 'dashboard', label: 'Início (Dashboard)' },
    { key: 'orders', label: 'Pedidos' },
    { key: 'pcp_release', label: 'PCP: liberar produção' },
    { key: 'registrations', label: 'Cadastros' },
    { key: 'users', label: 'Usuários' },
    { key: 'workstations', label: 'Setores' },
    { key: 'sector_tasks', label: 'Chefia: fila do setor' },
    { key: 'operator_panel', label: 'Operador: painel de produção' },
    { key: 'configs', label: 'Configurações de Banco' },
    { key: 'roles', label: 'Funções (Perfis)' },
];

export function ModalRole({ show, handleClose, initialData = null, onSaved }) {
    const [name, setName] = useState('');
    const [selectedPerms, setSelectedPerms] = useState([]);

    useEffect(() => {
        if (show) {
            setName(initialData?.name ?? '');
            setSelectedPerms(initialData?.permissions ?? []);
        }
    }, [show, initialData]);

    const togglePerm = (key) => {
        setSelectedPerms(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const save = async () => {
        if (!name.trim()) { alert('Informe o nome da função.'); return; }
        try {
            let response;
            if (initialData?.id) {
                response = await api.put(`/roles/${initialData.id}`, { name: name.trim(), permissions: selectedPerms });
            } else {
                response = await api.post('/roles/', { name: name.trim(), permissions: selectedPerms });
            }
            if (response.status === 200 || response.status === 201) {
                onSaved?.(response.data);
                handleClose();
            }
        } catch (error) {
            alert('Erro ao salvar função: ' + error.response?.data?.detail);
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{initialData?.id ? 'Editar Função' : 'Nova Função'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Nome da Função</Form.Label>
                        <Form.Control value={name} onChange={e => setName(e.target.value)} autoFocus />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Permissões de Acesso</Form.Label>
                        {ALL_PERMISSIONS.map(p => (
                            <Form.Check
                                key={p.key}
                                type="checkbox"
                                label={p.label}
                                checked={selectedPerms.includes(p.key)}
                                onChange={() => togglePerm(p.key)}
                            />
                        ))}
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} style={{ backgroundColor: 'red' }}>Cancelar</Button>
                <Button variant="primary" onClick={save}>Salvar</Button>
            </Modal.Footer>
        </Modal>
    );
}

export function ModalMaterial({ show, handleClose, initialData = null, onSaved }) {
    const [name, setName] = useState('');
    const [workstationId, setWorkstationId] = useState('');
    const [workstations, setWorkstations] = useState([]);

    const fetchWorkstations = async () => {
        try {
            const response = await api.get('/workstations/');
            setWorkstations(response.data || []);
        } catch (error) {
            console.error('Erro ao buscar setores para material:', error);
            setWorkstations([]);
        }
    };

    useEffect(() => {
        if (show) {
            setName(initialData?.name ?? '');
            setWorkstationId(initialData?.workstation_id ? String(initialData.workstation_id) : '');
            fetchWorkstations();
        }
    }, [show, initialData]);

    const save = async () => {
        if (!name.trim()) { alert('Informe o nome do material.'); return; }
        try {
            let response;
            const payload = {
                name: name.trim(),
                workstation_id: workstationId ? parseInt(workstationId, 10) : null,
            };
            if (initialData?.id) {
                response = await api.put(`/material_types/${initialData.id}`, payload);
            } else {
                response = await api.post('/material_types/', payload);
            }
            if (response.status === 200 || response.status === 201) {
                onSaved?.(response.data);
                handleClose();
            }
        } catch (error) {
            alert('Erro ao salvar material: ' + error.response?.data?.detail);
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{initialData?.id ? 'Editar Material' : 'Novo Material'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Nome do Material</Form.Label>
                        <Form.Control value={name} onChange={e => setName(e.target.value)} autoFocus />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Setor responsável</Form.Label>
                        <Form.Select value={workstationId} onChange={(e) => setWorkstationId(e.target.value)}>
                            <option value="">Selecione (opcional)</option>
                            {workstations.map((workstation) => (
                                <option key={workstation.id} value={workstation.id}>
                                    {workstation.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} style={{ backgroundColor: 'red' }}>Cancelar</Button>
                <Button variant="primary" onClick={save}>Salvar</Button>
            </Modal.Footer>
        </Modal>
    );
}

export function ModalNewUser({ show, handleClose, refreshList, initialData = null, onSaved }) {

    const [username, setUsername] = useState('');
    const [fullname, setFullname] = useState('');
    const [password, setPassword] = useState('');
    const [workstation, setWorkstation] = useState('');
    const [roleId, setRoleId] = useState('');
    const [rolesList, setRolesList] = useState([]);
    const [workstationsList, setWorkstationsList] = useState([]);
    const [showRoleModal, setShowRoleModal] = useState(false);

    const reset = () => {
        setUsername('');
        setFullname('');
        setPassword('');
        setWorkstation('');
        setRoleId('');
    };

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles/');
            setRolesList(response.data);
        } catch (error) {
            console.error("Erro ao buscar funções:", error);
        }
    };

    useEffect(() => {
        if (!show) {
            reset();
            return;
        }

        if (initialData?.id) {
            setUsername(initialData.username ?? '');
            setFullname(initialData.full_name ?? initialData.fullname ?? '');
            setPassword('');
            setWorkstation(initialData.workstation_id ? String(initialData.workstation_id) : '');
            setRoleId(initialData.role_id ? String(initialData.role_id) : '');
            return;
        }

        reset();
    }, [show, initialData?.id]);

    useEffect(() => {
        if (show) {
            const fetchWorkstations = async () => {
                try {
                    const response = await api.get('/workstations/');
                    setWorkstationsList(response.data);
                } catch (error) {
                    console.error("Erro ao buscar setores:", error);
                }
            };
            fetchWorkstations();
            fetchRoles();
        }
    }, [show]);

    const handleRoleSaved = (newRole) => {
        setRolesList(prev => {
            const exists = prev.find(r => r.id === newRole.id);
            if (exists) return prev.map(r => r.id === newRole.id ? newRole : r);
            return [...prev, newRole];
        });
        setRoleId(String(newRole.id));
    };

    const save = async () => {
        if (!username || (!initialData?.id && !password)) {
            alert('Usuário e senha são obrigatórios.');
            return;
        }
        try {
            let response;
            if (initialData?.id) {
                response = await api.put(`/users/${initialData.id}`, {
                    username: username.trim(),
                    full_name: fullname,
                    password,
                    workstation_id: workstation ? parseInt(workstation, 10) : 0,
                    role_id: roleId ? parseInt(roleId, 10) : null,
                });
            } else {
                response = await api.post(`/users/`, {
                    username,
                    full_name: fullname,
                    password,
                    workstation_id: workstation ? parseInt(workstation, 10) : 0,
                    role_id: roleId ? parseInt(roleId, 10) : null,
                });
            }
            if (response.status === 200 || response.status === 201) {
                refreshList();
                onSaved?.(response.data);
                handleClose();
                reset();
            }
        } catch (error) {
            alert('Erro ao tentar criar novo usuário: ' + error.response?.data?.detail);
        }
    };

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{initialData?.id ? 'Editar Usuário' : 'Novo Usuário'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Usuário</Form.Label>
                            <Form.Control
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nome Completo</Form.Label>
                            <Form.Control
                                type="text"
                                value={fullname}
                                onChange={(e) => setFullname(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Senha</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Setor</Form.Label>
                            <Form.Select value={workstation} onChange={(e) => setWorkstation(e.target.value)}>
                                <option value="">Selecione um setor...</option>
                                {workstationsList.map((ws) => (
                                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <Form.Label className="mb-0">Função</Form.Label>
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => setShowRoleModal(true)}
                                    title="Criar nova função"
                                    style={{ lineHeight: 1, padding: '0 6px' }}
                                >+</Button>
                            </div>
                            <Form.Select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                                <option value="">Selecione uma função...</option>
                                {rolesList.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { reset(); handleClose(); }} style={{ backgroundColor: 'red' }}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={save}>
                        Salvar
                    </Button>
                </Modal.Footer>
            </Modal>
            <ModalRole
                show={showRoleModal}
                handleClose={() => setShowRoleModal(false)}
                onSaved={handleRoleSaved}
            />
        </>
    );
}

export function ModalNewComponent({ show, handleClose, refreshList, initialData = null, onSaved }) {

    const [cod, setCod] = useState('');
    const [desc, setDesc] = useState('');
    const [line, setLine] = useState('');
    const [materialIds, setMaterialIds] = useState([]);
    const [base_points, setPoints] = useState('');
    const [materialList, setMaterialList] = useState([]);
    const [showMaterialModal, setShowMaterialModal] = useState(false);

    const reset = () => {
        setCod('');
        setDesc('');
        setLine('');
        setMaterialIds([]);
        setPoints('');
    };

    const fetchMaterialTypes = async () => {
        try {
            const response = await api.get('/material_types/');
            setMaterialList(response.data || []);
        } catch (error) {
            console.error("Erro ao buscar tipo de materiais:", error);
            setMaterialList([]);
        }
    };

    useEffect(() => {
        if (!show) {
            reset();
            return;
        }

        fetchMaterialTypes();

        if (initialData?.id) {
            setCod(initialData.cod ?? '');
            setDesc(initialData.desc ?? '');
            setLine(initialData.line ?? '');
            setPoints(initialData.base_points ?? '');
            if (initialData.material_id !== null && initialData.material_id !== undefined) {
                setMaterialIds([String(initialData.material_id)]);
            } else {
                setMaterialIds([]);
            }
            return;
        }

        reset();
    }, [show, initialData?.id]);

    const save = async () => {
        const isEditing = Boolean(initialData?.id);

        if (!cod || !desc || !line) {
            alert('Código, descrição e linha são obrigatórios.');
            return;
        }

        const pointsValue = parseInt(base_points, 10);
        if (Number.isNaN(pointsValue)) {
            alert('Informe um valor numérico válido em pontos.');
            return;
        }

        try {
            const selectedMaterialIds = materialIds.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id));
            if (selectedMaterialIds.length === 0) {
                alert('Selecione ao menos um tipo de material.');
                return;
            }

            const materialId = selectedMaterialIds[0];

            let response;
            if (isEditing) {
                response = await api.put(`/components/${initialData.id}`, {
                    cod: cod,
                    desc: desc,
                    line: line,
                    base_points: pointsValue,
                    material_id: materialId,
                    // workstation_id: workstation ? parseInt(workstation, 10) : 0,
                    // role_id: roleId ? parseInt(roleId, 10) : null,
                });
            } else {
                response = await api.post(`/components/`, {
                    cod,
                    desc,
                    line,
                    base_points: pointsValue,
                    material_id: materialId,
                    // workstation_id: workstation ? parseInt(workstation, 10) : 0,
                    // role_id: roleId ? parseInt(roleId, 10) : null,
                });
            }
            if (response.status === 200 || response.status === 201) {
                await refreshList?.();
                onSaved?.(response.data);
                handleClose();
                reset();
            }
        } catch (error) {
            const detail = error?.response?.data?.detail;
            const detailText = Array.isArray(detail)
                ? detail.map((item) => item?.msg || JSON.stringify(item)).join(' | ')
                : detail;
            alert('Erro ao tentar salvar componente: ' + (detailText || error?.message || 'erro desconhecido'));
        }
    };

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{initialData?.id ? 'Editar Componente' : 'Novo Componente'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Código</Form.Label>
                            <Form.Control
                                type="text"
                                value={cod}
                                onChange={(e) => setCod(e.target.value)}
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Descrição</Form.Label>
                            <Form.Control
                                type="text"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Linha</Form.Label>
                            <Form.Control
                                type="text"
                                value={line}
                                onChange={(e) => setLine(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Tipos de materiais (marque um ou mais)</Form.Label>
                            <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => setShowMaterialModal(true)}
                                    title="Criar novo material"
                                    style={{ lineHeight: 1, padding: '0 6px' }}
                                >+</Button>
                            <div style={{ border: '1px solid #d0d5dd', borderRadius: '8px', padding: '12px', maxHeight: '220px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                                {materialList.length === 0 && (
                                    <div style={{ color: '#5f6c81', fontSize: '14px' }}>Nenhum tipo de material cadastrado.</div>
                                )}
                                {materialList.map((material) => (
                                    <Form.Check
                                        key={material.id}
                                        type="checkbox"
                                        id={`product-material-${material.id}`}
                                        label={material.name}
                                        checked={materialIds.includes(String(material.id))}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setMaterialIds((current) => [...current, String(material.id)]);
                                            } else {
                                                setMaterialIds((current) => current.filter((id) => id !== String(material.id)));
                                            }
                                        }}
                                        style={{ marginBottom: '8px' }}
                                    />
                                ))}
                            </div>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Pontos</Form.Label>
                            <Form.Control
                                type="number"
                                value={base_points}
                                onChange={(e) => setPoints(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { reset(); handleClose(); }} style={{ backgroundColor: 'red' }}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={save}>
                        Salvar
                    </Button>
                </Modal.Footer>
            </Modal>
            <ModalMaterial
                show={showMaterialModal}
                handleClose={() => setShowMaterialModal(false)}
                onSaved={fetchMaterialTypes}
            />
        </>
    );
}

export function ModalNewProduct({ show, handleClose, refreshList, initialData = null, onSaved }) {

    const [cod, setCod] = useState('');
    const [desc, setDesc] = useState('');
    const [line, setLine] = useState('');
    const [base_points, setPoints] = useState('');
    const [materialIds, setMaterialIds] = useState([]);
    const [materialList, setMaterialList] = useState([]);
    const [componentIds, setComponentIds] = useState([]);
    const [componentsList, setComponentsList] = useState([]);
    const [showMaterialModal, setShowMaterialModal] = useState(false);

    const reset = () => {
        setCod('');
        setDesc('');
        setLine('');
        setPoints('');
        setMaterialIds([]);
        setComponentIds([]);
    };

    const fetchMaterialTypes = async () => {
        try {
            const response = await api.get('/material_types/');
            setMaterialList(response.data || []);
        } catch (error) {
            console.error("Erro ao buscar tipo de materiais:", error);
            setMaterialList([]);
        }
    };

    const fetchComponents = async () => {
        try {
            const response = await api.get('/components/');
            setComponentsList(response.data || []);
        } catch (error) {
            console.error("Erro ao buscar componentes:", error);
            setComponentsList([]);
        }
    };

    useEffect(() => {
        if (!show) {
            reset();
            return;
        }

        fetchMaterialTypes();
        fetchComponents();

        if (initialData?.id) {
            setCod(initialData.cod ?? '');
            setDesc(initialData.desc ?? '');
            setLine(initialData.line ?? '');
            setPoints(initialData.base_points ?? '');
            const selected = initialData.product_data?.material_type_ids || [];
            setMaterialIds(Array.isArray(selected) ? selected.map((id) => String(id)) : []);
            const selectedComponents = initialData.product_data?.component_ids || [];
            setComponentIds(Array.isArray(selectedComponents) ? selectedComponents.map((id) => String(id)) : []);
            return;
        }

        reset();
    }, [show, initialData?.id]);

    useEffect(() => {
        if (materialIds.length === 0) {
            setComponentIds([]);
            return;
        }

        const selectedMaterialIds = materialIds
            .map((id) => parseInt(id, 10))
            .filter((id) => !Number.isNaN(id));

        setComponentIds((current) =>
            current.filter((componentId) => {
                const component = componentsList.find((item) => String(item.id) === String(componentId));
                return component && selectedMaterialIds.includes(component.material_id);
            })
        );
    }, [materialIds, componentsList]);

    const save = async () => {
        if (!cod || !desc || !line) {
            alert('Código, descrição e linha são obrigatórios.');
            return;
        }

        const pointsValue = parseInt(base_points, 10);
        if (Number.isNaN(pointsValue)) {
            alert('Informe um valor numérico válido em pontos.');
            return;
        }

        try {
            const selectedMaterialIds = materialIds.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id));
            const selectedMaterialNames = materialList
                .filter((material) => selectedMaterialIds.includes(material.id))
                .map((material) => material.name);

            const selectedComponentIds = componentIds.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id));
            const selectedComponents = componentsList.filter((component) => selectedComponentIds.includes(component.id));
            const selectedComponentNames = selectedComponents.map((component) => component.desc);

            const compositionByMaterial = selectedComponents.reduce((acc, component) => {
                const material = materialList.find((item) => item.id === component.material_id);
                const key = material?.name || `material_${component.material_id}`;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push({
                    id: component.id,
                    cod: component.cod,
                    desc: component.desc,
                });
                return acc;
            }, {});

            const productData = {
                material_type_ids: selectedMaterialIds,
                material_type_names: selectedMaterialNames,
                component_ids: selectedComponentIds,
                component_names: selectedComponentNames,
                composition_by_material: compositionByMaterial,
            };

            let response;
            if (initialData?.id) {
                response = await api.put(`/products/${initialData.id}`, {
                    cod: cod,
                    desc: desc,
                    line: line,
                    base_points: pointsValue,
                    product_data: productData,
                    // workstation_id: workstation ? parseInt(workstation, 10) : 0,
                    // role_id: roleId ? parseInt(roleId, 10) : null,
                });
            } else {
                response = await api.post(`/products/`, {
                    cod,
                    desc,
                    line,
                    base_points: pointsValue,
                    product_data: productData,
                    // workstation_id: workstation ? parseInt(workstation, 10) : 0,
                    // role_id: roleId ? parseInt(roleId, 10) : null,
                });
            }
            if (response.status === 200 || response.status === 201) {
                refreshList();
                onSaved?.(response.data);
                handleClose();
                reset();
            }
        } catch (error) {
            alert('Erro ao tentar criar novo produto: ' + error.response?.data?.detail);
        }
    };

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{initialData?.id ? 'Editar Produto' : 'Novo Produto'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Código</Form.Label>
                            <Form.Control
                                type="text"
                                value={cod}
                                onChange={(e) => setCod(e.target.value)}
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Descrição</Form.Label>
                            <Form.Control
                                type="text"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Linha</Form.Label>
                            <Form.Control
                                type="text"
                                value={line}
                                onChange={(e) => setLine(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Pontos</Form.Label>
                            <Form.Control
                                type="number"
                                value={base_points}
                                onChange={(e) => setPoints(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Tipos de materiais (marque um ou mais)</Form.Label>
                            <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => setShowMaterialModal(true)}
                                    title="Criar novo material"
                                    style={{ lineHeight: 1, padding: '0 6px' }}
                                >+</Button>
                            <div style={{ border: '1px solid #d0d5dd', borderRadius: '8px', padding: '12px', maxHeight: '220px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                                {materialList.length === 0 && (
                                    <div style={{ color: '#5f6c81', fontSize: '14px' }}>Nenhum tipo de material cadastrado.</div>
                                )}
                                {materialList.map((material) => (
                                    <Form.Check
                                        key={material.id}
                                        type="checkbox"
                                        id={`product-material-${material.id}`}
                                        label={material.name}
                                        checked={materialIds.includes(String(material.id))}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setMaterialIds((current) => [...current, String(material.id)]);
                                            } else {
                                                setMaterialIds((current) => current.filter((id) => id !== String(material.id)));
                                            }
                                        }}
                                        style={{ marginBottom: '8px' }}
                                    />
                                ))}
                            </div>
                        </Form.Group>

                        <Form.Group className="mt-3">
                            <Form.Label>Composição do produto (componentes)</Form.Label>
                            <div style={{ border: '1px solid #d0d5dd', borderRadius: '8px', padding: '12px', maxHeight: '220px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                                {materialIds.length === 0 && (
                                    <div style={{ color: '#5f6c81', fontSize: '14px' }}>Selecione ao menos um tipo de material para escolher os componentes.</div>
                                )}

                                {materialIds.length > 0 && componentsList
                                    .filter((component) => materialIds.includes(String(component.material_id)))
                                    .map((component) => {
                                        const materialName = materialList.find((item) => item.id === component.material_id)?.name || 'Material não encontrado';

                                        return (
                                            <Form.Check
                                                key={component.id}
                                                type="checkbox"
                                                id={`product-component-${component.id}`}
                                                label={`${component.cod} - ${component.desc} (${materialName})`}
                                                checked={componentIds.includes(String(component.id))}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setComponentIds((current) => [...current, String(component.id)]);
                                                    } else {
                                                        setComponentIds((current) => current.filter((id) => id !== String(component.id)));
                                                    }
                                                }}
                                                style={{ marginBottom: '8px' }}
                                            />
                                        );
                                    })}

                                {materialIds.length > 0 && componentsList.filter((component) => materialIds.includes(String(component.material_id))).length === 0 && (
                                    <div style={{ color: '#5f6c81', fontSize: '14px' }}>Nenhum componente cadastrado para os materiais selecionados.</div>
                                )}
                            </div>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { reset(); handleClose(); }} style={{ backgroundColor: 'red' }}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={save}>
                        Salvar
                    </Button>
                </Modal.Footer>
            </Modal>
            <ModalMaterial
                show={showMaterialModal}
                handleClose={() => setShowMaterialModal(false)}
                onSaved={fetchMaterialTypes}
            />
        </>
    );
}

export function ModalNewWorkstation({ show, handleClose, refreshList }) {

    const [workstationName, setWorkstationName] = useState('');
    const [workstationHead, setWorkstationHead] = useState('');

    const cancel = async (e) => {
        if (e) e.preventDefault();

        try {
            handleClose();

            setWorkstationName('');
            setWorkstationHead('');
        } catch (error) {
            console.log("Erro ao limpar os campos: " + error.response?.data?.detail)
        }
    }

    const csl = async (e) => {
        if (e) e.preventDefault();

        try {

            const dadosParaEnviar = {
                name: workstationName,
                head: workstationHead
            };

            const response = await api.post('/workstations/', dadosParaEnviar);

            if (response.status === 201 || response.status === 200) {
                refreshList();

                handleClose();

                setWorkstationName('');
                setWorkstationHead('');

            }
        } catch (error) {
            alert('Erro ao tentar criar novo setor: ' + error.response?.data?.detail);
        }



    }

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Criar novo setor</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Nome</Form.Label>
                            <Form.Control
                                type="text"
                                value={workstationName}
                                onChange={(e) => setWorkstationName(e.target.value)}
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Encarregado</Form.Label>
                            <Form.Control
                                type="text"
                                value={workstationHead}
                                onChange={(e) => setWorkstationHead(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { cancel(); handleClose() }} style={{ backgroundColor: 'red' }}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={() => { csl(); handleClose() }}>
                        Adicionar
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export function ConfirmDelItem({ show, handleClose, onConfirm, mensagem }) {
    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Tem certeza?</Modal.Title>
            </Modal.Header>
            <Modal.Body>{mensagem}</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
                <Button variant="danger" onClick={onConfirm}>Sim, deletar.</Button>
            </Modal.Footer>
        </Modal>
    );
}


export function ModalDatabaseConfig({ show, handleClose, refreshList, initialData }) {
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        db_type: 'postgresql',
        server: '',
        username: '',
        password: '',
        database_name: '',
        table_name: '',
        custom_query: '',
        has_password: false,
        selected_fields: [],
        distinct_column: null,
        order_detail_fields: [],
        order_item_fields: [],
    });
    const [availableFields, setAvailableFields] = useState([]);
    const [selectedFields, setSelectedFields] = useState([]);
    const [isLoadingFields, setIsLoadingFields] = useState(false);
    const [fieldsError, setFieldsError] = useState('');

    useEffect(() => {
        if (show) {
            resetDatabaseConfigForm(setFormData, initialData);
            setAvailableFields(initialData?.selected_fields ?? []);
            setSelectedFields(initialData?.selected_fields ?? []);
            setFieldsError('');
            setIsLoadingFields(false);
        }
    }, [show, initialData]);

    const handleFieldChange = (field) => (event) => {
        setFormData((currentData) => ({
            ...currentData,
            [field]: event.target.value,
        }));
    };

    const cancel = (event) => {
        if (event) event.preventDefault();
        resetDatabaseConfigForm(setFormData, initialData);
        setAvailableFields([]);
        setSelectedFields([]);
        setFieldsError('');
        setIsLoadingFields(false);
        handleClose();
    };

    const previewFields = async () => {
        setFieldsError('');

        const usingCustomQuery = Boolean((formData.custom_query || '').trim());

        if (!formData.server || !formData.username || !formData.database_name) {
            setFieldsError('Preencha servidor, usuário e banco antes de carregar os campos.');
            return;
        }

        if (!usingCustomQuery && !formData.table_name) {
            setFieldsError('Preencha a tabela ou informe uma query personalizada.');
            return;
        }

        if (usingCustomQuery) {
            // Strip block comments (/* ... */) and line comments (-- ...) before validating
            const strippedQuery = formData.custom_query
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .replace(/--[^\n]*/g, '')
                .trim()
                .toLowerCase();
            if (!strippedQuery.startsWith('select') && !strippedQuery.startsWith('with')) {
                setFieldsError('A query personalizada deve iniciar com SELECT ou WITH (CTE).');
                return;
            }
        }

        setIsLoadingFields(true);
        try {
            const payload = {
                config_id: initialData?.id ?? null,
                db_type: formData.db_type,
                server: formData.server,
                username: formData.username,
                password: formData.password,
                database_name: formData.database_name,
                table_name: formData.table_name,
                custom_query: formData.custom_query,
            };

            const response = await api.post('/configs/preview-fields', payload);
            const fields = response.data?.fields || [];
            const persistedSelectedFields = formData.selected_fields || [];
            const preservedSelectedFields = persistedSelectedFields.filter((field) => fields.includes(field));

            setAvailableFields(fields);
            setSelectedFields(preservedSelectedFields.length > 0 ? preservedSelectedFields : fields);
        } catch (error) {
            setFieldsError(error.response?.data?.detail || 'Não foi possível recuperar os campos da tabela.');
            setAvailableFields([]);
            setSelectedFields([]);
        } finally {
            setIsLoadingFields(false);
        }
    };

    const handleFieldCheckboxChange = (field) => {
        setSelectedFields((currentFields) => {
            if (currentFields.includes(field)) {
                return currentFields.filter((item) => item !== field);
            }
            return [...currentFields, field];
        });
    };

    const saveConfig = async (event) => {
        if (event) event.preventDefault();

        const payload = {
            name: formData.name,
            db_type: formData.db_type,
            server: formData.server,
            username: formData.username,
            password: formData.password,
            database_name: formData.database_name,
            table_name: formData.custom_query ? '' : formData.table_name,
            custom_query: formData.custom_query,
            selected_fields: selectedFields,
            distinct_column: formData.distinct_column,
            order_detail_fields: formData.order_detail_fields,
            order_item_fields: formData.order_item_fields,
        };

        try {
            const response = initialData?.id
                ? await api.put(`/configs/${initialData.id}`, payload)
                : await api.post('/configs/', payload);

            if (response.status === 201 || response.status === 200) {
                refreshList();
                handleClose();
                resetDatabaseConfigForm(setFormData, null);
            }
        } catch (error) {
            alert('Erro ao salvar configuração: ' + error.response?.data?.detail);
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{initialData?.id ? 'Editar configuração' : 'Nova configuração'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Nome da configuração</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.name}
                            onChange={handleFieldChange('name')}
                            autoFocus
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Servidor</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.server}
                            onChange={handleFieldChange('server')}
                            placeholder={formData.db_type === 'sqlserver' ? 'Ex.: HOST\\INSTANCIA ou HOST,1433' : 'Ex: 192.168.0.1:5432'}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Tipo de banco</Form.Label>
                        <Form.Select value={formData.db_type} onChange={handleFieldChange('db_type')}>
                            <option value="postgresql">PostgreSQL</option>
                            <option value="sqlserver">SQL Server</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Usuário</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.username}
                            onChange={handleFieldChange('username')}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Senha</Form.Label>
                        <Form.Control
                            type="password"
                            value={formData.password}
                            onChange={handleFieldChange('password')}
                            placeholder={initialData?.has_password ? 'Preencha apenas para alterar a senha' : ''}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Banco de dados</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.database_name}
                            onChange={handleFieldChange('database_name')}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Tabela</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.table_name}
                            onChange={handleFieldChange('table_name')}
                            disabled={Boolean((formData.custom_query || '').trim())}
                            placeholder={formData.db_type === 'sqlserver' ? 'Ex.: dbo.PEDIDOS' : 'Ex.: public.orders'}
                        />
                        <Form.Text>
                            Se você preencher a query personalizada abaixo, o campo tabela deixa de ser obrigatório.
                        </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Query personalizada (opcional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={formData.custom_query}
                            onChange={handleFieldChange('custom_query')}
                            placeholder="Ex.: SELECT pedido, cliente, filial FROM dbo.PEDIDOS WHERE status = 'aberto'"
                        />
                        <Form.Text>
                            Use apenas SELECT. Quando informada, essa query será usada no lugar da tabela para carregar campos e pedidos.
                        </Form.Text>
                    </Form.Group>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                        <Button variant="outline-primary" onClick={previewFields} disabled={isLoadingFields}>
                            {isLoadingFields ? 'Carregando campos...' : 'Carregar campos da fonte'}
                        </Button>
                    </div>

                    {fieldsError && (
                        <div style={{ color: '#b42318', marginBottom: '10px', fontSize: '14px' }}>
                            {fieldsError}
                        </div>
                    )}

                    {availableFields.length > 0 && (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>Campos recuperados da conexão</Form.Label>
                                <div style={{ border: '1px solid #d0d5dd', borderRadius: '8px', padding: '12px', maxHeight: '220px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                                    {availableFields.map((field) => (
                                        <Form.Check
                                            key={field}
                                            type="checkbox"
                                            id={`field-${field}`}
                                            label={field}
                                            checked={selectedFields.includes(field)}
                                            onChange={() => handleFieldCheckboxChange(field)}
                                            style={{ marginBottom: '8px' }}
                                        />
                                    ))}
                                </div>
                                <Form.Text>
                                    Marque os campos que devem entrar na query da tela de pedidos. Somente os campos selecionados serão consultados na base externa.
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Coluna para Deduplicação (opcional)</Form.Label>
                                <Form.Select
                                    value={formData.distinct_column || ''}
                                    onChange={(e) => setFormData({ ...formData, distinct_column: e.target.value || null })}
                                >
                                    <option value="">Nenhuma (não deduplica)</option>
                                    {availableFields.map((field) => (
                                        <option key={field} value={field}>{field}</option>
                                    ))}
                                </Form.Select>
                                <Form.Text>
                                    Selecione uma coluna para eliminar duplicatas. Por ex: se a coluna "pedido" se repete para cada item, selecionar "pedido" exibirá apenas uma linha por pedido único.
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Campos de Detalhes do Pedido (opcional)</Form.Label>
                                <div style={{ border: '1px solid #d0d5dd', borderRadius: '8px', padding: '12px', maxHeight: '180px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                                    {availableFields.map((field) => (
                                        <Form.Check
                                            key={`detail-${field}`}
                                            type="checkbox"
                                            id={`detail-${field}`}
                                            label={field}
                                            checked={formData.order_detail_fields.includes(field)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({ ...formData, order_detail_fields: [...formData.order_detail_fields, field] });
                                                } else {
                                                    setFormData({ ...formData, order_detail_fields: formData.order_detail_fields.filter(f => f !== field) });
                                                }
                                            }}
                                            style={{ marginBottom: '8px' }}
                                        />
                                    ))}
                                </div>
                                <Form.Text>
                                    Selecione os campos que contêm os detalhes principais do pedido (ex: número, cliente, data).
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Campos dos Itens/Produtos (opcional)</Form.Label>
                                <div style={{ border: '1px solid #d0d5dd', borderRadius: '8px', padding: '12px', maxHeight: '180px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                                    {availableFields.map((field) => (
                                        <Form.Check
                                            key={`item-${field}`}
                                            type="checkbox"
                                            id={`item-${field}`}
                                            label={field}
                                            checked={formData.order_item_fields.includes(field)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({ ...formData, order_item_fields: [...formData.order_item_fields, field] });
                                                } else {
                                                    setFormData({ ...formData, order_item_fields: formData.order_item_fields.filter(f => f !== field) });
                                                }
                                            }}
                                            style={{ marginBottom: '8px' }}
                                        />
                                    ))}
                                </div>
                                <Form.Text>
                                    Selecione os campos que contêm informações dos itens/produtos dentro do pedido (ex: código, descrição, quantidade, material).
                                </Form.Text>
                            </Form.Group>
                        </>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={cancel} style={{ backgroundColor: 'red' }}>
                    Cancelar
                </Button>
                <Button variant="primary" onClick={saveConfig}>
                    Salvar
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export function ModalOrderDetails({ show, handleClose, orderData }) {
    if (!orderData) return null;

    const details = orderData._details && typeof orderData._details === 'object'
        ? orderData._details
        : (typeof orderData === 'object' ? orderData : {});
    const items = Array.isArray(orderData._items) ? orderData._items : [];
    const itemHeaders = items.length > 0 ? Object.keys(items[0]) : [];

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Detalhes do Pedido</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="order-details">
                    {typeof details === 'object' && details !== null ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '0.9rem'
                            }}>
                                <tbody>
                                    {Object.entries(details).map(([key, value]) => (
                                        <tr key={key} style={{
                                            borderBottom: '1px solid #ddd',
                                            padding: '8px'
                                        }}>
                                            <td style={{
                                                fontWeight: 'bold',
                                                padding: '8px',
                                                background: '#f5f5f5',
                                                minWidth: '120px',
                                                wordBreak: 'break-word'
                                            }}>
                                                {key}
                                            </td>
                                            <td style={{
                                                padding: '8px',
                                                wordBreak: 'break-word'
                                            }}>
                                                {value === null || value === undefined ? '—' : String(value)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {items.length > 0 && (
                                <div style={{ marginTop: '16px' }}>
                                    <h6 style={{ color: '#3f4d67', marginBottom: '8px' }}>Itens do Pedido</h6>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #d0d5dd', textAlign: 'left' }}>
                                                {itemHeaders.map((header) => (
                                                    <th key={header} style={{ padding: '8px', color: '#3f4d67' }}>{header}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={`${index}-item`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                    {itemHeaders.map((header) => (
                                                        <td key={`${index}-${header}`} style={{ padding: '8px' }}>
                                                            {item?.[header] === null || item?.[header] === undefined ? '—' : String(item[header])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p>Nenhum dado disponível</p>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Fechar
                </Button>
            </Modal.Footer>
        </Modal>
    );
}