import {
    getPerformanceKPIs,
    getPerformanceFunil,
    getPerformanceEvolucao,
    getPerformanceRankingSDRs,
    getPerformanceTermometroMetodologias
} from "../controllers/performance.controller.js";

export async function performanceRoutes(app) {
    // GET /api/performance/kpis
    app.get("/kpis", getPerformanceKPIs);

    // GET /api/performance/funil
    app.get("/funil", getPerformanceFunil);

    // GET /api/performance/evolucao
    app.get("/evolucao", getPerformanceEvolucao);

    // GET /api/performance/ranking-sdrs
    app.get("/ranking-sdrs", getPerformanceRankingSDRs);

    // 5. Base-Direita: Termômetro de Maturidade Metodológica (Perfil, SPIN e BANT)
    app.get("/termometro-metodologias", getPerformanceTermometroMetodologias);
}