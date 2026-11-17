import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { motion, useReducedMotion } from 'framer-motion';
import { SimulationResult, formatRupiah } from '../utils/kprCalculator';

interface KprChartsProps {
  result: SimulationResult;
  bulanEkstra: number;
  danaEkstra: number;
}

export const KprCharts: React.FC<KprChartsProps> = ({
  result,
  bulanEkstra,
  danaEkstra,
}) => {
  const barCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const barChartRef = useRef<Chart | null>(null);
  const lineChartRef = useRef<Chart | null>(null);

  const [barMode, setBarMode] = useState<'normal' | 'extra'>('normal');
  const shouldReduceMotion = useReducedMotion();

  // 1. Stacked Bar Chart: Yearly Principal vs Interest
  useEffect(() => {
    const canvas = barCanvasRef.current;
    if (!canvas) return;

    if (barChartRef.current) {
      barChartRef.current.destroy();
      barChartRef.current = null;
    }

    const yearlyData = barMode === 'normal' ? result.yearlyNormal : result.yearlyExtra;
    const labels = yearlyData.map((y) => `Thn ${y.tahun}`);
    const pokokData = yearlyData.map((y) => Math.round(y.totalPokok));
    const bungaData = yearlyData.map((y) => Math.round(y.totalBunga));

    barChartRef.current = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Porsi Pokok',
            data: pokokData,
            backgroundColor: '#059669',
            borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 3, bottomRight: 3 },
            borderSkipped: false,
          },
          {
            label: 'Porsi Bunga',
            data: bungaData,
            backgroundColor: '#e11d48',
            borderRadius: { topLeft: 3, topRight: 3, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 240,
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              pointStyle: 'rectRounded',
              color: '#334155',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 12,
                weight: 600,
              },
            },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              family: "'Plus Jakarta Sans', sans-serif",
              size: 12,
              weight: 700,
            },
            bodyFont: {
              family: "'JetBrains Mono', monospace",
              size: 12,
            },
            callbacks: {
              title: (items) => {
                const idx = items[0]?.dataIndex ?? 0;
                const row = yearlyData[idx];
                if (!row) return '';
                return `Tahun ke-${row.tahun} (${row.faseDominan} · ${row.sukuBungaLabel})`;
              },
              label: (ctx) => {
                const val = Number(ctx.raw ?? 0);
                return ` ${ctx.dataset.label}: ${formatRupiah(val)}`;
              },
              afterBody: (items) => {
                const idx = items[0]?.dataIndex ?? 0;
                const row = yearlyData[idx];
                if (!row) return [];
                const total = row.totalPokok + row.totalBunga;
                const bungaShare = total > 0 ? ((row.totalBunga / total) * 100).toFixed(1) : '0.0';
                return [
                  ` Total Cicilan: ${formatRupiah(total)}`,
                  ` Rasio Bunga: ${bungaShare}% dari cicilan`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              display: false,
            },
            ticks: {
              color: '#64748b',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11,
              },
            },
          },
          y: {
            stacked: true,
            border: { display: false },
            grid: {
              color: '#f1f5f9',
            },
            ticks: {
              color: '#64748b',
              font: {
                family: "'JetBrains Mono', monospace",
                size: 11,
              },
              callback: (value) => formatRupiah(Number(value), true),
            },
          },
        },
      },
    });

    return () => {
      if (barChartRef.current) {
        barChartRef.current.destroy();
        barChartRef.current = null;
      }
    };
  }, [result, barMode]);

  // 2. Line Chart: Remaining Principal Normal vs Extra Payment
  useEffect(() => {
    const canvas = lineCanvasRef.current;
    if (!canvas) return;

    if (lineChartRef.current) {
      lineChartRef.current.destroy();
      lineChartRef.current = null;
    }

    const totalBulan = result.totalBulan;
    const labels: string[] = ['Bln 0'];
    const normalLine: (number | null)[] = [Math.round(result.pokokPinjaman)];
    const extraLine: (number | null)[] = [Math.round(result.pokokPinjaman)];

    for (let m = 1; m <= totalBulan; m++) {
      labels.push(`Bln ${m}`);
      const normRow = result.normalSchedule[m - 1];
      normalLine.push(normRow ? Math.round(normRow.sisaPokok) : 0);

      const extRow = result.extraSchedule[m - 1];
      if (extRow) {
        extraLine.push(Math.round(extRow.sisaPokok));
      } else {
        extraLine.push(0);
      }
    }

    lineChartRef.current = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Sisa Pokok — KPR Normal',
            data: normalLine,
            borderColor: '#0f172a',
            backgroundColor: 'rgba(15, 23, 42, 0.06)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.15,
            fill: true,
          },
          {
            label: 'Sisa Pokok — Dengan Pelunasan Sebagian',
            data: extraLine,
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.10)',
            borderWidth: 2.5,
            pointRadius: (ctx) => (ctx.dataIndex === bulanEkstra && danaEkstra > 0 ? 5 : 0),
            pointBackgroundColor: '#059669',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointHoverRadius: 5,
            tension: 0.1,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 240,
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 16,
              boxHeight: 2,
              color: '#334155',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 12,
                weight: 600,
              },
            },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              family: "'Plus Jakarta Sans', sans-serif",
              size: 12,
              weight: 700,
            },
            bodyFont: {
              family: "'JetBrains Mono', monospace",
              size: 12,
            },
            callbacks: {
              title: (items) => {
                const idx = items[0]?.dataIndex ?? 0;
                if (idx === 0) return 'Awal Kredit (Bulan ke-0)';
                const yr = Math.ceil(idx / 12);
                const suffix =
                  idx === bulanEkstra && danaEkstra > 0 ? ' · Setoran Dana Ekstra' : '';
                return `Bulan ke-${idx} (Tahun ke-${yr})${suffix}`;
              },
              label: (ctx) => {
                const val = Number(ctx.raw ?? 0);
                return ` ${ctx.dataset.label}: ${formatRupiah(val)}`;
              },
              afterBody: (items) => {
                const normVal = Number(items[0]?.raw ?? 0);
                const extVal = Number(items[1]?.raw ?? 0);
                const diff = normVal - extVal;
                if (diff > 0) {
                  return [` Selisih Sisa Pokok: -${formatRupiah(diff)}`];
                }
                return [];
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              maxTicksLimit: 10,
              color: '#64748b',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11,
              },
              callback: (_val, index) => {
                if (index === 0) return 'Bln 0';
                if (index % 12 === 0) return `Thn ${index / 12}`;
                return null;
              },
            },
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: {
              color: '#f1f5f9',
            },
            ticks: {
              color: '#64748b',
              font: {
                family: "'JetBrains Mono', monospace",
                size: 11,
              },
              callback: (value) => formatRupiah(Number(value), true),
            },
          },
        },
      },
    });

    return () => {
      if (lineChartRef.current) {
        lineChartRef.current.destroy();
        lineChartRef.current = null;
      }
    };
  }, [result, bulanEkstra, danaEkstra]);

  if (result.pokokPinjaman <= 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <p className="text-sm font-medium text-slate-700">
          Pokok pinjaman bernilai Rp 0 (DP 100%). Kurangi Uang Muka atau naikkan Harga Aset untuk melihat visualisasi grafik.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      id="grafik-analisis"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 xl:grid-cols-2 gap-5"
    >
      {/* Stacked Bar Chart */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 print-break-inside-avoid flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Porsi Pokok vs Bunga Tahunan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Komposisi cicilan yang mengurangi utang vs beban bunga.
            </p>
          </div>
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl self-start no-print relative">
            <button
              type="button"
              onClick={() => setBarMode('normal')}
              className={`relative px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer z-10 ${
                barMode === 'normal'
                  ? 'text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {barMode === 'normal' && (
                <motion.span
                  layoutId="chartBarToggle"
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                />
              )}
              Normal
            </button>
            <button
              type="button"
              onClick={() => setBarMode('extra')}
              className={`relative px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer z-10 ${
                barMode === 'extra'
                  ? 'text-emerald-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {barMode === 'extra' && (
                <motion.span
                  layoutId="chartBarToggle"
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                />
              )}
              Pelunasan
            </button>
          </div>
        </div>
        <div className="relative h-64 sm:h-72 w-full mt-auto">
          <canvas ref={barCanvasRef} />
        </div>
      </section>

      {/* Line Chart */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 print-break-inside-avoid flex flex-col">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Sisa Pokok Utang: Normal vs Pelunasan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {danaEkstra > 0
              ? `Setoran ekstra ${formatRupiah(danaEkstra, true)} di Bln ${bulanEkstra} mempercepat lunas.`
              : 'Tambahkan dana ekstra untuk melihat percepatan lunas.'}
          </p>
        </div>
      <div className="relative h-64 sm:h-72 w-full mt-auto">
          <canvas ref={lineCanvasRef} />
        </div>
      </section>
    </motion.div>
  );
};
