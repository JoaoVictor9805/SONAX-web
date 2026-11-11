import { ConsolidatedProfileData, FiltersResponse } from "@/types/dashboard";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export async function fetchConsolidacaoFiltros(): Promise<FiltersResponse> {
  const response = await fetch(`${API_BASE_URL}/api/consolidacao/filtros`);
  if (!response.ok) {
    throw new Error("Não foi possível carregar a lista de agentes e períodos.");
  }
  return response.json();
}

export async function fetchPerfilConsolidado(params: {
  id_agente?: number;
  agente_nome?: string;
  ano: number;
  mes: number;
  semana_do_mes: number;
}): Promise<ConsolidatedProfileData> {
  const searchParams = new URLSearchParams({
    tipo_escopo: "AGENTE",
    granularidade: "SEMANAL",
    ano: String(params.ano),
    mes: String(params.mes),
    semana_do_mes: String(params.semana_do_mes),
  });

  if (params.id_agente) {
    searchParams.set("id_agente", String(params.id_agente));
  } else if (params.agente_nome) {
    searchParams.set("agente_nome", params.agente_nome);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/consolidacao/perfil?${searchParams.toString()}`
  );

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error("Erro ao buscar o perfil consolidado no servidor.");
  }

  return response.json();
}

