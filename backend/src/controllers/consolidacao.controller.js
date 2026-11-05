import { prisma } from "../lib/prisma.js";
import { executarConsolidacaoSemanal } from "../services/consolidacao.service.js";

/**
 * Disparo manual / sob demanda da consolidação semanal de perfis de SDRs
 * POST /api/consolidacao/executar
 * Body obrigatório: { id_agente: 11 } (ou agente_login: "sdr_lucas")
 * Body opcional: { data_inicio: "YYYY-MM-DD", data_fim: "YYYY-MM-DD" }
 */
export async function dispararConsolidacaoManual(request, reply) {
    try {
        const { data_inicio, data_fim, id_agente, agente_login } = request.body || {};

        // Bloqueio do disparo geral: exige identificar expressamente o SDR
        if (!id_agente && !agente_login) {
            return reply.status(400).send({
                erro: "A consolidação em lote geral está bloqueada. O parâmetro 'id_agente' (ou 'agente_login') é obrigatório para processar o fechamento individual do SDR."
            });
        }

        const resultado = await executarConsolidacaoSemanal({
            dataInicio: data_inicio,
            dataFim: data_fim,
            idAgente: id_agente,
            agenteLogin: agente_login,
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

/**
 * Consulta de perfil consolidado salvo no banco de dados para consumo do Frontend
 * GET /api/consolidacao/perfil
 * Query params: tipo_escopo, granularidade, ano, mes, semana_do_mes, id_agente, id_departamento
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
        }

        if (id_departamento) {
            where.id_departamento = Number(id_departamento);
        }

        const perfil = await prisma.perfis_consolidados.findFirst({
            where,
            orderBy: { processado_em: "desc" },
        });

        if (!perfil) {
            return reply.status(404).send({
                erro: "Perfil consolidado não encontrado para os filtros informados."
            });
        }

        return reply.status(200).send(perfil);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            erro: "Falha ao consultar perfil consolidado.",
            detalhes: error.message,
        });
    }
}
