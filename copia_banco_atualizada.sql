-- ==============================================================================
-- NOVO SCHEMA SONAX: FOCO EXCLUSIVO EM FEEDBACK E DESENVOLVIMENTO DE SDR
-- Remoção de tabelas de CRM, Perfil de Empresa e Metodologias Engessadas.
-- ==============================================================================

-- 1. TABELAS INDEPENDENTES E DIMENSÕES

CREATE TABLE IF NOT EXISTS chamadas (
    protocolo BIGINT,
    estado_ddd VARCHAR(3),
    numero VARCHAR(20),
    atendido CHAR(1),
    ramal VARCHAR(20),
    duracao_segundos INT,
    fila_id INT,
    fila_descricao VARCHAR(150),
    tabulacao_id INT,
    tabulacao_descricao VARCHAR(150),
    agente_login VARCHAR(50),
    agente_nome VARCHAR(100),
    campanha_id INT,
    campanha_descricao VARCHAR(150),
    dt_inicio TIMESTAMP,
    dt_fim TIMESTAMP,
    status VARCHAR(50),
    hash_registro VARCHAR(64),
    last_sync TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registro_chamadas (
    log VARCHAR(255) PRIMARY KEY,
    protocolo BIGINT unique not null,
    transcricao TEXT
    -- Removido o vinculo com tabela empresa, focando apenas no log da ligação.
);

-- 2. TABELAS DEPENDENTES (Nível 1)

CREATE TABLE IF NOT EXISTS avaliacao_ia (
    log VARCHAR(255) PRIMARY KEY NOT NULL,
    data_avaliacao DATE NOT NULL,
    modelo_ia VARCHAR(50) NOT NULL,
    interlocutor_nome VARCHAR(100),
    cargo VARCHAR(100),
    resultado VARCHAR(255),
    
    -- KPIs de Funil
    ligacao_relevante VARCHAR(1) NOT NULL CHECK (ligacao_relevante IN ('s','n')),
    conversa_decisor VARCHAR(1) NOT NULL DEFAULT 'n' CHECK (conversa_decisor IN ('s','n')),
    reuniao_confirmada VARCHAR(1) NOT NULL CHECK (reuniao_confirmada IN ('s','n')),
    
    resultado_frase TEXT NOT NULL,
   
    FOREIGN KEY (log) REFERENCES registro_chamadas(log)
);

-- 3. TABELAS DEPENDENTES (Nível 2)

CREATE TABLE IF NOT EXISTS avaliacao_sdr (
    log VARCHAR(255) PRIMARY KEY NOT NULL,
    nota_final INT,
    feedback_geral TEXT NOT NULL,
    acertos TEXT,
    melhorias TEXT, 
    frase_alternativa TEXT,
    
    -- Critérios de Avaliação (Nota e Justificativa embutidos na mesma linha)
    nota_abertura INT,
    justificativa_abertura TEXT,
    
    nota_spin INT,
    justificativa_spin TEXT,
    
    nota_perfil INT,
    justificativa_perfil TEXT,
    
    nota_bant INT,
    justificativa_bant TEXT,
    
    nota_escuta INT,
    justificativa_escuta TEXT,
    
    nota_prox_passo INT,
    justificativa_prox_passo TEXT,
   
    FOREIGN KEY (log) REFERENCES avaliacao_ia(log) ON DELETE CASCADE
);


-- Tabela para o Mapa Qualitativo de Objeções (Essencial para a Camada 3)
CREATE TABLE IF NOT EXISTS interlocutor (
    log VARCHAR(255) PRIMARY KEY NOT NULL,
    interesse_expresso TEXT,
    duvidas TEXT,            
    objecoes TEXT,          
    resposta_sdr TEXT,      
    reacao_interlocutor TEXT,
    FOREIGN KEY (log) REFERENCES avaliacao_ia(log) ON DELETE CASCADE
);


ALTER TABLE chamadas ADD PRIMARY KEY (protocolo);
ALTER TABLE registro_chamadas ADD CONSTRAINT fk_registro_chamada 
    FOREIGN KEY (protocolo) REFERENCES chamadas(protocolo) ON DELETE CASCADE;


-- ==============================================================================
-- 1. TABELA DE DEPARTAMENTOS
-- Lista pré-existente (Inbound, Outbound, PME, Enterprise, etc.)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS departamentos (
    id_departamento INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. TABELA DE AGENTES (Vínculo Telefonia <-> Dashboard)
-- SDRs novos entram com id_departamento = NULL até o gestor alocá-los.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS agentes (
    id_agente INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    agente_login VARCHAR(50) NOT NULL UNIQUE, -- Login exato que vem da tabela 'chamadas'
    agente_nome VARCHAR(100) NOT NULL,
    id_departamento INT REFERENCES departamentos(id_departamento) ON DELETE SET NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. TABELA DE SÍNTESE (PERFIS CONSOLIDADOS)
-- Armazena o JSON mastigado pelo Node.js/IA para o Dashboard e Chatbot.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS perfis_consolidados (
    id_perfil INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Escopo e Granularidade (Filtros do Cabeçalho)
    tipo_escopo VARCHAR(20) NOT NULL CHECK (tipo_escopo IN ('AGENTE', 'DEPARTAMENTO', 'EQUIPE')),
    granularidade VARCHAR(10) NOT NULL CHECK (granularidade IN ('SEMANAL', 'MENSAL')),
    
    -- Controle de Tempo
    ano INT NOT NULL,
    mes INT NOT NULL,              
    semana_do_mes INT,               
    data_inicio DATE NOT NULL,       
    data_fim DATE NOT NULL,          
    
    -- Vínculos de Escopo (Ficam NULL quando tipo_escopo for 'EQUIPE')
    id_agente INT REFERENCES agentes(id_agente) ON DELETE CASCADE,
    id_departamento INT REFERENCES departamentos(id_departamento) ON DELETE CASCADE,
    
    -- Dados Estruturados para as 4 Camadas do Dashboard em JSONB (Performance)
    metricas_camada_1 JSONB NOT NULL,    -- Fluxo bruto, taxas do funil, gargalo e ranking
    metricas_camada_2 JSONB NOT NULL,    -- Nota geral, delta vs período anterior, radar/barras
    diagnostico_camada_3 JSONB NOT NULL, -- Síntese IA: 3 bullets executivos, top melhorias e mapa de objeções
    evidencias_camada_4 JSONB NOT NULL,  -- IDs, áudios transcritos e notas das 3 melhores/piores ligações
    
    processado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE NULLS NOT DISTINCT (tipo_escopo, granularidade, ano, mes, semana_do_mes, id_agente, id_departamento)
);


-- 5. ÍNDICES REVISADOS E CORRIGIDOS
CREATE INDEX IF NOT EXISTS idx_chamadas_agente_data ON chamadas (agente_nome, dt_inicio);
CREATE INDEX IF NOT EXISTS idx_avaliacao_ia_data ON avaliacao_ia (data_avaliacao);
CREATE INDEX IF NOT EXISTS idx_avaliacao_sdr_nota ON avaliacao_sdr (nota_final);
CREATE INDEX IF NOT EXISTS idx_perfis_filtros ON perfis_consolidados (tipo_escopo, granularidade, data_inicio, id_agente, id_departamento);


ALTER TABLE perfis_consolidados 
ADD COLUMN IF NOT EXISTS parecer_executivo TEXT;
