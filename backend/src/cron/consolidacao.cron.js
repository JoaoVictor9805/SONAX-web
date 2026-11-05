import cron from "node-cron";

/**
 * Agendador Cron de Consolidação Semanal
 * 
 * NOTA ARQUITETURAL:
 * O disparo em lote automático geral está temporariamente pausado.
 * O fluxo completo em lote (SDRs -> Departamento -> Equipe) será ativado
 * assim que as etapas de Rollup forem implementadas.
 */
export function initConsolidacaoCron() {
    console.log("[Cron Job] Consolidação automática geral pausada (fechamento atual opera estritamente por SDR individual).");
}
