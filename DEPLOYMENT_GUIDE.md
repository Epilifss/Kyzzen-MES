# 🚀 Guia de Deployment e Validação

## Pré-Requisitos

- Backend rodando (FastAPI)
- Frontend construído (`npm run build`)
- Banco de dados PostgreSQL/SQL Server conectado

## Passos de Deploy

### 1. Backend - Criar Tabela de Pedidos Importados

O sistema cria automaticamente a tabela ao iniciar. Verifique:

```bash
cd Backend
python main.py
```

Se usar alembic (migrations):
```bash
alembic upgrade head
```

### 2. Frontend - Build

```bash
cd Frontend
npm run build
```

Servir a pasta `dist/` via seu servidor web (nginx, Apache, etc)

### 3. Testar Endpoints

```bash
# Listar pedidos importados
curl http://localhost:8000/orders/imported/

# Importar pedidos
curl -X POST http://localhost:8000/orders/import/ \
  -H "Content-Type: application/json" \
  -d '{
    "config_id": 1,
    "external_ids": ["pedido1", "pedido2"]
  }'
```

## ✅ Checklist de Validação

- [ ] **Deduplicação:**
  - [ ] Selecionar coluna na config e salvar
  - [ ] Atualizar pedidos externos
  - [ ] Verificar que duplicatas foram removidas

- [ ] **Abas e Checkboxes:**
  - [ ] Aba "Pedidos Externos" mostra dados com checkboxes
  - [ ] Aba "Pedidos Importados" inicialmente vazia
  - [ ] "Selecionar Todos" funciona

- [ ] **Importação:**
  - [ ] Selecionar pedidos e clicar "Importar" com sucesso
  - [ ] Mensagem de confirmação aparece
  - [ ] Pedidos aparecem em "Pedidos Importados"
  - [ ] Nova query external atualiza sem duplicatas

- [ ] **Modal de Detalhes:**
  - [ ] Botão "Detalhes" abre modal
  - [ ] Dados do pedido exibidos em tabela
  - [ ] Fechar modal funciona

- [ ] **Responsividade:**
  - [ ] Teste em desktop (1920px), tablet (768px), mobile (375px)
  - [ ] Abas permanecem acessíveis
  - [ ] Checkboxes visíveis e clicáveis
  - [ ] Modal responsiva

- [ ] **Integração:**
  - [ ] Voltar a editar config não quebra UI
  - [ ] Atualizar página mantém seleção logicamente
  - [ ] Erro de conexão com BD externo exibido

## 🐛 Troubleshooting

### Pedidos não aparecem na aba de Importados
- Verificar se backend está rodando
- Verificar resposta de `/orders/imported/` via DevTools
- Verificar BD: `SELECT * FROM imported_orders;`

### Deduplicação não funciona
- Verificar se coluna foi selecionada na config
- Verificar se coluna existe nos dados retornados
- Checar console do navegador para erros

### Build falha
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erro "external_ids format"
- IDs dos pedidos devem ser strings únicas
- Revalidar que a serialização JSON está correta no Orders.jsx

## 📌 Arquitetura de Dados

```
database_configs
├── connection_data (JSONB)
│   ├── selected_fields: ["pedido", "cliente", "valor"]
│   ├── distinct_column: "pedido"
│   ├── order_detail_fields: ["pedido", "cliente"]
│   └── order_item_fields: ["codigo", "descricao", "qtd"]

imported_orders
├── external_id: STRING (JSON serializado do pedido)
├── config_id: FOREIGN KEY
├── order_data: JSONB (cópia dos dados)
├── order_items: JSONB (reservado para itens futuros)
└── import_status: "pending" | "processing" | "completed"
```

## 🎯 Performance Considerations

- **Deduplicação em memória** - Rápida para até ~10k linhas
- Se processar >50k linhas, considere mover lógica para SQL

## 🔐 Segurança

- Passwords de banco externo armazenadas com hash
- Queries customizadas validadas (SELECT/WITH apenas)
- Rate limit em `/orders/import/` recomendado para produção

## 📞 Contato & Suporte

Para issues ou dúvidas, refer-se ao código em:
- Backend: `Backend/main.py` (linhas ~322-430)
- Frontend: `Frontend/src/Orders.jsx` + `Frontend/src/modais.jsx`
