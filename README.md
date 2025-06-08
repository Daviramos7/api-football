# ⚽ BrasilScore

BrasilScore é um dashboard interativo para fãs de futebol, permitindo consultar classificações de campeonatos, buscar por times e jogadores, e gerenciar uma lista de favoritos pessoal.

## 📜 Sobre o Projeto

O **BrasilScore** foi criado como uma solução completa para entusiastas do futebol que desejam ter informações rápidas e personalizadas sobre os principais campeonatos brasileiros. Em vez de navegar por múltiplos sites, o usuário pode centralizar sua experiência, acompanhar a classificação, buscar por seus ídolos e clubes, e salvar seus favoritos em um perfil pessoal.

O projeto foi desenvolvido com foco em JavaScript moderno (ES Modules), manipulação do DOM, e consumo de uma API externa robusta (API-Football), simulando um ambiente de aplicação web de página única (SPA) em suas interações.

-----

## ✨ Principais Funcionalidades

  * **👤 Sistema de Contas de Usuário (CRUD Completo):**

      * Cadastro, Login e Logout: Sistema de autenticação completo que gerencia a sessão do usuário.
      * Perfil de Usuário: Cada usuário possui um perfil onde pode visualizar e editar seus dados (nome, senha, etc.).
      * Painel de Admin: Usuários com o papel de "Administrador" têm acesso a uma página de listagem (`listing.html`) onde podem visualizar, editar e excluir outros usuários.

  * **⭐ Favoritos por Usuário:**

      * O sistema de favoritos é atrelado a cada perfil. Ao trocar de conta, a lista de favoritos muda para a do usuário logado.
      * Funcionalidade para adicionar ou remover times e jogadores dos favoritos.
      * Exibição dos favoritos na página principal e em páginas dedicadas (`profile.html` e `favorites.html`).

  * **🔍 Busca Otimizada:**

      * Busca por times e jogadores restrita às ligas nacionais brasileiras (Séries A, B, C e D) para garantir resultados relevantes.
      * Sistema de cache persistente (`localStorage`) para resultados de busca, minimizando chamadas à API em pesquisas repetidas.

  * **📊 Tabela de Classificação Dinâmica:**

      * Exibição da tabela de classificação para as Séries A, B, C e D.
      * Funcionalidade especial para a **Série D**, com um seletor dinâmico para consultar os diferentes grupos do campeonato.
      * Carregamento de dados "sob demanda": a tabela só é carregada quando o usuário seleciona uma liga.

  * **⚙️ Otimização de API:**

      * Uso agressivo de **cache persistente (`localStorage`)** para respostas da API e resultados de busca, respeitando o limite diário de requisições.
      * Remoção de funcionalidades de alto consumo para focar na performance e na economia de chamadas.

  * **📱 Design Responsivo:**

      * Interface adaptada para funcionar em diferentes tamanhos de tela, de desktops a dispositivos móveis.

-----

## 🚀 Tecnologias Utilizadas

  * **Frontend:**
      * HTML5
      * CSS3 (com Variáveis CSS e layout Flexbox/Grid)
      * JavaScript (ES6+ com sistema de Módulos `import`/`export`)
  * **API:**
      * [API-Football](https://rapidapi.com/api-sports/api/api-football) via RapidAPI como fonte de dados.
  * **Armazenamento:**
      * `localStorage` do navegador para simular um banco de dados para usuários e cache.

-----

## 🛠️ Configuração e Instalação

Para executar este projeto em sua máquina local, siga os passos abaixo.

### 1\. Clonar o Repositório

```bash
git clone https://URL_DO_SEU_REPOSITORIO.git
cd NOME_DA_PASTA_DO_PROJETO
```

### 2\. Configurar a Chave da API

O projeto requer uma chave da API-Football para funcionar.

1.  Obtenha sua chave gratuita no site da [RapidAPI](https://rapidapi.com/api-sports/api/api-football).

2.  Abra o arquivo `assets/js/api.js`.

3.  Encontre a constante `API_KEY` e substitua o valor existente pela sua chave.

    ```javascript
    // Em assets/js/api.js
    const API_KEY = 'SUA_CHAVE_API_VEM_AQUI'; 
    ```

-----

## ▶️ Como Executar o Projeto

Devido ao uso de Módulos ES6 (`import`/`export`) em JavaScript, você **não pode** simplesmente abrir os arquivos `.html` diretamente no navegador. Você precisa de um servidor local.

A maneira mais fácil é usar a extensão **Live Server** no Visual Studio Code.

1.  Instale a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) no VS Code.
2.  Abra a pasta do projeto no VS Code.
3.  Clique com o botão direito no seu arquivo HTML de login (`login.html`).
4.  Selecione "Open with Live Server".

-----

## 📂 Estrutura do Projeto

```
/
|-- assets/
|   |-- css/
|   |   |-- global.css
|   |-- js/
|   |   |-- api.js
|   |   |-- auth.js
|   |   |-- favorites.js
|   |   |-- search.js
|   |   |-- main.js
|   |   |-- profile.js
|   |   |-- favorites-page.js
|   |   |-- listing.js
|
|-- login.html
|-- registre.html
|-- main.html
|-- search.html
|-- profile.html
|-- favorites.html
|-- listing.html
|-- README.md
```

-----

## 👨‍💻 Autores

**[Davi Ramos Ferreira]**

  * [LinkedIn](https://www.linkedin.com/in/davi-ramos-ferreira-325354294//)
  * [GitHub](https://github.com/Daviramos7)

**[Luiz Gabriel Santiago da Silva]**

  * [LinkedIn](https://www.linkedin.com/in/luiz-gabriel-5a5b46277/)
  * [GitHub](https://github.com/LuizSanti)

**[Nickolas Eduardo Gonçalves de Oliveira]**

  * [GitHub](https://github.com/Nickolas30)

**[João Mariano Leite Valadares]**

  * [GitHub](https://github.com/joaomariano087)
