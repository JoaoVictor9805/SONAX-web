import { prisma } from "../lib/prisma.js";

export async function getDadosParaFechamentoSdr(request, reply) {
    try {
        const { data_inicio, data_fim, agente_login } = request.query;

        if (!data_inicio || !data_fim || !agente_login) {
            return reply.status(400).send({ erro: "Parâmetros 'data_inicio', 'data_fim' e 'agente_login' são obrigatórios." });
        }

        const dtInicio = `${data_inicio.split("T")[0]} 00:00:00`;
        const dtFim = `${data_fim.split("T")[0]} 23:59:59.999`;
        const agente = agente_login.trim();

        // 1. KPIs de Conversão e Notas (Semana Atual - Para o Funil e Radar)
        const sqlKpisAtuais = `
            SELECT 
                COUNT(*) AS total_realizadas,
                COUNT(*) FILTER (WHERE c.atendido = 's') AS total_atendidas,
                COUNT(*) FILTER (WHERE ai.ligacao_relevante = 's') AS total_relevantes,
                COUNT(*) FILTER (WHERE ai.conversa_decisor = 's') AS total_decisor,
                COUNT(*) FILTER (WHERE ai.reuniao_confirmada = 's') AS total_reunioes,
                ROUND(AVG(sdr.nota_final), 1) AS media_nota_geral,
                ROUND(AVG(sdr.nota_abertura), 1) AS media_abertura,
                ROUND(AVG(sdr.nota_spin), 1) AS media_spin,
                ROUND(AVG(sdr.nota_perfil), 1) AS media_perfil,
                ROUND(AVG(sdr.nota_bant), 1) AS media_bant,
                ROUND(AVG(sdr.nota_escuta), 1) AS media_escuta,
                ROUND(AVG(sdr.nota_prox_passo), 1) AS media_prox_passo
            FROM chamadas c
            LEFT JOIN registro_chamadas rc ON rc.protocolo = c.protocolo
            LEFT JOIN avaliacao_ia ai ON ai.log = rc.log
            LEFT JOIN avaliacao_sdr sdr ON sdr.log = ai.log
            WHERE c.dt_inicio >= $1::timestamp 
              AND c.dt_inicio <= $2::timestamp 
              AND c.agente_login = $3::text;
        `;

        // 2. Gráfico Evolutivo (Média geral agrupada por semana nas últimas 4 semanas)
        // Usamos date_trunc para agrupar as datas e INTERVAL '4 weeks' para recuar o tempo
        const sqlEvolutivo = `
            SELECT 
                date_trunc('week', c.dt_inicio) AS semana_referencia,
                ROUND(AVG(sdr.nota_final), 1) AS media_nota_geral
            FROM chamadas c
            LEFT JOIN registro_chamadas rc ON rc.protocolo = c.protocolo
            LEFT JOIN avaliacao_ia ai ON ai.log = rc.log
            LEFT JOIN avaliacao_sdr sdr ON sdr.log = ai.log
            WHERE c.dt_inicio >= ($1::timestamp - INTERVAL '4 weeks')
              AND c.dt_inicio <= $2::timestamp
              AND c.agente_login = $3::text
            GROUP BY date_trunc('week', c.dt_inicio)
            ORDER BY semana_referencia ASC;
        `;

        // 3. Amostragem IA (30 Ligações - Apenas Metadados e Textos Avaliativos/Objeções)
        // Sem transcrição. Traz as 'melhorias' para gerar cards e as 'objecoes' pro mapa.
        const sqlAmostragem = `
            WITH chamadas_base AS (
                SELECT 
                    c.protocolo, rc.log,
                    sdr.nota_final,
                    sdr.acertos, 
                    sdr.melhorias, 
                    sdr.feedback_geral, 
                    sdr.frase_alternativa,
                    it.objecoes, 
                    it.resposta_sdr, 
                    it.reacao_interlocutor,
                    CASE 
                        WHEN sdr.nota_final < 60 THEN 'BAIXA'
                        WHEN sdr.nota_final > 90 THEN 'ALTA'
                        ELSE 'MEDIA'
                    END AS faixa
                FROM chamadas c
                INNER JOIN registro_chamadas rc ON rc.protocolo = c.protocolo
                INNER JOIN avaliacao_ia ai ON ai.log = rc.log
                INNER JOIN avaliacao_sdr sdr ON sdr.log = ai.log
                LEFT JOIN interlocutor it ON it.log = ai.log
                WHERE c.dt_inicio >= $1::timestamp 
                  AND c.dt_inicio <= $2::timestamp 
                  AND c.agente_login = $3::text
            ),
            baixas AS (SELECT * FROM chamadas_base WHERE faixa = 'BAIXA' ORDER BY nota_final ASC LIMIT 10),
            altas AS (SELECT * FROM chamadas_base WHERE faixa = 'ALTA' ORDER BY nota_final DESC LIMIT 10),
            medias AS (SELECT * FROM chamadas_base WHERE faixa = 'MEDIA' ORDER BY RANDOM() LIMIT (30 - (SELECT COUNT(*) FROM baixas) - (SELECT COUNT(*) FROM altas)))
            
            SELECT * FROM baixas 
            UNION ALL 
            SELECT * FROM altas 
            UNION ALL 
            SELECT * FROM medias;
        `;

        // Executa as 3 queries em paralelo
        const [kpisAtuais, historicoEvolutivo, amostragemIA] = await Promise.all([
            prisma.$queryRawUnsafe(sqlKpisAtuais, dtInicio, dtFim, agente),
            prisma.$queryRawUnsafe(sqlEvolutivo, dtInicio, dtFim, agente),
            prisma.$queryRawUnsafe(sqlAmostragem, dtInicio, dtFim, agente)
        ]);

        return reply.status(200).send({
            kpis_conversao_notas: kpisAtuais[0],      // Base matemática da semana atual
            grafico_evolutivo: historicoEvolutivo,    // Array das últimas 4 semanas + atual
            lote_ia_30_chamadas: amostragemIA         // Array de 30 com melhorias e objeções (sem transcrição)
        });

    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            erro: "Falha ao extrair dados bases para consolidação do perfil."
        });
    }
}



/**
 * Disparo manual / sob demanda da consolidação semanal de perfis de SDRs
 * POST /api/processamento/consolidar
 * Body opcional: { data_inicio: "YYYY-MM-DD", data_fim: "YYYY-MM-DD", id_agente: 123 }
 */
export async function dispararConsolidacaoManual(request, reply) {
    try {
        const { data_inicio, data_fim, id_agente } = request.body || {};

        const resultado = await executarConsolidacaoSemanal({
            dataInicio: data_inicio,
            dataFim: data_fim,
            idAgente: id_agente,
        });

        return reply.status(200).send({
            mensagem: "Consolidação processada com sucesso.",
            ...resultado,
        });
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            erro: "Falha ao executar a consolidação semanal.",
            detalhes: error.message,
        });
    }
}