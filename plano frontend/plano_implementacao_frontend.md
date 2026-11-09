# Plano de Implementação: Frontend SONAX (React + Vite) & Integração Full-Stack

Este documento detalha toda a arquitetura, o papel de cada tecnologia escolhida, a estrutura de arquivos do Frontend em **React**, as adequações no **Backend** e a modelagem/preenchimento relacional do **Banco de Dados PostgreSQL**.

---

## 1. Papel de Cada Tecnologia no Frontend (Por que usamos cada peça?)

Como o código do dashboard desenvolvido no **v0** (`dashboard-source`) utiliza recursos modernos do ecossistema React, estruturamos a pasta `frontend/` com as seguintes ferramentas:

| Tecnologia / Biblioteca | Para que serve e qual sua utilidade prática no projeto? |
| :--- | :--- |
| **React (`react`, `react-dom`)** | Biblioteca principal para construção da interface dividida em **componentes reutilizáveis** (`Header`, `Layer1ExecutiveSection`, `Layer2VolumeAndQuality`, `Layer3OpportunitiesObjections`, `Layer4PracticalEvidences`) e **estados reativos** (`useState`, `useEffect`, `useRef`). O React permite que, ao selecionar outro SDR ou trocar a semana, apenas os dados na tela sejam atualizados instantaneamente sem recarregar o navegador. |
| **Vite (`vite`, `@vitejs/plugin-react`)** | Servidor de desenvolvimento e empacotador (*bundler*). O navegador web não compreende nativamente arquivos `.tsx` (TypeScript com JSX) nem importações diretas de pacotes do `node_modules`. O Vite compila e serve esse código em milissegundos na porta `5173`, oferecendo *Hot Module Replacement (HMR)* — qualquer alteração salva no código atualiza a tela imediatamente. |
| **TypeScript (`typescript`)** | Adiciona **tipagem estática** ao JavaScript. Define contratos rigorosos (`ConsolidatedProfileData`, `CallEvidence`, `CriterionScore`) garantindo que o formato do JSON enviado pelo Backend corresponda exatamente às propriedades lidas pelos componentes visuais, prevenindo erros de execução (`undefined`). |
| **Tailwind CSS (`tailwindcss`, `postcss`, `autoprefixer`)** | Motor de estilização utilitária. Todo o design estilo *Huddly* do projeto (`bg-[#F3F3F1]`, `rounded-[28px]`, `text-[#145F5E]`, sombras suaves e grids responsivos) é processado pelo Tailwind CSS a partir das classes escritas no `className` dos elementos. |
| **shadcn/ui + Radix UI (`@radix-ui/react-select`, `@radix-ui/react-tooltip`, `clsx`, `tailwind-merge`)** | Fornece os componentes de interface (`Card`, `Badge`, `Button`, `Select`, `Table`, `TooltipProvider`) importados em `@/components/ui/...` e a função utilitária `cn()` em `@/lib/utils`, garantindo acessibilidade, menus suspensos (dropdowns) fluidos e combinação inteligente de classes CSS. |
| **Recharts (`recharts`)** | Biblioteca de gráficos para React utilizada na **Camada 2**: renderiza o `ComposedChart` (evolução histórica combinando barras de reuniões agendadas e linha de nota média) e o `RadarChart` (gráfico de teia de aranha normalizado em percentual 0–100%). |
| **Lucide React (`lucide-react`)** | Biblioteca de ícones vetoriais leves (`Sparkles`, `Zap`, `Star`, `AlertTriangle`, `Target`, `Search`, `ArrowUpRight`, etc.) usados para enriquecer a leitura visual do dashboard. |

---

## 2. Tabela Oficial de Critérios e Tetos de Pontuação (Soma = 100 Pontos)

Conforme a matriz oficial de avaliação de SDR da SONAX, cada ligação (e a média semanal da Camada 2) é avaliada em 6 critérios cujos tetos somam **100 pontos**:

| Código | Nome Curto no UI | Descrição Oficial do Critério e Subpesos | Teto Máximo |
| :--- | :--- | :--- | :---: |
| `abertura` | **Abertura** | Abertura clara, motivo do contato e relevância para o interlocutor | **10 pts** |
| `spin` | **SPIN** | Descoberta SPIN: Situação (5), Problema (10), Implicação (8), Necessidade de solução (7) | **30 pts** |
| `perfil` | **Perfil ICP** | Investigação adequada do perfil: setor (5), regime tributário (10), faturamento (10) | **25 pts** |
| `bant` | **BANT** | Investigação BANT: viabilidade comercial (2), autoridade (5), necessidade (5), prazo (3) | **15 pts** |
| `escuta` | **Escuta Ativa** | Escuta, aprofundamento e tratamento respeitoso de dúvidas ou objeções | **10 pts** |
| `prox_passo` | **Próximo Passo** | Proposta de próximo passo pertinente e tentativa de obter compromisso claro | **10 pts** |
| **TOTAL** | — | **Nota Média Geral / Nota Final da Ligação** | **100 pts** |

- **Na visualização em Barras (Camada 2)**: A barra preenche proporcionalmente ao teto (`(nota / teto) * 100%`) e exibe o valor absoluto (`nota / teto`, ex: `20.7 / 30`).
- **Na visualização em Radar (Camada 2)**: Como os tetos são diferentes (de 10 a 30), os valores são normalizados em base percentual (`0% a 100%`) para que a teia de aranha fique geometricamente equilibrada, exibindo no tooltip tanto a porcentagem de aproveitamento quanto a nota bruta (`20.7 / 30 pts`).

---

## 3. Estrutura de Pastas e Arquivos Criados em `frontend/`

```text
frontend/
├── Dockerfile                  # Imagem Docker Node 20 para rodar o servidor Vite na porta 5173
├── .dockerignore               # Evita copiar node_modules local para dentro do build Docker
├── .gitignore                  # Ignora node_modules, dist e arquivos .env locais
├── index.html                  # HTML raiz onde o React é montado (<div id="root">)
├── package.json                # Dependências (React, Vite, Tailwind, Recharts, Radix, Lucide)
├── tsconfig.json               # Configuração do TypeScript e atalho de importação "@/*" -> "./src/*"
├── tsconfig.node.json          # Configuração TS para o arquivo vite.config.ts
├── vite.config.ts              # Configuração do bundler Vite, porta 5173 e alias "@"
├── postcss.config.js           # Processador CSS para integrar Tailwind e Autoprefixer
├── tailwind.config.js          # Configuração de cores, fontes e animações do Tailwind
└── src/
    ├── main.tsx                # Ponto de entrada que inicializa o React na DOM
    ├── App.tsx                 # Componente raiz que renderiza a página do Dashboard
    ├── index.css               # Diretivas @tailwind e estilos globais de fundo (#F3F3F1)
    ├── lib/
    │   └── utils.ts            # Função cn() para mesclar classes CSS condicionais
    ├── types/
    │   └── dashboard.ts        # Interfaces TypeScript do Perfil Consolidado e Filtros
    ├── services/
    │   └── api.ts              # Funções HTTP (fetch) para buscar filtros e perfil no Backend (:3333)
    ├── components/
    │   └── ui/                 # Componentes base estilo shadcn/ui exigidos pelo código do v0
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── select.tsx
    │       ├── table.tsx
    │       └── tooltip.tsx
    └── pages/
        └── Dashboard.tsx       # Código do dashboard-source integrado à API + estados informativos
```

### Comportamento dos Botões de Escopo e Granularidade:
- **Pessoal (SDR) + Semanal**: Exibe o dashboard completo de 4 camadas consumindo os dados reais do banco de dados via API.
- **Departamento / Equipe Geral / Mensal**: Mantidos **clicáveis** conforme decidido. Ao clicar neles, o usuário visualiza um card informativo elegante explicando que, nesta fase do projeto, a consolidação opera exclusivamente no escopo **Individual por SDR (Semanal)**, com um botão rápido para retornar à visão ativa.

---

## 4. Alterações Realizadas no Backend (`backend/`)

1. **Rota `GET /api/consolidacao/filtros` (`consolidacao.routes.js` e `consolidacao.controller.js`)**:
   - Retorna a lista de SDRs cadastrados no banco (`id_agente`, `agente_login`, `agente_nome`, `departamento_nome`), a lista de departamentos e os períodos semanais consolidados disponíveis no banco, alimentando o Autocomplete e o Seletor de Semanas do Frontend dinamicamente.
2. **Enriquecimento da Rota `GET /api/consolidacao/perfil` (`consolidacao.controller.js`)**:
   - Faz o `include` das tabelas `agentes` e `departamentos` via Prisma.
   - Devolve `agente_nome`, `departamento_nome` e `periodo_label` formatados, além de garantir que `criterios_radar` sempre contenha `codigo`, `teto` (10, 30, 25, 15, 10, 10) e `descricao` oficial de cada critério.
3. **Atualização de `montarCamadas` (`consolidacao.service.js`)**:
   - Inclui os campos `codigo`, `teto` e `descricao` oficial na geração do JSON de `metricas_camada_2.criterios_radar`.

---

## 5. Banco de Dados e Seed Relacional Completo (`copia_banco_atualizada.sql` + `seed.js`)

O preenchimento do banco segue estritamente a cadeia de chaves estrangeiras (Foreign Keys):

1. **`departamentos`**: Comercial Geral, Comercial Tributário, Inbound Corporativo.
2. **`agentes`**: Lucas Silveira (`sdr_lucas`), Beatriz Lima (`sdr_beatriz`), Lucas Prado (`sdr_prado`), Thiago Ramos (`sdr_thiago`), Mariana Souza (`sdr_mariana`), Felipe Mendes (`sdr_felipe`), Karolyne Gluszczynski (`sdr_karolyne`).
3. **`chamadas`**: Registro completo das ligações ao longo das semanas (incluindo as 62 ligações da Semana 1 de Nov/2026 de Lucas Silveira, chamadas das semanas anteriores de Outubro para cálculo de histórico evolutivo e chamadas da Semana 2 e de outros SDRs).
4. **`registro_chamadas`**: Logs únicos (`LOG_...`) e transcrições completas associadas aos protocolos da tabela `chamadas`.
5. **`avaliacao_ia`**: Flags de funil (`ligacao_relevante`, `conversa_decisor`, `reuniao_confirmada`) e `resultado_frase`.
6. **`avaliacao_sdr`**: Notas por critério respeitando os tetos (10, 30, 25, 15, 10, 10), `nota_final`, `feedback_geral`, `acertos`, `melhorias`, `frase_original`, `frase_alternativa`, justificativas por critério e os 4 pilares qualitativos.
7. **`interlocutor`**: Mapeamento de objeções, dúvidas, interesse expresso, resposta do SDR e reação do interlocutor.
8. **`perfis_consolidados`**: Perfis semanais consolidados para navegação imediata no Frontend.

---

## 6. Orquestração no Docker (`docker-compose.yml`)

O arquivo `docker-compose.yml` na raiz passa a contar com 3 serviços integrados:
- **`sonax-postgres`**: Banco de dados PostgreSQL 16 na porta `5432`.
- **`sonax-backend`**: API Fastify + Prisma na porta `3333`.
- **`sonax-frontend`**: Aplicação React + Vite na porta `5173`, com *live-reload* mapeado via volume.

