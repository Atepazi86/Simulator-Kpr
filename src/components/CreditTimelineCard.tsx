import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Flag, KeyRound, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { formatBulanToTahunBulan, formatRupiah } from '../utils/kprCalculator';

interface CreditTimelineCardProps {
  totalBulan: number;
  fixedMonths: number;
  tenorAkhirBulan: number;
  bulanDipangkas: number;
  bulanEkstra: number;
  danaEkstra: number;
  bungaDihemat: number;
  hasFloatingPeriod: boolean;
}

export const CreditTimelineCard: React.FC<CreditTimelineCardProps> = ({
  totalBulan,
  fixedMonths,
  tenorAkhirBulan,
  bulanDipangkas,
  bulanEkstra,
  danaEkstra,
  bungaDihemat,
  hasFloatingPeriod,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (totalBulan <= 0) return null;

  const fixedPct = Math.min(100, Math.max(0, (fixedMonths / totalBulan) * 100));
  const extraPct = Math.min(100, Math.max(0, (bulanEkstra / totalBulan) * 100));
  const payoffPct = Math.min(100, Math.max(4, (tenorAkhirBulan / totalBulan) * 100));

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 print-break-inside-avoid overflow-hidden relative"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-slate-900">
            Perjalanan Pelunasan Kredit Anda
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          {bulanDipangkas > 0
            ? `Selesai di Bulan ke-${tenorAkhirBulan} (lebih cepat ${formatBulanToTahunBulan(bulanDipangkas)})`
            : `Durasi penuh ${formatBulanToTahunBulan(totalBulan)} (${totalBulan} bulan)`}
        </span>
      </div>

      {/* Animated Timeline Track */}
      <div className="relative pt-7 pb-9 px-2">
        {/* Background Full Normal Tenor Track */}
        <div className="h-3 w-full rounded-full bg-slate-100 relative overflow-hidden">
          {/* Fixed Phase Segment */}
          {fixedPct > 0 && (
            <motion.div
              className="absolute left-0 top-0 bottom-0 bg-sky-400"
              initial={false}
              animate={{ width: `${Math.min(fixedPct, payoffPct)}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          )}

          {/* Floating Phase Segment (up to actual payoff) */}
          {payoffPct > fixedPct && (
            <motion.div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-indigo-500 to-emerald-500"
              initial={false}
              animate={{
                left: `${fixedPct}%`,
                width: `${Math.max(0, payoffPct - fixedPct)}%`,
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          )}

          {/* Shaved/Saved Tenor Striped Area */}
          {bulanDipangkas > 0 && (
            <motion.div
              className="absolute top-0 bottom-0 right-0 bg-emerald-100/90 border-l-2 border-dashed border-emerald-500"
              initial={false}
              animate={{ width: `${Math.max(0, 100 - payoffPct)}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
        </div>

        {/* Milestone 1: Start (Month 1) */}
        <div className="absolute left-2 top-8 flex flex-col items-start">
          <div className="w-3.5 h-3.5 -mt-0.5 rounded-full bg-sky-500 border-2 border-white shadow-xs" />
          <span className="mt-2 text-[11px] font-semibold text-slate-700 whitespace-nowrap">
            Mulai (Bln 1)
          </span>
        </div>

        {/* Milestone 2: Transition to Floating */}
        {hasFloatingPeriod && fixedMonths > 0 && fixedPct < 88 && (
          <motion.div
            className="absolute top-8 flex flex-col items-center -translate-x-1/2"
            initial={false}
            animate={{ left: `${Math.max(14, fixedPct)}%` }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-4 h-4 -mt-0.5 rounded-full bg-rose-500 border-2 border-white shadow-xs flex items-center justify-center" />
            <span className="mt-2 text-[11px] font-medium text-rose-600 whitespace-nowrap flex items-center gap-1">
              <TrendingUp className="w-3 h-3" aria-hidden="true" />
              Floating (Bln {fixedMonths + 1})
            </span>
          </motion.div>
        )}

        {/* Milestone 3: Extra Payment Marker (floating above track) */}
        {danaEkstra > 0 && extraPct > 5 && extraPct < 96 && (
          <motion.div
            className="absolute top-0 flex flex-col items-center -translate-x-1/2"
            initial={false}
            animate={{ left: `${extraPct}%` }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.span
              animate={shouldReduceMotion ? undefined : { y: [0, -2.5, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg whitespace-nowrap"
            >
              Ekstra {formatRupiah(danaEkstra, true)}
            </motion.span>
            <div className="w-0.5 h-2 bg-emerald-400" />
          </motion.div>
        )}

        {/* Milestone 4: Early Payoff Pin */}
        <motion.div
          className="absolute top-7 flex flex-col items-center -translate-x-1/2"
          initial={false}
          animate={{ left: `${Math.min(97, Math.max(12, payoffPct))}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={
              shouldReduceMotion || bulanDipangkas === 0
                ? undefined
                : { scale: [1, 1.12, 1] }
            }
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className={`w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
              bulanDipangkas > 0 ? 'bg-emerald-600' : 'bg-indigo-600'
            }`}
          >
            <Flag className="w-2.5 h-2.5 text-white" aria-hidden="true" />
          </motion.div>
          <span
            className={`mt-1.5 text-[11px] font-semibold whitespace-nowrap ${
              bulanDipangkas > 0 ? 'text-emerald-700' : 'text-indigo-700'
            }`}
          >
            Lunas Bln {tenorAkhirBulan}
          </span>
        </motion.div>

        {/* End Marker if shaved */}
        {bulanDipangkas > 0 && payoffPct < 88 && (
          <div className="absolute right-2 top-8 flex flex-col items-end">
            <div className="w-3 h-3 rounded-full bg-slate-300 border-2 border-white" />
            <span className="mt-2 text-[11px] text-slate-400 line-through whitespace-nowrap">
              Bln {totalBulan}
            </span>
          </div>
        )}
      </div>

      {/* Simple Legend Footer */}
      <div className="mt-1 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" />
            Masa Fixed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            Masa Floating
          </span>
          {bulanDipangkas > 0 && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              Tenor Terpangkas ({bulanDipangkas} bln)
            </span>
          )}
        </div>
        {bungaDihemat > 0 && (
          <span className="font-mono font-semibold text-emerald-700 tabular-nums">
            Hemat {formatRupiah(bungaDihemat)}
          </span>
        )}
      </div>
    </motion.section>
  );
};
