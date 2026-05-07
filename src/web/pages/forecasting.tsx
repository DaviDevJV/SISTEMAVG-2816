import { useState, useMemo, useEffect, useRef } from "react";
// import { Link } from "wouter"; // Removido para usar navegação customizada
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const YEARS = [2024, 2025, 2026, 2027, 2028];

// ─── Types ───
type Rates = {
  cpl: number;
  taxaQualificado: number;
  taxaCallAgendada: number;
  taxaCallRealizada: number;
  taxaConversao: number;
  taxaChurn: number;
};

type MonthInput = { investimento: string; ticket: string; setup: string };
type CostItem = { nome: string; valor: string; mesInicio: number };
type MonthResult = {
  leads: number; qualificados: number; agendadas: number; realizadas: number;
  vendas: number; cpa: number; fatNovo: number; fatSetup: number; clientesBase: number;
  clientesTotais: number; churn: number; fatRecorrente: number; fatTotal: number;
  lucro: number; lucroAcumulado: number; custoTotal: number;
};

// ─── Helpers ───
const parse = (v: string) => { const n = parseFloat(v.replace(",", ".")); return isNaN(n) ? 0 : n; };
const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const fmtD = (n: number, d = 1) => n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtC = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1).replace('.0','')}k` : fmt(n);

// ─── Pill Input ───
function PillInput({ value, onChange }: { value: string; onChange: (v: string) => void; }) {
  return (
    <input type="text" inputMode="decimal" value={value}
      onChange={e => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
      className="w-full bg-[#060606] border border-[#1E1E1E] rounded-full text-white text-[11px] font-bold transition-all duration-200 focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_6px_#39FF1440] py-1.5 px-1 text-center"
    />
  );
}

// ─── Rate Input ───
function RateInput({ label, value, onChange, suffix = "", prefix = "" }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; prefix?: string; }) {
  return (
    <div>
      <label className="block text-[#A8A9AD] text-[10px] uppercase tracking-[0.12em] mb-1.5 font-medium">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#39FF14] text-xs font-bold pointer-events-none">{prefix}</span>}
        <input type="text" inputMode="decimal" value={value}
          onChange={e => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
          className={`w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl text-white text-base font-semibold py-3 ${prefix ? 'pl-9' : 'pl-4'} pr-4 transition-all duration-200 focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_8px_#39FF1440] placeholder:text-[#333]`}
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A8A9AD] text-xs pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

export default function Forecasting() {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [cpl, setCpl] = useState("20");
  const [taxaQ, setTaxaQ] = useState("40");
  const [taxaCA, setTaxaCA] = useState("60");
  const [taxaCR, setTaxaCR] = useState("70");
  const [taxaConv, setTaxaConv] = useState("2");
  const [taxaChurn, setTaxaChurn] = useState("30");
  const [aporteInicial, setAporteInicial] = useState("1000");
  const [mesAporte, setMesAporte] = useState(4);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [custos, setCustos] = useState<CostItem[]>([
    { nome: "Pré Qualificação / Automação", valor: "60", mesInicio: 0 },
    { nome: "Salario Dovi", valor: "2000", mesInicio: 0 },
  ]);

  const [months, setMonths] = useState<MonthInput[]>(
    MONTHS.map((_, i) => ({
      investimento: i < 2 ? "0" : i < 5 ? "3000" : "6000",
      ticket: i < 6 ? "1000" : "4500",
      setup: i < 6 ? "500" : "1500",
    }))
  );

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/forecast/${selectedYear}`);
        if (res.ok) {
          const data = await res.json();
          setCpl(data.cpl);
          setTaxaQ(data.taxaQualificado);
          setTaxaCA(data.taxaCallAgendada);
          setTaxaCR(data.taxaCallRealizada);
          setTaxaConv(data.taxaConversao);
          setTaxaChurn(data.taxaChurn);
          setAporteInicial(data.aporteInicial);
          setMesAporte(data.mesAporte ?? 4);
          setCustos(data.custos);
          setMonths(data.months);
        }
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedYear]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          cpl, taxaQualificado: taxaQ, taxaCallAgendada: taxaCA, taxaCallRealizada: taxaCR,
          taxaConversao: taxaConv, taxaChurn, aporteInicial, mesAporte, custos, months
        })
      });
    } catch (e) {
      console.error("Erro ao salvar", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#000000",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      pdf.addImage(imgData, "PNG", (pdfWidth - finalWidth) / 2, 0, finalWidth, finalHeight);
      pdf.save(`Forecasting_Vanguard_${selectedYear}.pdf`);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const addCusto = () => setCustos(prev => [...prev, { nome: "Novo custo", valor: "0", mesInicio: 0 }]);
  const removeCusto = (idx: number) => setCustos(prev => prev.filter((_, i) => i !== idx));
  const updateCusto = (idx: number, field: keyof CostItem, val: string | number) => {
    setCustos(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c));
  };

  const custoTotalOperacaoRef = useMemo(() => custos.reduce((s, c) => s + parse(c.valor), 0), [custos]);

  const updateMonth = (i: number, field: keyof MonthInput, val: string) => {
    setMonths(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const rates: Rates = useMemo(() => ({
    cpl: parse(cpl),
    taxaQualificado: parse(taxaQ) / 100,
    taxaCallAgendada: parse(taxaCA) / 100,
    taxaCallRealizada: parse(taxaCR) / 100,
    taxaConversao: parse(taxaConv) / 100,
    taxaChurn: parse(taxaChurn) / 100,
  }), [cpl, taxaQ, taxaCA, taxaCR, taxaConv, taxaChurn]);

  const margemInfo = useMemo(() => {
    const activeMonths = months.filter(m => parse(m.investimento) > 0);
    const avgTicket = activeMonths.length > 0
      ? activeMonths.reduce((s, m) => s + parse(m.ticket), 0) / activeMonths.length
      : parse(months[0].ticket);
    return { avgTicket, custoMensal: custoTotalOperacaoRef };
  }, [months, custoTotalOperacaoRef]);

  const results: MonthResult[] = useMemo(() => {
    const res: MonthResult[] = [];
    for (let i = 0; i < 12; i++) {
      const inv = parse(months[i].investimento);
      const tk = parse(months[i].ticket);
      const setupVal = parse(months[i].setup);
      const leads = Math.round(rates.cpl > 0 ? inv / rates.cpl : 0);
      const qualificados = Math.round(leads * rates.taxaQualificado);
      const agendadas = Math.round(qualificados * rates.taxaCallAgendada);
      const realizadas = Math.round(agendadas * rates.taxaCallRealizada);
      const vendas = Math.round(realizadas * rates.taxaConversao);
      const cpa = vendas > 0 ? inv / vendas : 0;
      const fatSetup = Math.round(vendas * setupVal);
      const fatNovo = Math.round(vendas * tk);
      const prevTotal = i > 0 ? res[i - 1].clientesTotais : 0;
      const churn = Math.round(prevTotal * rates.taxaChurn);
      const clientesBase = prevTotal - churn;
      const clientesTotais = clientesBase + vendas;
      const fatRecorrente = Math.round(clientesBase * tk);
      const fatTotal = fatNovo + fatSetup + fatRecorrente;
      
      const custoOperacionalMes = custos.reduce((s, c) => {
        return i >= c.mesInicio ? s + parse(c.valor) : s;
      }, 0);

      const custoMes = custoOperacionalMes + inv;
      const lucroMes = fatTotal - custoMes;

      const prevLucroAcum = i > 0 ? res[i - 1].lucroAcumulado : 0;
      const lucroAcumulado = prevLucroAcum + lucroMes;
      
      res.push({ leads, qualificados, agendadas, realizadas, vendas, cpa, fatNovo, fatSetup, clientesBase, clientesTotais, churn, fatRecorrente, fatTotal, lucro: lucroMes, lucroAcumulado, custoTotal: custoMes });
    }
    return res;
  }, [months, rates, custos]);

  const totals = useMemo(() => {
    const fatTotal = results.reduce((s, r) => s + r.fatTotal, 0);
    const lucro = results.reduce((s, r) => s + r.lucro, 0);
    return {
      investimento: months.reduce((s, m) => s + parse(m.investimento), 0),
      leads: results.reduce((s, r) => s + r.leads, 0),
      vendas: results.reduce((s, r) => s + r.vendas, 0),
      fatTotal,
      lucro,
      pctLucro: fatTotal > 0 ? (lucro / fatTotal) * 100 : 0,
    };
  }, [months, results]);

  const margemDerived = useMemo(() => {
    const activeResults = results.filter(r => r.clientesTotais > 0);
    const avgClientes = activeResults.length > 0 ? activeResults.reduce((s, r) => s + r.clientesTotais, 0) / activeResults.length : 1;
    
    const avgCustoOp = activeResults.length > 0 
      ? activeResults.reduce((s, r, idx) => {
          const monthIdx = results.indexOf(r);
          const opCost = custos.reduce((acc, c) => monthIdx >= c.mesInicio ? acc + parse(c.valor) : acc, 0);
          return s + opCost;
        }, 0) / activeResults.length
      : custoTotalOperacaoRef;

    const custoPerCliente = avgCustoOp / avgClientes;
    const lucroPerCliente = margemInfo.avgTicket - custoPerCliente;
    const pctLucro = margemInfo.avgTicket > 0 ? (lucroPerCliente / margemInfo.avgTicket) * 100 : 0;
    return { custoPerCliente, lucroPerCliente, pctLucro };
  }, [results, custos, custoTotalOperacaoRef, margemInfo]);

  const paybackInfo = useMemo(() => {
    const aporteVal = parse(aporteInicial);
    const target = aporteVal * 1.5;
    for (let i = mesAporte; i < 12; i++) {
      if (results[i].lucro >= target) {
        return { mes: MONTHS[i], index: i, status: 'devolvido' };
      }
    }
    return { mes: null, index: -1, status: 'pendente' };
  }, [aporteInicial, mesAporte, results]);

  const maxFat = Math.max(...results.map(r => r.fatTotal), 1);

  return (
    <div className="min-h-screen bg-black grid-bg scanline-overlay relative">
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#39FF14] to-transparent opacity-60" />

      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div 
            onClick={() => (window as any).navigateTo('/')}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center text-[#39FF14] group-hover:border-[#39FF14]/50 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </div>
            <div>
              <h1 className="text-white font-bold tracking-[0.2em] uppercase text-sm" style={{ fontFamily: "'Orbitron', monospace" }}>VANGUARD</h1>
              <p className="text-[#555] text-[9px] uppercase tracking-widest">Voltar ao ROI</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl px-4 py-2">
              <span className="text-[#A8A9AD] text-[10px] uppercase tracking-wider font-bold">Ano do Forecasting:</span>
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="bg-transparent text-[#39FF14] font-bold focus:outline-none cursor-pointer">
                {YEARS.map(y => <option key={y} value={y} className="bg-black">{y}</option>)}
              </select>
            </div>

            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest bg-[#1A1A1A] text-white border border-[#333] hover:border-[#39FF14] transition-all ${isExporting ? 'opacity-50 cursor-wait' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
              {isExporting ? 'Exportando...' : 'Exportar PDF'}
            </button>
            
            <button onClick={handleSave} disabled={isSaving || isLoading} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isSaving ? 'bg-[#39FF14]/20 text-[#39FF14] opacity-50' : 'bg-[#39FF14] text-black hover:shadow-[0_0_20px_#39FF1460]'}`}>
              {isSaving ? 'Salvando...' : 'Salvar no Banco'}
            </button>
          </div>
        </header>

        {isLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-[#39FF14] font-bold animate-pulse tracking-widest uppercase">Carregando Dados...</div>
          </div>
        )}

        {/* ─── CONTEÚDO PARA EXPORTAÇÃO ─── */}
        <div ref={printRef} className="bg-black p-4 rounded-xl">
          {/* DASHBOARD */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
              <h2 className="text-white text-[10px] uppercase tracking-[0.2em] font-bold">Resumo Anual</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
              <StatCard label="Investimento Total" value={`R$ ${fmt(totals.investimento)}`} />
              <StatCard label="Total de Leads" value={fmt(totals.leads)} />
              <StatCard label="Vendas no Ano" value={fmt(totals.vendas)} />
              <StatCard label="Faturamento Anual" value={`R$ ${fmt(totals.fatTotal)}`} />
              <StatCard label="Lucro Anual" value={`R$ ${fmt(totals.lucro)}`} highlight={totals.lucro > 0} isProfit />
              <StatCard label="ROAS Anual" value={`${fmtD(totals.fatTotal / (totals.investimento || 1), 1)}x`} highlight />
            </div>

            <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-white text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#39FF14] rounded-full" />
                  Faturamento vs Lucro Mensal
                </h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#39FF14]" />
                    <span className="text-[#A8A9AD] text-[9px] uppercase font-medium">Faturamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
                    <span className="text-[#A8A9AD] text-[9px] uppercase font-medium">Lucro</span>
                  </div>
                </div>
              </div>
              
              <div className="h-48 flex items-end gap-2 px-2">
                {results.map((r, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative h-full">
                    <div className="w-full flex items-end gap-[2px] h-full">
                      <div className="flex-1 bg-[#39FF14]/20 border-t border-[#39FF14]" style={{ height: `${Math.max(1, (r.fatTotal / maxFat) * 100)}%` }} />
                      <div className="flex-1 bg-[#FFD700]/20 border-t border-[#FFD700]" style={{ height: `${Math.max(1, (Math.max(0, r.lucro) / maxFat) * 100)}%` }} />
                    </div>
                    <span className="text-[#555] text-[8px] font-bold uppercase mt-2">{MONTHS[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-[10px] uppercase tracking-[0.2em] font-bold">Margem de Lucro — {fmtD(totals.pctLucro, 1)}%</h3>
                    {paybackInfo.status === 'devolvido' ? (
                      <span className="text-[#39FF14] text-[9px] uppercase font-bold bg-[#39FF14]/10 px-3 py-1 rounded-full border border-[#39FF14]/20">
                        Aporte Devolvido em {paybackInfo.mes}
                      </span>
                    ) : (
                      <span className="text-[#FF4D4D] text-[9px] uppercase font-bold bg-[#FF4D4D]/10 px-3 py-1 rounded-full border border-[#FF4D4D]/20">
                        Aporte em Aguardo (Alvo: 1.5x)
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {results.map((r, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[#555] text-[8px] font-bold w-6">{MONTHS[i]}</span>
                        <div className="flex-1 h-1.5 bg-[#111] rounded-full overflow-hidden">
                          <div className={`h-full ${r.lucro > 0 ? 'bg-gradient-to-r from-[#FFD700]/40 to-[#FFD700]' : 'bg-[#FF4D4D]/20'}`} style={{ width: `${Math.min(100, (Math.max(0, r.lucro) / maxFat) * 100)}%` }} />
                        </div>
                        <span className={`text-[9px] font-bold w-12 text-right ${r.lucro > 0 ? 'text-[#FFD700]' : 'text-[#FF4D4D]'}`}>{r.lucro > 0 ? `R$ ${fmtC(r.lucro)}` : `-R$ ${fmtC(Math.abs(r.lucro))}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="w-full md:w-[300px] grid grid-cols-2 gap-3">
                  <div className="bg-[#060606] border border-[#1A1A1A] rounded-xl p-4">
                    <p className="text-[#A8A9AD] text-[8px] uppercase tracking-wider mb-1">Custo / Cliente</p>
                    <p className="text-red-400 text-lg font-bold">R$ {fmt(margemDerived.custoPerCliente)}</p>
                  </div>
                  <div className="bg-[#060606] border border-[#1A1A1A] rounded-xl p-4">
                    <p className="text-[#A8A9AD] text-[8px] uppercase tracking-wider mb-1">Lucro / Cliente</p>
                    <p className="text-[#FFD700] text-lg font-bold">R$ {fmt(margemDerived.lucroPerCliente)}</p>
                  </div>
                  <div className="bg-[#060606] border border-[#1A1A1A] rounded-xl p-4 col-span-2">
                    <p className="text-[#A8A9AD] text-[8px] uppercase tracking-wider mb-1">Alvo de Lucro p/ Payback (1.5x)</p>
                    <p className="text-white text-lg font-bold">R$ {fmt(parse(aporteInicial) * 1.5)}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TABELA MENSAL */}
          <section className="mb-8">
            <SectionLabel text={`Projeção Mensal — ${selectedYear}`} />
            <div className="rounded-xl border border-[#1A1A1A] overflow-hidden bg-[#0A0A0A]">
              <div className="overflow-x-auto">
                <table className="w-full text-xs table-fixed min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-[#1A1A1A]">
                      <th className="text-left text-[#A8A9AD] text-[8px] uppercase tracking-wider py-3 px-3 font-medium w-[150px]">Métrica</th>
                      {MONTHS.map(m => <th key={m} className="text-center text-[#39FF14] text-[8px] uppercase tracking-wider py-3 font-medium">{m}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    <EditableRow label="Investimento (R$)" months={months} field="investimento" onChange={updateMonth} />
                    <EditableRow label="Ticket Médio (R$)" months={months} field="ticket" onChange={updateMonth} />
                    <EditableRow label="Setup (R$)" months={months} field="setup" onChange={updateMonth} />
                    <CalcRow label="Leads Gerados" values={results.map(r => fmt(r.leads))} muted />
                    <CalcRow label="Leads Qualificados" values={results.map(r => fmt(r.qualificados))} muted />
                    <CalcRow label="Calls Agendadas" values={results.map(r => fmt(r.agendadas))} muted />
                    <CalcRow label="Calls Realizadas" values={results.map(r => fmt(r.realizadas))} muted />
                    <CalcRow label="Vendas Realizadas" values={results.map(r => fmt(r.vendas))} accent />
                    <CalcRow label="CPA (R$)" values={results.map(r => r.vendas > 0 ? fmt(r.cpa) : "-")} muted />
                    <CalcRow label="Fat. Setup" values={results.map(r => fmtC(r.fatSetup))} muted />
                    <CalcRow label="Fat. Novos" values={results.map(r => fmtC(r.fatNovo))} muted />
                    <CalcRow label="Clientes Base" values={results.map(r => fmt(r.clientesBase))} muted />
                    <CalcRow label="Clientes Totais" values={results.map(r => fmt(r.clientesTotais))} highlight />
                    <CalcRow label="Churn" values={results.map(r => fmt(r.churn))} muted />
                    <CalcRow label="Fat. Recorrente" values={results.map(r => fmtC(r.fatRecorrente))} muted />
                    <CalcRow label="Fat. Total" values={results.map(r => fmtC(r.fatTotal))} highlight />
                    <CalcRow label="Lucro do Mês" values={results.map(r => fmtC(r.lucro))} profit />
                    <CalcRow label="Lucro Acumulado" values={results.map(r => fmtC(r.lucroAcumulado))} accent />
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* INPUTS DE CONFIGURAÇÃO (FORA DO PRINT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <section>
            <SectionLabel text="Métricas de Conversão" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <RateInput label="CPL (WhatsApp)" value={cpl} onChange={setCpl} prefix="R$" />
              <RateInput label="Taxa Qualificado" value={taxaQ} onChange={setTaxaQ} suffix="%" />
              <RateInput label="Call Agendada" value={taxaCA} onChange={setTaxaCA} suffix="%" />
              <RateInput label="Call Realizada" value={taxaCR} onChange={setTaxaCR} suffix="%" />
              <RateInput label="Taxa Conversão" value={taxaConv} onChange={setTaxaConv} suffix="%" />
              <RateInput label="Taxa Churn" value={taxaChurn} onChange={setTaxaChurn} suffix="%" />
            </div>
          </section>
          
          <section>
            <SectionLabel text="Estrutura de Custos" />
            <div className="flex items-center gap-4 mb-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-3 w-fit">
              <span className="text-[#A8A9AD] text-[10px] uppercase tracking-[0.12em] font-medium">Aporte:</span>
              <input type="text" value={aporteInicial} onChange={e => setAporteInicial(e.target.value.replace(/[^0-9.,]/g, ""))} className="w-[80px] bg-transparent text-red-400 font-bold focus:outline-none" />
              <span className="text-[#A8A9AD] text-[10px] uppercase tracking-[0.12em] font-medium ml-2">Mês:</span>
              <select value={mesAporte} onChange={e => setMesAporte(Number(e.target.value))} className="bg-transparent text-red-400 font-bold focus:outline-none cursor-pointer">
                {MONTHS.map((m, i) => <option key={i} value={i} className="bg-black">{m}</option>)}
              </select>
            </div>
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-[#1A1A1A]"><th className="text-left p-2">Descrição</th><th className="text-center p-2">Início</th><th className="text-right p-2">Valor</th><th className="w-8" /></tr></thead>
                <tbody>
                  {custos.map((c, i) => (
                    <tr key={i} className="border-b border-[#111]">
                      <td className="p-2"><input type="text" value={c.nome} onChange={e => updateCusto(i, "nome", e.target.value)} className="w-full bg-transparent text-white focus:outline-none" /></td>
                      <td className="p-2 text-center">
                        <select value={c.mesInicio} onChange={e => updateCusto(i, "mesInicio", Number(e.target.value))} className="bg-[#060606] text-[#A8A9AD] text-[10px] rounded px-1 focus:outline-none">
                          {MONTHS.map((m, idx) => <option key={idx} value={idx} className="bg-black">{m}</option>)}
                        </select>
                      </td>
                      <td className="p-2 text-right text-[#39FF14] font-bold">R$ <input type="text" value={c.valor} onChange={e => updateCusto(i, "valor", e.target.value.replace(/[^0-9.,]/g, ""))} className="w-16 bg-transparent text-right focus:outline-none" /></td>
                      <td className="p-2"><button onClick={() => removeCusto(i)} className="text-[#555] hover:text-red-500">×</button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-[#060606]"><td colSpan={2} className="p-2"><button onClick={addCusto} className="text-[#39FF14] text-[10px] uppercase font-bold">+ Adicionar</button></td><td className="p-2 text-right font-bold text-white">R$ {fmt(custoTotalOperacaoRef)}</td><td /></tr></tfoot>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponents ───
function StatCard({ label, value, highlight = false, isProfit = false }: { label: string; value: string; highlight?: boolean; isProfit?: boolean }) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-4">
      <p className="text-[#A8A9AD] text-[9px] uppercase tracking-wider mb-2 font-medium">{label}</p>
      <p className={`text-xl font-bold ${highlight ? (isProfit ? 'text-[#FFD700]' : 'text-[#39FF14]') : 'text-white'}`} style={{ fontFamily: "'Orbitron', monospace" }}>{value}</p>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14]" />
      <h2 className="text-white text-[10px] uppercase tracking-[0.2em] font-bold">{text}</h2>
    </div>
  );
}

function EditableRow({ label, months, field, onChange }: { label: string; months: MonthInput[]; field: keyof MonthInput; onChange: (i: number, f: keyof MonthInput, v: string) => void; }) {
  return (
    <tr className="border-b border-[#111]">
      <td className="py-3 px-3 text-[#A8A9AD] text-[8px] uppercase tracking-wider bg-[#060606] font-bold">{label}</td>
      {months.map((m, i) => (
        <td key={i} className="py-2 px-1">
          <PillInput value={m[field]} onChange={v => onChange(i, field, v)} />
        </td>
      ))}
    </tr>
  );
}

function CalcRow({ label, values, highlight = false, accent = false, profit = false, muted = false }: { label: string; values: string[]; highlight?: boolean; accent?: boolean; profit?: boolean; muted?: boolean; }) {
  return (
    <tr className={`border-b border-[#111] ${highlight ? 'bg-[#39FF14]/5' : profit ? 'bg-[#FFD700]/5' : ''}`}>
      <td className={`py-2 px-3 text-[8px] uppercase tracking-wider bg-[#060606] font-bold ${highlight ? 'text-[#39FF14]' : profit ? 'text-[#FFD700]' : accent ? 'text-white' : muted ? 'text-[#555]' : 'text-[#A8A9AD]'}`}>{label}</td>
      {values.map((v, i) => <td key={i} className={`py-2 px-1 text-center text-[9px] font-bold ${highlight ? 'text-[#39FF14]' : profit ? 'text-[#FFD700]' : accent ? 'text-white' : muted ? 'text-[#333]' : 'text-[#ccc]'}`}>{v}</td>)}
    </tr>
  );
}
