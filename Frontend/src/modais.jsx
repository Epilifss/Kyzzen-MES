// import { useState } from 'react';
import React, { useState } from "react";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import api from './api';

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
                            <Form.Select value={workstation}
                                onChange={(e) => setworkstation(e.target.value)}
                            >
                                <option value="0">TI</option>
                                <option value="1">RH</option>
                                <option value="2">Vendas</option>
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
    const [workstationHead, setWorkstationHead] = useState('0');

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
                    <Modal.Title>Criar novo usuário</Modal.Title>
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

export function ConfirmDelItem({ show, handleClose, onConfirm }) {
    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Tem certeza?</Modal.Title>
            </Modal.Header>
            <Modal.Body>Essa ação não poderá ser desfeita.</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
                <Button variant="danger" onClick={onConfirm}>Sim, deletar.</Button>
            </Modal.Footer>
        </Modal>
    );
}