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
        const txConversaoReuniao = decisores > 0 ? (reunioes / decisores) * 100 : 0;

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

export async function getPerformanceRankingSDRs(request, reply) {
    try {
        // 1. Extrai o filtro dinâmico pronto para avaliacao_ia
        const { whereAvaliacao } = buildPerformanceFilters(request.query);

        // 2. Busca apenas os campos necessários para consolidar os SDRs
        const avaliacoes = await prisma.avaliacao_ia.findMany({
            where: whereAvaliacao,
            select: {
                ligacao_relevante: true,
                conversa_decisor: true,
                reuniao_confirmada: true,
                registro_chamadas: {
                    select: {
                        chamada_info: {
                            select: {
                                agente_nome: true,
                            },
                        },
                    },
                },
                avaliacao_sdr: {
                    select: {
                        nota_final: true,
                    },
                },
                analise_perfil: {
                    select: {
                        setor: true,
                        regime_tributario: true,
                        faturamento_regra: true,
                    },
                },
                crm: {
                    select: {
                        acao: true,
                    },
                },
            },
        });

        // 3. Agrupamento em memória por SDR
        const mapaSDRs = new Map();

        const campoPreenchido = (valor) => {
            if (!valor) return false;
            const v = valor.trim().toLowerCase();
            return v !== "não informado" && v !== "nao informado" && v !== "não se aplica";
        };

        for (const item of avaliacoes) {
            const nomeSDR =
                item.registro_chamadas?.chamada_info?.agente_nome?.trim() || "Não Informado";

            if (!mapaSDRs.has(nomeSDR)) {
                mapaSDRs.set(nomeSDR, {
                    sdr: nomeSDR,
                    total_avaliadas: 0,
                    ligacoes_relevantes: 0,
                    conversa_decisor: 0,
                    reunioes_confirmadas: 0,
                    retornos_com_data: 0,
                    soma_notas: 0,
                    total_com_nota: 0,
                    perfil_investigado_count: 0,
                });
            }

            const stats = mapaSDRs.get(nomeSDR);
            stats.total_avaliadas += 1;

            const isRelevante = item.ligacao_relevante?.toLowerCase() === "s";
            const isDecisor = item.conversa_decisor?.toLowerCase() === "s";
            const isReuniao = item.reuniao_confirmada?.toLowerCase() === "s";

            if (isRelevante) stats.ligacoes_relevantes += 1;
            if (isDecisor) stats.conversa_decisor += 1;
            if (isReuniao) stats.reunioes_confirmadas += 1;

            // Retornos com data agendada (apoio em tooltip)
            if (item.crm?.acao === "retorno com data combinado") {
                stats.retornos_com_data += 1;
            }

            // Notas de qualidade
            if (typeof item.avaliacao_sdr?.nota_final === "number") {
                stats.soma_notas += item.avaliacao_sdr.nota_final;
                stats.total_com_nota += 1;
            }

            // Perfil Investigado: avalia apenas se a ligação for relevante e com campos válidos
            if (isRelevante && item.analise_perfil) {
                const p = item.analise_perfil;
                const temFaturamento = campoPreenchido(p.faturamento_regra);
                const temSetor = campoPreenchido(p.setor);
                const temRegime = campoPreenchido(p.regime_tributario);

                if (temFaturamento || temSetor || temRegime) {
                    stats.perfil_investigado_count += 1;
                }
            }
        }

        // 4. Consolidação das métricas
        const ranking = Array.from(mapaSDRs.values()).map((sdr) => {
            const txDecisor =
                sdr.ligacoes_relevantes > 0
                    ? Number(((sdr.conversa_decisor / sdr.ligacoes_relevantes) * 100).toFixed(1))
                    : 0;

            const txConversao =
                sdr.conversa_decisor > 0
                    ? Number(((sdr.reunioes_confirmadas / sdr.conversa_decisor) * 100).toFixed(1))
                    : 0;

            const notaMedia =
                sdr.total_com_nota > 0
                    ? Number((sdr.soma_notas / sdr.total_com_nota).toFixed(1))
                    : 0;

            const txPerfil =
                sdr.ligacoes_relevantes > 0
                    ? Number(((sdr.perfil_investigado_count / sdr.ligacoes_relevantes) * 100).toFixed(1))
                    : 0;

            return {
                sdr: sdr.sdr,
                ligacoes_relevantes: sdr.ligacoes_relevantes,
                conversas_decisor: sdr.conversa_decisor, // Valor bruto adicionado
                tx_decisor_pct: txDecisor,
                reunioes_confirmadas: sdr.reunioes_confirmadas,
                retornos_com_data: sdr.retornos_com_data,
                tx_conversao_pct: txConversao,
                nota_media_ia: notaMedia,
                perfil_investigado_pct: txPerfil,
            };
        });

        // 5. Ordenação Padrão por Reuniões Confirmadas
        ranking.sort((a, b) => b.reunioes_confirmadas - a.reunioes_confirmadas);

        return reply.status(200).send(ranking);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ erro: "Falha ao gerar o ranking de SDRs." });
    }
}

export async function getPerformanceTermometroMetodologias(request, reply) {
    try {
        const { data_inicio, data_fim } = request.query;

        // 1. Filtros para o período atual
        const { whereAvaliacao } = buildPerformanceFilters(request.query);

        // 2. Metadados e pesos oficiais das 3 metodologias (soma = 70 pts)
        const configuracaoMetodologias = {
            CRIT_PERFIL: {
                id: "CRIT_PERFIL",
                metodologia: "Investigação de Perfil / ICP",
                peso_maximo: 25,
            },
            CRIT_SPIN: {
                id: "CRIT_SPIN",
                metodologia: "Descoberta Consultiva SPIN",
                peso_maximo: 30,
            },
            CRIT_BANT: {
                id: "CRIT_BANT",
                metodologia: "Qualificação Comercial BANT",
                peso_maximo: 15,
            },
        };

        const codigosAlvo = Object.keys(configuracaoMetodologias);

        // 3. Busca notas do período atual
        const notasAtuais = await prisma.avaliacao_criterio.findMany({
            where: {
                codigo_criterio: { in: codigosAlvo },
                nota_criterio: { not: null },
                avaliacao_sdr: {
                    avaliacao_ia: whereAvaliacao,
                },
            },
            select: {
                codigo_criterio: true,
                nota_criterio: true,
            },
        });

        // 4. Busca notas do período anterior equivalente para cálculo do delta (▲/▼ p.p.)
        let notasAnteriores = [];
        const possuiFiltroData = Boolean(data_inicio && data_fim);

        if (possuiFiltroData) {
            const dtInicio = new Date(data_inicio);
            const dtFim = new Date(`${data_fim}T23:59:59.999Z`);
            const intervaloMs = dtFim.getTime() - dtInicio.getTime();

            const dtFimAnt = new Date(dtInicio.getTime() - 1);
            const dtInicioAnt = new Date(dtInicio.getTime() - intervaloMs);

            const queryAnterior = {
                ...request.query,
                data_inicio: dtInicioAnt.toISOString().split("T")[0],
                data_fim: dtFimAnt.toISOString().split("T")[0],
            };

            const { whereAvaliacao: whereAvaliacaoAnt } = buildPerformanceFilters(queryAnterior);

            notasAnteriores = await prisma.avaliacao_criterio.findMany({
                where: {
                    codigo_criterio: { in: codigosAlvo },
                    nota_criterio: { not: null },
                    avaliacao_sdr: {
                        avaliacao_ia: whereAvaliacaoAnt,
                    },
                },
                select: {
                    codigo_criterio: true,
                    nota_criterio: true,
                },
            });
        }

        // 5. Função acumuladora de somas e contagens
        const consolidarNotas = (registros) => {
            const mapa = {
                CRIT_PERFIL: { soma: 0, total: 0 },
                CRIT_SPIN: { soma: 0, total: 0 },
                CRIT_BANT: { soma: 0, total: 0 },
            };

            for (const reg of registros) {
                if (mapa[reg.codigo_criterio]) {
                    mapa[reg.codigo_criterio].soma += reg.nota_criterio;
                    mapa[reg.codigo_criterio].total += 1;
                }
            }
            return mapa;
        };

        const acumuladorAtual = consolidarNotas(notasAtuais);
        const acumuladorAnterior = consolidarNotas(notasAnteriores);

        // 6. Montagem do payload final normalizado em escala percentual (0 a 100%)
        const resultado = codigosAlvo.map((codigo) => {
            const config = configuracaoMetodologias[codigo];
            const atual = acumuladorAtual[codigo];
            const anterior = acumuladorAnterior[codigo];

            const notaMediaAtual =
                atual.total > 0 ? Number((atual.soma / atual.total).toFixed(1)) : 0;

            const aproveitamentoAtual =
                config.peso_maximo > 0
                    ? Number(((notaMediaAtual / config.peso_maximo) * 100).toFixed(1))
                    : 0;

            let variacaoPp = null;

            if (possuiFiltroData && anterior.total > 0) {
                const notaMediaAnt = Number((anterior.soma / anterior.total).toFixed(1));
                const aproveitamentoAnt = Number(
                    ((notaMediaAnt / config.peso_maximo) * 100).toFixed(1)
                );
                variacaoPp = Number((aproveitamentoAtual - aproveitamentoAnt).toFixed(1));
            }

            return {
                id: config.id,
                metodologia: config.metodologia,
                peso_maximo: config.peso_maximo,
                nota_media: notaMediaAtual,
                aproveitamento_pct: aproveitamentoAtual,
                variacao_pp: variacaoPp,
            };
        });

        return reply.status(200).send(resultado);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            erro: "Falha ao calcular o Termômetro de Maturidade Metodológica.",
        });
    }
}