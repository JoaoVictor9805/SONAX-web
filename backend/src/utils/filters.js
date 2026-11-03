/**
 * Utilitário centralizado para construção de filtros de busca no banco de dados.
 * Garante que os filtros de data e agente se apliquem consistentemente à data da chamada (dt_inicio).
 * 
 * @param {Object} query - Parâmetros recebidos via request.query (data_inicio, data_fim, agente, etc.)
 * @returns {{ whereAvaliacao: Object, whereChamadas: Object }} Objetos 'where' prontos para o Prisma
 */
export function buildPerformanceFilters(query = {}) {
    const { data_inicio, data_fim, agente } = query;

    const whereAvaliacao = {};
    const whereChamadas = {};

    // Objeto interno para filtros em chamada_info (usado na relação com avaliacao_ia)
    const filtroChamadaInfo = {};

    // 1. Tratamento do Filtro de Período (baseado na data de início da chamada: dt_inicio)
    if (data_inicio || data_fim) {
        const filtroData = {};

        if (data_inicio) {
            filtroData.gte = new Date(data_inicio);
        }

        if (data_fim) {
            // Garante que a data final cubra o dia inteiro até 23:59:59.999
            filtroData.lte = new Date(`${data_fim}T23:59:59.999Z`);
        }

        whereChamadas.dt_inicio = filtroData;
        filtroChamadaInfo.dt_inicio = filtroData;
    }

    // 2. Tratamento do Filtro de Agente / SDR
    if (agente && agente.trim() !== "") {
        const termoAgente = agente.trim();
        const filtroAgente = {
            contains: termoAgente,
            mode: "insensitive", // Ignora maiúsculas/minúsculas
        };

        whereChamadas.agente_nome = filtroAgente;
        filtroChamadaInfo.agente_nome = filtroAgente;
    }

    // Se houver algum filtro de chamada (data ou agente), injeta na relação de avaliacao_ia
    if (Object.keys(filtroChamadaInfo).length > 0) {
        whereAvaliacao.registro_chamadas = {
            chamada_info: filtroChamadaInfo,
        };
    }

    return {
        whereAvaliacao,
        whereChamadas,
    };
}
