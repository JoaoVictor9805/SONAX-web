export interface CriterionScore {
  codigo: string;
  criterio: string;
  descricao?: string;
  nota: number;
  nota_anterior: number;
  teto: number; // 10, 30, 25, 15, 10, 10 (Soma = 100)
}

export interface Opportunity {
  codigo: string;
  prioridade: "ALTA" | "MEDIA" | "BAIXA";
  percentual_aparicao: number;
  diagnostico_consolidado: string;
}

export interface ObjectionProfile {
  objecao_padrao: string;
  frequencia_percentual: number;
  reacao_predominante_sdr: string;
  efetividade: "ALTA" | "MEDIA" | "BAIXA";
  recomendacao_curta: string;
}

export interface CallEvidence {
  protocolo: number;
  log: string;
  numero: string;
  interlocutor: string;
  nota: number;
  resultado_frase: string;
  feedback_geral: string;
  acertos: string;
  melhorias: string;
  frase_original?: string | null;
  frase_alternativa: string | null;
  ponto_forte?: string;
  falha_critica?: string;
  transcricao: string;
  notas_criterios: {
    abertura: number;
    spin: number;
    perfil: number;
    bant: number;
    escuta: number;
    prox_passo: number;
  };
  justificativas_textuais: {
    abertura: string;
    spin: string;
    perfil: string;
    bant: string;
    escuta: string;
    prox_passo: string;
  };
}

export interface ConsolidatedProfileData {
  id_perfil: number;
  tipo_escopo: "AGENTE" | "DEPARTAMENTO" | "EQUIPE";
  granularidade: "SEMANAL" | "MENSAL";
  id_agente?: number;
  agente_nome: string;
  departamento_nome: string;
  periodo_label: string;
  parecer_executivo: string;
  metricas_camada_1: {
    fluxo_bruto: {
      realizadas: number;
      atendidas: number;
      relevantes: number;
      decisor: number;
      reunioes: number;
    };
    funil_passagem: {
      atendimento: number;
      relevancia: number;
      decisor: number;
      conversao_final: number;
    };
    ranking_adaptativo: Array<{
      periodo: string;
      reunioes: number;
      nota_media: number;
    }>;
  };
  metricas_camada_2: {
    nota_media_geral: number;
    delta_periodo_anterior: number;
    criterios_radar: CriterionScore[];
  };
  diagnostico_camada_3: {
    sintese_executiva: {
      destaque: string;
      gargalo_principal: string;
      foco_da_semana: string;
    };
    sintese_qualitativa: {
      validacao_dor: string;
      contato_inicial: string;
      isolamento_objecao: string;
      qualidade_investigacao: string;
    };
    oportunidades_unificadas: Opportunity[];
    perfil_objecoes: ObjectionProfile[];
  };
  evidencias_camada_4: {
    top_3_melhores: CallEvidence[];
    top_3_piores: CallEvidence[];
  };
}

export interface AgentOption {
  id_agente: number;
  agente_login: string;
  agente_nome: string;
  id_departamento: number;
  departamento_nome: string;
}

export interface PeriodOption {
  chave: string;
  ano: number;
  mes: number;
  mes_label: string;
  semana_do_mes: number;
  data_inicio: string;
  data_fim: string;
  label_curto: string;
  periodo_label: string;
}

export interface FiltersResponse {
  agentes: AgentOption[];
  departamentos: Array<{ id_departamento: number; nome: string }>;
  periodos_semanais: PeriodOption[];
}

export const CRITERIA_META: Record<
  string,
  { label: string; teto: number; descricao: string }
> = {
  abertura: {
    label: "Abertura",
    teto: 10,
    descricao: "Abertura clara, motivo do contato e relevância para o interlocutor",
  },
  spin: {
    label: "SPIN",
    teto: 30,
    descricao:
      "Descoberta SPIN: Situação (5), Problema (10), Implicação (8), Necessidade de solução (7)",
  },
  perfil: {
    label: "Perfil ICP",
    teto: 25,
    descricao:
      "Investigação adequada do perfil: setor (5), regime tributário (10), faturamento (10)",
  },
  bant: {
    label: "BANT",
    teto: 15,
    descricao:
      "Investigação BANT: viabilidade comercial (2), autoridade (5), necessidade (5), prazo (3)",
  },
  escuta: {
    label: "Escuta Ativa",
    teto: 10,
    descricao:
      "Escuta, aprofundamento e tratamento respeitoso de dúvidas ou objeções",
  },
  prox_passo: {
    label: "Próximo Passo",
    teto: 10,
    descricao:
      "Proposta de próximo passo pertinente e tentativa de obter compromisso claro",
  },
};

