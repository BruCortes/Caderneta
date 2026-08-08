import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { Plus, Trash2, ChevronLeft, ChevronRight, Copy, X, Sparkles, LogOut, Check } from "lucide-react";
import { supabase } from "./supabaseClient";

/* ---------------------------------------------------------
   TEMA — "Caderneta de contas": capa de couro/tecido escura,
   páginas em papel pardo, tinta dourada. Números em monoespaçada
   (livro-caixa), títulos em slab serif.
--------------------------------------------------------- */
const THEME = {
  cover: "#16261D",
  coverAlt: "#1E3327",
  page: "#F3ECDC",
  pageAlt: "#EBE2CC",
  ink: "#2B2418",
  inkSoft: "#6B6152",
  gold: "#B8863B",
  goldSoft: "#DCC48E",
  income: "#3E6B52",
  incomeSoft: "#DCE9DF",
  expense: "#A24632",
  expenseSoft: "#F1DCD3",
  line: "#D8CBA9",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
`;

const DEFAULT_CATEGORIES = [
  { id: "moradia", name: "Moradia", emoji: "🏠", color: "#8B5E3C", limit: 0 },
  { id: "alimentacao", name: "Alimentação", emoji: "🍽️", color: "#A24632", limit: 0 },
  { id: "transporte", name: "Transporte", emoji: "🚗", color: "#4C6E81", limit: 0 },
  { id: "saude", name: "Saúde", emoji: "💊", color: "#3E6B52", limit: 0 },
  { id: "educacao", name: "Educação", emoji: "📚", color: "#7A5C8E", limit: 0 },
  { id: "lazer", name: "Lazer", emoji: "🎉", color: "#B8863B", limit: 0 },
  { id: "outros", name: "Outros", emoji: "📦", color: "#6E6259", limit: 0 },
];
const INCOME_CAT = { id: "receita", name: "Receita", emoji: "💰", color: "#3E6B52" };
const FREE_CUSTOM_LIMIT = 3;

function fmtBRL(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthKey(dateStr) {
  return dateStr.slice(0, 7);
}
function genCode() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

/* ---------------------------------------------------------
   FRASCO (jar) — elemento assinatura: ilustra o método dos
   potes/envelopes de orçamento, comum na educação financeira.
--------------------------------------------------------- */
function Jar({ pct, color, size = 72, empty }) {
  const clamped = Math.max(0, Math.min(100, pct || 0));
  const bodyTop = 34, bodyBottom = 112, bodyHeight = bodyBottom - bodyTop;
  const fillH = (clamped / 100) * bodyHeight;
  const fillY = bodyBottom - fillH;
  const over = pct > 100;
  return (
    <svg width={size} height={size * 1.35} viewBox="0 0 100 135">
      <defs>
        <clipPath id={`jarclip-${color.replace("#", "")}-${size}`}>
          <rect x="14" y={bodyTop} width="72" height={bodyHeight} rx="10" />
        </clipPath>
      </defs>
      {/* corpo do frasco (contorno) */}
      <rect x="14" y={bodyTop} width="72" height={bodyHeight} rx="10"
        fill={empty ? "transparent" : THEME.page} stroke={THEME.inkSoft} strokeWidth="2"
        strokeDasharray={empty ? "4 4" : "0"} />
      {!empty && (
        <rect x="14" y={fillY} width="72" height={fillH} rx="10"
          fill={over ? THEME.expense : color}
          clipPath={`url(#jarclip-${color.replace("#", "")}-${size})`} />
      )}
      {/* gargalo */}
      <rect x="34" y="16" width="32" height="20" rx="4" fill="none" stroke={THEME.inkSoft} strokeWidth="2" />
      {/* tampa */}
      <rect x="30" y="6" width="40" height="12" rx="3" fill={THEME.inkSoft} />
    </svg>
  );
}

/* ---------------------------------------------------------
   ONBOARDING
--------------------------------------------------------- */
function Onboarding({ onSubmit }) {
  const [mode, setMode] = useState("pessoal");
  const [name, setName] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [joinExisting, setJoinExisting] = useState(false);

  const canSubmit = name.trim().length > 0 && (mode === "pessoal" || !joinExisting || codeInput.trim().length > 0);

  function submit() {
    if (!canSubmit) return;
    onSubmit({
      mode,
      code: mode === "grupo" ? (joinExisting ? codeInput.trim().toLowerCase() : genCode()) : null,
      userName: name.trim(),
    });
  }

  return (
    <div style={{ minHeight: 560, background: THEME.cover, borderRadius: 16, padding: "2.5rem 1.75rem", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <style>{FONTS}</style>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 4 }}>📗</div>
          <h1 style={{ fontFamily: "'Roboto Slab', serif", color: THEME.goldSoft, fontSize: 26, fontWeight: 700, margin: 0 }}>
            Caderneta
          </h1>
          <p style={{ color: "#A9B4A9", fontSize: 14, marginTop: 6 }}>Seu controle de orçamento mensal, do jeito de um livro-caixa.</p>
        </div>

        <label style={{ color: THEME.goldSoft, fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Como podemos te chamar?</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "none", background: THEME.page, color: THEME.ink, fontSize: 15, marginBottom: 18 }}
        />

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button onClick={() => setMode("pessoal")}
            style={{ flex: 1, padding: "12px 8px", borderRadius: 10, cursor: "pointer", border: mode === "pessoal" ? `2px solid ${THEME.gold}` : "2px solid transparent", background: THEME.coverAlt, color: mode === "pessoal" ? THEME.goldSoft : "#A9B4A9", fontSize: 13, fontWeight: 500 }}>
            📔 Só eu
          </button>
          <button onClick={() => setMode("grupo")}
            style={{ flex: 1, padding: "12px 8px", borderRadius: 10, cursor: "pointer", border: mode === "grupo" ? `2px solid ${THEME.gold}` : "2px solid transparent", background: THEME.coverAlt, color: mode === "grupo" ? THEME.goldSoft : "#A9B4A9", fontSize: 13, fontWeight: 500 }}>
            👥 Compartilhado
          </button>
        </div>

        {mode === "grupo" && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button onClick={() => setJoinExisting(false)}
                style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12.5, border: "none", background: !joinExisting ? THEME.gold : THEME.coverAlt, color: !joinExisting ? "#1D1508" : "#A9B4A9", fontWeight: 500 }}>
                Criar novo grupo
              </button>
              <button onClick={() => setJoinExisting(true)}
                style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12.5, border: "none", background: joinExisting ? THEME.gold : THEME.coverAlt, color: joinExisting ? "#1D1508" : "#A9B4A9", fontWeight: 500 }}>
                Entrar com código
              </button>
            </div>
            {joinExisting && (
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="código do grupo (ex: familia-silva)"
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "none", background: THEME.page, color: THEME.ink, fontSize: 14, fontFamily: "'IBM Plex Mono', monospace" }}
              />
            )}
            {!joinExisting && (
              <p style={{ color: "#A9B4A9", fontSize: 12.5, margin: 0 }}>Vamos gerar um código único. Compartilhe com quem for dividir esse orçamento com você.</p>
            )}
          </div>
        )}

        <button onClick={submit} disabled={!canSubmit}
          style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", cursor: canSubmit ? "pointer" : "not-allowed", background: canSubmit ? THEME.gold : THEME.coverAlt, color: canSubmit ? "#1D1508" : "#6b7268", fontSize: 15, fontWeight: 600 }}>
          Abrir caderneta
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   MODAL: NOVA TRANSAÇÃO
--------------------------------------------------------- */
function AddTransactionModal({ categories, onClose, onSave }) {
  const [type, setType] = useState("despesa");
  const [amount, setAmount] = useState("");
  const [catId, setCatId] = useState(categories[0]?.id || "outros");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");

  function submit() {
    const v = parseFloat(amount.replace(",", "."));
    if (!v || v <= 0) return;
    onSave({
      type,
      amount: v,
      category: type === "receita" ? "receita" : catId,
      date,
      note: note.trim(),
    });
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(22,38,29,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: THEME.page, borderRadius: "18px 18px 0 0", padding: "1.5rem", maxHeight: "88vh", overflowY: "auto", fontFamily: "Inter, sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Roboto Slab', serif", color: THEME.ink, margin: 0, fontSize: 19 }}>Novo lançamento</h3>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: THEME.inkSoft }}><X size={20} /></button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => setType("despesa")}
            style={{ flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer", border: `2px solid ${type === "despesa" ? THEME.expense : THEME.line}`, background: type === "despesa" ? THEME.expenseSoft : "transparent", color: THEME.ink, fontWeight: 500, fontSize: 14 }}>
            ↓ Despesa
          </button>
          <button onClick={() => setType("receita")}
            style={{ flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer", border: `2px solid ${type === "receita" ? THEME.income : THEME.line}`, background: type === "receita" ? THEME.incomeSoft : "transparent", color: THEME.ink, fontWeight: 500, fontSize: 14 }}>
            ↑ Receita
          </button>
        </div>

        <label style={{ fontSize: 12.5, color: THEME.inkSoft, fontWeight: 500 }}>Valor</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          inputMode="decimal"
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: `1px solid ${THEME.line}`, background: "#fff", fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, color: THEME.ink, margin: "6px 0 16px" }}
        />

        {type === "despesa" && (
          <>
            <label style={{ fontSize: 12.5, color: THEME.inkSoft, fontWeight: 500 }}>Categoria</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, margin: "6px 0 16px" }}>
              {categories.map((c) => (
                <button key={c.id} onClick={() => setCatId(c.id)}
                  style={{ padding: "10px 4px", borderRadius: 8, cursor: "pointer", border: `2px solid ${catId === c.id ? c.color : THEME.line}`, background: catId === c.id ? c.color + "22" : "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 18 }}>{c.emoji}</span>
                  <span style={{ fontSize: 10.5, color: THEME.ink, textAlign: "center", lineHeight: 1.1 }}>{c.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <label style={{ fontSize: 12.5, color: THEME.inkSoft, fontWeight: 500 }}>Data</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: `1px solid ${THEME.line}`, background: "#fff", fontSize: 14, color: THEME.ink, margin: "6px 0 16px" }} />

        <label style={{ fontSize: 12.5, color: THEME.inkSoft, fontWeight: 500 }}>Nota (opcional)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: mercado da semana"
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: `1px solid ${THEME.line}`, background: "#fff", fontSize: 14, color: THEME.ink, margin: "6px 0 20px" }} />

        <button onClick={submit}
          style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", cursor: "pointer", background: THEME.ink, color: THEME.page, fontSize: 15, fontWeight: 600 }}>
          Salvar lançamento
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   MODAL: PREMIUM (teaser de monetização)
--------------------------------------------------------- */
function PremiumModal({ onClose }) {
  const perks = [
    ["📊", "Relatórios em PDF e Excel", "Exporte o mês inteiro com um toque."],
    ["🗂️", "Categorias ilimitadas", "Sem limite de 3 categorias extras."],
    ["👨‍👩‍👧‍👦", "Vários grupos ao mesmo tempo", "Casa, trabalho e viagem, cada um com sua caderneta."],
    ["🔔", "Alertas de limite", "Um aviso assim que um pote está prestes a estourar."],
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(22,38,29,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: THEME.cover, borderRadius: 16, padding: "1.75rem", fontFamily: "Inter, sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={20} color={THEME.gold} />
            <h3 style={{ fontFamily: "'Roboto Slab', serif", color: THEME.goldSoft, margin: 0, fontSize: 19 }}>Caderneta Premium</h3>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#A9B4A9" }}><X size={20} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {perks.map(([emoji, title, desc]) => (
            <div key={title} style={{ display: "flex", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{emoji}</span>
              <div>
                <div style={{ color: THEME.goldSoft, fontSize: 14, fontWeight: 500 }}>{title}</div>
                <div style={{ color: "#A9B4A9", fontSize: 12.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button disabled style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: THEME.coverAlt, color: "#A9B4A9", fontSize: 14, fontWeight: 600, cursor: "not-allowed" }}>
          Em breve
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   APP PRINCIPAL
--------------------------------------------------------- */
export default function CadernetaApp() {
  const [phase, setPhase] = useState("loading");
  const [settings, setSettings] = useState(null);
  const [workspaceKey, setWorkspaceKey] = useState(null);
  const [shared, setShared] = useState(false);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("painel");
  const [currentMonth, setCurrentMonth] = useState(todayStr().slice(0, 7));
  const [showAdd, setShowAdd] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem("app-settings");
      if (!raw) { setPhase("onboarding"); return; }
      const s = JSON.parse(raw);
      setSettings(s);
      await enterWorkspace(s.mode, s.code, s.userName);
    })();
  }, []);

  async function enterWorkspace(mode, code, userName) {
    const key = `workspace:${code}`;
    setWorkspaceKey(key);
    setShared(mode === "grupo");
    try {
      const { data: row, error } = await supabase.from("workspaces").select("data").eq("key", key).single();
      if (error || !row) throw new Error("não encontrado");
      setData(row.data);
    } catch {
      const fresh = { categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })), transactions: [] };
      setData(fresh);
      try { await supabase.from("workspaces").upsert({ key, data: fresh }); } catch (e) {}
    }
    setPhase("app");
  }

  async function persist(newData) {
    setData(newData);
    try {
      const { error } = await supabase.from("workspaces").upsert({ key: workspaceKey, data: newData });
      if (error) throw error;
      setSaveError(null);
    } catch (e) {
      setSaveError("Não deu para salvar agora. Verifique sua internet e tente de novo.");
    }
  }

  async function handleOnboardingSubmit({ mode, code, userName }) {
    // no modo pessoal, geramos um código único escondido, só para
    // identificar essa "gaveta" de dados no banco — o usuário nunca vê.
    const finalCode = mode === "grupo" ? code : genCode();
    const s = { mode, code: finalCode, userName };
    setSettings(s);
    localStorage.setItem("app-settings", JSON.stringify(s));
    await enterWorkspace(mode, finalCode, userName);
  }

  function leaveWorkspace() {
    localStorage.removeItem("app-settings");
    setSettings(null);
    setData(null);
    setPhase("onboarding");
  }

  function addTransaction(tx) {
    const withId = { ...tx, id: `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`, author: settings.userName };
    persist({ ...data, transactions: [...data.transactions, withId] });
  }
  function deleteTransaction(id) {
    persist({ ...data, transactions: data.transactions.filter((t) => t.id !== id) });
  }
  function updateLimit(id, limit) {
    persist({ ...data, categories: data.categories.map((c) => (c.id === id ? { ...c, limit } : c)) });
  }
  function addCategory() {
    const name = newCatName.trim();
    if (!name) return;
    const customCount = data.categories.length - DEFAULT_CATEGORIES.length;
    if (customCount >= FREE_CUSTOM_LIMIT) { setShowPremium(true); return; }
    const palette = ["#4C6E81", "#7A5C8E", "#A24632", "#3E6B52", "#B8863B"];
    const cat = { id: `c${Date.now()}`, name, emoji: "🏷️", color: palette[customCount % palette.length], limit: 0 };
    persist({ ...data, categories: [...data.categories, cat] });
    setNewCatName("");
  }
  function deleteCategory(id) {
    persist({ ...data, categories: data.categories.filter((c) => c.id !== id) });
  }

  function switchMonth(delta) {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function copyCode() {
    if (navigator.clipboard) navigator.clipboard.writeText(settings.code);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  }

  const monthTx = useMemo(
    () => (data ? data.transactions.filter((t) => monthKey(t.date) === currentMonth) : []),
    [data, currentMonth]
  );
  const income = useMemo(() => monthTx.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0), [monthTx]);
  const expense = useMemo(() => monthTx.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0), [monthTx]);
  const saldo = income - expense;

  const spentByCat = useMemo(() => {
    const map = {};
    monthTx.filter((t) => t.type === "despesa").forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [monthTx]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return data.categories
      .filter((c) => spentByCat[c.id] > 0)
      .map((c) => ({ name: c.name, value: spentByCat[c.id], color: c.color }));
  }, [data, spentByCat]);

  const trendData = useMemo(() => {
    if (!data) return [];
    const out = [];
    const [cy, cm] = currentMonth.split("-").map(Number);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(cy, cm - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const txs = data.transactions.filter((t) => monthKey(t.date) === key);
      out.push({
        mes: monthLabel(key),
        Receitas: Math.round(txs.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0)),
        Despesas: Math.round(txs.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0)),
      });
    }
    return out;
  }, [data, currentMonth]);

  const groupedTx = useMemo(() => {
    const sorted = [...monthTx].sort((a, b) => b.date.localeCompare(a.date));
    const groups = {};
    sorted.forEach((t) => { (groups[t.date] = groups[t.date] || []).push(t); });
    return Object.entries(groups);
  }, [monthTx]);

  if (phase === "loading") {
    return (
      <div style={{ minHeight: 400, background: THEME.cover, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{FONTS}</style>
        <span style={{ color: THEME.goldSoft, fontFamily: "Inter, sans-serif" }}>Abrindo caderneta…</span>
      </div>
    );
  }
  if (phase === "onboarding") return <Onboarding onSubmit={handleOnboardingSubmit} />;

  const catById = Object.fromEntries((data.categories || []).map((c) => [c.id, c]));
  const tabs = [
    { id: "painel", label: "Painel" },
    { id: "lancamentos", label: "Lançamentos" },
    { id: "categorias", label: "Potes" },
    ...(shared ? [{ id: "grupo", label: "Grupo" }] : []),
  ];

  return (
    <div style={{ background: THEME.cover, borderRadius: 16, overflow: "hidden", fontFamily: "Inter, sans-serif", maxWidth: 780, margin: "0 auto" }}>
      <style>{FONTS}</style>

      {/* CAPA / cabeçalho */}
      <div style={{ padding: "1.25rem 1.25rem 0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>{shared ? "📗" : "📔"}</span>
              <h1 style={{ fontFamily: "'Roboto Slab', serif", color: THEME.goldSoft, fontSize: 20, fontWeight: 700, margin: 0 }}>
                {shared ? "Caderneta compartilhada" : `Caderneta de ${settings.userName}`}
              </h1>
            </div>
            {shared && (
              <button onClick={copyCode} style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#A9B4A9", fontSize: 12.5 }}>código: {settings.code}</span>
                {showCopied ? <Check size={13} color={THEME.gold} /> : <Copy size={13} color="#A9B4A9" />}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setShowPremium(true)} title="Caderneta Premium"
              style={{ display: "flex", alignItems: "center", gap: 5, border: `1px solid ${THEME.gold}`, background: "transparent", color: THEME.goldSoft, borderRadius: 20, padding: "5px 10px", fontSize: 11.5, cursor: "pointer" }}>
              <Sparkles size={12} /> Grátis
            </button>
            <button onClick={leaveWorkspace} title="Trocar caderneta"
              style={{ border: "none", background: "transparent", color: "#A9B4A9", cursor: "pointer", padding: 5 }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* navegação de mês */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, margin: "14px 0 12px" }}>
          <button onClick={() => switchMonth(-1)} style={{ border: "none", background: THEME.coverAlt, color: THEME.goldSoft, borderRadius: 8, padding: 6, cursor: "pointer" }}><ChevronLeft size={16} /></button>
          <span style={{ color: THEME.goldSoft, fontSize: 14, fontWeight: 500, minWidth: 110, textAlign: "center", textTransform: "capitalize" }}>{monthLabel(currentMonth)}</span>
          <button onClick={() => switchMonth(1)} style={{ border: "none", background: THEME.coverAlt, color: THEME.goldSoft, borderRadius: 8, padding: 6, cursor: "pointer" }}><ChevronRight size={16} /></button>
        </div>

        {/* abas */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: "8px 14px", borderRadius: "10px 10px 0 0", border: "none", cursor: "pointer", whiteSpace: "nowrap", fontSize: 13.5, fontWeight: 500, background: activeTab === t.id ? THEME.page : "transparent", color: activeTab === t.id ? THEME.ink : "#A9B4A9" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* PÁGINA */}
      <div style={{ background: THEME.page, minHeight: 480, padding: "1.5rem 1.25rem 5rem", position: "relative" }}>
        {saveError && (
          <div style={{ background: THEME.expenseSoft, color: THEME.expense, padding: "8px 12px", borderRadius: 8, fontSize: 12.5, marginBottom: 14 }}>{saveError}</div>
        )}

        {activeTab === "painel" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 22 }}>
              <div style={{ background: THEME.pageAlt, borderRadius: 12, padding: "12px 10px" }}>
                <div style={{ fontSize: 11.5, color: THEME.inkSoft }}>Receitas</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 600, color: THEME.income }}>{fmtBRL(income)}</div>
              </div>
              <div style={{ background: THEME.pageAlt, borderRadius: 12, padding: "12px 10px" }}>
                <div style={{ fontSize: 11.5, color: THEME.inkSoft }}>Despesas</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 600, color: THEME.expense }}>{fmtBRL(expense)}</div>
              </div>
              <div style={{ background: THEME.pageAlt, borderRadius: 12, padding: "12px 10px" }}>
                <div style={{ fontSize: 11.5, color: THEME.inkSoft }}>Saldo</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 600, color: saldo >= 0 ? THEME.ink : THEME.expense }}>{fmtBRL(saldo)}</div>
              </div>
            </div>

            <h3 style={{ fontFamily: "'Roboto Slab', serif", color: THEME.ink, fontSize: 15, marginBottom: 10 }}>Potes do mês</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))", gap: 10, marginBottom: 26 }}>
              {data.categories.map((c) => {
                const spent = spentByCat[c.id] || 0;
                const pct = c.limit > 0 ? (spent / c.limit) * 100 : 0;
                return (
                  <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <Jar pct={pct} color={c.color} empty={c.limit === 0} size={54} />
                    <span style={{ fontSize: 10.5, color: THEME.ink, textAlign: "center" }}>{c.emoji} {c.name}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: THEME.inkSoft }}>
                      {c.limit > 0 ? `${fmtBRL(spent)} / ${fmtBRL(c.limit)}` : fmtBRL(spent)}
                    </span>
                  </div>
                );
              })}
            </div>

            {pieData.length > 0 && (
              <div style={{ marginBottom: 26 }}>
                <h3 style={{ fontFamily: "'Roboto Slab', serif", color: THEME.ink, fontSize: 15, marginBottom: 6 }}>Despesas por categoria</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtBRL(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <h3 style={{ fontFamily: "'Roboto Slab', serif", color: THEME.ink, fontSize: 15, marginBottom: 6 }}>Últimos 6 meses</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.line} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: THEME.inkSoft }} />
                <YAxis tick={{ fontSize: 10, fill: THEME.inkSoft }} />
                <Tooltip formatter={(v) => fmtBRL(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Receitas" fill={THEME.income} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill={THEME.expense} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {activeTab === "lancamentos" && (
          <>
            {groupedTx.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: THEME.inkSoft }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🖊️</div>
                <p style={{ fontSize: 14 }}>Nenhum lançamento neste mês ainda.<br />Toque em "+" para começar a preencher a página.</p>
              </div>
            )}
            {groupedTx.map(([date, txs]) => (
              <div key={date} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: THEME.inkSoft, fontWeight: 500, marginBottom: 6 }}>
                  {new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                </div>
                {txs.map((t) => {
                  const c = t.type === "receita" ? INCOME_CAT : (catById[t.category] || { emoji: "📦", name: t.category, color: THEME.inkSoft });
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: THEME.pageAlt, borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{c.emoji}</span>
                        <div>
                          <div style={{ fontSize: 13.5, color: THEME.ink }}>{t.note || c.name}</div>
                          <div style={{ fontSize: 11, color: THEME.inkSoft }}>{c.name}{shared ? ` · ${t.author}` : ""}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, fontWeight: 600, color: t.type === "receita" ? THEME.income : THEME.expense }}>
                          {t.type === "receita" ? "+" : "−"} {fmtBRL(t.amount)}
                        </span>
                        <button onClick={() => deleteTransaction(t.id)} style={{ border: "none", background: "transparent", cursor: "pointer", color: THEME.inkSoft }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}

        {activeTab === "categorias" && (
          <>
            <p style={{ fontSize: 13, color: THEME.inkSoft, marginBottom: 16 }}>Defina um limite mensal para cada pote e acompanhe o quanto já foi usado.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {data.categories.map((c) => {
                const spent = spentByCat[c.id] || 0;
                const pct = c.limit > 0 ? (spent / c.limit) * 100 : 0;
                const isCustom = !DEFAULT_CATEGORIES.find((d) => d.id === c.id);
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, background: THEME.pageAlt, borderRadius: 12, padding: "10px 12px" }}>
                    <Jar pct={pct} color={c.color} empty={c.limit === 0} size={44} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, color: THEME.ink, fontWeight: 500 }}>{c.emoji} {c.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 11.5, color: THEME.inkSoft }}>limite:</span>
                        <input
                          type="number"
                          defaultValue={c.limit || ""}
                          placeholder="0"
                          onBlur={(e) => updateLimit(c.id, parseFloat(e.target.value) || 0)}
                          style={{ width: 80, padding: "3px 6px", borderRadius: 6, border: `1px solid ${THEME.line}`, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}
                        />
                      </div>
                    </div>
                    {isCustom && (
                      <button onClick={() => deleteCategory(c.id)} style={{ border: "none", background: "transparent", cursor: "pointer", color: THEME.inkSoft }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nova categoria"
                style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${THEME.line}`, fontSize: 13.5 }} />
              <button onClick={addCategory} style={{ border: "none", background: THEME.ink, color: THEME.page, borderRadius: 8, padding: "0 16px", cursor: "pointer", fontSize: 13.5, fontWeight: 500 }}>
                Adicionar
              </button>
            </div>
            <p style={{ fontSize: 11.5, color: THEME.inkSoft, marginTop: 8 }}>Plano grátis: até {FREE_CUSTOM_LIMIT} categorias personalizadas.</p>
          </>
        )}

        {activeTab === "grupo" && shared && (
          <>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", color: THEME.ink, fontSize: 16, marginBottom: 6 }}>Convide quem divide as contas com você</h3>
            <p style={{ fontSize: 13, color: THEME.inkSoft, marginBottom: 14 }}>Compartilhe o código abaixo. Quem entrar com ele vê e lança nesta mesma caderneta.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: THEME.pageAlt, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, letterSpacing: 1, color: THEME.ink, flex: 1 }}>{settings.code}</span>
              <button onClick={copyCode} style={{ border: "none", background: THEME.ink, color: THEME.page, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
                {showCopied ? <Check size={13} /> : <Copy size={13} />} {showCopied ? "Copiado" : "Copiar"}
              </button>
            </div>

            <h3 style={{ fontFamily: "'Roboto Slab', serif", color: THEME.ink, fontSize: 15, marginBottom: 8 }}>Quem já lançou este mês</h3>
            {[...new Set(monthTx.map((t) => t.author))].length === 0 ? (
              <p style={{ fontSize: 13, color: THEME.inkSoft }}>Ninguém lançou nada ainda neste mês.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...new Set(monthTx.map((t) => t.author))].map((author) => {
                  const total = monthTx.filter((t) => t.author === author && t.type === "despesa").reduce((s, t) => s + t.amount, 0);
                  return (
                    <div key={author} style={{ display: "flex", justifyContent: "space-between", background: THEME.pageAlt, borderRadius: 10, padding: "10px 14px" }}>
                      <span style={{ fontSize: 13.5, color: THEME.ink }}>{author}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: THEME.expense }}>{fmtBRL(total)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* botão flutuante de adicionar */}
        <button onClick={() => setShowAdd(true)}
          style={{ position: "absolute", bottom: 20, right: 20, width: 52, height: 52, borderRadius: "50%", border: "none", background: THEME.ink, color: THEME.page, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }}>
          <Plus size={24} />
        </button>
      </div>

      {showAdd && <AddTransactionModal categories={data.categories} onClose={() => setShowAdd(false)} onSave={addTransaction} />}
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
    </div>
  );
}
