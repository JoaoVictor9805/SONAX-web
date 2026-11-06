import { prisma } from "../lib/prisma.js";

/**
 * Extração analítica direta do banco de dados para um SDR em um período:
 * 1. KPIs de conversão e médias dos 6 critérios
 * 2. Gráfico evolutivo (médias semanais das últimas 4 semanas)
 * 3. Lote de amostragem de 30 chamadas com notas, observações qualitativas e objeções
 */
export async function extrairDadosSdr(agenteLogin, dtInicio, dtFim) {
    const sqlKpis = `
        SELECT 
            COUNT(*)::int AS total_realizadas,
            COUNT(*) FILTER (WHERE c.atendido = 's')::int AS total_atendidas,
            COUNT(*) FILTER (WHERE ai.ligacao_relevante = 's')::int AS total_relevantes,
            COUNT(*) FILTER (WHERE ai.conversa_decisor = 's')::int AS total_decisor,
            COUNT(*) FILTER (WHERE ai.reuniao_confirmada = 's')::int AS total_reunioes,
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

    const sqlEvolutivo = `
        SELECT 
            date_trunc('week', c.dt_inicio) AS semana_referencia,
            ROUND(AVG(sdr.nota_final), 1) AS media_nota_geral,
            ROUND(AVG(sdr.nota_abertura), 1) AS media_abertura,
            ROUND(AVG(sdr.nota_spin), 1) AS media_spin,
            ROUND(AVG(sdr.nota_perfil), 1) AS media_perfil,
            ROUND(AVG(sdr.nota_bant), 1) AS media_bant,
            ROUND(AVG(sdr.nota_escuta), 1) AS media_escuta,
            ROUND(AVG(sdr.nota_prox_passo), 1) AS media_prox_passo,
            COUNT(*) FILTER (WHERE ai.reuniao_confirmada = 's')::int AS reunioes,
            COUNT(*)::int AS total_realizadas,
            COUNT(*) FILTER (WHERE c.atendido = 's')::int AS total_atendidas
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

    const sqlAmostragem = `
        WITH chamadas_base AS (
            SELECT 
                c.protocolo::text AS protocolo,
                rc.log,
                c.numero,
                sdr.nota_final,
                sdr.acertos, 
                sdr.melhorias, 
                sdr.feedback_geral, 
                sdr.frase_original,
                sdr.frase_alternativa,
                sdr.validacao_dor,
                sdr.contato_inicial,
                sdr.isolamento_objecao,
                sdr.qualidade_investigacao,
                sdr.nota_abertura, 
                sdr.justificativa_abertura,
                sdr.nota_spin, 
                sdr.justificativa_spin,
                sdr.nota_perfil, 
                sdr.justificativa_perfil,
                sdr.nota_bant, 
                sdr.justificativa_bant,
                sdr.nota_escuta, 
                sdr.justificativa_escuta,
                sdr.nota_prox_passo,
                sdr.justificativa_prox_passo,
                it.interesse_expresso,
                it.duvidas,
                it.objecoes, 
                it.resposta_sdr, 
                it.reacao_interlocutor,
                ai.resultado_frase,
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

    const [kpisAtuais, historicoEvolutivo, amostragemIA] = await Promise.all([
        prisma.$queryRawUnsafe(sqlKpis, dtInicio, dtFim, agenteLogin),
        prisma.$queryRawUnsafe(sqlEvolutivo, dtInicio, dtFim, agenteLogin),
        prisma.$queryRawUnsafe(sqlAmostragem, dtInicio, dtFim, agenteLogin),
    ]);

    // Identifica a última semana anterior mais recente em relação à data de início atual
    const dtInicioMs = new Date(dtInicio).getTime();
    const semanasAnteriores = (historicoEvolutivo || []).filter(
        (h) => new Date(h.semana_referencia).getTime() < dtInicioMs
    );
    const semanaAnteriorMaisRecente = semanasAnteriores.length > 0
        ? semanasAnteriores[semanasAnteriores.length - 1]
        : (historicoEvolutivo && historicoEvolutivo.length >= 2 ? historicoEvolutivo[historicoEvolutivo.length - 2] : null);

    const comparativoSemanaAnterior = semanaAnteriorMaisRecente ? {
        semana_referencia: semanaAnteriorMaisRecente.semana_referencia,
        nota_media_geral: Number(semanaAnteriorMaisRecente.media_nota_geral || 0),
        notas_criterios: {
            abertura: Number(semanaAnteriorMaisRecente.media_abertura || 0),
            spin: Number(semanaAnteriorMaisRecente.media_spin || 0),
            perfil: Number(semanaAnteriorMaisRecente.media_perfil || 0),
            bant: Number(semanaAnteriorMaisRecente.media_bant || 0),
            escuta: Number(semanaAnteriorMaisRecente.media_escuta || 0),
            prox_passo: Number(semanaAnteriorMaisRecente.media_prox_passo || 0),
        },
        reunioes: Number(semanaAnteriorMaisRecente.reunioes || 0),
        total_realizadas: Number(semanaAnteriorMaisRecente.total_realizadas || 0),
        total_atendidas: Number(semanaAnteriorMaisRecente.total_atendidas || 0),
    } : null;

    return {
        kpis: kpisAtuais[0] || {},
        historico: historicoEvolutivo || [],
        amostragem: amostragemIA || [],
        comparativo_semana_anterior: comparativoSemanaAnterior,
    };
}

