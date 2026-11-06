import { prisma } from "../lib/prisma.js";
import { createConsolidacaoChain } from "./langchain.service.js";
import { extrairDadosSdr } from "./processamento.service.js";

// Re-exporta para manter compatibilidade
export { extrairDadosSdr };

/**
 * Calcula a semana de trabalho anterior (Segunda a Sexta) com base em uma data de referência.
 */
export function calcularSemanaAnterior(referencia = new Date()) {
    const dataRef = new Date(referencia);
    const diaSemana = dataRef.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

    // Distância até a sexta-feira anterior:
    // Se for sábado (6), a sexta foi ontem (-1 dia).
    // Se for domingo (0), a sexta foi há 2 dias (-2 dias).
    // Para outros dias, retrocede até a sexta da semana anterior.
    const diffAteSexta = diaSemana === 6 ? -1 : diaSemana === 0 ? -2 : -(diaSemana + 2);

    const sexta = new Date(dataRef);
    sexta.setDate(dataRef.getDate() + diffAteSexta);
    sexta.setHours(23, 59, 59, 999);

    const segunda = new Date(sexta);
    segunda.setDate(sexta.getDate() - 4);
    segunda.setHours(0, 0, 0, 0);

    const ano = segunda.getFullYear();
    const mes = segunda.getMonth() + 1; // 1 a 12
    const semanaDoMes = Math.ceil(segunda.getDate() / 7);

    const formatarData = (d) => d.toISOString().split("T")[0];

    return {
        dataInicioStr: formatarData(segunda),
        dataFimStr: formatarData(sexta),
        dtInicio: `${formatarData(segunda)} 00:00:00`,
        dtFim: `${formatarData(sexta)} 23:59:59.999`,
        ano,
        mes,
        semanaDoMes,
        dataInicioDate: segunda,
        dataFimDate: sexta,
    };
}



/**
 * Passo 3: Busca de transcrições das chamadas selecionadas pela IA (Top 3 Melhores e Bottom 3 Piores)
 */
export async function buscarTranscricoes(protocolosStr) {
    if (!protocolosStr || protocolosStr.length === 0) return [];

    const protocolosBigInt = protocolosStr
        .map((p) => {
            try {
                return BigInt(p);
            } catch {
                return null;
            }
        })
        .filter((p) => p !== null);

    if (protocolosBigInt.length === 0) return [];

    return await prisma.registro_chamadas.findMany({
        where: {
            protocolo: { in: protocolosBigInt },
        },
        select: {
            protocolo: true,
            log: true,
            transcricao: true,
        },
    });
}

/**
 * Monta as métricas estruturadas das 4 camadas para inserção em perfis_consolidados
 */
export function montarCamadas({ kpis, historico, amostragem, respostaIA, registrosTranscritas }) {
    // 1. Camada 1: Métricas de Funil e Passagem
    const realizadas = Number(kpis.total_realizadas || 0);
    const atendidas = Number(kpis.total_atendidas || 0);
    const relevantes = Number(kpis.total_relevantes || 0);
    const decisor = Number(kpis.total_decisor || 0);
    const reunioes = Number(kpis.total_reunioes || 0);

    const txAtendimento = realizadas > 0 ? Math.round((atendidas / realizadas) * 100) : 0;
    const txRelevancia = atendidas > 0 ? Math.round((relevantes / atendidas) * 100) : 0;
    const txDecisor = relevantes > 0 ? Math.round((decisor / relevantes) * 100) : 0;
    const txConversaoFinal = decisor > 0 ? Math.round((reunioes / decisor) * 100) : 0;

    const taxas = [
        { etapa: "atendimento", valor: txAtendimento },
        { etapa: "relevancia", valor: txRelevancia },
        { etapa: "decisor", valor: txDecisor },
        { etapa: "conversao_final", valor: txConversaoFinal },
    ];
    const gargaloEtapa = taxas.reduce((menor, atual) => (atual.valor < menor.valor ? atual : menor), taxas[0]).etapa;

    const rankingAdaptativo = historico.map((h, idx) => ({
        periodo: idx === historico.length - 1 ? "Semana Atual" : `Semana ${idx + 1}`,
        reunioes: h.reunioes !== undefined && h.reunioes !== null ? Number(h.reunioes) : reunioes,
        nota_media: Number(h.media_nota_geral || 0),
    }));

    const metricas_camada_1 = {
        fluxo_bruto: {
            realizadas,
            atendidas,
            relevantes,
            decisor,
            reunioes,
        },
        funil_passagem: {
            atendimento: txAtendimento,
            relevancia: txRelevancia,
            decisor: txDecisor,
            conversao_final: txConversaoFinal,
            gargalo_etapa: gargaloEtapa,
        },
        ranking_adaptativo: rankingAdaptativo,
    };

    // 2. Camada 2: Radar de Competências e Notas
    const notaMediaGeral = Number(kpis.media_nota_geral || 0);

    // Identifica a última semana anterior mais recente
    const penultimaSemanaObj = historico.length >= 2 ? historico[historico.length - 2] : null;
    const notaMediaAnterior = penultimaSemanaObj ? Number(penultimaSemanaObj.media_nota_geral || 0) : null;
    const deltaPeriodoAnterior = notaMediaAnterior !== null ? Math.round(notaMediaGeral - notaMediaAnterior) : 0;

    const criteriosRadar = [
        {
            criterio: "Abertura",
            nota: Number(kpis.media_abertura || 0),
            nota_anterior: penultimaSemanaObj ? Number(penultimaSemanaObj.media_abertura || 0) : null,
            delta: penultimaSemanaObj ? Math.round(Number(kpis.media_abertura || 0) - Number(penultimaSemanaObj.media_abertura || 0)) : 0,
        },
        {
            criterio: "SPIN",
            nota: Number(kpis.media_spin || 0),
            nota_anterior: penultimaSemanaObj ? Number(penultimaSemanaObj.media_spin || 0) : null,
            delta: penultimaSemanaObj ? Math.round(Number(kpis.media_spin || 0) - Number(penultimaSemanaObj.media_spin || 0)) : 0,
        },
        {
            criterio: "Perfil ICP",
            nota: Number(kpis.media_perfil || 0),
            nota_anterior: penultimaSemanaObj ? Number(penultimaSemanaObj.media_perfil || 0) : null,
            delta: penultimaSemanaObj ? Math.round(Number(kpis.media_perfil || 0) - Number(penultimaSemanaObj.media_perfil || 0)) : 0,
        },
        {
            criterio: "BANT",
            nota: Number(kpis.media_bant || 0),
            nota_anterior: penultimaSemanaObj ? Number(penultimaSemanaObj.media_bant || 0) : null,
            delta: penultimaSemanaObj ? Math.round(Number(kpis.media_bant || 0) - Number(penultimaSemanaObj.media_bant || 0)) : 0,
        },
        {
            criterio: "Escuta Ativa",
            nota: Number(kpis.media_escuta || 0),
            nota_anterior: penultimaSemanaObj ? Number(penultimaSemanaObj.media_escuta || 0) : null,
            delta: penultimaSemanaObj ? Math.round(Number(kpis.media_escuta || 0) - Number(penultimaSemanaObj.media_escuta || 0)) : 0,
        },
        {
            criterio: "Próximo Passo",
            nota: Number(kpis.media_prox_passo || 0),
            nota_anterior: penultimaSemanaObj ? Number(penultimaSemanaObj.media_prox_passo || 0) : null,
            delta: penultimaSemanaObj ? Math.round(Number(kpis.media_prox_passo || 0) - Number(penultimaSemanaObj.media_prox_passo || 0)) : 0,
        },
    ];

    const comparativoSemanaAnterior = penultimaSemanaObj ? {
        semana_referencia: penultimaSemanaObj.semana_referencia,
        nota_media_geral: Number(penultimaSemanaObj.media_nota_geral || 0),
        notas_criterios: {
            abertura: Number(penultimaSemanaObj.media_abertura || 0),
            spin: Number(penultimaSemanaObj.media_spin || 0),
            perfil: Number(penultimaSemanaObj.media_perfil || 0),
            bant: Number(penultimaSemanaObj.media_bant || 0),
            escuta: Number(penultimaSemanaObj.media_escuta || 0),
            prox_passo: Number(penultimaSemanaObj.media_prox_passo || 0),
        },
        reunioes: Number(penultimaSemanaObj.reunioes || 0),
        total_realizadas: Number(penultimaSemanaObj.total_realizadas || 0),
        total_atendidas: Number(penultimaSemanaObj.total_atendidas || 0),
    } : null;

    const metricas_camada_2 = {
        nota_media_geral: notaMediaGeral,
        delta_periodo_anterior: deltaPeriodoAnterior,
        comparativo_semana_anterior: comparativoSemanaAnterior,
        criterios_radar: criteriosRadar,
        metodologias: {
            spin_aderencia: Number(kpis.media_spin || 0),
            bant_aderencia: Number(kpis.media_bant || 0),
        },
    };

    // 3. Camada 3: Diagnóstico Comportamental da IA
    const diagnostico_camada_3 = respostaIA.diagnostico_camada_3;
    const parecer_executivo = respostaIA.parecer_executivo || respostaIA.diagnostico_camada_3?.parecer_executivo || "";

    // 4. Camada 4: Evidências e Transcrições (Top 3 Melhores e Bottom 3 Piores)
    const mapaTranscritas = new Map();
    for (const r of registrosTranscritas) {
        mapaTranscritas.set(r.protocolo.toString(), r.transcricao);
    }

    const mapaAmostras = new Map();
    for (const a of amostragem) {
        mapaAmostras.set(a.protocolo?.toString(), a);
    }

    const formatarEvidencia = (protoStr, isMelhor) => {
        const protoKey = protoStr?.toString();
        const amostra = mapaAmostras.get(protoKey) || {};
        const transcricao = mapaTranscritas.get(protoKey) || "Transcrição não disponível.";
        const interlocutorLabel = amostra.numero ? `Lead (${amostra.numero})` : "Lead";

        const base = {
            protocolo: Number(protoStr) || protoStr,
            log: amostra.log || "",
            numero: amostra.numero || "",
            nota: Number(amostra.nota_final || 0),
            audio_url: `/audios/${protoStr}.mp3`,
            interlocutor: interlocutorLabel,
            transcricao,
            feedback_geral: amostra.feedback_geral || "",
            resultado_frase: amostra.resultado_frase || "",
            acertos: amostra.acertos || null,
            melhorias: amostra.melhorias || null,
            frase_original: amostra.frase_original || null,
            frase_alternativa: amostra.frase_alternativa || null,
            notas_criterios: {
                abertura: Number(amostra.nota_abertura || 0),
                spin: Number(amostra.nota_spin || 0),
                perfil: Number(amostra.nota_perfil || 0),
                bant: Number(amostra.nota_bant || 0),
                escuta: Number(amostra.nota_escuta || 0),
                prox_passo: Number(amostra.nota_prox_passo || 0),
            },
            justificativa_criterios: {
                abertura: Number(amostra.nota_abertura || 0),
                spin: Number(amostra.nota_spin || 0),
                perfil: Number(amostra.nota_perfil || 0),
                bant: Number(amostra.nota_bant || 0),
                escuta: Number(amostra.nota_escuta || 0),
                prox_passo: Number(amostra.nota_prox_passo || 0),
            },
            justificativas_textuais: {
                abertura: amostra.justificativa_abertura || null,
                spin: amostra.justificativa_spin || null,
                perfil: amostra.justificativa_perfil || null,
                bant: amostra.justificativa_bant || null,
                escuta: amostra.justificativa_escuta || null,
                prox_passo: amostra.justificativa_prox_passo || null,
            },
            criterios_qualitativos: {
                validacao_dor: amostra.validacao_dor || null,
                contato_inicial: amostra.contato_inicial || null,
                isolamento_objecao: amostra.isolamento_objecao || null,
                qualidade_investigacao: amostra.qualidade_investigacao || null,
            },
            detalhes_interlocutor: {
                interesse_expresso: amostra.interesse_expresso || null,
                duvidas: amostra.duvidas || null,
                objecoes: amostra.objecoes || null,
                resposta_sdr: amostra.resposta_sdr || null,
                reacao_interlocutor: amostra.reacao_interlocutor || null,
            },
        };

        if (isMelhor) {
            return {
                ...base,
                ponto_forte: amostra.acertos || "Excelente condução e qualificação",
            };
        } else {
            return {
                ...base,
                falha_critica: amostra.melhorias || "Dificuldade no contorno de objeções",
            };
        }
    };

    const top3Protos = respostaIA.protocolos_selecionados?.top_3 || [];
    const bottom3Protos = respostaIA.protocolos_selecionados?.bottom_3 || [];

    const evidencias_camada_4 = {
        top_3_melhores: top3Protos.map((p) => formatarEvidencia(p, true)),
        top_3_piores: bottom3Protos.map((p) => formatarEvidencia(p, false)),
    };

    return {
        metricas_camada_1,
        metricas_camada_2,
        diagnostico_camada_3,
        evidencias_camada_4,
        parecer_executivo,
    };
}

/**
 * Executa os 4 passos para um agente específico e realiza o Upsert idempotente no banco.
 * Aceita opcionalmente 'dadosProcessamento' pré-coletados pela rota de processamento,
 * eliminando a redundância de consultar o banco novamente.
 */
export async function consolidarPerfilAgente({
    agente,
    dataInicio,
    dataFim,
    ano,
    mes,
    semanaDoMes,
    chain,
    dadosProcessamento = null,
}) {
    console.log(`[Consolidação] Processando SDR ${agente.agente_nome} (${agente.agente_login})...`);

    const dtInicio = `${dataInicio.split("T")[0]} 00:00:00`;
    const dtFim = `${dataFim.split("T")[0]} 23:59:59.999`;

    let kpis;
    let historico;
    let amostragem;

    // Se os dados já foram fornecidos (ex.: vindos da rota de processamento), não refaz as 3 queries
    if (dadosProcessamento) {
        console.log(`[Consolidação] Utilizando dados pré-coletados pela rota de processamento para ${agente.agente_login} (sem nova consulta analítica ao banco).`);
        kpis = dadosProcessamento.kpis_conversao_notas || dadosProcessamento.kpis || {};
        historico = dadosProcessamento.grafico_evolutivo || dadosProcessamento.historico || [];
        amostragem = dadosProcessamento.lote_ia_30_chamadas || dadosProcessamento.amostragem || [];
    } else {
        // Passo 1: Extração SQL direta do banco de dados
        const dadosExtraidos = await extrairDadosSdr(agente.agente_login, dtInicio, dtFim);
        kpis = dadosExtraidos.kpis;
        historico = dadosExtraidos.historico;
        amostragem = dadosExtraidos.amostragem;
    }

    if (!amostragem || amostragem.length === 0) {
        console.warn(`[Consolidação] Sem chamadas avaliadas para ${agente.agente_login} no período.`);
        return { status: "sem_dados", agente: agente.agente_login };
    }

    // Passo 2: Diagnóstico IA via LangChain.js
    const payloadPrompt = {
        agente_nome: agente.agente_nome,
        agente_login: agente.agente_login,
        data_inicio: dataInicio.split("T")[0],
        data_fim: dataFim.split("T")[0],
        historico_evolutivo: JSON.stringify(historico, null, 2),
        kpis_resumo: JSON.stringify(kpis, null, 2),
        lote_amostragem: JSON.stringify(amostragem, null, 2),
    };

    const respostaIA = await chain.invoke(payloadPrompt);

    // Passo 3: Busca de Transcrições
    const protocolosSelecionados = [
        ...(respostaIA.protocolos_selecionados?.top_3 || []),
        ...(respostaIA.protocolos_selecionados?.bottom_3 || []),
    ];

    const registrosTranscritas = await buscarTranscricoes(protocolosSelecionados);

    // Passo 4: Montagem das Camadas e Upsert Idempotente
    const camadas = montarCamadas({
        kpis,
        historico,
        amostragem,
        respostaIA,
        registrosTranscritas,
    });

    const dataInicioDate = new Date(`${dataInicio.split("T")[0]}T00:00:00.000Z`);
    const dataFimDate = new Date(`${dataFim.split("T")[0]}T00:00:00.000Z`);

    const registroUpsert = await prisma.perfis_consolidados.upsert({
        where: {
            tipo_escopo_granularidade_ano_mes_semana_do_mes_id_agente_id_departamento: {
                tipo_escopo: "AGENTE",
                granularidade: "SEMANAL",
                ano,
                mes,
                semana_do_mes: semanaDoMes,
                id_agente: agente.id_agente,
                id_departamento: agente.id_departamento || null,
            },
        },
        update: {
            data_inicio: dataInicioDate,
            data_fim: dataFimDate,
            metricas_camada_1: camadas.metricas_camada_1,
            metricas_camada_2: camadas.metricas_camada_2,
            diagnostico_camada_3: camadas.diagnostico_camada_3,
            evidencias_camada_4: camadas.evidencias_camada_4,
            parecer_executivo: camadas.parecer_executivo,
            processado_em: new Date(),
        },
        create: {
            tipo_escopo: "AGENTE",
            granularidade: "SEMANAL",
            ano,
            mes,
            semana_do_mes: semanaDoMes,
            data_inicio: dataInicioDate,
            data_fim: dataFimDate,
            id_agente: agente.id_agente,
            id_departamento: agente.id_departamento || null,
            metricas_camada_1: camadas.metricas_camada_1,
            metricas_camada_2: camadas.metricas_camada_2,
            diagnostico_camada_3: camadas.diagnostico_camada_3,
            evidencias_camada_4: camadas.evidencias_camada_4,
            parecer_executivo: camadas.parecer_executivo,
            processado_em: new Date(),
        },
    });

    console.log(`[Consolidação] Perfil consolidado com sucesso para ${agente.agente_login} (ID: ${registroUpsert.id_perfil}).`);
    return { status: "sucesso", id_perfil: registroUpsert.id_perfil, agente: agente.agente_login };
}

/**
 * Orquestrador da Consolidação Semanal Individual por SDR
 */
export async function executarConsolidacaoSemanal({
    dataInicio,
    dataFim,
    idAgente,
    agenteLogin,
    dadosProcessamento = null,
} = {}) {
    if (!idAgente && !agenteLogin) {
        throw new Error("A consolidação geral em lote está bloqueada. Informe 'idAgente' ou 'agenteLogin' para processar individualmente.");
    }

    console.log("[Consolidação Semanal] Iniciando consolidação individual de SDR...");

    // Se as datas não foram passadas, calcula a semana de trabalho anterior
    const semanaPadrao = calcularSemanaAnterior();
    const dtInicioFinal = dataInicio || semanaPadrao.dataInicioStr;
    const dtFimFinal = dataFim || semanaPadrao.dataFimStr;

    const dataRef = new Date(`${dtInicioFinal}T00:00:00Z`);
    const ano = semanaPadrao.ano || dataRef.getFullYear();
    const mes = semanaPadrao.mes || dataRef.getMonth() + 1;
    const semanaDoMes = semanaPadrao.semanaDoMes || Math.ceil(dataRef.getDate() / 7);

    // Instancia a chain resiliente do LangChain
    const chain = createConsolidacaoChain();

    // Filtra o agente específico
    const whereAgente = { ativo: true };
    if (idAgente) {
        whereAgente.id_agente = Number(idAgente);
    }
    if (agenteLogin) {
        whereAgente.agente_login = agenteLogin.trim();
    }

    const agentesAtivos = await prisma.agentes.findMany({
        where: whereAgente,
        select: {
            id_agente: true,
            agente_login: true,
            agente_nome: true,
            id_departamento: true,
        },
    });

    if (agentesAtivos.length === 0) {
        throw new Error(`Nenhum SDR ativo encontrado com o identificador fornecido.`);
    }

    console.log(`[Consolidação Semanal] SDR selecionado: ${agentesAtivos[0].agente_nome} (${agentesAtivos[0].agente_login}) para o período ${dtInicioFinal} a ${dtFimFinal}.`);

    const resultados = [];

    for (const agente of agentesAtivos) {
        try {
            const res = await consolidarPerfilAgente({
                agente,
                dataInicio: dtInicioFinal,
                dataFim: dtFimFinal,
                ano,
                mes,
                semanaDoMes,
                chain,
                dadosProcessamento,
            });
            resultados.push(res);
        } catch (erro) {
            console.error(`[Consolidação Semanal] Erro ao consolidar perfil de ${agente.agente_login}:`, erro);
            resultados.push({ status: "erro", agente: agente.agente_login, erro: erro.message });
        }
    }

    // Hook preparado para Rollup Departamental futuro:
    // await executarRollupDepartamentos({ ano, mes, semanaDoMes, dataInicio: dtInicioFinal, dataFim: dtFimFinal });

    console.log("[Consolidação Semanal] Ciclo finalizado:", resultados);
    return {
        periodo: { data_inicio: dtInicioFinal, data_fim: dtFimFinal, ano, mes, semana_do_mes: semanaDoMes },
        total_agentes: agentesAtivos.length,
        resultados,
    };
}

