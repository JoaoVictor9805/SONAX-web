import { extrairDadosSdr } from "../services/processamento.service.js";
import { executarConsolidacaoSemanal } from "../services/consolidacao.service.js";

/**
 * Extração analítica dos dados de ligações do SDR para um determinado período.
 * GET /api/processamento/chamadas-consolidadas?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD&agente_login=xxx
 */
export async function getDadosParaFechamentoSdr(request, reply) {
    try {
        const { data_inicio, data_fim, agente_login } = request.query;

        if (!data_inicio || !data_fim || !agente_login) {
            return reply.status(400).send({
                erro: "Parâmetros 'data_inicio', 'data_fim' e 'agente_login' são obrigatórios."
            });
        }

        const dtInicio = `${data_inicio.split("T")[0]} 00:00:00`;
        const dtFim = `${data_fim.split("T")[0]} 23:59:59.999`;
        const agente = agente_login.trim();

        const { kpis, historico, amostragem, comparativo_semana_anterior } = await extrairDadosSdr(agente, dtInicio, dtFim);

        return reply.status(200).send({
            kpis_conversao_notas: kpis,                              // Base matemática da semana atual (taxas e médias)
            comparativo_semana_anterior: comparativo_semana_anterior, // Notas e reuniões da última semana anterior para comparar nos cards
            grafico_evolutivo: historico,                            // Médias semanais das últimas semanas
            lote_ia_30_chamadas: amostragem                          // Lote de 30 chamadas com notas, critérios qualitativos e objeções
        });

    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            erro: "Falha ao extrair dados bases para consolidação do perfil.",
            detalhes: error.message,
        });
    }
}

/**
 * Disparo manual / sob demanda da consolidação de perfil do SDR
 * POST /api/processamento/consolidar
 * Body opcional:
 * {
 *   id_agente: 11,
 *   agente_login: "sdr_lucas",
 *   data_inicio: "YYYY-MM-DD",
 *   data_fim: "YYYY-MM-DD",
 *   dados_processamento: { ... } // Dados já coletados previamente por /chamadas-consolidadas
 * }
 */
export async function dispararConsolidacaoManual(request, reply) {
    try {
        const { data_inicio, data_fim, id_agente, agente_login, dados_processamento } = request.body || {};

        const idAgenteFinal = id_agente || dados_processamento?.id_agente;
        const agenteLoginFinal = agente_login || dados_processamento?.agente_login;

        if (!idAgenteFinal && !agenteLoginFinal) {
            return reply.status(400).send({
                erro: "O parâmetro 'id_agente' (ou 'agente_login') é obrigatório para processar o fechamento individual do SDR."
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
            mensagem: "Consolidação processada com sucesso.",
            ...resultado,
        });
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            erro: "Falha ao executar a consolidação.",
            detalhes: error.message,
        });
    }
}
