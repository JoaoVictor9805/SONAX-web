import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

// Schema formal de saída para diagnóstico comportamental via Zod
export const diagnosticoSchema = z.object({
    diagnostico_camada_3: z.object({
        sintese_executiva: z.object({
            destaque: z.string().describe("Principal ponto forte demonstrado na semana"),
            gargalo_principal: z.string().describe("Maior gargalo que prejudicou as conversões"),
            foco_da_semana: z.string().describe("Direcionamento prático e prioritário para a próxima semana"),
        }),
        parecer_executivo: z.string().describe("Visão executiva contextualizada e resumida sobre o desempenho do SDR"),
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

    // 3. Chaveamento automático via .withFallbacks()
    const resilientModel = primaryModel.withFallbacks({
        fallbacks: [fallbackModel],
    });

    // 4. Forçamento do Schema Estruturado
    const structuredModel = resilientModel.withStructuredOutput(diagnosticoSchema);

    // 5. Template de Prompt Padronizado
    const promptTemplate = ChatPromptTemplate.fromMessages([
        [
            "system",
            `Você é um treinador de vendas B2B sênior (Sales Enablement).
Sua missão é analisar um lote de chamadas de um SDR ({agente_nome}) e gerar um diagnóstico comportamental estruturado da semana.
Avalie os acertos, melhorias, notas e objeções mapeadas.
Você deve retornar estritamente a estrutura solicitada.
Escolha as 3 ligações que melhor representam os acertos (top_3) e as 3 que evidenciam o gargalo principal (bottom_3) indicando os protocolos correspondentes como strings.`
        ],
        [
            "human",
            `Período de Análise: {data_inicio} até {data_fim}
SDR: {agente_nome} (login: {agente_login})

Resumo de Indicadores da Semana:
{kpis_resumo}

Lote de Amostragem de Ligações (Avaliações e Objeções):
{lote_amostragem}

Gere o diagnóstico comportamental estruturado completo.`
        ]
    ]);

    return promptTemplate.pipe(structuredModel);
}

