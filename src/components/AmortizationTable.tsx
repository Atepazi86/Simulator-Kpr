import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Download, Printer } from 'lucide-react';
import {
  SimulationResult,
  exportScheduleToCsv,
  formatPercent,
  formatRupiah,
} from '../utils/kprCalculator';

interface AmortizationTableProps {
  result: SimulationResult;
  bulanEkstra: number;
  danaEkstra: number;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  result,
  bulanEkstra,
  danaEkstra,
}) => {
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly');
  const [scheduleMode, setScheduleMode] = useState<'normal' | 'extra'>('normal');
  const shouldReduceMotion = useReducedMotion();

  const monthlyRows =
    scheduleMode === 'normal' ? result.normalSchedule : result.extraSchedule;
  const yearlyRows =
    scheduleMode === 'normal' ? result.yearlyNormal : result.yearlyExtra;

  const showExtraCol = scheduleMode === 'extra' && danaEkstra > 0;

  const handleDownloadCsv = () => {
    exportScheduleToCsv(monthlyRows, scheduleMode, viewMode, yearlyRows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section
      id="tabel-amortisasi"
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
    >
      {/* Header & Controls */}
      <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Tabel Amortisasi Kredit
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Rincian angsuran, pokok, bunga, dan sisa utang{' '}
              {viewMode === 'yearly'
                ? `(${yearlyRows.length} tahun)`
                : `(${monthlyRows.length} bulan)`}
              .
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap items-center gap-2.5 no-print">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Unduh Tabel (.CSV)
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              Cetak / Simpan PDF
            </button>
          </div>
        </div>

        {/* Segmented Filters with Framer Motion layoutId */}
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl relative">
            <button
              type="button"
              onClick={() => setViewMode('yearly')}
              className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer z-10 ${
                viewMode === 'yearly'
                  ? 'text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {viewMode === 'yearly' && (
                <motion.span
                  layoutId="tableViewToggle"
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                />
              )}
              Tampilkan Per Tahun
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer z-10 ${
                viewMode === 'monthly'
                  ? 'text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {viewMode === 'monthly' && (
                <motion.span
                  layoutId="tableViewToggle"
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                />
              )}
              Tampilkan Semua Bulan
            </button>
          </div>

          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl relative">
            <button
              type="button"
              onClick={() => setScheduleMode('normal')}
              className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer z-10 ${
                scheduleMode === 'normal'
                  ? 'text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {scheduleMode === 'normal' && (
                <motion.span
                  layoutId="tableScheduleToggle"
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                />
              )}
              KPR Normal
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode('extra')}
              className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer z-10 ${
                scheduleMode === 'extra'
                  ? 'text-emerald-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {scheduleMode === 'extra' && (
                <motion.span
                  layoutId="tableScheduleToggle"
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                />
              )}
              Dengan Pelunasan Sebagian
            </button>
          </div>
        </div>
      </div>

      {/* Table Viewport */}
      {result.pokokPinjaman <= 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          Tidak ada jadwal amortisasi karena Pokok Pinjaman bernilai Rp 0.
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${viewMode}-${scheduleMode}`}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-x-auto max-h-[540px] overflow-y-auto print-table-expand"
          >
            <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">
                  {viewMode === 'yearly' ? 'Tahun ke-' : 'Bulan ke-'}
                </th>
                <th className="py-3 px-4 whitespace-nowrap text-right">
                  Suku Bunga Berlaku (%)
                </th>
                <th className="py-3 px-4 whitespace-nowrap text-right">
                  {viewMode === 'yearly' ? 'Total Cicilan' : 'Cicilan Bulanan'}
                </th>
                <th className="py-3 px-4 whitespace-nowrap text-right">
                  Porsi Pokok
                </th>
                <th className="py-3 px-4 whitespace-nowrap text-right">
                  Porsi Bunga
                </th>
                {showExtraCol && (
                  <th className="py-3 px-4 whitespace-nowrap text-right">
                    Setoran Ekstra
                  </th>
                )}
                <th className="py-3 px-4 whitespace-nowrap text-right">
                  Sisa Pokok Utang
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {viewMode === 'yearly'
                ? yearlyRows.map((row) => {
                    const hasExtraThisYear = row.totalEkstra > 0;
                    const isTransition = row.faseDominan === 'Transisi';
                    return (
                      <tr
                        key={row.tahun}
                        className={`transition-colors hover:bg-slate-50/90 ${
                          hasExtraThisYear ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 tabular-nums">
                            Tahun {row.tahun}
                          </div>
                          <div className="text-xs text-slate-500">
                            {row.bulanRange} ·{' '}
                            <span
                              className={
                                row.faseDominan === 'Floating'
                                  ? 'text-rose-600 font-medium'
                                  : isTransition
                                  ? 'text-amber-700 font-medium'
                                  : 'text-slate-600'
                              }
                            >
                              {row.faseDominan}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums text-slate-700">
                          {row.sukuBungaLabel}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums font-medium text-slate-900">
                          {formatRupiah(row.totalCicilan)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums text-emerald-600 font-medium">
                          {formatRupiah(row.totalPokok)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums text-rose-600 font-medium">
                          {formatRupiah(row.totalBunga)}
                        </td>
                        {showExtraCol && (
                          <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums text-emerald-700 font-semibold">
                            {row.totalEkstra > 0 ? formatRupiah(row.totalEkstra) : '—'}
                          </td>
                        )}
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums font-semibold text-slate-900">
                          {formatRupiah(row.sisaPokokAkhir)}
                        </td>
                      </tr>
                    );
                  })
                : monthlyRows.map((row) => {
                    const isTransitionMonth =
                      result.hasFloatingPeriod && row.bulan === result.fixedMonths + 1;
                    const isExtraMonth =
                      scheduleMode === 'extra' &&
                      row.bulan === bulanEkstra &&
                      row.ekstra > 0;
                    return (
                      <tr
                        key={row.bulan}
                        className={`transition-colors hover:bg-slate-50/90 ${
                          isExtraMonth
                            ? 'bg-emerald-50/50'
                            : isTransitionMonth
                            ? 'bg-rose-50/40'
                            : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold tabular-nums text-slate-900">
                              Bulan {row.bulan}
                            </span>
                            <span className="text-xs text-slate-500">
                              ·{' '}
                              <span
                                className={
                                  row.fase === 'Floating'
                                    ? 'text-rose-600 font-medium'
                                    : 'text-slate-600'
                                }
                              >
                                {row.fase}
                              </span>
                              {isTransitionMonth && (
                                <span className="text-rose-600 font-semibold">
                                  {' '}
                                  · Awal Floating
                                </span>
                              )}
                              {isExtraMonth && (
                                <span className="text-emerald-700 font-semibold">
                                  {' '}
                                  · Setoran Ekstra
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-right font-mono tabular-nums text-slate-700">
                          {formatPercent(row.sukuBunga)}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-right font-mono tabular-nums font-medium text-slate-900">
                          {formatRupiah(row.cicilan)}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-right font-mono tabular-nums text-emerald-600 font-medium">
                          {formatRupiah(row.pokok)}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-right font-mono tabular-nums text-rose-600 font-medium">
                          {formatRupiah(row.bunga)}
                        </td>
                        {showExtraCol && (
                          <td className="py-2.5 px-4 whitespace-nowrap text-right font-mono tabular-nums text-emerald-700 font-semibold">
                            {row.ekstra > 0 ? formatRupiah(row.ekstra) : '—'}
                          </td>
                        )}
                        <td className="py-2.5 px-4 whitespace-nowrap text-right font-mono tabular-nums font-semibold text-slate-900">
                          {formatRupiah(row.sisaPokok)}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
};
