import React from "react";
import { NavLink } from "react-router-dom";
import { Users, Group, FolderPlus, ShieldCheck, Package, Layers } from "lucide-react";

function Registrations() {
    const registrationItems = [
        {
            to: "/users",
            icon: Users,
            title: "Usuários",
            description: "Gerencie operadores, perfis de acesso e vínculos com setores.",
            cta: "Cadastrar usuários",
        },
        {
            to: "/workstations",
            icon: Group,
            title: "Setores",
            description: "Organize os setores produtivos e responsáveis de cada área.",
            cta: "Cadastrar setores",
        },
        {
            to: "/roles",
            icon: ShieldCheck,
            title: "Funções",
            description: "Defina permissões e padronize níveis de acesso no sistema.",
            cta: "Gerenciar funções",
        },
        {
            to: "/products",
            icon: Package,
            title: "Produtos",
            description: "Cadastre produtos e configure pontos base para produção.",
            cta: "Cadastrar produtos",
        },
        {
            to: "/components",
            icon: Layers,
            title: "Componentes",
            description: "Mantenha os componentes de produto e seus materiais relacionados.",
            cta: "Cadastrar componentes",
        },
    ];

    return (
        <div className="com-sidebar page-shell registrations-page">
            <section className="registrations-hero">
                <h2 className="page-title">
                    <FolderPlus color="#3f4d67" /> Cadastros
                </h2>
                <p className="muted-text registrations-subtitle">
                    Centralize os principais cadastros mestre do MES e mantenha dados organizados para operação.
                </p>
            </section>

            <section className="registrations-grid" aria-label="Atalhos de cadastro">
                {registrationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink key={item.to} to={item.to} className="registration-card-link">
                            <article className="registration-card">
                                <div className="registration-card-icon">
                                    <Icon size={22} />
                                </div>
                                <div className="registration-card-body">
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </div>
                                <span className="registration-card-cta">{item.cta}</span>
                            </article>
                        </NavLink>
                    );
                })}
            </section>
                </div>
    );
}


export default Registrations;