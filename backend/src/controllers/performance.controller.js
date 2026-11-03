import { prisma } from "../lib/prisma.js";
import { buildPerformanceFilters } from "../utils/filters.js";
import { extrairSemanaAno } from "../utils/weeks.js";

export async function getPerformanceKPIs(request, reply) {
    try {
        // 1. Constrói os filtros padronizados de data e SDR
        const { whereAvaliacao: where } = buildPerformanceFilters(request.query);

        // 2. Consultas ao Banco de Dados
        const totalAvaliadas = await prisma.avaliacao_ia.count({ where });

        const relevantes = await prisma.avaliacao_ia.count({
            where: { ...where, ligacao_relevante: "s" }
        });

        const decisores = await prisma.avaliacao_ia.count({
            where: { ...where, conversa_decisor: "s" }
        });

        const reunioes = await prisma.avaliacao_ia.count({
            where: { ...where, reuniao_confirmada: "s" }
        });

        // Agregação da nota média
        const notas = await prisma.avaliacao_sdr.aggregate({
            where: { avaliacao_ia: where },
            _avg: { nota_final: true }
        });

        // 3. Cálculos das Taxas de Conversão do Funil
        const txConversaoRelevante = totalAvaliadas > 0 ? (relevantes / totalAvaliadas) * 100 : 0;
        const txConversaoDecisor = relevantes > 0 ? (decisores / relevantes) * 100 : 0;
        const txConversaoReuniao = totalAvaliadas > 0 ? (reunioes / totalAvaliadas) * 100 : 0;

        // 4. Resposta formatada para os cartões do React
        return reply.status(200).send({
            ligacoes_avaliadas: totalAvaliadas,
            conversas_relevantes: {
                total: relevantes,
                percentual: txConversaoRelevante.toFixed(1)
            },
            conversa_decisor: {
                total: decisores,
                percentual: txConversaoDecisor.toFixed(1)
            },
            reunioes_confirmadas: {
                total: reunioes,
                percentual: txConversaoReuniao.toFixed(1)
            },
            nota_media_ia: Number((notas._avg.nota_final || 0).toFixed(1))
        });

    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ erro: "Falha ao calcular KPIs da Visão Executiva." });
    }
}

export async function getPerformanceFunil(request, reply) {
    try {
        // 1. Obtém os filtros padronizados para chamadas e avaliacao_ia
        const { whereAvaliacao, whereChamadas } = buildPerformanceFilters(request.query);

        // 2. Consultas paralelas ao PostgreSQL via Prisma
        const [realizadas, atendidas, substantivas, decisor, reunioes] = await Promise.all([
            // 1. Total de Ligações Realizadas (volume bruto discado)
            prisma.chamadas.count({ where: whereChamadas }),

            // 2. Total de Ligações Atendidas
            prisma.chamadas.count({
                where: {
                    ...whereChamadas,
                    atendido: { in: ["s", "S", "1"] },
                },
            }),

            // 3. Conversas Substantivas (Ligações Relevantes)
            prisma.avaliacao_ia.count({
                where: {
                    ...whereAvaliacao,
                    ligacao_relevante: { equals: "s", mode: "insensitive" },
                },
            }),

            // 4. Conversas com Decisor
            prisma.avaliacao_ia.count({
                where: {
                    ...whereAvaliacao,
                    conversa_decisor: { equals: "s", mode: "insensitive" },
                },
            }),

            // 5. Reuniões Confirmadas
            prisma.avaliacao_ia.count({
                where: {
                    ...whereAvaliacao,
                    reuniao_confirmada: { equals: "s", mode: "insensitive" },
                },
            }),
        ]);

        // 3. Cálculo das Taxas de Passagem consecutivas (degrau a degrau)
        const txAtendimento = realizadas > 0 ? (atendidas / realizadas) * 100 : 0;
        const txSubstantivas = atendidas > 0 ? (substantivas / atendidas) * 100 : 0;
        const txDecisor = substantivas > 0 ? (decisor / substantivas) * 100 : 0;
        const txReuniao = decisor > 0 ? (reunioes / decisor) * 100 : 0;

        // 4. Estrutura do Funil para o Gráfico
        const etapas = [
            {
                id: "realizadas",
                etapa: "1. Realizadas",
                volume: realizadas,
                taxa_passagem: 100.0,
            },
            {
                id: "atendidas",
                etapa: "2. Atendidas",
                volume: atendidas,
                taxa_passagem: Number(txAtendimento.toFixed(1)),
            },
            {
                id: "substantivas",
                etapa: "3. Substantivas",
                volume: substantivas,
                taxa_passagem: Number(txSubstantivas.toFixed(1)),
            },
            {
                id: "decisor",
                etapa: "4. Com Decisor",
                volume: decisor,
                taxa_passagem: Number(txDecisor.toFixed(1)),
            },
            {
                id: "reunioes",
                etapa: "5. Reuniões Confirmadas",
                volume: reunioes,
                taxa_passagem: Number(txReuniao.toFixed(1)),
            },
        ];

        // 5. Identificação Dinâmica do Gargalo
        const etapasPassagem = etapas.slice(1);
        const menorTaxa = Math.min(...etapasPassagem.map((e) => e.taxa_passagem));

        const funilComGargalo = etapas.map((etapa, index) => ({
            ...etapa,
            is_gargalo: index > 0 && etapa.taxa_passagem === menorTaxa && etapa.volume > 0,
        }));

        return reply.status(200).send(funilComGargalo);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ erro: "Falha ao calcular dados do Funil de Prospecção." });
    }
}

export async function getPerformanceEvolucao(request, reply) {
    try {
        // 1. Extrai o filtro pronto para a tabela avaliacao_ia (filtrando por dt_inicio)
        const { whereAvaliacao } = buildPerformanceFilters(request.query);

        // 2. Busca apenas o que é necessário para o gráfico misto
        const avaliacoes = await prisma.avaliacao_ia.findMany({
            where: whereAvaliacao,
            select: {
                reuniao_confirmada: true,
                avaliacao_sdr: {
                    select: {
                        nota_final: true,
                    },
                },
                registro_chamadas: {
                    select: {
                        chamada_info: {
                            select: {
                                dt_inicio: true,
                            },
                        },
                    },
                },
            },
        });

        // 3. Agrupamento por semana da chamada (dt_inicio)
        const mapaSemanas = {};

        for (const item of avaliacoes) {
            const dataChamada = item.registro_chamadas?.chamada_info?.dt_inicio;
            if (!dataChamada) continue;

            const { label, chaveOrdenacao } = extrairSemanaAno(dataChamada);

            if (!mapaSemanas[chaveOrdenacao]) {
                mapaSemanas[chaveOrdenacao] = {
                    semana: label,
                    reunioes_confirmadas: 0,
                    soma_notas: 0,
                    total_com_nota: 0,
                };
            }

            if (item.reuniao_confirmada && item.reuniao_confirmada.toLowerCase() === "s") {
                mapaSemanas[chaveOrdenacao].reunioes_confirmadas += 1;
            }

            if (item.avaliacao_sdr && typeof item.avaliacao_sdr.nota_final === "number") {
                mapaSemanas[chaveOrdenacao].soma_notas += item.avaliacao_sdr.nota_final;
                mapaSemanas[chaveOrdenacao].total_com_nota += 1;
            }
        }

        // 4. Formata a lista cronológica final
        const resultado = Object.keys(mapaSemanas)
            .sort()
            .map((chave) => {
                const dados = mapaSemanas[chave];
                const media = dados.total_com_nota > 0
                    ? Number((dados.soma_notas / dados.total_com_nota).toFixed(1))
                    : 0;

                return {
                    semana: dados.semana,
                    reunioes_confirmadas: dados.reunioes_confirmadas,
                    nota_media_sdr: media,
                };
            });

        return reply.status(200).send(resultado);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ erro: "Falha ao calcular evolução semanal." });
    }
}
