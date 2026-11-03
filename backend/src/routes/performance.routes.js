import {
    getPerformanceKPIs,
    getPerformanceFunil,
    getPerformanceEvolucao
} from "../controllers/performance.controller.js";

export async function performanceRoutes(app) {
    // GET /api/performance/kpis
    app.get("/kpis", getPerformanceKPIs);

    // GET /api/performance/funil
    app.get("/funil", getPerformanceFunil);

    // GET /api/performance/evolucao
    app.get("/evolucao", getPerformanceEvolucao);
}