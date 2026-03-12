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
        has_password: initialValue?.has_password ?? false,
    });
};

export function ModalNewUser({ show, handleClose, refreshList }) {

    const [username, setUsername] = useState('');
    const [fullname, setFullname] = useState('');
    const [password, setPassword] = useState('');
    const [workstation, setworkstation] = useState('0');
    const [role, setRole] = useState('Admin');

    const cancel = async (e) => {
        if (e) e.preventDefault();

        try {
            handleClose();

            setUsername('');
            setFullname('');
            setPassword('');
        } catch (error) {
            console.log("Erro ao limpar os campos: " + error.response?.data?.detail)
        }
    }

    const csl = async (e) => {
        if (e) e.preventDefault();

        try {

            const dadosParaEnviar = {
                username: username,
                full_name: fullname,
                password: password,
                workstation_id: workstation,
                role: role
            };

            const response = await api.post('/users/', dadosParaEnviar);

            if (response.status === 201 || response.status === 200) {
                refreshList();

                handleClose();

                setUsername('');
                setFullname('');
                setPassword('');

            }
        } catch (error) {
            alert('Erro ao tentar criar novo usuário: ' + error.response?.data?.detail);
        }
    }

    const [workstationsList, setWorkstationsList] = useState([])

    useEffect(() => {
        const fetchWorkstations = async () => {
            try {
                const response = await api.get('/workstations/');
                setWorkstationsList(response.data)
            } catch (error) {
                console.error("Erro ao buscar setores:", error);
            }
        };
        fetchWorkstations();
    }, []);

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Criar novo usuário</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Usuário</Form.Label>
                            <Form.Control
                                type="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Sobrenome</Form.Label>
                            <Form.Control
                                type="fullname"
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
                        <Form.Group
                            className="mb-3"
                        >
                            <Form.Label>Setor</Form.Label>
                            <Form.Select onChange={(e) => setworkstation(e.target.value)}>

                                <option value="">Selecione um setor...</option>
                                {workstationsList.map((ws) => (
                                    <option key={ws.id} value={ws.id}>
                                        {ws.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group
                            className="mb-3"
                        >
                            <Form.Label>Função</Form.Label>
                            <Form.Select value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="Admin">Admin</option>
                                <option value="Trançador">Trançador</option>
                                <option value="Vendedor">Vendedor</option>
                            </Form.Select>
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
        has_password: false,
    });
    const [availableFields, setAvailableFields] = useState([]);
    const [selectedFields, setSelectedFields] = useState([]);
    const [isLoadingFields, setIsLoadingFields] = useState(false);
    const [fieldsError, setFieldsError] = useState('');

    useEffect(() => {
        if (show) {
            resetDatabaseConfigForm(setFormData, initialData);
            setAvailableFields([]);
            setSelectedFields([]);
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

        if (!formData.server || !formData.username || !formData.database_name || !formData.table_name) {
            setFieldsError('Preencha servidor, usuário, banco e tabela antes de carregar os campos.');
            return;
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
            };

            const response = await api.post('/configs/preview-fields', payload);
            const fields = response.data?.fields || [];

            setAvailableFields(fields);
            setSelectedFields(fields);
        } catch (error) {
            setFieldsError(error.response?.data?.detail || 'Não foi possível recuperar os campos da tabela.');
            setAvailableFields([]);
            setSelectedFields([]);
        } finally {
            setIsLoadingFields(false);
        }
    };

    const handleFieldSelectionChange = (event) => {
        const selectedValues = Array.from(event.target.selectedOptions).map((option) => option.value);
        setSelectedFields(selectedValues);
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
            table_name: formData.table_name,
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
                            placeholder={formData.db_type === 'sqlserver' ? 'Ex.: dbo.PEDIDOS' : 'Ex.: public.orders'}
                        />
                    </Form.Group>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                        <Button variant="outline-primary" onClick={previewFields} disabled={isLoadingFields}>
                            {isLoadingFields ? 'Carregando campos...' : 'Carregar campos da tabela'}
                        </Button>
                    </div>

                    {fieldsError && (
                        <div style={{ color: '#b42318', marginBottom: '10px', fontSize: '14px' }}>
                            {fieldsError}
                        </div>
                    )}

                    {availableFields.length > 0 && (
                        <Form.Group className="mb-3">
                            <Form.Label>Campos recuperados da conexão (seleção múltipla)</Form.Label>
                            <Form.Select multiple value={selectedFields} onChange={handleFieldSelectionChange} style={{ minHeight: '130px' }}>
                                {availableFields.map((field) => (
                                    <option key={field} value={field}>
                                        {field}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Text>
                                Esses campos são recuperados da tabela externa para uso no fluxo de pedidos, sem gravar os pedidos no banco local nesta etapa.
                            </Form.Text>
                        </Form.Group>
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