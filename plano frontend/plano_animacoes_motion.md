# Plano de Implementação: Animações Suaves com `motion` (Framer Motion)

O objetivo deste documento é explicar como a biblioteca **`motion`** (sucessora moderna do *Framer Motion* para React) foi integrada na branch `homologacao` para eliminar cortes secos na interface e adicionar **fluidez e naturalidade** ao Dashboard SONAX.

---

## 1. O que é a biblioteca `motion` e como ela funciona no React?

No React puro, quando um estado muda (por exemplo, `selectedCall` passa de `null` para um objeto, ou `criteriaViewMode` muda de `"bars"` para `"radar"`), o React **insere ou destrói o HTML instantaneamente** (em `0ms`). É isso que causa a sensação "crua" e abrupta ao clicar.

A biblioteca `motion` (`import { motion, AnimatePresence } from "motion/react"`) resolve isso com três recursos principais:

| Recurso do `motion` | O que ele faz na prática? |
| :--- | :--- |
| **`motion.div` / `motion.button`** | Substitui tags HTML comuns por versões animadas que aceitam propriedades declarativas como `initial` (como nasce), `animate` (como fica em tela), `whileHover` (ao passar o mouse) e `whileTap` (feedback tátil ao clicar). |
| **`AnimatePresence`** | Permite **animar a saída (desmontagem)** de elementos. Antes do React remover um modal, dropdown ou aba da tela, o `AnimatePresence` segura o elemento por ~200ms para executar a transição de fechamento (`exit`). |
| **`layoutId` (Shared Layout)** | Cria transições automáticas entre elementos diferentes. Quando você clica em outro botão de uma pílula (ex: trocar de *Barras* para *Radar*), o fundo preto (`bg-zinc-900`) **desliza fisicamente** de um botão para o outro em vez de piscar. |

---

## 2. Mapa das 6 Animações Aplicadas em `src/pages/Dashboard.tsx`

### 2.1. Entrada em Cascata das 4 Camadas (*Staggered Fade-Up*)
- **Onde:** Container principal das Camadas 1, 2, 3 e 4 ao carregar a página ou ao trocar de SDR/Semana.
- **Comportamento:** Em vez de todo o dashboard "piscar" de uma vez quando a API responde, cada camada surge suavemente de baixo para cima (`opacity: 0, y: 14` → `opacity: 1, y: 0`) com um pequeno intervalo de `0.06s` entre a Camada 1, Camada 2, Camada 3 e Camada 4.
- **Duração:** `350ms` com curva `easeOut`.

### 2.2. Abertura, Troca e Fechamento do Card de Auditoria de Ligação (Camada 4)
- **Onde:** Painel detalhado da ligação selecionada (`selectedCall`) na Camada 4.
- **Comportamento:**
  - **Ao clicar em "Ver detalhes":** O painel expande suavemente com *fade-in* e leve deslizamento vertical (`opacity: 0, y: 12, scale: 0.99` → `opacity: 1, y: 0, scale: 1`).
  - **Ao trocar de uma ligação para outra (ex: Protocolo #1 → Protocolo #2):** Usando `<AnimatePresence mode="wait">` com `key={selectedCall.call.protocolo}`, o card faz uma transição fluida (*crossfade*) entre os dados da ligação anterior e a nova.
  - **Ao clicar em "Ocultar" ou "Fechar detalhes":** O painel recolhe suavemente antes de sair da tela (`exit={{ opacity: 0, y: 8, scale: 0.99 }}`).

### 2.3. Pílulas Deslizantes nos Seletores (`layoutId`)
- **Onde:**
  1. Seletor de Escopo no topo (*Pessoal (SDR)* | *Departamento* | *Equipe Geral*) — `layoutId="scope-pill"`
  2. Seletor de Granularidade (*Semanal* | *Mensal*) — `layoutId="granularity-pill"`
  3. Seletor de Visualização de Critérios na Camada 2 (*Barras* | *Radar (100%)*) — `layoutId="criteria-view-pill"`
- **Comportamento:** A pílula escura (`bg-zinc-900`) desliza suavemente com física de mola curta (`type: "spring", stiffness: 400, damping: 32`) acompanhando o clique do usuário.

### 2.4. Alternância Suave entre "Barras" e "Radar" + Preenchimento das Barras (Camada 2 e Camada 3)
- **Onde:** Card *Critérios de Qualidade* (Camada 2) e barras de frequência do *Mapa de Objeções* (Camada 3).
- **Comportamento:**
  - Ao alternar entre os modos *Barras* e *Radar (100%)*, o conteúdo faz um *crossfade* rápido (`200ms`) via `AnimatePresence`.
  - As barras verdes de progresso (`bg-[#145F5E]`) animam sua largura de `0%` até a nota do SDR (`initial={{ width: 0 }} animate={{ width: "${pctAtual}%" }}`), dando vida imediata aos indicadores.

### 2.5. Dropdown de Busca de SDRs e Card de Status Informativo
- **Onde:** Menu autocomplete de busca de agentes no `Header` e card informativo dos escopos em implementação (*Departamento* / *Equipe* / *Mensal*).
- **Comportamento:**
  - O dropdown de sugestões abre e fecha com leve efeito de *scale + fade* (`opacity: 0, y: -6, scale: 0.98` → `opacity: 1, y: 0, scale: 1`).
  - Quando o usuário alterna para *Departamento*, *Equipe Geral* ou *Mensal*, o card informativo entra e sai com transição suave via `AnimatePresence`.

### 2.6. Micro-interações nos Cards de KPI e Botões (`whileHover` / `whileTap`)
- **Onde:** Nos 5 cards de KPI da Camada 2 e nos botões de ação (*Ver detalhes*).
- **Comportamento:** Leve elevação de `2px` ao passar o mouse (`whileHover={{ y: -2 }}`) e sutil compressão ao clicar (`whileTap={{ scale: 0.98 }}`), dando resposta visual imediata a cada clique.
