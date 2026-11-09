import { prisma } from "../lib/prisma.js";
import { executarConsolidacaoSemanal } from "../services/consolidacao.service.js";

/**
 * Disparo manual / sob demanda da consolidação semanal de perfis de SDRs
 * POST /api/consolidacao/executar
 * Body obrigatório: { id_agente: 11 } (ou agente_login: "sdr_lucas")
 * Body opcional: { data_inicio: "YYYY-MM-DD", data_fim: "YYYY-MM-DD", dados_processamento: { ... } }
 */
export async function dispararConsolidacaoManual(request, reply) {
    try {
        const { data_inicio, data_fim, id_agente, agente_login, dados_processamento } = request.body || {};

        const idAgenteFinal = id_agente || dados_processamento?.id_agente;
        const agenteLoginFinal = agente_login || dados_processamento?.agente_login;

        // Bloqueio do disparo geral: exige identificar expressamente o SDR
        if (!idAgenteFinal && !agenteLoginFinal) {
            return reply.status(400).send({
                erro: "A consolidação em lote geral está bloqueada. O parâmetro 'id_agente' (ou 'agente_login') é obrigatório para processar o fechamento individual do SDR."
            });
        }

        const resultado = await executarConsolidacaoSemanal({
            dataInicio: data_inicio || dados_processamento?.data_inicio,
            dataFim: data_fim || dados_processamento?.data_fim,
            idAgente: idAgenteFinal,
            agenteLogin: agenteLoginFinal,
            dadosProcessamento: dados_processamento,
        });

        return reply.status(200).send({
            mensagem: "Consolidação individual processada com sucesso.",
            ...resultado,
        });
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            erro: "Falha ao executar a consolidação individual.",
            detalhes: error.message,
        });
    }
}

const MESES_ABREV = [
    "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const MESES_COMPLETOS = [
    "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const META_CRITERIOS_OFICIAL = {
    "Abertura": {
        codigo: "abertura",
        teto: 10,
        descricao: "Abertura clara, motivo do contato e relevância para o interlocutor",
    },
    "SPIN": {
        codigo: "spin",
        teto: 30,
        descricao: "Descoberta SPIN: Situação (5), Problema (10), Implicação (8), Necessidade de solução (7)",
    },
    "Perfil ICP": {
        codigo: "perfil",
        teto: 25,
        descricao: "Investigação adequada do perfil: setor (5), regime tributário (10), faturamento (10)",
    },
    "BANT": {
        codigo: "bant",
        teto: 15,
        descricao: "Investigação BANT: viabilidade comercial (2), autoridade (5), necessidade (5), prazo (3)",
    },
    "Escuta Ativa": {
        codigo: "escuta",
        teto: 10,
        descricao: "Escuta, aprofundamento e tratamento respeitoso de dúvidas ou objeções",
    },
    "Próximo Passo": {
        codigo: "prox_passo",
        teto: 10,
        descricao: "Proposta de próximo passo pertinente e tentativa de obter compromisso claro",
    },
};

function formatarDiaMes(dateVal) {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    const dia = String(d.getUTCDate()).padStart(2, "0");
    const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${dia}/${mes}`;
}

/**
 * Lista os agentes (SDRs), departamentos e semanas disponíveis para alimentar os filtros do Frontend
 * GET /api/consolidacao/filtros
 */
export async function listarFiltrosConsolidacao(request, reply) {
    try {
        const [agentesRaw, departamentosRaw, periodosRaw] = await Promise.all([
            prisma.agentes.findMany({
                where: { ativo: true },
                include: { departamentos: true },
                orderBy: { id_agente: "asc" },
            }),
            prisma.departamentos.findMany({
                where: { ativo: true },
                orderBy: { id_departamento: "asc" },
            }),
            prisma.perfis_consolidados.findMany({
                where: { tipo_escopo: "AGENTE", granularidade: "SEMANAL" },
                select: {
                    ano: true,
                    mes: true,
                    semana_do_mes: true,
                    data_inicio: true,
                    data_fim: true,
                },
                distinct: ["ano", "mes", "semana_do_mes"],
                orderBy: [
                    { ano: "desc" },
                    { mes: "desc" },
                    { semana_do_mes: "desc" },
                ],
            }),
        ]);

        const agentes = agentesRaw.map((a) => ({
            id_agente: a.id_agente,
            agente_login: a.agente_login,
            agente_nome: a.agente_nome,
            id_departamento: a.id_departamento,
            departamento_nome: a.departamentos?.nome || "Comercial Geral",
        }));

        const departamentos = departamentosRaw.map((d) => ({
            id_departamento: d.id_departamento,
            nome: d.nome,
        }));

        const periodos_semanais = periodosRaw.map((p) => {
            const dtIni = formatarDiaMes(p.data_inicio);
            const dtFim = formatarDiaMes(p.data_fim);
            const mesAbrev = MESES_ABREV[p.mes] || String(p.mes);
            const mesNome = MESES_COMPLETOS[p.mes] || String(p.mes);
            return {
                chave: `sem${p.semana_do_mes}-${p.mes}-${p.ano}`,
                ano: p.ano,
                mes: p.mes,
                mes_label: `${mesNome} ${p.ano}`,
                semana_do_mes: p.semana_do_mes,
                data_inicio: p.data_inicio,
                data_fim: p.data_fim,
                label_curto: `Semana ${p.semana_do_mes} (${dtIni} a ${dtFim.split("/")[0]} ${mesAbrev})`,
                periodo_label: `Semana ${p.semana_do_mes}, ${mesAbrev} ${p.ano} (${dtIni} a ${dtFim})`,
            };
        });

        return reply.status(200).send({
            agentes,
            departamentos,
            periodos_semanais,
        });
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            erro: "Falha ao carregar filtros de consolidação.",
            detalhes: error.message,
        });
    }
}

/**
 * Consulta de perfil consolidado salvo no banco de dados para consumo do Frontend
 * GET /api/consolidacao/perfil
 * Query params: tipo_escopo, granularidade, ano, mes, semana_do_mes, id_agente, agente_nome, id_departamento
 */
export async function obterPerfilConsolidado(request, reply) {
    try {
        const {
            tipo_escopo = "AGENTE",
            granularidade = "SEMANAL",
            ano,
            mes,
            semana_do_mes,
            id_agente,
            agente_nome,
            id_departamento,
        } = request.query;

        if (!ano || !mes) {
            return reply.status(400).send({
                erro: "Os parâmetros 'ano' e 'mes' são obrigatórios."
            });
        }

        const where = {
            tipo_escopo,
            granularidade,
            ano: Number(ano),
            mes: Number(mes),
        };

        if (semana_do_mes !== undefined && semana_do_mes !== null && semana_do_mes !== "") {
            where.semana_do_mes = Number(semana_do_mes);
        }

        if (id_agente) {
            where.id_agente = Number(id_agente);
        } else if (agente_nome) {
            const ag = await prisma.agentes.findFirst({
                where: { agente_nome: { equals: agente_nome, mode: "insensitive" } },
            });
            if (ag) where.id_agente = ag.id_agente;
        }

        if (id_departamento) {
            where.id_departamento = Number(id_departamento);
        }

        const perfil = await prisma.perfis_consolidados.findFirst({
            where,
            include: {
                agentes: {
                    include: { departamentos: true },
                },
                departamentos: true,
            },
            orderBy: { processado_em: "desc" },
        });

        if (!perfil) {
            return reply.status(404).send({
                erro: "Perfil consolidado não encontrado para os filtros informados."
            });
        }

        const dtIni = formatarDiaMes(perfil.data_inicio);
        const dtFim = formatarDiaMes(perfil.data_fim);
        const mesAbrev = MESES_ABREV[perfil.mes] || String(perfil.mes);
        const periodoLabel = perfil.semana_do_mes
            ? `Semana ${perfil.semana_do_mes}, ${mesAbrev} ${perfil.ano} (${dtIni} a ${dtFim})`
            : `${MESES_COMPLETOS[perfil.mes] || perfil.mes} ${perfil.ano}`;

        const camada2Original = perfil.metricas_camada_2 || {};
        const radarEnriquecido = Array.isArray(camada2Original.criterios_radar)
            ? camada2Original.criterios_radar.map((item) => {
                const meta = META_CRITERIOS_OFICIAL[item.criterio] || { codigo: "outro", teto: 10, descricao: "" };
                return {
                    ...item,
                    codigo: item.codigo || meta.codigo,
                    teto: item.teto || meta.teto,
                    descricao: item.descricao || meta.descricao,
                    nota_anterior: item.nota_anterior ?? item.nota,
                };
            })
            : [];

        const respostaFormatada = {
            ...perfil,
            agente_nome: perfil.agentes?.agente_nome || "SDR",
            agente_login: perfil.agentes?.agente_login || "",
            departamento_nome: perfil.departamentos?.nome || perfil.agentes?.departamentos?.nome || "Comercial Geral",
            periodo_label: periodoLabel,
            metricas_camada_2: {
                ...camada2Original,
                criterios_radar: radarEnriquecido,
            },
        };

        return reply.status(200).send(respostaFormatada);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            erro: "Falha ao consultar perfil consolidado.",
            detalhes: error.message,
        });
    }
}
