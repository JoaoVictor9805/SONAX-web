import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  Target,
  Zap,
  Star,
  Search,
  X,
  Sparkles,
  Check,
  ArrowUpRight,
  Info,
  RefreshCw,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend as RechartsLegend,
} from "recharts";

import {
  AgentOption,
  CallEvidence,
  ConsolidatedProfileData,
  CRITERIA_META,
  PeriodOption,
} from "@/types/dashboard";
import {
  fetchConsolidacaoFiltros,
  fetchPerfilConsolidado,
} from "@/services/api";

// ============== FALLBACK INITIAL DATA ==============

const DEFAULT_AGENTS: AgentOption[] = [
  { id_agente: 1, agente_login: "sdr_lucas", agente_nome: "Lucas Silveira", id_departamento: 1, departamento_nome: "Comercial Geral" },
  { id_agente: 2, agente_login: "sdr_prado", agente_nome: "Lucas Prado", id_departamento: 1, departamento_nome: "Comercial Geral" },
  { id_agente: 3, agente_login: "sdr_beatriz", agente_nome: "Beatriz Lima", id_departamento: 2, departamento_nome: "Comercial Tributário" },
  { id_agente: 4, agente_login: "sdr_thiago", agente_nome: "Thiago Ramos", id_departamento: 3, departamento_nome: "Inbound Corporativo" },
  { id_agente: 5, agente_login: "sdr_mariana", agente_nome: "Mariana Souza", id_departamento: 2, departamento_nome: "Comercial Tributário" },
  { id_agente: 6, agente_login: "sdr_felipe", agente_nome: "Felipe Mendes", id_departamento: 1, departamento_nome: "Comercial Geral" },
  { id_agente: 7, agente_login: "sdr_karolyne", agente_nome: "Karolyne Gluszczynski", id_departamento: 3, departamento_nome: "Inbound Corporativo" },
];

const DEFAULT_DEPARTMENTS = [
  "Comercial Geral",
  "Comercial Tributário",
  "Inbound Corporativo",
];

// ============== UTILITY COMPONENTS (HUDDLY B&W + GREEN + RED) ==============

const ScoreBadge = ({
  score,
  size = "sm",
}: {
  score: number;
  size?: "sm" | "lg";
}) => {
  const isHigh = score >= 70;
  const isCritical = score < 55;

  return (
    <div
      className={cn(
        "flex items-center justify-center font-medium rounded-2xl shrink-0 transition-all",
        size === "lg" ? "w-14 h-14 text-xl" : "w-11 h-11 text-sm",
        isHigh
          ? "bg-emerald-300/40 text-[#145F5E] font-semibold"
          : isCritical
            ? "bg-red-500 text-white font-semibold shadow-sm"
            : "bg-zinc-900 text-white"
      )}
    >
      {score}
    </div>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const variants: Record<string, { label: string; className: string }> = {
    ALTA: {
      label: "Prioridade Alta",
      className: "bg-red-500 text-white font-semibold",
    },
    MEDIA: {
      label: "Prioridade Média",
      className: "bg-yellow-200 text-yellow-900",
    },
    BAIXA: {
      label: "Prioridade Baixa",
      className: "bg-emerald-200 text-emerald-900",
    },
  };
  const v = variants[priority] || variants.BAIXA;
  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full text-xs font-medium shrink-0",
        v.className
      )}
    >
      {v.label}
    </span>
  );
};

// ============== HEADER WITH PILL NAVIGATION & AUTOCOMPLETE ==============

const Header = ({
  escopo,
  setEscopo,
  selectedEntity,
  setSelectedEntity,
  granularidade,
  setGranularidade,
  periodoLabel,
  departamentoNome,
  agentsList,
  departmentsList,
  periodsList,
  selectedPeriodKey,
  onSelectPeriodKey,
}: {
  escopo: "pessoal" | "departamento" | "equipe";
  setEscopo: (val: "pessoal" | "departamento" | "equipe") => void;
  selectedEntity: string;
  setSelectedEntity: (val: string) => void;
  granularidade: "semanal" | "mensal";
  setGranularidade: (val: "semanal" | "mensal") => void;
  periodoLabel: string;
  departamentoNome: string;
  agentsList: AgentOption[];
  departmentsList: string[];
  periodsList: PeriodOption[];
  selectedPeriodKey: string;
  onSelectPeriodKey: (key: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = React.useState(selectedEntity);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setSearchQuery(selectedEntity);
  }, [selectedEntity]);

  const sourceList =
    escopo === "pessoal"
      ? agentsList.map((a) => a.agente_nome)
      : departmentsList;

  const filteredSuggestions = sourceList.filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleScopeChange = (
    newScope: "pessoal" | "departamento" | "equipe"
  ) => {
    setEscopo(newScope);
    if (newScope === "pessoal") {
      const firstAgent = agentsList[0]?.agente_nome || "Lucas Silveira";
      setSelectedEntity(firstAgent);
      setSearchQuery(firstAgent);
    } else if (newScope === "departamento") {
      const firstDept = departmentsList[0] || "Comercial Geral";
      setSelectedEntity(firstDept);
      setSearchQuery(firstDept);
    } else {
      setSelectedEntity("Equipe Completa");
      setSearchQuery("");
    }
  };

  const isScopeEquipe = escopo === "equipe";

  const groupedPeriods = React.useMemo(() => {
    const map = new Map<string, PeriodOption[]>();
    for (const p of periodsList) {
      const group = map.get(p.mes_label) || [];
      group.push(p);
      map.set(p.mes_label, group);
    }
    return Array.from(map.entries());
  }, [periodsList]);

  return (
    <div className="mb-8 space-y-6">
      {/* Top Bar: Brand + Scope Pill Switcher + Search Autocomplete Pill */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Brand Logo Estilo Huddly */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-300/70 flex items-center justify-center text-[#145F5E] shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-zinc-900">
            sonax
          </span>
        </div>

        {/* Center Pill Navigation: Seletor de Escopo com layoutId */}
        <div className="inline-flex items-center bg-white p-1.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.03)] self-start lg:self-auto">
          {(
            [
              { id: "pessoal", label: "Pessoal (SDR)" },
              { id: "departamento", label: "Departamento" },
              { id: "equipe", label: "Equipe Geral" },
            ] as const
          ).map((tab) => {
            const isActive = escopo === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleScopeChange(tab.id)}
                className={cn(
                  "relative px-5 py-2 rounded-full text-xs font-medium transition-colors",
                  isActive
                    ? "text-white"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="scope-pill"
                    className="absolute inset-0 rounded-full bg-zinc-900 shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Campo Autocomplete */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-[260px]" ref={dropdownRef}>
            <div className="relative">
              <Search
                className={cn(
                  "h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2",
                  isScopeEquipe ? "text-zinc-300" : "text-zinc-400"
                )}
              />
              <input
                type="text"
                disabled={isScopeEquipe}
                value={isScopeEquipe ? "" : searchQuery}
                onFocus={() => !isScopeEquipe && setIsDropdownOpen(true)}
                onChange={(e) => {
                  if (!isScopeEquipe) {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }
                }}
                placeholder={
                  isScopeEquipe
                    ? "Filtro inativo para Equipe"
                    : escopo === "pessoal"
                      ? "Buscar agente..."
                      : "Buscar departamento..."
                }
                className={cn(
                  "w-full h-11 pl-10 pr-9 text-xs font-medium rounded-full bg-white text-zinc-900 shadow-[0_2px_10px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all",
                  isScopeEquipe
                    ? "opacity-50 cursor-not-allowed placeholder:text-zinc-300"
                    : "placeholder:text-zinc-400"
                )}
              />
              {searchQuery && !isScopeEquipe && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIsDropdownOpen(true);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <AnimatePresence>
              {isDropdownOpen && !isScopeEquipe && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="absolute z-50 mt-2 w-full bg-white rounded-3xl border border-zinc-100 shadow-xl max-h-60 overflow-y-auto p-2"
                >
                  {filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedEntity(item);
                          setSearchQuery(item);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-xs rounded-2xl flex items-center justify-between transition-colors",
                          selectedEntity === item
                            ? "bg-zinc-900 text-white font-medium"
                            : "text-zinc-700 hover:bg-zinc-100"
                        )}
                      >
                        <span>{item}</span>
                        {selectedEntity === item && (
                          <Check className="h-3.5 w-3.5 text-emerald-300" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-zinc-400">
                      Nenhum nome semelhante encontrado.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Second Row: Título Principal + Controles de Período */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pt-2">
        <motion.div
          key={selectedEntity}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-normal tracking-tight text-zinc-900">
            {selectedEntity}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {periodoLabel} • {departamentoNome}
          </p>
        </motion.div>

        {/* Controles de Granularidade e Período */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Pílula de Granularidade com layoutId */}
          <div className="inline-flex items-center bg-white p-1 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            {(
              [
                { id: "semanal", label: "Semanal" },
                { id: "mensal", label: "Mensal" },
              ] as const
            ).map((g) => {
              const isActive = granularidade === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGranularidade(g.id)}
                  className={cn(
                    "relative px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
                    isActive
                      ? "text-white"
                      : "text-zinc-600 hover:text-zinc-900"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="granularity-pill"
                      className="absolute inset-0 rounded-full bg-zinc-900"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 32,
                      }}
                    />
                  )}
                  <span className="relative z-10">{g.label}</span>
                </button>
              );
            })}
          </div>

          {/* Seletor de Período */}
          {granularidade === "semanal" ? (
            <Select
              value={selectedPeriodKey}
              onValueChange={(val) => onSelectPeriodKey(val)}
            >
              <SelectTrigger className="w-[220px] rounded-full bg-white border-0 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-xs font-medium h-9 px-4">
                <SelectValue placeholder="Selecione o Período" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-zinc-100 max-h-72">
                {groupedPeriods.length > 0 ? (
                  groupedPeriods.map(([mesLabel, items], idx) => (
                    <SelectGroup key={mesLabel} className={idx > 0 ? "mt-2" : ""}>
                      <SelectLabel className="pl-4 font-bold text-zinc-900 text-xs mt-2 border-b border-zinc-100 pb-1 mb-1">
                        {mesLabel}
                      </SelectLabel>
                      {items.map((p) => (
                        <SelectItem
                          key={p.chave}
                          value={p.chave}
                          className="pl-6 text-xs text-zinc-600"
                        >
                          {p.label_curto}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))
                ) : (
                  <SelectGroup>
                    <SelectLabel className="pl-4 font-bold text-zinc-900 text-xs mt-2 border-b border-zinc-100 pb-1 mb-1">
                      Novembro 2026
                    </SelectLabel>
                    <SelectItem
                      value="sem1-11-2026"
                      className="pl-6 text-xs text-zinc-600"
                    >
                      Semana 1 (02/11 a 06 Nov)
                    </SelectItem>
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          ) : (
            <Select defaultValue="nov26">
              <SelectTrigger className="w-[200px] rounded-full bg-white border-0 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-xs font-medium h-9 px-4">
                <SelectValue placeholder="Selecione o Mês" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-zinc-100 max-h-72">
                <SelectItem
                  value="nov26"
                  className="text-xs font-medium text-zinc-700"
                >
                  Novembro 2026
                </SelectItem>
                <SelectItem
                  value="out26"
                  className="text-xs font-medium text-zinc-700"
                >
                  Outubro 2026
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
};

// ============== CAMADA 1: FAIXA NOTA GERAL + PARECER EXECUTIVO ==============

const Layer1ExecutiveSection = ({
  notaGeral,
  delta,
  parecerExecutivo,
  sinteseExecutiva,
  sinteseQualitativa,
}: {
  notaGeral: number;
  delta: number;
  parecerExecutivo: string;
  sinteseExecutiva: ConsolidatedProfileData["diagnostico_camada_3"]["sintese_executiva"];
  sinteseQualitativa: ConsolidatedProfileData["diagnostico_camada_3"]["sintese_qualitativa"];
}) => {
  const qualitativeBlocks = [
    {
      label: "Validação da Dor do Cliente",
      text: sinteseQualitativa.validacao_dor,
    },
    { label: "Contato Inicial", text: sinteseQualitativa.contato_inicial },
    {
      label: "Isolamento de Objeção",
      text: sinteseQualitativa.isolamento_objecao,
    },
    {
      label: "Qualidade da Investigação",
      text: sinteseQualitativa.qualidade_investigacao,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mb-8 space-y-4"
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">
          Camada 1 • Síntese Executiva & Diagnóstico Geral
        </h2>
      </div>

      {/* Faixa de Largura Total Exclusiva para a Nota Média Geral */}
      <div className="w-full bg-white rounded-[28px] px-7 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-emerald-300" />
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-500 block">
              Indicador Global da Semana
            </span>
            <span className="text-base font-medium text-zinc-900">
              Nota Média Geral de Qualidade Técnica
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-light tracking-tight text-zinc-900">
              {Number(notaGeral).toFixed(1)}
            </span>
            <span className="text-sm text-zinc-400 font-normal">/ 100 pts</span>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold",
              delta >= 0
                ? "bg-emerald-300/60 text-[#145F5E]"
                : "bg-red-100 text-red-700"
            )}
          >
            {delta >= 0 ? `+${Number(delta).toFixed(1)}` : Number(delta).toFixed(1)} pts
          </span>
        </div>
      </div>

      {/* Card Principal da Camada 1 */}
      <div className="bg-white rounded-[28px] p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parecer Executivo */}
          <div className="lg:col-span-2 flex flex-col justify-between pr-0 lg:pr-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-900">
                  Parecer Executivo Consolidado
                </h3>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#F3F3F1] text-zinc-600">
                  IA Analysis
                </span>
              </div>
              <div className="space-y-3 text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                {parecerExecutivo}
              </div>
            </div>
          </div>

          {/* 3 Cards de Síntese Rápida */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-gradient-to-br from-emerald-100/70 via-teal-50/50 to-[#F3F3F1] rounded-2xl p-4 shadow-sm border border-emerald-100/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-300/50 text-[#145F5E]">
                  <Star className="h-3 w-3" /> Destaque
                </span>
              </div>
              <p className="text-xs text-zinc-800 leading-relaxed">
                {sinteseExecutiva.destaque}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-rose-50/30 rounded-2xl p-4 shadow-sm border border-red-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500 text-white shadow-sm">
                  <AlertTriangle className="h-3 w-3" /> Gargalo Principal
                </span>
              </div>
              <p className="text-xs text-red-950 font-medium leading-relaxed">
                {sinteseExecutiva.gargalo_principal}
              </p>
            </div>

            <div className="bg-[#F3F3F1] rounded-2xl p-4 shadow-sm border border-zinc-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-900 text-white">
                  <Target className="h-3 w-3 text-emerald-300" /> Foco da Semana
                </span>
              </div>
              <p className="text-xs text-zinc-800 leading-relaxed">
                {sinteseExecutiva.foco_da_semana}
              </p>
            </div>
          </div>
        </div>

        {/* Base: 4 Caixas de Texto Empilhadas */}
        <div className="pt-4 border-t border-zinc-100">
          <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-3">
            Diagnóstico Qualitativo da Abordagem
          </h4>
          <div className="space-y-2.5">
            {qualitativeBlocks.map((block, i) => (
              <div
                key={i}
                className="bg-[#F6F6F4] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4"
              >
                <div className="flex items-center gap-2 shrink-0 sm:w-56">
                  <span className="w-2 h-2 rounded-full bg-[#145F5E]" />
                  <span className="text-xs font-semibold text-zinc-900">
                    {block.label}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed flex-1">
                  {block.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============== CAMADA 2: KPIS DE VOLUME + GRÁFICO EVOLUTIVO + CRITÉRIOS ==============

const Layer2VolumeAndQuality = ({
  camada1,
  camada2,
}: {
  camada1: ConsolidatedProfileData["metricas_camada_1"];
  camada2: ConsolidatedProfileData["metricas_camada_2"];
}) => {
  const [criteriaViewMode, setCriteriaViewMode] = React.useState<
    "bars" | "radar"
  >("bars");

  const kpiCards = [
    {
      label: "Ligações realizadas",
      value: camada1.fluxo_bruto.realizadas,
      unit: "chamadas",
      badge: "100%",
    },
    {
      label: "Ligações atendidas",
      value: camada1.fluxo_bruto.atendidas,
      unit: "atendidas",
      badge: `${camada1.funil_passagem.atendimento}%`,
    },
    {
      label: "Ligações relevantes",
      value: camada1.fluxo_bruto.relevantes,
      unit: "relevantes",
      badge: `${camada1.funil_passagem.relevancia}%`,
    },
    {
      label: "Conversa c/ decisor",
      value: camada1.fluxo_bruto.decisor,
      unit: "decisores",
      badge: `${camada1.funil_passagem.decisor}%`,
    },
    {
      label: "Reuniões agendadas",
      value: camada1.fluxo_bruto.reunioes,
      unit: "reuniões",
      badge: `${camada1.funil_passagem.conversao_final}%`,
    },
  ];

  const normalizedRadarData = camada2.criterios_radar.map((item) => {
    const meta = CRITERIA_META[item.codigo] || {
      label: item.criterio,
      teto: item.teto || 10,
      descricao: "",
    };
    const teto = item.teto || meta.teto;
    return {
      criterio: `${item.criterio} (${teto})`,
      atual_pct: Math.round((item.nota / teto) * 100),
      anterior_pct: Math.round(((item.nota_anterior ?? item.nota) / teto) * 100),
      nota_bruta: item.nota,
      teto,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.06, ease: "easeOut" }}
      className="mb-8 space-y-4"
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">
          Camada 2 • Volume Operacional, Evolução & Critérios de Qualidade
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-600 truncate">
                {kpi.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-300/60 text-[#145F5E] shrink-0">
                {kpi.badge}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-4xl font-light tracking-tight text-zinc-900">
                {kpi.value}
              </span>
              <span className="text-xs text-zinc-400 font-normal">
                {kpi.unit}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-zinc-900">
                Evolução da qualidade & reuniões
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Comparativo entre Nota Média (linha) e Reuniões Agendadas
                (colunas)
              </p>
            </div>
          </div>

          <div className="h-[310px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={camada1.ranking_adaptativo}
                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="huddlyGreenBar"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#145F5E" stopOpacity={0.85} />
                    <stop
                      offset="100%"
                      stopColor="#10B981"
                      stopOpacity={0.08}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F1F1EF"
                />
                <XAxis
                  dataKey="periodo"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#71717A", fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#71717A", fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  allowDecimals={false}
                  domain={[0, 10]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#145F5E", fontSize: 11 }}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                />
                <RechartsLegend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="reunioes"
                  name="Reuniões Agendadas"
                  fill="url(#huddlyGreenBar)"
                  radius={[10, 10, 4, 4]}
                  barSize={42}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="nota_media"
                  name="Nota Média Geral"
                  stroke="#18181B"
                  strokeWidth={2.5}
                  dot={{ fill: "#18181B", r: 4 }}
                  activeDot={{ r: 6, fill: "#145F5E" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h3 className="text-lg font-medium text-zinc-900">
                Critérios de qualidade
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {criteriaViewMode === "bars"
                  ? "Pontuação proporcional ao teto oficial de cada critério (Soma = 100)"
                  : "Equilíbrio normalizado em base 100%"}
              </p>
            </div>

            <div className="inline-flex items-center bg-[#F3F3F1] p-1 rounded-full self-start">
              {(
                [
                  { id: "bars", label: "Barras" },
                  { id: "radar", label: "Radar (100%)" },
                ] as const
              ).map((mode) => {
                const isActive = criteriaViewMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setCriteriaViewMode(mode.id)}
                    className={cn(
                      "relative px-4 py-1.5 text-xs font-medium rounded-full transition-colors",
                      isActive
                        ? "text-white"
                        : "text-zinc-600 hover:text-zinc-900"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="criteria-view-pill"
                        className="absolute inset-0 rounded-full bg-zinc-900 shadow-sm"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 32,
                        }}
                      />
                    )}
                    <span className="relative z-10">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {criteriaViewMode === "bars" ? (
              <motion.div
                key="bars"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5 pt-1"
              >
                {camada2.criterios_radar.map((crit, idx) => {
                  const meta = CRITERIA_META[crit.codigo] || {
                    label: crit.criterio,
                    teto: crit.teto || 10,
                    descricao: crit.descricao || "",
                  };
                  const teto = crit.teto || meta.teto;
                  const descricao = crit.descricao || meta.descricao;
                  const pctAtual = Math.min(
                    100,
                    Math.round((crit.nota / teto) * 100)
                  );
                  const diff = +(
                    crit.nota - (crit.nota_anterior ?? crit.nota)
                  ).toFixed(1);

                  return (
                    <div
                      key={idx}
                      className="py-1.5 border-b border-zinc-100/80 last:border-0"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="w-40 shrink-0">
                          <span className="text-sm font-medium text-zinc-900 block">
                            {crit.criterio}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {diff >= 0 ? `+${diff}` : diff} vs. anterior
                          </span>
                        </div>
                        <div className="flex-1 bg-[#F3F3F1] h-2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pctAtual}%` }}
                            transition={{
                              duration: 0.55,
                              delay: idx * 0.04,
                              ease: "easeOut",
                            }}
                            className="bg-[#145F5E] h-full rounded-full"
                          />
                        </div>
                        <div className="w-20 text-right shrink-0">
                          <span className="text-sm font-semibold text-zinc-900">
                            {crit.nota}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {" "}
                            / {teto}
                          </span>
                        </div>
                      </div>
                      {descricao && (
                        <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                          {descricao}
                        </p>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="radar"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="h-[310px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={normalizedRadarData}
                    margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
                  >
                    <PolarGrid stroke="#E4E4E7" />
                    <PolarAngleAxis
                      dataKey="criterio"
                      tick={{ fill: "#27272A", fontSize: 11, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                      domain={[0, 100]}
                      tick={{ fill: "#71717A", fontSize: 10 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <RechartsTooltip
                      formatter={(value: unknown, name: unknown, props: any) => [
                        `${String(value)}% (${props.payload.nota_bruta}/${props.payload.teto} pts)`,
                        String(name),
                      ]}
                    />
                    <RechartsLegend wrapperStyle={{ fontSize: "12px" }} />
                    <Radar
                      name="Semana Atual (%)"
                      dataKey="atual_pct"
                      stroke="#145F5E"
                      fill="#10B981"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Semana Anterior (%)"
                      dataKey="anterior_pct"
                      stroke="#18181B"
                      fill="#18181B"
                      fillOpacity={0.08}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// ============== CAMADA 3: OPORTUNIDADES & MAPA DE OBJEÇÕES ==============

const Layer3OpportunitiesObjections = ({
  data,
}: {
  data: ConsolidatedProfileData["diagnostico_camada_3"];
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12, ease: "easeOut" }}
      className="mb-8 space-y-4"
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">
          Camada 3 • Oportunidades de Melhoria & Mapa de Objeções
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
          <div>
            <h3 className="text-lg font-medium text-zinc-900">
              Oportunidades de melhoria
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Prioridades táticas consolidadas pela IA na semana
            </p>
          </div>
          <div className="space-y-3">
            {data.oportunidades_unificadas.map((opp, i) => (
              <div
                key={i}
                className={cn(
                  "p-4 rounded-2xl space-y-2.5",
                  opp.prioridade === "ALTA"
                    ? "bg-red-50/50"
                    : opp.prioridade === "MEDIA"
                      ? "bg-yellow-50/70"
                      : "bg-emerald-50/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <PriorityBadge priority={opp.prioridade} />
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white border border-zinc-200 text-zinc-700 shadow-sm">
                    {opp.percentual_aparicao}% das chamadas
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed">
                  {opp.diagnostico_consolidado}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
          <div>
            <h3 className="text-lg font-medium text-zinc-900">
              Mapa de objeções
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Frequência de barreiras dos leads e reação predominante
            </p>
          </div>

          <div className="w-full">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="border-zinc-100">
                  <TableHead className="text-xs font-medium text-zinc-400 whitespace-normal break-words w-[24%]">
                    Objeção Padrão
                  </TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 whitespace-normal break-words w-[18%]">
                    Frequência
                  </TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 whitespace-normal break-words w-[29%]">
                    Reação do SDR
                  </TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 whitespace-normal break-words w-[29%]">
                    Recomendação
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.perfil_objecoes.map((obj, i) => (
                  <TableRow
                    key={i}
                    className="border-zinc-100 hover:bg-transparent"
                  >
                    <TableCell className="font-medium text-xs text-zinc-900 align-top whitespace-normal break-words">
                      {obj.objecao_padrao}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="w-[58%] max-w-[84px] min-w-0 bg-[#F3F3F1] h-2 rounded-full overflow-hidden shrink-0">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${obj.frequencia_percentual}%` }}
                            transition={{
                              duration: 0.55,
                              delay: 0.15 + i * 0.05,
                              ease: "easeOut",
                            }}
                            className="bg-[#145F5E] h-full rounded-full"
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-zinc-900 shrink-0">
                          {obj.frequencia_percentual}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 align-top whitespace-normal break-words">
                      {obj.reacao_predominante_sdr}
                    </TableCell>
                    <TableCell className="text-xs text-[#145F5E] font-medium align-top whitespace-normal break-words">
                      {obj.recomendacao_curta}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============== CAMADA 4: EVIDÊNCIAS PRÁTICAS + CARD EXPANSÍVEL ABAIXO ==============

const Layer4PracticalEvidences = ({
  data,
}: {
  data: ConsolidatedProfileData["evidencias_camada_4"];
}) => {
  const [selectedCall, setSelectedCall] = React.useState<{
    call: CallEvidence;
    type: "best" | "worst";
  } | null>(
    data.top_3_melhores?.[0]
      ? { call: data.top_3_melhores[0], type: "best" }
      : null
  );

  React.useEffect(() => {
    if (data.top_3_melhores?.[0]) {
      setSelectedCall({ call: data.top_3_melhores[0], type: "best" });
    } else {
      setSelectedCall(null);
    }
  }, [data]);

  const handleSelectCall = (call: CallEvidence, type: "best" | "worst") => {
    if (selectedCall?.call.protocolo === call.protocolo) {
      setSelectedCall(null);
    } else {
      setSelectedCall({ call, type });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.18, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">
          Camada 4 • Evidências Práticas & Auditoria de Ligações
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-zinc-900">
                Top 3 melhores ligações
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Exemplos reais de execução técnica na semana
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-300/50 text-[#145F5E]">
              Alta Performance
            </span>
          </div>

          <div className="space-y-2.5">
            {data.top_3_melhores.map((call) => {
              const isSelected =
                selectedCall?.call.protocolo === call.protocolo;
              return (
                <motion.div
                  key={call.protocolo}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "p-4 rounded-2xl transition-colors flex items-center justify-between gap-4 border",
                    isSelected
                      ? "bg-[#F3F3F1] border-emerald-400"
                      : "bg-[#F8F8F7] hover:bg-[#F3F3F1] border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ScoreBadge score={call.nota} size="sm" />
                    <div className="min-w-0">
                      <span className="font-semibold text-sm text-zinc-900 block">
                        Protocolo #{call.protocolo}
                      </span>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {call.interlocutor}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSelectCall(call, "best")}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-medium shrink-0 inline-flex items-center gap-1.5 transition-all",
                      isSelected
                        ? "bg-[#145F5E] text-white"
                        : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {isSelected ? "Ocultar" : "Ver detalhes"}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-zinc-900">
                Top 3 piores ligações
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Chamadas prioritárias para revisão em coaching
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white shadow-sm">
              Ponto de Atenção
            </span>
          </div>

          <div className="space-y-2.5">
            {data.top_3_piores.map((call) => {
              const isSelected =
                selectedCall?.call.protocolo === call.protocolo;
              return (
                <motion.div
                  key={call.protocolo}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "p-4 rounded-2xl transition-colors flex items-center justify-between gap-4 border",
                    isSelected
                      ? "bg-red-50/50 border-red-300"
                      : "bg-[#F8F8F7] hover:bg-[#F3F3F1] border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ScoreBadge score={call.nota} size="sm" />
                    <div className="min-w-0">
                      <span className="font-semibold text-sm text-zinc-900 block">
                        Protocolo #{call.protocolo}
                      </span>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {call.interlocutor}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSelectCall(call, "worst")}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-medium shrink-0 inline-flex items-center gap-1.5 transition-all",
                      isSelected
                        ? "bg-red-600 text-white"
                        : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {isSelected ? "Ocultar" : "Ver detalhes"}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Painel Expansível de Auditoria da Ligação com AnimatePresence */}
      <AnimatePresence mode="wait">
        {selectedCall && (
          <motion.div
            key={selectedCall.call.protocolo}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "bg-white rounded-[28px] p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-6 border",
              selectedCall.type === "best"
                ? "border-emerald-200"
                : "border-red-200"
            )}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-zinc-100">
              <div className="flex items-center gap-4">
                <ScoreBadge score={selectedCall.call.nota} size="lg" />
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-medium text-zinc-900">
                      Protocolo #{selectedCall.call.protocolo}
                    </h3>
                    <span
                      className={cn(
                        "px-3 py-0.5 rounded-full text-xs font-semibold shadow-sm",
                        selectedCall.type === "best"
                          ? "bg-emerald-300/60 text-[#145F5E]"
                          : "bg-red-500 text-white"
                      )}
                    >
                      {selectedCall.type === "best"
                        ? "Destaque Positivo"
                        : "Auditoria de Falha"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {selectedCall.call.interlocutor} ({selectedCall.call.numero})
                    • {selectedCall.call.resultado_frase}
                  </p>
                </div>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedCall(null)}
                className="px-4 py-2 rounded-full text-xs font-medium bg-[#F3F3F1] text-zinc-700 hover:bg-zinc-200 self-start md:self-auto"
              >
                Fechar detalhes
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#F6F6F4]">
                <span className="text-xs font-semibold text-zinc-900 block mb-1">
                  Feedback Geral
                </span>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  {selectedCall.call.feedback_geral}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-xs font-semibold text-[#145F5E] block mb-1">
                  Acertos na Condução
                </span>
                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed">
                  {selectedCall.call.acertos}
                </p>
              </div>
              <div
                className={cn(
                  "p-4 rounded-2xl border",
                  selectedCall.type === "best"
                    ? "bg-[#F6F6F4] border-transparent"
                    : "bg-red-50/40 border-red-100"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-semibold block mb-1",
                    selectedCall.type === "best"
                      ? "text-zinc-900"
                      : "text-red-700"
                  )}
                >
                  {selectedCall.type === "best"
                    ? "Pontos de Melhoria"
                    : "Falha Crítica Identificada"}
                </span>
                <p
                  className={cn(
                    "text-xs sm:text-sm leading-relaxed",
                    selectedCall.type === "best"
                      ? "text-zinc-600"
                      : "text-red-950"
                  )}
                >
                  {selectedCall.type === "best"
                    ? selectedCall.call.melhorias
                    : selectedCall.call.falha_critica}
                </p>
              </div>
            </div>

            {selectedCall.call.frase_alternativa && (
              <div className="grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#F3F3F1] via-emerald-50/50 to-emerald-100/70 border border-emerald-100/50">
                <div className="p-5 border-b md:border-b-0 md:border-r border-zinc-200/70">
                  <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold bg-white/80 text-zinc-600 mb-2 shadow-sm">
                    Frase Original
                  </span>
                  <p className="text-sm font-medium text-zinc-800 italic">
                    "
                    {selectedCall.call.frase_original ||
                      selectedCall.call.resultado_frase}
                    "
                  </p>
                </div>
                <div className="p-5">
                  <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold bg-white text-[#145F5E] mb-2 shadow-sm">
                    Frase Alternativa Sugerida pela IA
                  </span>
                  <p className="text-sm font-medium text-zinc-900 italic">
                    "{selectedCall.call.frase_alternativa}"
                  </p>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-3">
                Notas por Critério & Justificativas ({selectedCall.call.nota}/100
                pts)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(
                  Object.keys(CRITERIA_META) as Array<keyof typeof CRITERIA_META>
                ).map((key) => {
                  const meta = CRITERIA_META[key];
                  const notaCrit =
                    selectedCall.call.notas_criterios[
                    key as keyof CallEvidence["notas_criterios"]
                    ];
                  const justCrit =
                    selectedCall.call.justificativas_textuais[
                    key as keyof CallEvidence["justificativas_textuais"]
                    ];

                  return (
                    <div
                      key={key}
                      className="p-4 rounded-2xl bg-[#F6F6F4] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-zinc-900">
                          {meta.label}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white text-[#145F5E] shadow-sm border border-zinc-100">
                          {notaCrit} / {meta.teto}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        {meta.descricao}
                      </p>
                      <p className="text-xs text-zinc-600 leading-relaxed pt-1">
                        {justCrit}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                Transcrição Bruta da Ligação
              </h4>
              <div className="p-5 rounded-2xl bg-zinc-900 text-zinc-100 font-mono text-xs leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto">
                {selectedCall.call.transcricao}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============== MAIN PAGE COMPONENT ==============

export default function Dashboard() {
  const [escopo, setEscopo] = React.useState<
    "pessoal" | "departamento" | "equipe"
  >("pessoal");
  const [granularidade, setGranularidade] = React.useState<
    "semanal" | "mensal"
  >("semanal");

  const [agentsList, setAgentsList] =
    React.useState<AgentOption[]>(DEFAULT_AGENTS);
  const [departmentsList, setDepartmentsList] = React.useState<string[]>(
    DEFAULT_DEPARTMENTS
  );
  const [periodsList, setPeriodsList] = React.useState<PeriodOption[]>([]);

  const [selectedEntity, setSelectedEntity] =
    React.useState<string>("Lucas Silveira");
  const [selectedPeriodKey, setSelectedPeriodKey] =
    React.useState<string>("sem1-11-2026");

  const [profileData, setProfileData] =
    React.useState<ConsolidatedProfileData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchConsolidacaoFiltros()
      .then((res) => {
        if (res.agentes?.length > 0) {
          setAgentsList(res.agentes);
        }
        if (res.departamentos?.length > 0) {
          setDepartmentsList(res.departamentos.map((d) => d.nome));
        }
        if (res.periodos_semanais?.length > 0) {
          setPeriodsList(res.periodos_semanais);
          setSelectedPeriodKey(res.periodos_semanais[0].chave);
        }
      })
      .catch((err) => {
        console.warn("Aviso ao carregar filtros:", err);
      });
  }, []);

  const requestIdRef = React.useRef(0);

  const loadProfile = React.useCallback(
    async (overridePeriodKey?: string) => {
      if (escopo !== "pessoal" || granularidade !== "semanal") {
        return;
      }

      const currentReqId = ++requestIdRef.current;
      const effectivePeriodKey = overridePeriodKey || selectedPeriodKey;

      setIsLoading(true);
      setErrorMsg(null);

      try {
        const agentObj = agentsList.find(
          (a) => a.agente_nome.toLowerCase() === selectedEntity.toLowerCase()
        );
        const periodObj = periodsList.find(
          (p) => p.chave === effectivePeriodKey
        );

        const ano = periodObj?.ano || 2026;
        const mes = periodObj?.mes || 11;
        const semana_do_mes = periodObj?.semana_do_mes || 1;

        const data = await fetchPerfilConsolidado({
          id_agente: agentObj?.id_agente,
          agente_nome: selectedEntity,
          ano,
          mes,
          semana_do_mes,
        });

        if (currentReqId !== requestIdRef.current) return;
        setProfileData(data);
      } catch (err: any) {
        if (currentReqId !== requestIdRef.current) return;
        if (err?.message === "NOT_FOUND") {
          setErrorMsg("Perfil não consolidado para este SDR neste período.");
        } else {
          setErrorMsg(
            "Não foi possível conectar à API do Backend (verifique se a porta 3333 está ativa)."
          );
        }
        setProfileData(null);
      } finally {
        if (currentReqId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [escopo, granularidade, selectedEntity, selectedPeriodKey, agentsList, periodsList]
  );

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isUnsupportedScopeOrGranularity =
    escopo !== "pessoal" || granularidade !== "semanal";

  const currentDeptName =
    profileData?.departamento_nome ||
    agentsList.find((a) => a.agente_nome === selectedEntity)
      ?.departamento_nome ||
    "Comercial Geral";

  const currentPeriodLabel =
    profileData?.periodo_label ||
    periodsList.find((p) => p.chave === selectedPeriodKey)?.periodo_label ||
    "Semana 1, Nov 2026 (02/11 a 06/11)";

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#F3F3F1] text-zinc-900 font-sans pb-12">
        <div className="container mx-auto px-4 sm:px-8 py-8 max-w-[1400px]">
          <Header
            escopo={escopo}
            setEscopo={setEscopo}
            selectedEntity={selectedEntity}
            setSelectedEntity={setSelectedEntity}
            granularidade={granularidade}
            setGranularidade={setGranularidade}
            periodoLabel={currentPeriodLabel}
            departamentoNome={currentDeptName}
            agentsList={agentsList}
            departmentsList={departmentsList}
            periodsList={periodsList}
            selectedPeriodKey={selectedPeriodKey}
            onSelectPeriodKey={setSelectedPeriodKey}
          />

          <AnimatePresence mode="wait">
            {isUnsupportedScopeOrGranularity ? (
              <motion.div
                key={`unsupported-${escopo}-${granularidade}`}
                initial={{ opacity: 0, y: 12, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="bg-white rounded-[28px] p-10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-zinc-100 text-center max-w-2xl mx-auto my-8 space-y-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-300/50 text-[#145F5E] flex items-center justify-center mx-auto">
                  <Info className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F3F3F1] text-zinc-700">
                    Escopo em Fase de Implementação
                  </span>
                  <h2 className="text-2xl font-medium text-zinc-900 pt-1">
                    {escopo !== "pessoal"
                      ? `Visão consolidada por ${escopo === "departamento" ? "Departamento" : "Equipe Geral"}`
                      : "Consolidação na granularidade Mensal"}
                  </h2>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Neste primeiro momento do projeto SONAX, o motor de
                    consolidação analítica e diagnóstico de IA opera
                    exclusivamente para{" "}
                    <strong className="text-zinc-800">
                      SDRs individuais (Pessoal)
                    </strong>{" "}
                    e{" "}
                    <strong className="text-zinc-800">
                      perfis semanais (Semanal)
                    </strong>
                    .
                  </p>
                </div>
                <div className="pt-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setEscopo("pessoal");
                      setGranularidade("semanal");
                      setSelectedEntity(
                        agentsList[0]?.agente_nome || "Lucas Silveira"
                      );
                    }}
                    className="px-6 py-2.5 rounded-full text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all shadow-sm"
                  >
                    Voltar para Pessoal (SDR) • Semanal
                  </motion.button>
                </div>
              </motion.div>
            ) : isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="bg-white rounded-[28px] p-12 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center gap-3 my-8"
              >
                <RefreshCw className="h-6 w-6 text-[#145F5E] animate-spin" />
                <p className="text-sm text-zinc-500">
                  Carregando perfil consolidado de{" "}
                  <strong className="text-zinc-800">{selectedEntity}</strong>...
                </p>
              </motion.div>
            ) : errorMsg || !profileData ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="bg-white rounded-[28px] p-10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] text-center max-w-xl mx-auto my-8 space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900">
                  {errorMsg || "Perfil não consolidado para este período."}
                </h3>
                <p className="text-xs text-zinc-500">
                  Selecione a Semana 1 de Novembro 2026 ou tente buscar novamente.
                </p>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    const targetKey = periodsList[0]?.chave || "sem1-11-2026";
                    if (selectedPeriodKey === targetKey) {
                      loadProfile(targetKey);
                    } else {
                      setSelectedPeriodKey(targetKey);
                    }
                  }}
                  className="px-5 py-2 rounded-full text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all"
                >
                  Carregar Semana 1 (Nov 2026)
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key={`${profileData.id_perfil}-${selectedEntity}-${selectedPeriodKey}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Layer1ExecutiveSection
                  notaGeral={profileData.metricas_camada_2.nota_media_geral}
                  delta={profileData.metricas_camada_2.delta_periodo_anterior}
                  parecerExecutivo={profileData.parecer_executivo}
                  sinteseExecutiva={
                    profileData.diagnostico_camada_3.sintese_executiva
                  }
                  sinteseQualitativa={
                    profileData.diagnostico_camada_3.sintese_qualitativa
                  }
                />
                <Layer2VolumeAndQuality
                  camada1={profileData.metricas_camada_1}
                  camada2={profileData.metricas_camada_2}
                />
                <Layer3OpportunitiesObjections
                  data={profileData.diagnostico_camada_3}
                />
                <Layer4PracticalEvidences
                  data={profileData.evidencias_camada_4}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  );
}
