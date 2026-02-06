"use client";

import { useState, useMemo, useCallback } from "react";
import chemicals from "@/data/chemicals.json";

type Chemical = (typeof chemicals)[number];

interface ProductInfo {
  name: string | null;
  formula: string | null;
  cas: string | null;
  pubchemUrl: string | null;
  cid: number | null;
}

interface CompatibilityInfo {
  level: "incompatible" | "caution" | "compatible";
  icon: string;
  hazards_he: string[];
  hazards_en: string[];
  description_he: string;
  gases: string[];
}

interface PredictionResult {
  product?: string;
  confidence?: number | null;
  reactionSmiles?: string;
  productInfo?: ProductInfo | null;
  compatibility: CompatibilityInfo | null;
  isOrganic?: boolean;
  error?: string;
  allPredictions?: { product: string; confidence: number | null }[];
  reactants?: { chem1: any; chem2: any };
}

interface CustomChemical {
  name: string;
  formula: string;
  cas: string;
  smiles: string;
  pubchemUrl?: string;
  source: "pubchem";
  category_en: string;
  category_he: string;
}

/* ═══════ i18n ═══════ */
type Lang = "he" | "en";

const t = {
  title: { he: "ChemPredict AI", en: "ChemPredict AI" },
  subtitle: {
    he: "חיזוי תגובות כימיות וניתוח סיכונים",
    en: "Chemical Reaction & Risk Prediction",
  },
  selectChemicals: { he: "⚗️ בחירת חומרים", en: "⚗️ Select Chemicals" },
  chem1: { he: "מגיב A", en: "Reactant A" },
  chem2: { he: "מגיב B", en: "Reactant B" },
  fromList: { he: "מהרשימה", en: "List" },
  search: { he: "חיפוש", en: "Search" },
  chooseChem: { he: "— בחר חומר —", en: "— Choose chemical —" },
  searchPlaceholder: {
    he: "שם חומר או CAS...",
    en: "Chemical name or CAS...",
  },
  predict: { he: "🔬 חזה תגובה", en: "🔬 Predict Reaction" },
  predicting: { he: "⏳ מנתח...", en: "⏳ Analyzing..." },
  found: { he: "✅ נמצא", en: "✅ Found" },
  notFound: { he: "לא נמצא", en: "Not found" },
  error2Chars: {
    he: "יש להזין לפחות 2 תווים",
    en: "Enter at least 2 characters",
  },
  select2: {
    he: "יש לבחור או לחפש שני חומרים",
    en: "Select or search two chemicals",
  },
  select2diff: {
    he: "יש לבחור שני חומרים שונים",
    en: "Select two different chemicals",
  },
  commError: { he: "שגיאת תקשורת — נסה שוב", en: "Connection error — retry" },
  riskLevel: { he: "רמת סיכון", en: "Risk Level" },
  hazards: { he: "סיכונים", en: "Hazards" },
  expectedGases: { he: "גזים צפויים", en: "Expected Gases" },
  incompatible: {
    he: "🔴 לא תואם — סכנה!",
    en: "🔴 Incompatible — Danger!",
  },
  caution: { he: "🟡 זהירות — תגובה אפשרית", en: "🟡 Caution — Possible Reaction" },
  compatible: { he: "🟢 תואם — אין סכנה צפויה", en: "🟢 Compatible — No Expected Hazard" },
  nonOrganic: {
    he: "ℹ️ תגובה אנאורגנית — מודל ה-AI מתמחה בסינתזה אורגנית בלבד",
    en: "ℹ️ Inorganic reaction — AI model specializes in organic synthesis only",
  },
  aiResult: { he: "✅ תוצאת חיזוי AI", en: "✅ AI Prediction Result" },
  productName: { he: "שם התוצר", en: "Product Name" },
  formula: { he: "נוסחה", en: "Formula" },
  casNum: { he: "מספר CAS", en: "CAS Number" },
  confidence: { he: "רמת ביטחון", en: "Confidence" },
  fullReaction: { he: "תגובה מלאה", en: "Full Reaction" },
  viewPubChem: { he: "🔗 צפה ב-PubChem", en: "🔗 View on PubChem" },
  aiDisclaimer: {
    he: "⚠️ חיזוי AI מבוסס על ReactionT5. תוצאות הן הערכה בלבד.",
    en: "⚠️ AI prediction based on ReactionT5. Results are estimates only.",
  },
  errorWithCompat: {
    he: "⚠️ {e} — ניתוח תאימות עדיין תקף",
    en: "⚠️ {e} — Compatibility analysis still valid",
  },
  footer: {
    he: "© ChemPredict AI 2025 — כלי עזר בלבד, אינו מחליף שיקול דעת מקצועי",
    en: "© ChemPredict AI 2025 — Advisory tool only, not a substitute for professional judgment",
  },
  category: { he: "קטגוריה", en: "Category" },
};

const hazardLabels: Record<string, { he: string; en: string }> = {
  water_reactive: { he: "💧 תגובתי למים", en: "💧 Water Reactive" },
  highly_flammable: { he: "🔥 דליק מאוד", en: "🔥 Highly Flammable" },
  flammable: { he: "🔥 דליק", en: "🔥 Flammable" },
  corrosive: { he: "⚗️ מאכל", en: "⚗️ Corrosive" },
  toxic: { he: "☠️ רעיל", en: "☠️ Toxic" },
  highly_toxic: { he: "💀 רעיל מאוד", en: "💀 Highly Toxic" },
  fatal: { he: "💀 קטלני", en: "💀 Fatal" },
  oxidizer: { he: "⚡ מחמצן", en: "⚡ Oxidizer" },
  explosive: { he: "💥 נפיץ", en: "💥 Explosive" },
  carcinogen: { he: "⚠️ מסרטן", en: "⚠️ Carcinogen" },
  irritant: { he: "⚠️ מגרה", en: "⚠️ Irritant" },
  env_hazard: { he: "🌍 מסוכן לסביבה", en: "🌍 Environmental Hazard" },
  toxic_gas: { he: "☁️ גז רעיל", en: "☁️ Toxic Gas" },
  compressed_gas: { he: "🫧 גז דחוס", en: "🫧 Compressed Gas" },
  asphyxiant: { he: "😶‍🌫️ חונק", en: "😶‍🌫️ Asphyxiant" },
};

const levelConfig: Record<
  string,
  { bg: string; border: string; glow: string; barColor: string }
> = {
  incompatible: {
    bg: "from-red-950/80 to-red-900/40",
    border: "border-red-500/60",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]",
    barColor: "from-red-600 to-red-400",
  },
  caution: {
    bg: "from-yellow-950/60 to-amber-900/30",
    border: "border-yellow-500/50",
    glow: "shadow-[0_0_30px_rgba(234,179,8,0.2)]",
    barColor: "from-yellow-600 to-amber-400",
  },
  compatible: {
    bg: "from-green-950/60 to-emerald-900/30",
    border: "border-green-500/50",
    glow: "shadow-[0_0_30px_rgba(34,197,94,0.2)]",
    barColor: "from-green-600 to-emerald-400",
  },
};

/* ═══════ COMPONENT ═══════ */

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("he");
  const isRTL = lang === "he";
  const tx = (key: keyof typeof t) => t[key][lang];

  // Selection mode
  const [mode1, setMode1] = useState<"list" | "search">("list");
  const [mode2, setMode2] = useState<"list" | "search">("list");
  const [chem1, setChem1] = useState("");
  const [chem2, setChem2] = useState("");

  // Search
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [searching1, setSearching1] = useState(false);
  const [searching2, setSearching2] = useState(false);
  const [custom1, setCustom1] = useState<CustomChemical | null>(null);
  const [custom2, setCustom2] = useState<CustomChemical | null>(null);
  const [searchError1, setSearchError1] = useState("");
  const [searchError2, setSearchError2] = useState("");

  // Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PredictionResult | null>(null);

  const sortedChemicals = useMemo(
    () =>
      [...chemicals].sort((a, b) =>
        lang === "he"
          ? a.name_he.localeCompare(b.name_he, "he")
          : a.name_en.localeCompare(b.name_en, "en")
      ),
    [lang]
  );

  const getChemBySmiles = (smiles: string): Chemical | undefined =>
    chemicals.find((c) => c.smiles === smiles);

  /* ── Search PubChem ── */
  const handleSearch = useCallback(
    async (which: 1 | 2) => {
      const query = which === 1 ? search1 : search2;
      if (!query || query.trim().length < 2) return;

      if (which === 1) {
        setSearching1(true);
        setSearchError1("");
        setCustom1(null);
      } else {
        setSearching2(true);
        setSearchError2("");
        setCustom2(null);
      }

      try {
        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "search", query: query.trim() }),
        });
        const data = await res.json();

        if (data.success) {
          const custom: CustomChemical = {
            name: data.name || query,
            formula: data.formula || "",
            cas: data.cas || "",
            smiles: data.smiles,
            pubchemUrl: data.pubchemUrl,
            source: "pubchem",
            category_en: data.category_en || "Unknown",
            category_he: data.category_he || "לא ידוע",
          };

          if (which === 1) {
            setCustom1(custom);
            setChem1("");
          } else {
            setCustom2(custom);
            setChem2("");
          }

          if (data.source === "local") {
            if (which === 1) {
              setChem1(data.smiles);
              setMode1("list");
            } else {
              setChem2(data.smiles);
              setMode2("list");
            }
          }
        } else {
          const err = data.error || tx("notFound");
          if (which === 1) setSearchError1(err);
          else setSearchError2(err);
        }
      } catch {
        const err = tx("commError");
        if (which === 1) setSearchError1(err);
        else setSearchError2(err);
      } finally {
        if (which === 1) setSearching1(false);
        else setSearching2(false);
      }
    },
    [search1, search2, lang]
  );

  const getSmiles1 = () => (mode1 === "list" ? chem1 : custom1?.smiles || "");
  const getSmiles2 = () => (mode2 === "list" ? chem2 : custom2?.smiles || "");

  const getInfo1 = () => {
    if (mode1 === "list" && chem1) return getChemBySmiles(chem1);
    if (mode1 === "search" && custom1)
      return {
        name_he: custom1.name,
        name_en: custom1.name,
        formula: custom1.formula,
        cas: custom1.cas,
        category_he: custom1.category_he,
        category_en: custom1.category_en,
        hazards: [] as string[],
      };
    return undefined;
  };
  const getInfo2 = () => {
    if (mode2 === "list" && chem2) return getChemBySmiles(chem2);
    if (mode2 === "search" && custom2)
      return {
        name_he: custom2.name,
        name_en: custom2.name,
        formula: custom2.formula,
        cas: custom2.cas,
        category_he: custom2.category_he,
        category_en: custom2.category_en,
        hazards: [] as string[],
      };
    return undefined;
  };

  /* ── Predict ── */
  const handlePredict = async () => {
    const s1 = getSmiles1();
    const s2 = getSmiles2();

    if (!s1 || !s2) {
      setError(tx("select2"));
      return;
    }
    if (s1 === s2) {
      setError(tx("select2diff"));
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smiles1: s1,
          smiles2: s2,
          chem1Custom:
            mode1 === "search" && custom1
              ? { category_en: custom1.category_en }
              : undefined,
          chem2Custom:
            mode2 === "search" && custom2
              ? { category_en: custom2.category_en }
              : undefined,
        }),
      });

      const data = await res.json();
      if (data.error && !data.product && !data.compatibility) {
        setError(data.error);
      } else {
        setResult(data);
        if (data.error) setError(data.error);
      }
    } catch {
      setError(tx("commError"));
    } finally {
      setLoading(false);
    }
  };

  const c1 = getInfo1();
  const c2 = getInfo2();
  const canPredict = !!getSmiles1() && !!getSmiles2();

  /* ── Chemical Card ── */
  const ChemCard = ({
    info,
    label,
  }: {
    info: any;
    label: string;
  }) => {
    if (!info) return null;
    const name = lang === "he" ? info.name_he : info.name_en;
    const cat = lang === "he" ? info.category_he : (info.category_en || "");
    return (
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm p-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="text-[10px] uppercase tracking-widest text-cyan-400/60 mb-1">
          {label}
        </div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-cyan-100 font-semibold text-sm leading-tight">
              {name}
            </p>
            <p className="text-cyan-300/60 text-xs mt-0.5 font-mono">
              {info.formula}
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 whitespace-nowrap">
            {cat}
          </span>
        </div>
        {info.hazards && info.hazards.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {info.hazards.map((h: string) => (
              <span
                key={h}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-300/80 border border-red-500/20"
              >
                {hazardLabels[h]?.[lang] || h}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ── Mode Toggle ── */
  const ModeToggle = ({
    mode,
    onList,
    onSearch,
  }: {
    mode: "list" | "search";
    onList: () => void;
    onSearch: () => void;
  }) => (
    <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
      <button
        onClick={onList}
        className={`text-[11px] px-3 py-1 rounded-md transition-all ${
          mode === "list"
            ? "bg-cyan-500/20 text-cyan-300 shadow-sm"
            : "text-slate-500 hover:text-slate-400"
        }`}
      >
        {tx("fromList")}
      </button>
      <button
        onClick={onSearch}
        className={`text-[11px] px-3 py-1 rounded-md transition-all ${
          mode === "search"
            ? "bg-cyan-500/20 text-cyan-300 shadow-sm"
            : "text-slate-500 hover:text-slate-400"
        }`}
      >
        🔍 {tx("search")}
      </button>
    </div>
  );

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen relative overflow-hidden"
    >
      {/* ── Cosmic Background ── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0c1445_0%,#020617_50%,#000_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(88,28,135,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.08),transparent_50%)]" />
        {/* Stars */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 30% 70%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1.5px 1.5px at 50% 10%, rgba(255,255,255,0.9), transparent),
            radial-gradient(1px 1px at 70% 40%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 90% 80%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1.5px 1.5px at 15% 50%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 60% 90%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 85% 15%, rgba(255,255,255,0.5), transparent)`
        }} />
        {/* Nebula glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px]" />
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Language Toggle */}
        <div className="flex justify-end">
          <button
            onClick={() => setLang(lang === "he" ? "en" : "he")}
            className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-all"
          >
            {lang === "he" ? "🌐 English" : "🌐 עברית"}
          </button>
        </div>

        {/* ── Header ── */}
        <div className="text-center space-y-3 pb-2">
          {/* Glowing molecule icon */}
          <div className="relative mx-auto w-16 h-16 mb-2">
            <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-16 h-16 flex items-center justify-center text-3xl">
              ⚛️
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              ChemPredict
            </span>{" "}
            <span className="text-white/90">AI</span>
          </h1>
          <p className="text-slate-400 text-sm tracking-wide">
            {tx("subtitle")}
          </p>
          {/* Risk level legend */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-2 rounded-full bg-gradient-to-r from-red-600 to-red-400" />
              <span className="text-[10px] text-red-400/80">
                {lang === "he" ? "סכנה" : "Hazard"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-2 rounded-full bg-gradient-to-r from-yellow-600 to-amber-400" />
              <span className="text-[10px] text-yellow-400/80">
                {lang === "he" ? "זהירות" : "Caution"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-400" />
              <span className="text-[10px] text-green-400/80">
                {lang === "he" ? "בטוח" : "Safe"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Selectors Card ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-5 shadow-[0_0_60px_rgba(6,182,212,0.05)]">
          <h3 className="text-cyan-300 font-semibold text-sm flex items-center gap-2">
            {tx("selectChemicals")}
          </h3>

          {/* Chemical 1 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300 tracking-wide uppercase">
                {tx("chem1")}
              </label>
              <ModeToggle
                mode={mode1}
                onList={() => {
                  setMode1("list");
                  setCustom1(null);
                  setSearchError1("");
                  setResult(null);
                }}
                onSearch={() => {
                  setMode1("search");
                  setChem1("");
                  setResult(null);
                }}
              />
            </div>

            {mode1 === "list" ? (
              <select
                value={chem1}
                onChange={(e) => {
                  setChem1(e.target.value);
                  setError("");
                  setResult(null);
                }}
                className="w-full p-3 rounded-xl bg-slate-800/60 border border-white/10 text-slate-100 text-sm focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
              >
                <option value="">{tx("chooseChem")}</option>
                {sortedChemicals.map((c) => (
                  <option key={c.cas} value={c.smiles}>
                    {lang === "he"
                      ? `${c.name_he} | ${c.name_en} | ${c.formula}`
                      : `${c.name_en} | ${c.formula} | ${c.name_he}`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={search1}
                  onChange={(e) => setSearch1(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(1)}
                  placeholder={tx("searchPlaceholder")}
                  className="flex-1 p-3 rounded-xl bg-slate-800/60 border border-white/10 text-slate-100 text-sm focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 placeholder:text-slate-600 transition-all"
                />
                <button
                  onClick={() => handleSearch(1)}
                  disabled={searching1 || search1.trim().length < 2}
                  className="px-4 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 font-bold disabled:opacity-30 hover:bg-cyan-600/30 transition-all"
                >
                  {searching1 ? "⏳" : "🔍"}
                </button>
              </div>
            )}

            {searchError1 && (
              <p className="text-red-400/80 text-xs">⚠️ {searchError1}</p>
            )}
            {custom1 && mode1 === "search" && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-300">
                {tx("found")}: {custom1.name} | {custom1.formula} | CAS:{" "}
                {custom1.cas}
              </div>
            )}
          </div>

          {/* Divider with + */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg text-cyan-400/60">
              +
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Chemical 2 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300 tracking-wide uppercase">
                {tx("chem2")}
              </label>
              <ModeToggle
                mode={mode2}
                onList={() => {
                  setMode2("list");
                  setCustom2(null);
                  setSearchError2("");
                  setResult(null);
                }}
                onSearch={() => {
                  setMode2("search");
                  setChem2("");
                  setResult(null);
                }}
              />
            </div>

            {mode2 === "list" ? (
              <select
                value={chem2}
                onChange={(e) => {
                  setChem2(e.target.value);
                  setError("");
                  setResult(null);
                }}
                className="w-full p-3 rounded-xl bg-slate-800/60 border border-white/10 text-slate-100 text-sm focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
              >
                <option value="">{tx("chooseChem")}</option>
                {sortedChemicals.map((c) => (
                  <option key={c.cas} value={c.smiles}>
                    {lang === "he"
                      ? `${c.name_he} | ${c.name_en} | ${c.formula}`
                      : `${c.name_en} | ${c.formula} | ${c.name_he}`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={search2}
                  onChange={(e) => setSearch2(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(2)}
                  placeholder={tx("searchPlaceholder")}
                  className="flex-1 p-3 rounded-xl bg-slate-800/60 border border-white/10 text-slate-100 text-sm focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 placeholder:text-slate-600 transition-all"
                />
                <button
                  onClick={() => handleSearch(2)}
                  disabled={searching2 || search2.trim().length < 2}
                  className="px-4 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 font-bold disabled:opacity-30 hover:bg-cyan-600/30 transition-all"
                >
                  {searching2 ? "⏳" : "🔍"}
                </button>
              </div>
            )}

            {searchError2 && (
              <p className="text-red-400/80 text-xs">⚠️ {searchError2}</p>
            )}
            {custom2 && mode2 === "search" && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-300">
                {tx("found")}: {custom2.name} | {custom2.formula} | CAS:{" "}
                {custom2.cas}
              </div>
            )}
          </div>

          {/* Chemical info cards */}
          {(c1 || c2) && (
            <div className="space-y-2 pt-1">
              <ChemCard info={c1} label={tx("chem1")} />
              <ChemCard info={c2} label={tx("chem2")} />
            </div>
          )}
        </div>

        {/* ── Predict Button ── */}
        <button
          onClick={handlePredict}
          disabled={loading || !canPredict}
          className={`relative w-full py-4 rounded-2xl text-base font-bold tracking-wide transition-all duration-300 overflow-hidden ${
            loading || !canPredict
              ? "bg-slate-800/50 text-slate-600 cursor-not-allowed border border-white/5"
              : "bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-white cursor-pointer hover:scale-[1.02] shadow-[0_0_40px_rgba(6,182,212,0.3)] border border-cyan-400/20"
          }`}
        >
          {!loading && canPredict && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
          )}
          <span className="relative z-10">
            {loading ? tx("predicting") : tx("predict")}
          </span>
        </button>

        {/* ── Error ── */}
        {error && !result?.compatibility && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 backdrop-blur p-4 text-center">
            <p className="text-red-400 text-sm">⚠️ {error}</p>
          </div>
        )}

        {/* ═══════ RESULTS ═══════ */}
        {result && (
          <div className="space-y-4">
            {/* ── Risk / Compatibility ── */}
            {result.compatibility &&
              (() => {
                const lvl = result.compatibility.level;
                const cfg = levelConfig[lvl];
                const label =
                  lvl === "incompatible"
                    ? tx("incompatible")
                    : lvl === "caution"
                    ? tx("caution")
                    : tx("compatible");
                const desc =
                  lang === "he"
                    ? result.compatibility.description_he
                    : result.compatibility.hazards_en.join(". ");

                return (
                  <div
                    className={`rounded-2xl border ${cfg.border} bg-gradient-to-br ${cfg.bg} ${cfg.glow} backdrop-blur-sm p-5 space-y-4`}
                  >
                    {/* Risk bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-slate-400">
                          {tx("riskLevel")}
                        </span>
                        <span className="text-sm font-bold">{label}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${cfg.barColor} transition-all duration-1000`}
                          style={{
                            width:
                              lvl === "incompatible"
                                ? "100%"
                                : lvl === "caution"
                                ? "55%"
                                : "15%",
                          }}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {desc}
                    </p>

                    {/* Hazards */}
                    {result.compatibility.hazards_he.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500">
                          {tx("hazards")}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(lang === "he"
                            ? result.compatibility.hazards_he
                            : result.compatibility.hazards_en
                          ).map((h: string, i: number) => (
                            <span
                              key={i}
                              className={`text-[11px] px-2.5 py-1 rounded-full border backdrop-blur-sm ${
                                lvl === "incompatible"
                                  ? "bg-red-500/10 text-red-300 border-red-500/30"
                                  : "bg-yellow-500/10 text-yellow-300 border-yellow-500/30"
                              }`}
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gases */}
                    {result.compatibility.gases.length > 0 && (
                      <div className="rounded-xl bg-black/20 border border-white/5 p-3 space-y-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500">
                          {tx("expectedGases")}
                        </span>
                        {result.compatibility.gases.map(
                          (g: string, i: number) => (
                            <p
                              key={i}
                              className="text-red-300/90 text-xs font-mono"
                            >
                              ☁️ {g}
                            </p>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* Error with compat */}
            {error && result.compatibility && (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-950/20 p-3 text-center">
                <p className="text-yellow-400/80 text-xs">
                  {tx("errorWithCompat").replace("{e}", error)}
                </p>
              </div>
            )}

            {/* Non-organic */}
            {result.isOrganic === false && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 backdrop-blur p-4 text-center">
                <p className="text-blue-300/80 text-sm">{tx("nonOrganic")}</p>
              </div>
            )}

            {/* ── AI Prediction ── */}
            {result.product && (
              <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 to-slate-900/60 backdrop-blur-sm shadow-[0_0_40px_rgba(6,182,212,0.08)] p-5 space-y-4">
                <h3 className="text-cyan-300 font-bold text-sm text-center">
                  {tx("aiResult")}
                </h3>

                <div className="space-y-3">
                  {result.productInfo?.name && (
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-slate-500">
                        {tx("productName")}
                      </span>
                      <p className="text-lg font-bold text-cyan-200 mt-0.5">
                        {result.productInfo.name}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {result.productInfo?.formula && (
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-slate-500">
                          {tx("formula")}
                        </span>
                        <p className="text-sm font-mono text-slate-200 mt-0.5">
                          {result.productInfo.formula}
                        </p>
                      </div>
                    )}
                    {result.productInfo?.cas && (
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-slate-500">
                          {tx("casNum")}
                        </span>
                        <p className="text-sm font-mono text-slate-300 mt-0.5">
                          {result.productInfo.cas}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">
                      SMILES
                    </span>
                    <p className="text-xs font-mono text-cyan-400/80 mt-0.5 break-all">
                      {result.product}
                    </p>
                  </div>

                  {result.confidence != null && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500">
                          {tx("confidence")}
                        </span>
                        <span className="text-sm font-bold text-cyan-300">
                          {result.confidence}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000"
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {result.productInfo?.pubchemUrl && (
                    <a
                      href={result.productInfo.pubchemUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs text-cyan-400/70 hover:text-cyan-300 transition-colors"
                    >
                      {tx("viewPubChem")} →
                    </a>
                  )}

                  {result.reactionSmiles && (
                    <div className="border-t border-white/5 pt-3">
                      <span className="text-[10px] uppercase tracking-widest text-slate-500">
                        {tx("fullReaction")}
                      </span>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5 break-all">
                        {result.reactionSmiles}
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 text-center pt-1">
                  {tx("aiDisclaimer")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <p className="text-center text-[10px] text-slate-700 pt-4 pb-8">
          {tx("footer")}
        </p>
      </div>

      {/* Shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
