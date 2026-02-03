# Kyzzen MES 🚀

**Kyzzen MES** é um sistema de monitoramento de produção (Manufacturing Execution System) desenvolvido para otimizar o chão de fábrica através da digitalização de processos e gamificação da produtividade.

O sistema permite o cadastro de operadores e produtos, o registro de produção por estação de trabalho e a atribuição de pontuação somente após a conclusão efetiva de cada peça, incentivando a qualidade e o cumprimento de metas.

## 🛠️ Tecnologias Utilizadas

- **Backend:** FastAPI (Python 3.13)
- **Banco de Dados:** PostgreSQL (via Docker)
- **ORM:** SQLAlchemy
- **Driver de Conexão:** pg8000 (Otimizado para Windows)
- **Containerização:** Docker & Docker Compose

## 📌 Funcionalidades Principais

- **Gestão de Usuários:** Cadastro de operadores e administradores com níveis de acesso.
- **Catálogo de Produtos:** Registro de SKUs com definição de pontos base por complexidade.
- **Fluxo de Produção:** Registro de logs de produção com status (`pendente` e `finalizado`).
- **Lógica de Pontuação:** Os pontos só são creditados ao perfil do operador quando a produção é finalizada.
- **API Documentada:** Documentação interativa automática via Swagger (FastAPI).

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Docker e Docker Compose instalados.
- Python 3.13+ (opcional para rodar localmente).

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone (https://github.com/Epilifss/Kyzzen-MES.git)
   cd kyzzen-mes
