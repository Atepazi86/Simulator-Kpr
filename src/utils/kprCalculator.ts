export interface SimulationParams {
  hargaAset: number;
  dpPercent: number;
  tenorTahun: number;
  bungaFixed: number;
  masaFixedTahun: number;
  bungaFloating: number;
  bungaFlat: number;
  danaEkstra: number;
  bulanEkstra: number;
}

export interface MonthlyRow {
  bulan: number;
  tahun: number;
  fase: 'Fixed' | 'Floating';
  sukuBunga: number; // % p.a.
  cicilan: number;
  pokok: number;
  bunga: number;
  ekstra: number;
  sisaPokok: number;
}

export interface YearlyRow {
  tahun: number;
  bulanRange: string;
  faseDominan: 'Fixed' | 'Floating' | 'Transisi';
  sukuBungaLabel: string;
  totalCicilan: number;
  totalPokok: number;
  totalBunga: number;
  totalEkstra: number;
  sisaPokokAkhir: number;
}

export interface SimulationResult {
  pokokPinjaman: number;
  uangMukaNominal: number;
  totalBulan: number;
  fixedMonths: number;
  hasFloatingPeriod: boolean;

  // Fixed -> Floating Normal
  cicilanFixed: number;
  cicilanFloating: number;
  kenaikanCicilanNominal: number;
  kenaikanCicilanPersen: number;
  totalBungaNormal: number;
  totalBayarNormal: number;
  normalSchedule: MonthlyRow[];
  yearlyNormal: YearlyRow[];

  // Flat comparison
  cicilanFlat: number;
  pokokFlatPerBulan: number;
  bungaFlatPerBulan: number;
  totalBungaFlat: number;
  totalBayarFlat: number;
  flatEquivalentEffectiveRate: number;

  // Extra payment simulation
  extraSchedule: MonthlyRow[];
  yearlyExtra: YearlyRow[];
  tenorAkhirBulan: number;
  bulanDipangkas: number;
  totalBungaExtra: number;
  bungaDihemat: number;
  totalBayarExtra: number;
  actualExtraApplied: number;
  sisaPokokSebelumEkstra: number;
  sisaPokokSetelahEkstra: number;
}

export const DEFAULT_PARAMS: SimulationParams = {
  hargaAset: 500_000_000,
  dpPercent: 20,
  tenorTahun: 15,
  bungaFixed: 5.0,
  masaFixedTahun: 3,
  bungaFloating: 11.5,
  bungaFlat: 6.5,
  danaEkstra: 50_000_000,
  bulanEkstra: 36,
};

export function formatRupiah(value: number, compact = false): string {
  const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
  if (compact) {
    const abs = Math.abs(safeValue);
    const sign = safeValue < 0 ? '-' : '';
    if (abs >= 1_000_000_000) {
      return `${sign}Rp ${(abs / 1_000_000_000).toLocaleString('id-ID', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      })} M`;
    }
    if (abs >= 1_000_000) {
      return `${sign}Rp ${(abs / 1_000_000).toLocaleString('id-ID', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} Jt`;
    }
  }
  return `Rp ${safeValue.toLocaleString('id-ID')}`;
}

export function formatNumber(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
  return safeValue.toLocaleString('id-ID');
}

export function formatPercent(value: number, decimals = 2): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

export function formatBulanToTahunBulan(totalBulan: number): string {
  const months = Math.max(0, Math.round(totalBulan));
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years > 0 && rem > 0) {
    return `${years} Tahun ${rem} Bulan`;
  }
  if (years > 0) {
    return `${years} Tahun`;
  }
  return `${rem} Bulan`;
}

export function calculatePMT(principal: number, monthlyRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  if (monthlyRate <= 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * Finds the annual effective interest rate (%) equivalent to a given Flat monthly payment.
 */
function solveEffectiveRateFromFlat(
  principal: number,
  totalMonths: number,
  flatMonthlyPayment: number
): number {
  if (principal <= 0 || totalMonths <= 0 || flatMonthlyPayment <= principal / totalMonths) {
    return 0;
  }
  let low = 0;
  let high = 1.5; // 150% annual rate upper bound
  for (let i = 0; i < 48; i++) {
    const mid = (low + high) / 2;
    const pmt = calculatePMT(principal, mid / 12, totalMonths);
    if (pmt > flatMonthlyPayment) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return ((low + high) / 2) * 100;
}

function aggregateYearly(schedule: MonthlyRow[]): YearlyRow[] {
  const map = new Map<number, MonthlyRow[]>();
  for (const row of schedule) {
    const list = map.get(row.tahun);
    if (list) {
      list.push(row);
    } else {
      map.set(row.tahun, [row]);
    }
  }

  const yearly: YearlyRow[] = [];
  for (const [tahun, rows] of map.entries()) {
    const firstMonth = rows[0].bulan;
    const lastMonth = rows[rows.length - 1].bulan;
    const hasFixed = rows.some((r) => r.fase === 'Fixed');
    const hasFloating = rows.some((r) => r.fase === 'Floating');

    let faseDominan: YearlyRow['faseDominan'] = 'Fixed';
    if (hasFixed && hasFloating) {
      faseDominan = 'Transisi';
    } else if (hasFloating) {
      faseDominan = 'Floating';
    }

    const rates = Array.from(new Set(rows.map((r) => r.sukuBunga)));
    const sukuBungaLabel =
      rates.length === 1
        ? `${rates[0].toFixed(2).replace('.', ',')}%`
        : `${rates[0].toFixed(2).replace('.', ',')}% → ${rates[rates.length - 1]
            .toFixed(2)
            .replace('.', ',')}%`;

    yearly.push({
      tahun,
      bulanRange: firstMonth === lastMonth ? `Bln ${firstMonth}` : `Bln ${firstMonth}–${lastMonth}`,
      faseDominan,
      sukuBungaLabel,
      totalCicilan: rows.reduce((acc, r) => acc + r.cicilan, 0),
      totalPokok: rows.reduce((acc, r) => acc + r.pokok, 0),
      totalBunga: rows.reduce((acc, r) => acc + r.bunga, 0),
      totalEkstra: rows.reduce((acc, r) => acc + r.ekstra, 0),
      sisaPokokAkhir: rows[rows.length - 1].sisaPokok,
    });
  }

  return yearly;
}

export function runKprSimulation(raw: SimulationParams): SimulationResult {
  const hargaAset = Math.max(0, raw.hargaAset);
  const dpPercent = Math.min(95, Math.max(0, raw.dpPercent));
  const tenorTahun = Math.min(25, Math.max(1, Math.round(raw.tenorTahun)));
  const masaFixedTahun = Math.min(tenorTahun, Math.max(0, Math.round(raw.masaFixedTahun)));
  const bungaFixed = Math.max(0, raw.bungaFixed);
  const bungaFloating = Math.max(0, raw.bungaFloating);
  const bungaFlat = Math.max(0, raw.bungaFlat);
  const danaEkstra = Math.max(0, raw.danaEkstra);

  const totalBulan = tenorTahun * 12;
  const fixedMonths = Math.min(masaFixedTahun * 12, totalBulan);
  const hasFloatingPeriod = fixedMonths < totalBulan;
  const bulanEkstra = Math.min(totalBulan, Math.max(1, Math.round(raw.bulanEkstra)));

  const uangMukaNominal = (hargaAset * dpPercent) / 100;
  const pokokPinjaman = Math.max(0, hargaAset - uangMukaNominal);

  const rFixed = bungaFixed / 100 / 12;
  const rFloat = bungaFloating / 100 / 12;

  // 1. Normal KPR Fixed -> Floating Schedule
  const cicilanFixed =
    fixedMonths > 0
      ? calculatePMT(pokokPinjaman, rFixed, totalBulan)
      : calculatePMT(pokokPinjaman, rFloat, totalBulan);

  let balanceNormal = pokokPinjaman;
  let cicilanFloating = cicilanFixed;
  let floatingCalculated = fixedMonths === 0;
  const normalSchedule: MonthlyRow[] = [];

  for (let m = 1; m <= totalBulan; m++) {
    const isFixed = m <= fixedMonths;
    const rateAnnual = isFixed ? bungaFixed : bungaFloating;
    const monthlyRate = isFixed ? rFixed : rFloat;

    if (!isFixed && !floatingCalculated) {
      const remMonths = totalBulan - fixedMonths;
      cicilanFloating = calculatePMT(balanceNormal, rFloat, remMonths);
      floatingCalculated = true;
    }

    const targetPayment = isFixed ? cicilanFixed : cicilanFloating;
    const bunga = balanceNormal * monthlyRate;
    let pokok = Math.min(balanceNormal, Math.max(0, targetPayment - bunga));
    if (m === totalBulan) {
      pokok = balanceNormal;
    }
    const cicilan = pokok + bunga;
    balanceNormal = Math.max(0, balanceNormal - pokok);
    if (balanceNormal < 1) balanceNormal = 0;

    normalSchedule.push({
      bulan: m,
      tahun: Math.ceil(m / 12),
      fase: isFixed ? 'Fixed' : 'Floating',
      sukuBunga: rateAnnual,
      cicilan,
      pokok,
      bunga,
      ekstra: 0,
      sisaPokok: balanceNormal,
    });
  }

  const totalBungaNormal = normalSchedule.reduce((sum, r) => sum + r.bunga, 0);
  const totalBayarNormal = pokokPinjaman + totalBungaNormal;

  const kenaikanCicilanNominal = hasFloatingPeriod ? cicilanFloating - cicilanFixed : 0;
  const kenaikanCicilanPersen =
    hasFloatingPeriod && cicilanFixed > 0 ? (kenaikanCicilanNominal / cicilanFixed) * 100 : 0;

  // 2. Flat Scheme Comparison
  const pokokFlatPerBulan = totalBulan > 0 ? pokokPinjaman / totalBulan : 0;
  const bungaFlatPerBulan = (pokokPinjaman * (bungaFlat / 100)) / 12;
  const cicilanFlat = pokokFlatPerBulan + bungaFlatPerBulan;
  const totalBungaFlat = bungaFlatPerBulan * totalBulan;
  const totalBayarFlat = pokokPinjaman + totalBungaFlat;
  const flatEquivalentEffectiveRate = solveEffectiveRateFromFlat(
    pokokPinjaman,
    totalBulan,
    cicilanFlat
  );

  // 3. Extra Payment Simulation (Shorten Tenor / Pangkas Tenor)
  const extraSchedule: MonthlyRow[] = [];
  let balanceExtra = pokokPinjaman;
  let actualExtraApplied = 0;
  let sisaPokokSebelumEkstra = 0;
  let sisaPokokSetelahEkstra = 0;

  if (pokokPinjaman > 0) {
    for (let m = 1; m <= totalBulan; m++) {
      if (balanceExtra <= 0) break;

      const isFixed = m <= fixedMonths;
      const rateAnnual = isFixed ? bungaFixed : bungaFloating;
      const monthlyRate = isFixed ? rFixed : rFloat;

      // Maintain normal benchmark installment to shorten tenor
      const benchmarkInstallment = isFixed ? cicilanFixed : cicilanFloating;
      const bunga = balanceExtra * monthlyRate;
      let pokok = Math.min(balanceExtra, Math.max(0, benchmarkInstallment - bunga));

      // Guard against tiny floating precision or final month
      if (m === totalBulan && balanceExtra - pokok < 5) {
        pokok = balanceExtra;
      }

      const cicilan = pokok + bunga;
      let nextBalance = Math.max(0, balanceExtra - pokok);
      if (nextBalance < 1) nextBalance = 0;

      let ekstra = 0;
      if (m === bulanEkstra && danaEkstra > 0) {
        sisaPokokSebelumEkstra = nextBalance;
        if (nextBalance > 0) {
          ekstra = Math.min(danaEkstra, nextBalance);
          nextBalance = Math.max(0, nextBalance - ekstra);
          if (nextBalance < 1) nextBalance = 0;
        }
        actualExtraApplied = ekstra;
        sisaPokokSetelahEkstra = nextBalance;
      }

      balanceExtra = nextBalance;

      extraSchedule.push({
        bulan: m,
        tahun: Math.ceil(m / 12),
        fase: isFixed ? 'Fixed' : 'Floating',
        sukuBunga: rateAnnual,
        cicilan,
        pokok,
        bunga,
        ekstra,
        sisaPokok: balanceExtra,
      });

      if (balanceExtra === 0) break;
    }
  }

  const tenorAkhirBulan = extraSchedule.length;
  const bulanDipangkas = pokokPinjaman > 0 ? Math.max(0, totalBulan - tenorAkhirBulan) : 0;
  const totalBungaExtra = extraSchedule.reduce((sum, r) => sum + r.bunga, 0);
  const bungaDihemat = Math.max(0, totalBungaNormal - totalBungaExtra);
  const totalBayarExtra = pokokPinjaman + totalBungaExtra;

  return {
    pokokPinjaman,
    uangMukaNominal,
    totalBulan,
    fixedMonths,
    hasFloatingPeriod,

    cicilanFixed,
    cicilanFloating,
    kenaikanCicilanNominal,
    kenaikanCicilanPersen,
    totalBungaNormal,
    totalBayarNormal,
    normalSchedule,
    yearlyNormal: aggregateYearly(normalSchedule),

    cicilanFlat,
    pokokFlatPerBulan,
    bungaFlatPerBulan,
    totalBungaFlat,
    totalBayarFlat,
    flatEquivalentEffectiveRate,

    extraSchedule,
    yearlyExtra: aggregateYearly(extraSchedule),
    tenorAkhirBulan,
    bulanDipangkas,
    totalBungaExtra,
    bungaDihemat,
    totalBayarExtra,
    actualExtraApplied,
    sisaPokokSebelumEkstra,
    sisaPokokSetelahEkstra,
  };
}

export function exportScheduleToCsv(
  rows: MonthlyRow[],
  mode: 'normal' | 'extra',
  viewMode: 'monthly' | 'yearly',
  yearlyRows: YearlyRow[]
): void {
  const BOM = '\uFEFF';
  let csvContent = '';

  if (viewMode === 'monthly') {
    const headers = [
      'Bulan ke-',
      'Tahun ke-',
      'Fase',
      'Suku Bunga (%)',
      'Cicilan Bulanan (Rp)',
      'Porsi Pokok (Rp)',
      'Porsi Bunga (Rp)',
      ...(mode === 'extra' ? ['Setoran Ekstra (Rp)'] : []),
      'Sisa Pokok Utang (Rp)',
    ];
    const lines = rows.map((r) => [
      r.bulan,
      r.tahun,
      r.fase,
      r.sukuBunga.toFixed(2),
      Math.round(r.cicilan),
      Math.round(r.pokok),
      Math.round(r.bunga),
      ...(mode === 'extra' ? [Math.round(r.ekstra)] : []),
      Math.round(r.sisaPokok),
    ]);
    csvContent = [headers.join(','), ...lines.map((l) => l.join(','))].join('\n');
  } else {
    const headers = [
      'Tahun ke-',
      'Rentang Bulan',
      'Fase',
      'Suku Bunga (%)',
      'Total Cicilan Tahunan (Rp)',
      'Total Pokok (Rp)',
      'Total Bunga (Rp)',
      ...(mode === 'extra' ? ['Setoran Ekstra (Rp)'] : []),
      'Sisa Pokok Akhir Tahun (Rp)',
    ];
    const lines = yearlyRows.map((r) => [
      r.tahun,
      `"${r.bulanRange}"`,
      r.faseDominan,
      `"${r.sukuBungaLabel}"`,
      Math.round(r.totalCicilan),
      Math.round(r.totalPokok),
      Math.round(r.totalBunga),
      ...(mode === 'extra' ? [Math.round(r.totalEkstra)] : []),
      Math.round(r.sisaPokokAkhir),
    ]);
    csvContent = [headers.join(','), ...lines.map((l) => l.join(','))].join('\n');
  }

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `amortisasi-kpr-${mode === 'extra' ? 'pelunasan-ekstra' : 'normal'}-${viewMode}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
