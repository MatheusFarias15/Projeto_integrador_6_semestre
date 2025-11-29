# AutoControl 🚗

AutoControl é uma aplicação web completa projetada para simplificar o gerenciamento de frotas e veículos pessoais. A plataforma permite que os usuários cadastrem seus veículos, registrem despesas, controlem o histórico de manutenções e visualizem dados importantes através de um dashboard interativo.
 
## 📄 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [✨ Key Features](#-key-features)
- [📸 Screenshots](#-screenshots)
- [🛠️ Tech Stack](#️-tech-stack)
- [🗃️ Estrutura do Banco de Dados](#️-estrutura-do-banco-de-dados)
- [🚀 Começando](#-começando)

## 💡 Sobre o Projeto

O objetivo do AutoControl é fornecer uma solução centralizada e intuitiva para donos de veículos e gestores de frotas. Com ele, é possível abandonar planilhas complexas e ter um controle financeiro e operacional preciso, além de receber alertas sobre manutenções futuras para garantir a segurança e a vida útil dos veículos.

## ✨ Key Features

- **🔐 Autenticação de Usuários:** Sistema seguro de cadastro e login para proteger os dados de cada usuário.
- **📊 Dashboard Interativo:** Visão geral com os principais indicadores, como total de veículos, gastos mensais e manutenções.
- **🚗 Gerenciamento de Veículos:** Adicione, visualize e gerencie todos os veículos da sua frota em um só lugar.
- **🔧 Controle de Manutenção:** Registre cada serviço de manutenção realizado, incluindo custos, data e detalhes técnicos.
- **💰 Rastreamento de Despesas:** Monitore todos os gastos, categorizados por tipo (combustível, seguro, etc.), para um controle financeiro detalhado.
g
## 🛠️ Tech Stack

A aplicação foi construída utilizando tecnologias modernas, tanto no frontend quanto no backend.

- **Frontend:**
  - [React](https://reactjs.org/)
  - [TypeScript](https://www.typescriptlang.org/) (com sintaxe TSX)
  - HTML5 & CSS3

- **Backend & Database:**
  - [Supabase](https://supabase.io/)
  - [MySQL](https://www.mysql.com/)

## 🗃️ Estrutura do Banco de Dados

O banco de dados MySQL, gerenciado pelo Supabase, é estruturado com as seguintes tabelas principais para garantir a integridade e o relacionamento dos dados:

- `profiles`: Armazena os dados dos usuários.
- `vehicles`: Contém as informações de cada veículo, associado a um usuário.
- `maintenance_types`: Tabela de apoio com os tipos de manutenção padrão.
- `maintenances`: Histórico de todos os serviços de manutenção.
- `expenses`: Registro de todas as despesas dos veículos.

## 🚀 Começando

Para executar o projeto localmente, siga os passos abaixo.

### Pré-requisitos

Você vai precisar ter o [Node.js](https://nodejs.org/en/) (versão 16 ou superior) e o [Git](https://git-scm.com/) instalados na sua máquina.

### Instalação

1.  **Clone o repositório:**
    ```sh
    git clone ([https://github.com/MatheusFarias15/Projeto_integrador_6_semestre])
    cd autocontrol
    ```

2.  **Instale as dependências:**
    ```sh
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    - Crie um arquivo `.env.local` na raiz do projeto.
    - Adicione suas chaves do Supabase, que você pode encontrar no dashboard do seu projeto Supabase:
      ```env
      REACT_APP_SUPABASE_URL="SUA_URL_DO_SUPABASE"
      REACT_APP_SUPABASE_ANON_KEY="SUA_CHAVE_ANON_DO_SUPABASE"
      ```

4.  **Inicie o servidor de desenvolvimento:**
    ```sh
    npm start
    ```

Agora, a aplicação deve estar rodando em `http://localhost:3000`.

---
Feito por [Matheus Farias](https://github.com/MatheusFarias15),[Tiago José batschke](https://github.com/tiagoBatschke), [Beatriz Bardela ](https://github.com/bbaebardy), [Gustavo Alves Marcelino](https://github.com/Gus12082005), [Kevin Kawan Dias  ](https://github.com/KaytosNikolaevich)