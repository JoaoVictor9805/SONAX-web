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
