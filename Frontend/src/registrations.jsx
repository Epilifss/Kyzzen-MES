import React, { useEffect, useState } from "react";
import api from './api';
import { CiTrash } from "react-icons/ci";
import { NavLink } from "react-router-dom";
import { Home, Users, Settings, Group, LogOut, BookPlus, ShieldCheck, FolderPlus } from "lucide-react";

function Registrations() {

    return (
        <div className="com-sidebar page-shell">
            <div>
                <h2 className="page-title">
                    <FolderPlus color="#3f4d67" /> Cadastros
                </h2>

                <div className="regs">
                    <nav className="regs-btns">
                        <NavLink to="/users" className={({ isActive }) => (isActive ? 'menu-link active-link' : 'menu-link')}>
                            <div className="reg-item">
                                <Users size={20} />
                                <span>Cadastrar Usuários</span>
                            </div>
                        </NavLink>
                    </nav>
                    <nav className="regs-btns">
                        <NavLink to="/workstations" className={({ isActive }) => (isActive ? 'menu-link active-link' : 'menu-link')}>
                            <div className="reg-item">
                                <Group size={20} />
                                <span>Cadastrar Setores</span>
                            </div>
                        </NavLink>
                    </nav>
                </div>

            </div>
        </div>
    );
}


export default Registrations;