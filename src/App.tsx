import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  Building2,
  Calculator,
  Car,
  CheckCircle2,
  Home,
  Printer,
  RotateCcw,
  Scissors,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { AmortizationTable } from './components/AmortizationTable';
import { AnimatedCurrency } from './components/AnimatedCurrency';
import { CreditTimelineCard } from './components/CreditTimelineCard';
import { CurrencyInput } from './components/CurrencyInput';
import { HouseHeroScene } from './components/HouseHeroScene';
import { KprCharts } from './components/KprCharts';
import {
  DEFAULT_PARAMS,
  SimulationParams,
  formatBulanToTahunBulan,
  formatPercent,
  formatRupiah,
  runKprSimulation,
} from './utils/kprCalculator';

interface NumberInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  integer?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  suffix,
  integer = false,
}) => {
  const [text, setText] = useState<string>(String(value));
  const [focused, setFocused] = useState(false);

  React.useEffect(() => {
    if (!focused) {
      setText(integer ? String(Math.round(value)) : String(value));
    }
  }, [value, focused, integer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(',', '.');
    setText(raw);
    if (raw === '' || raw === '.') return;
    const parsed = integer ? parseInt(raw, 10) : parseFloat(raw);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = integer ? parseInt(text, 10) : parseFloat(text);
    const next = Number.isNaN(parsed) ? min : Math.min(max, Math.max(min, parsed));
    onChange(next);
    setText(integer ? String(Math.round(next)) : String(next));
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={text}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          onChange={handleChange}
          className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold tabular-nums text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
            suffix ? 'pr-16' : ''
          }`}
        />
        {suffix && (
          <span className="absolute right-3.5 text-xs font-medium text-slate-500 select-none pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

type PresetId = 'house' | 'family' | 'car';
type NavSection = 'ringkasan' | 'pelunasan-ekstra' | 'grafik-analisis' | 'tabel-amortisasi';
type WorkspaceTab = 'all' | 'charts' | 'table';

const PRESETS: Record<PresetId, { label: string; params: SimulationParams }> = {
  house: {
    label: 'Rumah Pertama (Rp 500 Jt)',
    params: DEFAULT_PARAMS,
  },
  family: {
    label: 'Hunian Keluarga (Rp 1,2 M)',
    params: {
      hargaAset: 1_200_000_000,
      dpPercent: 20,
      tenorTahun: 20,
      bungaFixed: 5.5,
      masaFixedTahun: 3,
      bungaFloating: 11.5,
      bungaFlat: 6.5,
      danaEkstra: 100_000_000,
      bulanEkstra: 36,
    },
  },
  car: {
    label: 'Kredit Mobil (Rp 320 Jt)',
    params: {
      hargaAset: 320_000_000,
      dpPercent: 25,
      tenorTahun: 5,
      bungaFixed: 4.5,
      masaFixedTahun: 2,
      bungaFloating: 9.5,
      bungaFlat: 5.0,
      danaEkstra: 30_000_000,
      bulanEkstra: 24,
    },
  },
};

const NAV_ITEMS: { id: NavSection; label: string; tabTarget?: WorkspaceTab }[] = [
  { id: 'ringkasan', label: 'Ringkasan', tabTarget: 'all' },
  { id: 'pelunasan-ekstra', label: 'Pelunasan', tabTarget: 'all' },
  { id: 'grafik-analisis', label: 'Grafik', tabTarget: 'charts' },
  { id: 'tabel-amortisasi', label: 'Tabel Amortisasi', tabTarget: 'table' },
];

const WORKSPACE_TABS: { id: WorkspaceTab; label: string }[] = [
  { id: 'all', label: 'Semua Tampilan' },
  { id: 'charts', label: 'Grafik Analisis' },
  { id: 'table', label: 'Tabel Amortisasi' },
];

export default function App() {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [assetType, setAssetType] = useState<PresetId>('house');
  const [activeNav, setActiveNav] = useState<NavSection>('ringkasan');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('all');
  const shouldReduceMotion = useReducedMotion();

  const updateParam = <K extends keyof SimulationParams>(
    key: K,
    value: SimulationParams[K]
  ) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'tenorTahun') {
        const maxTenor = Math.min(25, Math.max(1, Math.round(Number(value))));
        next.tenorTahun = maxTenor;
        if (next.masaFixedTahun > maxTenor) {
          next.masaFixedTahun = maxTenor;
        }
        const maxBulan = maxTenor * 12;
        if (next.bulanEkstra > maxBulan) {
          next.bulanEkstra = maxBulan;
        }
      }
      return next;
    });
  };

  const applyPreset = (id: PresetId) => {
    setAssetType(id);
    setParams(PRESETS[id].params);
  };

  const handleReset = () => {
    setAssetType('house');
    setParams(DEFAULT_PARAMS);
  };

  const handleNavClick = (item: (typeof NAV_ITEMS)[number]) => {
    setActiveNav(item.id);
    if (item.tabTarget && workspaceTab !== 'all' && workspaceTab !== item.tabTarget) {
      setWorkspaceTab(item.tabTarget);
    }
  };

  const result = useMemo(() => runKprSimulation(params), [params]);

  const totalBulan = params.tenorTahun * 12;
  const selisihTotalFlatVsKpr = result.totalBayarFlat - result.totalBayarNormal;
  const isFloatingHigher = result.kenaikanCicilanNominal > 0.5;
  const isFloatingLower = result.kenaikanCicilanNominal < -0.5;

  const cardFade = (index: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.35,
            delay: index * 0.08,
            ease: [0.16, 1, 0.3, 1] as const,
          },
        };

  const normalPokokPct =
    result.totalBayarNormal > 0
      ? Math.round((result.pokokPinjaman / result.totalBayarNormal) * 100)
      : 100;
  const flatPokokPct =
    result.totalBayarFlat > 0
      ? Math.round((result.pokokPinjaman / result.totalBayarFlat) * 100)
      : 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/45 via-slate-50 to-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: Brand wordmark — Nav links — 1 Primary Action */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30 no-print">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="text-base sm:text-lg font-bold tracking-tight text-indigo-950 whitespace-nowrap shrink-0"
          >
            Simulator KPR &amp; Kredit
          </a>

          <nav
            aria-label="Navigasi bagian"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => handleNavClick(item)}
                  className={`relative py-1 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-indigo-600 font-semibold'
                      : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="topNavUnderline"
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full bg-indigo-600"
                    />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              Cetak / Simpan PDF
            </button>
          </div>
        </div>
      </header>

      <main
        id="top"
        className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
      >
        {/* Hero Banner with Fade-In & Animated House Scene */}
        <motion.section
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-4">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
                Simulator Cicilan KPR &amp; Kredit —{' '}
                <span className="text-indigo-600">Flat vs Floating</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Hitung cicilan bulanan dengan mudah, lihat lonjakan saat bunga berubah ke{' '}
                <span className="font-semibold text-rose-600">Floating</span>, dan uji seberapa cepat kredit lunas lewat setoran ekstra.
              </p>

              {/* Quick Interactive Presets with Framer Motion sliding background */}
              <div className="pt-1 no-print">
                <div className="text-xs font-medium text-slate-500 mb-2">
                  Pilih contoh simulasi cepat:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(['house', 'family', 'car'] as PresetId[]).map((id) => {
                    const isSelected = assetType === id;
                    const Icon = id === 'house' ? Home : id === 'family' ? Building2 : Car;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => applyPreset(id)}
                        className={`relative inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer z-10 ${
                          isSelected
                            ? 'text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'
                        }`}
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="presetPillBg"
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 bg-indigo-600 rounded-xl -z-10"
                          />
                        )}
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                        {PRESETS[id].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Unboxed Key Metadata Strip */}
              <div className="pt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm text-slate-600">
                <span>
                  Aset:{' '}
                  <AnimatedCurrency
                    value={params.hargaAset}
                    className="font-mono font-semibold tabular-nums text-slate-900"
                  />
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span>
                  DP {params.dpPercent}%:{' '}
                  <AnimatedCurrency
                    value={result.uangMukaNominal}
                    className="font-mono font-semibold tabular-nums text-slate-900"
                  />
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span>
                  Pokok Pinjaman:{' '}
                  <AnimatedCurrency
                    value={result.pokokPinjaman}
                    className="font-mono font-semibold tabular-nums text-indigo-700"
                  />
                </span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <HouseHeroScene
                hargaAset={params.hargaAset}
                dpPercent={params.dpPercent}
                pokokPinjaman={result.pokokPinjaman}
                bulanDipangkas={result.bulanDipangkas}
                bungaDihemat={result.bungaDihemat}
                danaEkstra={params.danaEkstra}
                assetType={assetType}
              />
            </div>
          </div>
        </motion.section>

        {/* Main 2-Column Calculator Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: Input Parameter Pengguna */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden no-print lg:sticky lg:top-22">
            <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Atur Simulasi Anda
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Geser slider atau ubah angka langsung
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Kembalikan ke nilai awal"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Reset
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Group 1: Harga Aset, DP, Tenor */}
              <div className="p-5 space-y-4">
                <h3 className="text-xs font-semibold text-indigo-600">
                  1. Harga Aset &amp; Tenor
                </h3>

                <CurrencyInput
                  id="harga-aset"
                  label="Harga Properti / Kendaraan"
                  value={params.hargaAset}
                  onChange={(v) => updateParam('hargaAset', v)}
                  max={100_000_000_000}
                />

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="dp-percent" className="text-sm font-medium text-slate-700">
                      Uang Muka (DP)
                    </label>
                    <AnimatedCurrency
                      value={result.uangMukaNominal}
                      className="text-xs font-mono font-semibold tabular-nums text-emerald-700"
                    />
                  </div>
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-7">
                      <input
                        aria-label="Slider Uang Muka"
                        type="range"
                        min={0}
                        max={80}
                        step={1}
                        value={Math.min(80, params.dpPercent)}
                        onChange={(e) => updateParam('dpPercent', Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="col-span-5 relative flex items-center">
                      <input
                        id="dp-percent"
                        type="number"
                        min={0}
                        max={95}
                        step={0.5}
                        value={params.dpPercent}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          updateParam('dpPercent', Number.isNaN(v) ? 0 : Math.min(95, Math.max(0, v)));
                        }}
                        className="w-full pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold tabular-nums text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <span className="absolute right-2.5 text-xs font-medium text-slate-500 pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="tenor-tahun" className="text-sm font-medium text-slate-700">
                      Jangka Waktu (Tenor)
                    </label>
                    <span className="text-xs font-mono tabular-nums text-slate-500">
                      {totalBulan} bulan
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-7">
                      <input
                        aria-label="Slider Tenor"
                        type="range"
                        min={1}
                        max={25}
                        step={1}
                        value={params.tenorTahun}
                        onChange={(e) => updateParam('tenorTahun', Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="col-span-5 relative flex items-center">
                      <input
                        id="tenor-tahun"
                        type="number"
                        min={1}
                        max={25}
                        step={1}
                        value={params.tenorTahun}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          updateParam('tenorTahun', Number.isNaN(v) ? 1 : Math.min(25, Math.max(1, v)));
                        }}
                        className="w-full pl-3 pr-11 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold tabular-nums text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <span className="absolute right-2.5 text-xs font-medium text-slate-500 pointer-events-none">
                        Thn
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 2: Skema KPR Bank (Fixed -> Floating) */}
              <div className="p-5 space-y-4">
                <h3 className="text-xs font-semibold text-sky-700">
                  2. Bunga Bank (Fixed ke Floating)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <NumberInput
                    id="bunga-fixed"
                    label="Bunga Fixed"
                    value={params.bungaFixed}
                    onChange={(v) => updateParam('bungaFixed', v)}
                    min={0}
                    max={30}
                    step={0.1}
                    suffix="% /thn"
                  />
                  <NumberInput
                    id="masa-fixed"
                    label="Masa Fixed"
                    value={params.masaFixedTahun}
                    onChange={(v) => updateParam('masaFixedTahun', v)}
                    min={0}
                    max={params.tenorTahun}
                    step={1}
                    suffix="Tahun"
                    integer
                  />
                </div>

                <NumberInput
                  id="bunga-floating"
                  label="Estimasi Bunga Floating"
                  value={params.bungaFloating}
                  onChange={(v) => updateParam('bungaFloating', v)}
                  min={0}
                  max={35}
                  step={0.1}
                  suffix="% /thn"
                />
              </div>

              {/* Group 3: Pembanding Bunga Flat */}
              <div className="p-5 space-y-3">
                <h3 className="text-xs font-semibold text-amber-700">
                  3. Pembanding Bunga Flat
                </h3>
                <NumberInput
                  id="bunga-flat"
                  label="Suku Bunga Flat"
                  value={params.bungaFlat}
                  onChange={(v) => updateParam('bungaFlat', v)}
                  min={0}
                  max={35}
                  step={0.1}
                  suffix="% /thn"
                />
              </div>

              {/* Group 4: Simulasi Pelunasan Sebagian */}
              <div className="p-5 space-y-4">
                <h3 className="text-xs font-semibold text-emerald-700">
                  4. Pelunasan Sebagian (Pangkas Tenor)
                </h3>

                <CurrencyInput
                  id="dana-ekstra"
                  label="Dana Ekstra yang Disetor"
                  value={params.danaEkstra}
                  onChange={(v) => updateParam('danaEkstra', v)}
                  max={params.hargaAset}
                />

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="bulan-ekstra" className="text-sm font-medium text-slate-700">
                      Setor pada Bulan ke-
                    </label>
                    <span className="text-xs font-mono tabular-nums text-emerald-700 font-medium">
                      Tahun ke-{Math.ceil(params.bulanEkstra / 12)}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-7">
                      <input
                        aria-label="Slider Bulan Setoran Ekstra"
                        type="range"
                        min={1}
                        max={totalBulan}
                        step={1}
                        value={params.bulanEkstra}
                        onChange={(e) => updateParam('bulanEkstra', Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="col-span-5 relative flex items-center">
                      <input
                        id="bulan-ekstra"
                        type="number"
                        min={1}
                        max={totalBulan}
                        step={1}
                        value={params.bulanEkstra}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          updateParam(
                            'bulanEkstra',
                            Number.isNaN(v) ? 1 : Math.min(totalBulan, Math.max(1, v))
                          );
                        }}
                        className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold tabular-nums text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <span className="absolute right-2.5 text-xs font-medium text-slate-500 pointer-events-none">
                        Bln
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT PANEL: Output Ringkasan, Grafik & Tabel */}
          <div className="lg:col-span-8 space-y-5 print-full">
            {/* 1. Kartu Ringkasan Perbandingan Side-by-Side (Fade-In Staggered on Load) */}
            <section id="ringkasan" className="space-y-4 print-break-inside-avoid">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Masa Fixed - Sky Accent */}
                <motion.div
                  {...cardFade(0)}
                  whileHover={shouldReduceMotion ? undefined : { y: -3 }}
                  className="bg-sky-50/75 border border-sky-200 rounded-2xl p-5 flex flex-col justify-between transition-shadow hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-sky-800">
                        {result.fixedMonths > 0
                          ? `Masa Fixed · Bln 1–${result.fixedMonths}`
                          : 'Tanpa Masa Fixed'}
                      </span>
                      <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-2xl font-bold font-mono tabular-nums text-slate-900">
                      {result.fixedMonths > 0 ? (
                        <AnimatedCurrency value={result.cicilanFixed} />
                      ) : (
                        '—'
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      per bulan · bunga{' '}
                      <span className="font-mono font-semibold text-sky-800">
                        {formatPercent(params.bungaFixed, 1)}
                      </span>{' '}
                      p.a.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-sky-200/70 text-xs text-sky-900">
                    Cicilan tetap selama {params.masaFixedTahun} tahun pertama
                  </div>
                </motion.div>

                {/* Masa Floating - Rose Accent */}
                <motion.div
                  {...cardFade(1)}
                  whileHover={shouldReduceMotion ? undefined : { y: -3 }}
                  className={`rounded-2xl p-5 flex flex-col justify-between border transition-all hover:shadow-sm ${
                    isFloatingHigher
                      ? 'bg-rose-50/80 border-rose-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          isFloatingHigher ? 'text-rose-800' : 'text-slate-700'
                        }`}
                      >
                        {result.hasFloatingPeriod
                          ? `Masa Floating · Bln ${result.fixedMonths + 1}–${result.totalBulan}`
                          : 'Full Fixed Hingga Lunas'}
                      </span>
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 ${
                          isFloatingHigher ? 'text-rose-600' : 'text-slate-400'
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      className={`mt-3 text-2xl font-bold font-mono tabular-nums ${
                        isFloatingHigher ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      <AnimatedCurrency
                        value={
                          result.hasFloatingPeriod
                            ? result.cicilanFloating
                            : result.cicilanFixed
                        }
                      />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      per bulan · bunga{' '}
                      <span className="font-mono font-semibold text-rose-700">
                        {formatPercent(
                          result.hasFloatingPeriod ? params.bungaFloating : params.bungaFixed,
                          1
                        )}
                      </span>{' '}
                      p.a.
                    </p>
                  </div>

                  <div
                    className={`mt-4 pt-3 border-t ${
                      isFloatingHigher ? 'border-rose-200/70' : 'border-slate-100'
                    }`}
                  >
                    {!result.hasFloatingPeriod ? (
                      <div className="text-xs text-slate-600">
                        Tidak terkena perubahan bunga floating.
                      </div>
                    ) : result.fixedMonths === 0 ? (
                      <div className="text-xs text-slate-600">
                        Menggunakan bunga floating sejak bulan ke-1.
                      </div>
                    ) : isFloatingHigher ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          Naik +<AnimatedCurrency value={result.kenaikanCicilanNominal} /> (+
                          {result.kenaikanCicilanPersen.toFixed(1)}%)
                        </span>
                      </div>
                    ) : isFloatingLower ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        <TrendingDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          Turun <AnimatedCurrency value={Math.abs(result.kenaikanCicilanNominal)} /> (
                          {result.kenaikanCicilanPersen.toFixed(1)}%)
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600">
                        Nominal cicilan tetap sama.
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Pembanding Bunga Flat - Amber Accent */}
                <motion.div
                  {...cardFade(2)}
                  whileHover={shouldReduceMotion ? undefined : { y: -3 }}
                  className="bg-amber-50/75 border border-amber-200 rounded-2xl p-5 flex flex-col justify-between transition-shadow hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-amber-900">
                        Pembanding Bunga Flat
                      </span>
                      <Calculator className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-2xl font-bold font-mono tabular-nums text-slate-900">
                      <AnimatedCurrency value={result.cicilanFlat} />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      per bulan · bunga{' '}
                      <span className="font-mono font-semibold text-amber-900">
                        {formatPercent(params.bungaFlat, 1)}
                      </span>{' '}
                      flat p.a.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-amber-200/70 text-xs text-amber-950">
                    Setara efektif{' '}
                    <span className="font-mono font-semibold text-rose-600 tabular-nums">
                      ~{formatPercent(result.flatEquivalentEffectiveRate, 2)} p.a.
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Perbandingan Total Pembayaran */}
              <motion.div
                {...cardFade(3)}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
              >
                <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Total Pembayaran Selama {params.tenorTahun} Tahun
                  </h3>
                  {result.pokokPinjaman > 0 && (
                    <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                      {selisihTotalFlatVsKpr > 0 ? (
                        <>
                          <TrendingUp className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                          <span>
                            Bunga Flat lebih mahal{' '}
                            <AnimatedCurrency
                              value={selisihTotalFlatVsKpr}
                              className="font-mono font-bold text-rose-600 tabular-nums"
                            />
                          </span>
                        </>
                      ) : selisihTotalFlatVsKpr < 0 ? (
                        <>
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                          <span>
                            Bunga Flat lebih hemat{' '}
                            <AnimatedCurrency
                              value={Math.abs(selisihTotalFlatVsKpr)}
                              className="font-mono font-bold text-emerald-600 tabular-nums"
                            />
                          </span>
                        </>
                      ) : (
                        <span>Total pembayaran kedua skema setara</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div className="p-5 space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-indigo-700">
                        KPR Fixed → Floating
                      </div>
                      <div className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900">
                        <AnimatedCurrency value={result.totalBayarNormal} />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Total bunga:{' '}
                        <AnimatedCurrency
                          value={result.totalBungaNormal}
                          className="font-mono font-semibold text-rose-600 tabular-nums"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-full rounded-full bg-rose-100 overflow-hidden flex">
                        <motion.div
                          className="h-full bg-emerald-500"
                          initial={false}
                          animate={{ width: `${normalPokokPct}%` }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        />
                        <motion.div
                          className="h-full bg-rose-500"
                          initial={false}
                          animate={{ width: `${100 - normalPokokPct}%` }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Pokok {normalPokokPct}%</span>
                        <span className="text-rose-600">Bunga {100 - normalPokokPct}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-amber-800">
                        Kredit Bunga Flat
                      </div>
                      <div className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900">
                        <AnimatedCurrency value={result.totalBayarFlat} />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Total bunga:{' '}
                        <AnimatedCurrency
                          value={result.totalBungaFlat}
                          className="font-mono font-semibold text-rose-600 tabular-nums"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-full rounded-full bg-rose-100 overflow-hidden flex">
                        <motion.div
                          className="h-full bg-emerald-500"
                          initial={false}
                          animate={{ width: `${flatPokokPct}%` }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        />
                        <motion.div
                          className="h-full bg-rose-500"
                          initial={false}
                          animate={{ width: `${100 - flatPokokPct}%` }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Pokok {flatPokokPct}%</span>
                        <span className="text-rose-600">Bunga {100 - flatPokokPct}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* Timeline Perjalanan Kredit Interaktif */}
            <CreditTimelineCard
              totalBulan={result.totalBulan}
              fixedMonths={result.fixedMonths}
              tenorAkhirBulan={result.tenorAkhirBulan}
              bulanDipangkas={result.bulanDipangkas}
              bulanEkstra={params.bulanEkstra}
              danaEkstra={params.danaEkstra}
              bungaDihemat={result.bungaDihemat}
              hasFloatingPeriod={result.hasFloatingPeriod}
            />

            {/* 2. Hasil Simulasi Pelunasan Sebagian */}
            <motion.section
              id="pelunasan-ekstra"
              {...cardFade(4)}
              className="bg-emerald-50/75 border border-emerald-200 rounded-2xl p-5 sm:p-6 print-break-inside-avoid"
            >
              <div className="flex items-center gap-2.5 pb-4 border-b border-emerald-200/70">
                <Scissors className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Hasil Simulasi Pelunasan Sebagian
                  </h2>
                  <p className="text-xs text-emerald-900/80">
                    Setor ekstra {formatRupiah(params.danaEkstra)} pada Bulan ke-{params.bulanEkstra} untuk mempercepat lunas.
                  </p>
                </div>
              </div>

              {result.pokokPinjaman <= 0 || params.danaEkstra <= 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  Isi nominal dana ekstra di panel kiri untuk menghitung penghematan bunga dan pemangkasan tenor.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <div className="text-xs font-medium text-emerald-900/70">
                      Tenor Berhasil Dipangkas
                    </div>
                    <motion.div
                      key={result.bulanDipangkas}
                      initial={shouldReduceMotion ? false : { scale: 0.94, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700"
                    >
                      {result.bulanDipangkas} Bulan
                    </motion.div>
                    <p className="mt-1 text-xs text-slate-700">
                      Lunas{' '}
                      <strong className="text-emerald-900">
                        {formatBulanToTahunBulan(result.bulanDipangkas)}
                      </strong>{' '}
                      lebih cepat (Bln ke-{result.tenorAkhirBulan})
                    </p>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-emerald-900/70">
                      Total Bunga Dihemat
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
                      <AnimatedCurrency
                        value={result.bungaDihemat}
                        className="text-2xl font-bold font-mono tabular-nums text-emerald-700"
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-700">
                      Bunga menjadi{' '}
                      <AnimatedCurrency
                        value={result.totalBungaExtra}
                        className="font-mono font-semibold tabular-nums text-slate-900"
                      />
                    </p>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-emerald-900/70">
                      Sisa Pokok Setelah Setoran
                    </div>
                    <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                      <AnimatedCurrency value={result.sisaPokokSetelahEkstra} />
                    </div>
                    <p className="mt-1 text-xs text-slate-700">
                      Turun dari{' '}
                      <AnimatedCurrency
                        value={result.sisaPokokSebelumEkstra}
                        className="font-mono tabular-nums"
                      />
                    </p>
                  </div>
                </div>
              )}
            </motion.section>

            {/* Menu Tampilan Detail dengan Transisi Halus Framer Motion */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 no-print">
              <div className="inline-flex items-center p-1 bg-white border border-slate-200 rounded-xl relative">
                {WORKSPACE_TABS.map((tab) => {
                  const isActive = workspaceTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setWorkspaceTab(tab.id)}
                      className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer z-10 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="workspaceTabBg"
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-0 bg-indigo-600 rounded-lg -z-10"
                        />
                      )}
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <span className="text-xs text-slate-500">
                Pilih tampilan grafik atau tabel amortisasi secara terfokus
              </span>
            </div>

            {/* 3 & 4. Grafik & Tabel dengan AnimatePresence Smooth Transition */}
            <AnimatePresence mode="wait">
              <motion.div
                key={workspaceTab}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
                {(workspaceTab === 'all' || workspaceTab === 'charts') && (
                  <KprCharts
                    result={result}
                    bulanEkstra={params.bulanEkstra}
                    danaEkstra={params.danaEkstra}
                  />
                )}

                {(workspaceTab === 'all' || workspaceTab === 'table') && (
                  <AmortizationTable
                    result={result}
                    bulanEkstra={params.bulanEkstra}
                    danaEkstra={params.danaEkstra}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-10 no-print">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Simulator Cicilan KPR &amp; Kredit — Flat vs Floating
          </span>
          <span>
            Estimasi matematis sebelum biaya administrasi, provisi, asuransi, atau penalti bank.
          </span>
        </div>
      </footer>
    </div>
  );
}
