import React, { useState, useMemo, useEffect } from "react";
// import { Link } from "wouter"; // Removido para usar navegação customizada
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ContainerScroll } from "../components/ui/container-scroll-animation";

// ─── Animated number ───
function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const dur = 400, start = display, diff = value - start, t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      setDisplay(start + diff * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  const fmt = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString("pt-BR");
  return <span>{prefix}{fmt}{suffix}</span>;
}

// ─── Glow input ───
function GlowInput({ label, value, onChange, prefix = "", suffix = "", placeholder = "0", icon }: {
  label: string; value: string; onChange: (v: string) => void;
  prefix?: string; suffix?: string; placeholder?: string; icon: React.ReactNode;
}) {
  return (
    <div className="group print:hidden">
      <label className="flex items-center gap-2 text-[#A8A9AD] text-xs uppercase tracking-[0.15em] mb-2 font-medium">
        <span className="text-[#39FF14] opacity-70">{icon}</span>{label}
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#39FF14] text-sm font-semibold pointer-events-none">{prefix}</span>}
        <input type="text" inputMode="decimal" value={value}
          onChange={e => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
          placeholder={placeholder}
          className={`w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl text-white text-lg font-semibold transition-all duration-300 ease-out focus:outline-none input-glow placeholder:text-[#333] ${prefix ? "pl-12 pr-4" : "pl-4 pr-4"} ${suffix ? "pr-12" : ""} py-3.5`}
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A8A9AD] text-sm font-medium pointer-events-none">{suffix}</span>}
        <div className="absolute inset-0 rounded-xl border border-[#39FF14] opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Result card ───
function ResultCard({ label, value, prefix = "", suffix = "", decimals = 0, highlight = false, isPositive = true, delay = 0, extraClass = "" }: {
  label: string; value: number; prefix?: string; suffix?: string; decimals?: number;
  highlight?: boolean; isPositive?: boolean; delay?: number; extraClass?: string;
}) {
  const color = highlight ? (isPositive ? "text-[#39FF14]" : "text-[#A8A9AD]") : "text-white";
  return (
    <div className={`relative overflow-hidden rounded-xl p-5 print:p-4 ${highlight ? `bg-[#0A0A0A] border-2 ${isPositive ? 'border-[#39FF14]/40 neon-pulse' : 'border-[#A8A9AD]/30'}` : `bg-[#0A0A0A] border border-[#1A1A1A] ${extraClass}`} animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}>
      {highlight && isPositive && <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent pointer-events-none" />}
      <p className="text-[#A8A9AD] text-[10px] uppercase tracking-[0.15em] mb-2 font-medium">{label}</p>
      <p className={`${highlight ? 'text-3xl md:text-4xl' : 'text-2xl'} font-bold ${color} transition-colors duration-500`}
        style={{ fontFamily: highlight ? "'Orbitron', monospace" : "inherit" }}>
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
      {highlight && <p className="text-[10px] uppercase tracking-[0.2em] mt-2 text-[#A8A9AD]/60">{isPositive ? "Retorno Positivo" : "Abaixo do Esperado"}</p>}
    </div>
  );
}

// ─── Funnel bar ───
function FunnelBar({ label, value, max, color = "bg-gradient-to-r from-[#39FF14] to-[#39FF14]/60" }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-[#A8A9AD]">{label}</span>
        <span className="text-white font-semibold">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Scenario Card ───
function ScenarioCard({ title, data, colorClass, barColor, delay }: {
  title: string; data: any; colorClass: string; barColor: string; delay: number;
}) {
  return (
    <div className={`bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-6 print:p-4 animate-fade-in-up flex-1 min-w-[300px] print:min-w-0 print:w-[32%]`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex justify-between items-start mb-6">
        <p className={`text-[12px] uppercase tracking-[0.25em] font-bold ${colorClass}`}>{title}</p>
        <div className="text-right">
          <p className="text-[#555] text-[10px] uppercase tracking-wider mb-0.5">ROAS</p>
          <p className="text-white font-bold text-2xl leading-none">{data.roas.toFixed(1)}x</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-[#1A1A1A]">
        <div>
          <p className="text-[#555] text-[10px] uppercase tracking-wider mb-1.5">Faturamento</p>
          <p className="text-white font-bold text-lg">R$ {Math.round(data.fat).toLocaleString("pt-BR")}</p>
        </div>
        <div>
          <p className="text-[#555] text-[10px] uppercase tracking-wider mb-1.5">Vendas</p>
          <p className="text-white font-bold text-lg">{Math.round(data.vendas)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[#555] text-[10px] uppercase tracking-widest font-bold">Performance Funil</p>
        <FunnelBar label="Leads" value={data.leads} max={data.leads} color={barColor} />
        <FunnelBar label="Qualificados" value={data.qualificados} max={data.leads} color={barColor} />
        <FunnelBar label="Agendados" value={data.agendamentos} max={data.leads} color={barColor} />
        <FunnelBar label="Vendas" value={data.vendas} max={data.leads} color={barColor} />
      </div>
    </div>
  );
}

// ─── Print-only inputs summary ───
function PrintInputsSummary({ investimento, custoLead, taxaPerda, taxaQualificacao, taxaAgendamento, taxaFechamento, ticketMedio }: {
  investimento: string; custoLead: string; taxaPerda: string; taxaQualificacao: string; taxaAgendamento: string; taxaFechamento: string; ticketMedio: string;
}) {
  const items = [
    { label: "Investimento", value: `R$ ${investimento}` },
    { label: "CPL (WhatsApp)", value: `R$ ${custoLead}` },
    { label: "Taxa Perda", value: `${taxaPerda}%` },
    { label: "Taxa Qualif.", value: `${taxaQualificacao}%` },
    { label: "Taxa Agend.", value: `${taxaAgendamento}%` },
    { label: "Taxa Fech.", value: `${taxaFechamento}%` },
    { label: "Ticket Médio", value: `R$ ${ticketMedio}` },
  ];
  return (
    <div className="hidden print:grid grid-cols-4 gap-4 mb-8 p-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl">
      {items.map(i => (
        <div key={i.label}>
          <p className="text-[#555] text-[9px] uppercase tracking-widest mb-1">{i.label}</p>
          <p className="text-white font-bold text-sm">{i.value}</p>
        </div>
      ))}
    </div>
  );
}

export default function Index() {
  const [investimento, setInvestimento] = useState("5000");
  const [custoLead, setCustoLead] = useState("15");
  const [taxaPerda, setTaxaPerda] = useState("20");
  const [taxaQualificacao, setTaxaQualificacao] = useState("50");
  const [taxaAgendamento, setTaxaAgendamento] = useState("40");
  const [taxaFechamento, setTaxaFechamento] = useState("25");
  const [ticketMedio, setTicketMedio] = useState("2500");
  const [isExporting, setIsExporting] = useState(false);

  const parse = (v: string) => { const n = parseFloat(v.replace(",", ".")); return isNaN(n) ? 0 : n; };

  const calculateROI = (inv: number, cpl: number, tp: number, tq: number, ta: number, tf: number, tm: number) => {
    const leads = cpl > 0 ? inv / cpl : 0;
    const leadsQueResponderam = leads * (1 - (tp / 100));
    const qualificados = leadsQueResponderam * (tq / 100);
    const agendamentos = qualificados * (ta / 100);
    const vendas = agendamentos * (tf / 100);
    const fat = vendas * tm;
    const roas = inv > 0 ? fat / inv : 0;
    return { leads, leadsQueResponderam, qualificados, agendamentos, vendas, fat, roas };
  };

  const r = useMemo(() => {
    const inv = parse(investimento), cpl = parse(custoLead), tp = parse(taxaPerda), tq = parse(taxaQualificacao), ta = parse(taxaAgendamento), tf = parse(taxaFechamento), tm = parse(ticketMedio);
    return calculateROI(inv, cpl, tp, tq, ta, tf, tm);
  }, [investimento, custoLead, taxaPerda, taxaQualificacao, taxaAgendamento, taxaFechamento, ticketMedio]);

  const scenarios = useMemo(() => {
    const inv = parse(investimento), cpl = parse(custoLead), tp = parse(taxaPerda), tq = parse(taxaQualificacao), ta = parse(taxaAgendamento), tf = parse(taxaFechamento), tm = parse(ticketMedio);
    
    // ─── LOGICA DE TRANSIÇÃO (CENARIOS) ───
    const conservador = calculateROI(inv, cpl * 1.2, Math.min(100, tp * 1.2), tq * 0.8, ta * 0.8, tf * 0.8, tm * 0.8);
    const otimista = calculateROI(inv, cpl * 0.5, tp * 0.5, Math.min(100, tq * 1.5), Math.min(100, ta * 1.5), Math.min(100, tf * 1.5), tm * 1.5);
    
    return { conservador, otimista };
  }, [investimento, custoLead, taxaPerda, taxaQualificacao, taxaAgendamento, taxaFechamento, ticketMedio]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById("pdf-content");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { backgroundColor: "#000000", scale: 2, useCORS: true, logging: false, windowWidth: 1400 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Relatorio_Vanguard_ROI_${new Date().toLocaleDateString("pt-BR")}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      
      <ContainerScroll
        titleComponent={
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold tracking-[0.3em] text-white uppercase mb-4">VANGUARD</h1>
            <p className="text-[#39FF14] text-sm md:text-xl tracking-[0.5em] uppercase font-light">Inteligência Financeira de ROI</p>
          </header>
        }
      >
        <div className="w-full h-full flex items-center justify-center bg-[#050505] p-4 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-4xl">
             <div className="flex flex-col items-center p-6 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl">
                <p className="text-[#A8A9AD] text-[10px] uppercase tracking-widest mb-2">Leads</p>
                <p className="text-2xl md:text-4xl font-bold text-white"><AnimatedNumber value={r.leads} /></p>
             </div>
             <div className="flex flex-col items-center p-6 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl">
                <p className="text-[#A8A9AD] text-[10px] uppercase tracking-widest mb-2">Vendas</p>
                <p className="text-2xl md:text-4xl font-bold text-white"><AnimatedNumber value={r.vendas} /></p>
             </div>
             <div className="flex flex-col items-center p-6 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl">
                <p className="text-[#A8A9AD] text-[10px] uppercase tracking-widest mb-2">ROAS</p>
                <p className="text-2xl md:text-4xl font-bold text-[#39FF14]"><AnimatedNumber value={r.roas} suffix="x" decimals={1} /></p>
             </div>
             <div className="flex flex-col items-center p-6 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl">
                <p className="text-[#A8A9AD] text-[10px] uppercase tracking-widest mb-2">Faturamento</p>
                <p className="text-2xl md:text-4xl font-bold text-white">R$ <AnimatedNumber value={r.fat} /></p>
             </div>
          </div>
        </div>
      </ContainerScroll>

      <div id="pdf-content" className={`max-w-6xl mx-auto px-6 pb-24 ${isExporting ? 'bg-black' : ''}`}>
        <PrintInputsSummary {...{ investimento, custoLead, taxaPerda, taxaQualificacao, taxaAgendamento, taxaFechamento, ticketMedio }} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-6 print:hidden">
            <div className="bg-[#050505] p-6 rounded-2xl border border-[#1A1A1A] space-y-6">
              <GlowInput label="Investimento" value={investimento} onChange={setInvestimento} prefix="R$" icon="💰" />
              <GlowInput label="Custo Lead (CPL)" value={custoLead} onChange={setCustoLead} prefix="R$" icon="💬" />
              <GlowInput label="Taxa Perda" value={taxaPerda} onChange={setTaxaPerda} suffix="%" icon="📉" />
              <GlowInput label="Taxa Qualificação" value={taxaQualificacao} onChange={setTaxaQualificacao} suffix="%" icon="✅" />
              <GlowInput label="Taxa Agendamento" value={taxaAgendamento} onChange={setTaxaAgendamento} suffix="%" icon="📅" />
              <GlowInput label="Taxa Fechamento" value={taxaFechamento} onChange={setTaxaFechamento} suffix="%" icon="🤝" />
              <GlowInput label="Ticket Médio" value={ticketMedio} onChange={setTicketMedio} prefix="R$" icon="🏷️" />
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <ResultCard label="ROAS Estratégico" value={r.roas} suffix="x" decimals={1} highlight isPositive={r.roas >= 1} />
            <div className="p-8 rounded-2xl bg-[#050505] border border-[#1A1A1A]">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#A8A9AD] mb-6 font-bold">Funil de Conversão</p>
              <div className="space-y-6">
                <FunnelBar label="Leads Totais" value={r.leads} max={r.leads} />
                <FunnelBar label="Leads Engajados" value={r.leadsQueResponderam} max={r.leads} />
                <FunnelBar label="Leads Qualificados" value={r.qualificados} max={r.leads} />
                <FunnelBar label="Agendamentos" value={r.agendamentos} max={r.leads} />
                <FunnelBar label="Vendas Realizadas" value={r.vendas} max={r.leads} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="flex flex-wrap lg:flex-nowrap gap-6">
            <ScenarioCard title="Conservador (-20%)" data={scenarios.conservador} colorClass="text-red-500" barColor="bg-red-500" delay={0} />
            <ScenarioCard title="Cenário Atual" data={r} colorClass="text-[#39FF14]" barColor="bg-[#39FF14]" delay={100} />
            <ScenarioCard title="Otimista (+50%)" data={scenarios.otimista} colorClass="text-blue-400" barColor="bg-blue-400" delay={200} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 right-8 flex flex-col gap-4 print:hidden z-50">
        <button onClick={handleExportPDF} disabled={isExporting}
          className="bg-[#39FF14] text-black font-bold py-4 px-8 rounded-2xl uppercase tracking-widest text-xs disabled:opacity-50">
          {isExporting ? "Gerando..." : "Exportar Relatório PDF"}
        </button>
        <button 
          onClick={() => (window as any).navigateTo('/forecasting')}
          className="bg-black border border-[#39FF14]/30 text-[#39FF14] font-bold py-4 px-8 rounded-2xl uppercase tracking-widest text-xs text-center"
        >
          Ir para Previsão Anual
        </button>
      </div>
    </div>
  );
}
