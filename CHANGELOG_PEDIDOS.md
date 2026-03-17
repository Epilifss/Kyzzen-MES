# Implementação: Sistema Dual de Pedidos com Deduplicação e Importação

## 📋 O que foi implementado

### 1️⃣ **Deduplicação de Dados**
- **Campo "Coluna para Deduplicação"** na modal de configuração
- Permite eliminar duplicatas baseado em uma coluna chave (ex: se "pedido" se repete para cada item, seleciona-se "pedido" para exibir apenas uma linha por pedido único)
- Aplicado automaticamente ao buscar pedidos externos

### 2️⃣ **Sistema Dual de Pedidos**
- **Abas na tela de Pedidos:**
  - "Pedidos Externos" - dados do banco externo com opções de importação
  - "Pedidos Importados" - histórico de pedidos trazidos para o sistema

### 3️⃣ **Seleção e Importação de Pedidos**
- ✅ Checkboxes ao lado de cada pedido externo
- ✅ Botão "Selecionar Todos" para seleção em massa
- ✅ Botão "Importar X" para trazer pedidos selecionados para o banco interno
- ✅ Contador de seleção dinâmico

### 4️⃣ **Modal de Detalhes do Pedido**
- Botão "Detalhes" em cada pedido (externo e importado)
- Exibe todos os dados do pedido em formato tabular
- Preparado para futura visualização aninhada de itens/produtos

### 5️⃣ **Configuração Expandida**
Na modal de configuração de banco de dados:
- **Campos de Detalhes do Pedido** (opcional) - marca quais colunas contêm info principal
- **Campos dos Itens/Produtos** (opcional) - marca quais colunas contêm itens/produtos

## 🛠️ Arquivos Modificados

### Backend
- `models.py` - Novo modelo `ImportedOrder` para armazenar pedidos importados
- `schemas.py` - Schemas atualizados com novos campos de configuração
- `main.py` - 4 mudanças principais:
  1. `serialize_database_config()` - inclui novos campos
  2. `create_config()` e `update_config()` - salvam novos campos
  3. `get_external_orders()` - aplica deduplicação
  4. Novos endpoints: `/orders/import/`, `/orders/imported/`, `/orders/imported/{id}`

### Frontend
- `Orders.jsx` - Refatorado com abas, checkboxes, seleção e importação
- `Orders.css` - Estilos para abas, checkboxes, toolbar, status badges
- `modais.jsx` - ModalOrderDetails + expansão de ModalDatabaseConfig
- `index.css` - Novos estilos globais (cell-checkbox, status-badge)

## 🚀 Como Testar

### 1. Configurar Deduplicação
1. Vá para **Configurações > Nova configuração** (ou edite uma existente)
2. Carregue os campos da fonte
3. Na seção "Coluna para Deduplicação", selecione a coluna que não deve se repetir
   - Ex: se "pedido" aparece 3x (uma para cada item), selecione "pedido"
4. Salve e volte a **Pedidos**
5. Clique "Atualizar" - agora mostrará apenas 1 linha por pedido único ✅

### 2. Importar Pedidos
1. Vá para **Pedidos** (aba "Pedidos Externos")
2. Selecione um ou mais pedidos com checkboxes
3. Clique em **"Importar X"** 
4. Pedidos aparecem na aba **"Pedidos Importados"**

### 3. Ver Detalhes
1. Em qualquer pedido (externo ou importado), clique em **"Detalhes"**
2. Modal abre mostrando todos os campos do pedido

### 4. Campos Customizáveis (Futura Expansão)
- "Campos de Detalhes do Pedido" - para exibir especificações na modal
- "Campos dos Itens/Produtos" - para eventual visualização aninhada

## 📊 Status do Desenvolvimento

| Recurso | Status |
|---------|--------|
| Deduplicação por coluna chave | ✅ Implementado |
| Abas Externos/Importados | ✅ Implementado |
| Checkboxes de seleção | ✅ Implementado |
| Botão de importação | ✅ Implementado |
| Modal de detalhes simples | ✅ Implementado |
| Armazenamento em BD | ✅ Implementado |
| UI de configuração (distinct, detail, items) | ✅ Implementado |
| Visualização aninhada de itens | ⏳ Preparado (próxima fase) |
| Integração com fluxo interno | ⏳ Próxima fase |

## 💡 Próximos Passos Sugeridos

1. **Visualização Aninhada** - Usar `order_detail_fields` e `order_item_fields` para exibir pedido + itens em tabela hierárquica
2. **Workflow de Integração** - Integrar pedidos importados com sistema de produção/planejamento
3. **Validação de Dados** - Adicionar validações antes da importação
4. **Histórico de Importação** - Rastrear quando/quem importou cada lote

## 🔧 API Endpoints Criados

```
POST   /orders/import/           - Importar lote de pedidos
GET    /orders/imported/         - Listar todos os pedidos importados
GET    /orders/imported/{id}     - Obter detalhes de um pedido importado
```

## 📝 Notas Técnicas

- **Deduplicação:** Aplicada em memória (Python) após buscar dados
- **External IDs:** Pedidos importados usam JSON serializado como ID único
- **Status:** Campo `import_status` permite rastrear linha (pending, processing, completed, error)
- **Responsividade:** Todas as novas UIs mantêm comportamento mobile-first
