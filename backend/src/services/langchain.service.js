import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

// Schema formal de saída para diagnóstico comportamental via Zod
export const diagnosticoSchema = z.object({
    parecer_executivo: z.string().describe("Visão executiva contextualizada e resumida sobre o desempenho do SDR em formato Markdown"),
    diagnostico_camada_3: z.object({
        sintese_executiva: z.object({
            destaque: z.string().describe("Principal ponto forte demonstrado na semana"),
            gargalo_principal: z.string().describe("Maior gargalo que prejudicou as conversões"),
            foco_da_semana: z.string().describe("Direcionamento prático e prioritário para a próxima semana"),
        }),
        sintese_qualitativa: z.object({
            validacao_dor: z.string().describe("Diagnóstico consolidado da capacidade do SDR em validar e aprofundar a dor do lead"),
            contato_inicial: z.string().describe("Diagnóstico consolidado da postura, tom e conexão no contato inicial"),
            isolamento_objecao: z.string().describe("Diagnóstico consolidado da técnica de isolamento e contorno de objeções"),
            qualidade_investigacao: z.string().describe("Diagnóstico consolidado das perguntas e profundidade investigativa do SDR"),
        }).describe("Síntese executiva consolidada dos 4 critérios qualitativos de vendas"),
        oportunidades_unificadas: z.array(
            z.object({
                codigo: z.string().optional().describe("Código mnemônico ou identificador da oportunidade"),
                prioridade: z.enum(["ALTA", "MEDIA", "BAIXA"]).describe("Nível de prioridade de intervenção"),
                percentual_aparicao: z.number().optional().describe("Frequência percentual observada"),
                diagnostico_consolidado: z.string().describe("Diagnóstico detalhado da oportunidade"),
            })
        ).describe("Lista consolidada de oportunidades de melhoria comportamental"),
        perfil_objecoes: z.array(
            z.object({
                objecao_padrao: z.string().describe("Objeção apresentada pelo interlocutor"),
                frequencia_percentual: z.number().optional().describe("Frequência de ocorrência"),
                reacao_predominante_sdr: z.string().describe("Como o SDR reagiu"),
                efetividade: z.enum(["ALTA", "MEDIA", "BAIXA"]).describe("Efetividade da resposta do SDR"),
                recomendacao_curta: z.string().describe("Ação recomendada para contornar a objeção"),
            })
        ).describe("Mapeamento das principais objeções"),
    }),
    protocolos_selecionados: z.object({
        top_3: z.array(z.string()).describe("Os 3 números de protocolo das melhores ligações"),
        bottom_3: z.array(z.string()).describe("Os 3 números de protocolo das ligações mais críticas"),
    }),
});

/**
 * Cria a chain estruturada do LangChain com fallback automático entre modelos Gemini.
 * Modelo primário: gemini-3.1-flash-lite
 * Modelo fallback: gemini-3.5-flash-lite (ativado automaticamente em erro de cota ou falha)
 */
export function createConsolidacaoChain() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY não configurada no ambiente.");
    }

    // 1. Modelo Primário
    const primaryModel = new ChatGoogleGenerativeAI({
        model: "gemini-3.1-flash-lite",
        apiKey,
        temperature: 0.2,
        maxRetries: 1,
    });

    // 2. Modelo de Fallback
    const fallbackModel = new ChatGoogleGenerativeAI({
        model: "gemini-3.5-flash-lite",
        apiKey,
        temperature: 0.2,
        maxRetries: 3,
    });

    // 3. Forçamento do Schema Estruturado em cada modelo
    const structuredPrimary = primaryModel.withStructuredOutput(diagnosticoSchema);
    const structuredFallback = fallbackModel.withStructuredOutput(diagnosticoSchema);

    // 4. Chaveamento automático resiliente via .withFallbacks()
    const resilientStructuredModel = structuredPrimary.withFallbacks({
        fallbacks: [structuredFallback],
    });

    // 5. Template de Prompt Padronizado
    const promptTemplate = ChatPromptTemplate.fromMessages([
        [
            "system",
            `Você é um treinador de vendas B2B sênior (Sales Enablement).
Sua missão é analisar um lote de chamadas de um SDR ({agente_nome}) e gerar um diagnóstico comportamental estruturado da semana.

Analise atentamente as chamadas fornecidas considerando:
1. Histórico evolutivo ({historico_evolutivo}): Avalie se o SDR está em evolução, estagnação ou queda em notas e reuniões em relação às semanas anteriores.
2. Indicadores gerais da semana ({kpis_resumo}): Taxas de conversão e médias dos 6 critérios metrificados (Abertura, SPIN, Perfil ICP, BANT, Escuta Ativa e Próximo Passo).
3. Lote de ligações ({lote_amostragem}):
   - Observações qualitativas por chamada: Validação da Dor (validacao_dor), Contato Inicial (contato_inicial), Isolamento de Objeções (isolamento_objecao) e Qualidade da Investigação (qualidade_investigacao).
   - Acertos, melhorias, feedback geral, frase original dita pelo SDR (frase_original) e frase alternativa sugerida (frase_alternativa).
   - Mapeamento do Interlocutor: interesse expresso, dúvidas, objeções apresentadas, resposta do SDR e reação do interlocutor.

Você deve retornar estritamente a estrutura solicitada:
- parecer_executivo: Parecer contextualizado e analítico sobre o desempenho e evolução do SDR em formato Markdown.
- diagnostico_camada_3: 
   - sintese_executiva: Destaque principal, gargalo principal e foco prioritário da semana.
   - sintese_qualitativa: Diagnóstico consolidado da semana para cada um dos 4 pilares qualitativos (validacao_dor, contato_inicial, isolamento_objecao, qualidade_investigacao).
   - oportunidades_unificadas: Lista priorizada de intervenções e planos de ação.
   - perfil_objecoes: Mapeamento analítico de objeções encontradas.
- protocolos_selecionados: Escolha as 3 ligações que melhor representam os acertos (top_3) e as 3 que evidenciam o gargalo principal ou falhas críticas (bottom_3), retornando os números de protocolo correspondentes como strings.`
        ],
        [
            "human",
            `Período de Análise: {data_inicio} até {data_fim}
SDR: {agente_nome} (login: {agente_login})

Histórico Evolutivo das Últimas Semanas (Evolução de Notas e Reuniões):
{historico_evolutivo}

Resumo de Indicadores da Semana:
{kpis_resumo}

Lote de Amostragem de Ligações (Avaliações Qualitativas, Notas e Objeções):
{lote_amostragem}

Gere o diagnóstico comportamental estruturado completo.`
        ]
    ]);

    return promptTemplate.pipe(resilientStructuredModel);
}

