import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { formatBulanToTahunBulan, formatRupiah } from '../utils/kprCalculator';

interface HouseHeroSceneProps {
  hargaAset: number;
  dpPercent: number;
  pokokPinjaman: number;
  bulanDipangkas: number;
  bungaDihemat: number;
  danaEkstra: number;
  assetType: 'house' | 'family' | 'car';
}

export const HouseHeroScene: React.FC<HouseHeroSceneProps> = ({
  hargaAset,
  dpPercent,
  pokokPinjaman,
  bulanDipangkas,
  bungaDihemat,
  danaEkstra,
  assetType,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const dpWidth = Math.min(100, Math.max(0, dpPercent));
  const loanWidth = 100 - dpWidth;

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-sky-50 via-indigo-50/70 to-emerald-50 border border-sky-200/80 p-5 overflow-hidden">
      {/* Subtle Ambient Floating Blobs */}
      {!shouldReduceMotion && (
        <>
          <motion.div
            aria-hidden="true"
            animate={{ x: [0, 14, 0], y: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-amber-200/35 blur-2xl pointer-events-none"
          />
          <motion.div
            aria-hidden="true"
            animate={{ x: [0, -12, 0], y: [0, 8, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-emerald-200/40 blur-2xl pointer-events-none"
          />
        </>
      )}

      {/* Animated SVG Landscape + House / Car Scene */}
      <div className="relative h-48 sm:h-52 w-full flex items-center justify-center">
        <svg
          viewBox="0 0 440 200"
          className="w-full h-full max-w-[440px] overflow-visible"
          role="img"
          aria-label="Ilustrasi animasi rumah dan pembiayaan kredit"
        >
          <defs>
            <linearGradient id="skyGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#ecfdf5" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="roofGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
            <linearGradient id="carGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>

          {/* Soft sky backdrop ellipse */}
          <ellipse cx="220" cy="118" rx="195" ry="76" fill="url(#skyGlow)" />

          {/* Distant Soft Hills */}
          <path
            d="M32 166 Q110 124 190 158 Q285 118 395 162 L395 174 L32 174 Z"
            fill="#d1fae5"
            opacity="0.7"
          />

          {/* Rising Sun with Rotating Rays */}
          <motion.g
            animate={
              shouldReduceMotion
                ? undefined
                : { scale: [1, 1.07, 1], opacity: [0.92, 1, 0.92] }
            }
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '355px 46px' }}
          >
            <circle cx="355" cy="46" r="26" fill="#fde68a" opacity="0.5" />
            <circle cx="355" cy="46" r="16" fill="#fbbf24" />
          </motion.g>

          {/* Drifting Cloud 1 */}
          <motion.g
            animate={shouldReduceMotion ? undefined : { x: [-10, 14, -10] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M46 52 C46 44, 56 39, 64 43 C68 35, 83 35, 87 44 C95 43, 102 49, 100 56 L49 56 C46 56, 46 54, 46 52 Z"
              fill="#ffffff"
              opacity="0.95"
            />
          </motion.g>

          {/* Drifting Cloud 2 */}
          <motion.g
            animate={shouldReduceMotion ? undefined : { x: [12, -12, 12] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M258 34 C258 28, 266 24, 272 27 C276 21, 288 21, 291 28 C298 27, 303 32, 301 38 L260 38 C258 38, 258 36, 258 34 Z"
              fill="#ffffff"
              opacity="0.88"
            />
          </motion.g>

          {/* Animated Flying Birds */}
          <motion.g
            animate={
              shouldReduceMotion
                ? undefined
                : { x: [0, 18, 0], y: [0, -6, 0] }
            }
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M126 44 Q131 39 136 44 Q141 39 146 44"
              fill="none"
              stroke="#64748b"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M148 34 Q152 30 156 34 Q160 30 164 34"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </motion.g>

          {/* Floating Gold Savings Coin when Extra Payment > 0 */}
          {danaEkstra > 0 && (
            <motion.g
              animate={
                shouldReduceMotion
                  ? undefined
                  : { y: [0, -7, 0], rotate: [-4, 4, -4] }
              }
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '108px 80px' }}
            >
              <circle cx="108" cy="80" r="14" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="108" cy="80" r="9.5" fill="none" stroke="#fef3c7" strokeWidth="1.2" />
              <text
                x="108"
                y="84"
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill="#78350f"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                Rp
              </text>
            </motion.g>
          )}

          {/* Rolling Green Ground */}
          <path
            d="M24 170 Q135 152 225 164 Q325 174 414 162 L414 182 L24 182 Z"
            fill="#a7f3d0"
          />
          <rect x="36" y="168" width="368" height="10" rx="5" fill="#34d399" opacity="0.45" />

          {/* Left Swaying Tree */}
          <motion.g
            animate={shouldReduceMotion ? undefined : { rotate: [-1.8, 1.8, -1.8] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '78px 168px' }}
          >
            <rect x="75" y="136" width="6" height="32" rx="3" fill="#92400e" />
            <circle cx="78" cy="124" r="20" fill="#10b981" />
            <circle cx="67" cy="131" r="13" fill="#059669" />
            <circle cx="89" cy="130" r="13" fill="#34d399" />
          </motion.g>

          {/* Right Bush / Tree */}
          <motion.g
            animate={shouldReduceMotion ? undefined : { rotate: [1.5, -1.5, 1.5] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '362px 168px' }}
          >
            <rect x="359" y="142" width="5" height="26" rx="2.5" fill="#92400e" />
            <circle cx="362" cy="132" r="16" fill="#059669" />
            <circle cx="372" cy="137" r="11" fill="#34d399" />
          </motion.g>

          {/* Main Animated House */}
          <motion.g
            key={assetType}
            initial={shouldReduceMotion ? false : { scale: 0.92, y: 8, opacity: 0.8 }}
            animate={shouldReduceMotion ? undefined : { scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: '220px 168px' }}
          >
            {/* Chimney + Gentle Smoke */}
            <rect x="252" y="60" width="16" height="28" rx="3" fill="#475569" />
            <motion.circle
              cx="260"
              cy="50"
              r="5"
              fill="#ffffff"
              opacity="0.75"
              animate={
                shouldReduceMotion
                  ? undefined
                  : { y: [0, -16, -25], x: [0, 5, 10], opacity: [0.75, 0.45, 0], scale: [0.8, 1.3, 1.7] }
              }
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.circle
              cx="263"
              cy="46"
              r="4"
              fill="#ffffff"
              opacity="0.6"
              animate={
                shouldReduceMotion
                  ? undefined
                  : { y: [0, -14, -22], x: [0, -3, 4], opacity: [0.6, 0.35, 0], scale: [0.7, 1.2, 1.5] }
              }
              transition={{ duration: 3.2, delay: 1.5, repeat: Infinity, ease: 'easeOut' }}
            />

            {/* House Base Body */}
            <rect
              x={assetType === 'family' ? 136 : 150}
              y="98"
              width={assetType === 'family' ? 168 : 140}
              height="70"
              rx="6"
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth="2"
            />

            {/* Side Annex for Family Home */}
            {assetType === 'family' && (
              <rect
                x="256"
                y="118"
                width="48"
                height="50"
                rx="4"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
            )}

            {/* Roof */}
            <path
              d={
                assetType === 'family'
                  ? 'M126 102 L220 46 L314 102 Z'
                  : 'M140 102 L220 50 L300 102 Z'
              }
              fill="url(#roofGrad)"
            />
            <path
              d={
                assetType === 'family'
                  ? 'M126 102 L220 46 L314 102'
                  : 'M140 102 L220 50 L300 102'
              }
              fill="none"
              stroke="#be123c"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Attic Window */}
            <circle cx="220" cy="79" r="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />

            {/* Warm Glowing Windows */}
            <motion.rect
              x={assetType === 'family' ? 152 : 165}
              y="116"
              width="28"
              height="24"
              rx="4"
              fill="#fde68a"
              stroke="#f59e0b"
              strokeWidth="1.8"
              animate={shouldReduceMotion ? undefined : { opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <line
              x1={assetType === 'family' ? 166 : 179}
              y1="116"
              x2={assetType === 'family' ? 166 : 179}
              y2="140"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
            <line
              x1={assetType === 'family' ? 152 : 165}
              y1="128"
              x2={assetType === 'family' ? 180 : 193}
              y2="128"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />

            <motion.rect
              x={assetType === 'family' ? 224 : 247}
              y="116"
              width="28"
              height="24"
              rx="4"
              fill="#fde68a"
              stroke="#f59e0b"
              strokeWidth="1.8"
              animate={shouldReduceMotion ? undefined : { opacity: [1, 0.85, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <line
              x1={assetType === 'family' ? 238 : 261}
              y1="116"
              x2={assetType === 'family' ? 238 : 261}
              y2="140"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />

            {/* Front Door */}
            <rect
              x={assetType === 'family' ? 189 : 206}
              y="124"
              width="26"
              height="44"
              rx="4"
              fill="#4f46e5"
            />
            <circle
              cx={assetType === 'family' ? 210 : 227}
              cy="146"
              r="2.2"
              fill="#fde68a"
            />
          </motion.g>

          {/* Animated Compact Car */}
          <motion.g
            animate={
              shouldReduceMotion
                ? undefined
                : assetType === 'car'
                ? { x: [-6, 12, -6] }
                : { y: [0, -1.5, 0] }
            }
            transition={{
              duration: assetType === 'car' ? 2.4 : 3.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <path
              d="M286 162 L293 149 Q296 145 302 145 L323 145 Q329 145 333 150 L341 162 Z"
              fill="url(#carGrad)"
            />
            <rect x="281" y="156" width="66" height="12" rx="5" fill="#0284c7" />
            <path
              d="M296 155 L300 148 L322 148 L328 155 Z"
              fill="#e0f2fe"
            />
            <circle cx="297" cy="168" r="6" fill="#0f172a" />
            <circle cx="297" cy="168" r="2.5" fill="#cbd5e1" />
            <circle cx="331" cy="168" r="6" fill="#0f172a" />
            <circle cx="331" cy="168" r="2.5" fill="#cbd5e1" />
          </motion.g>
        </svg>
      </div>

      {/* Interactive Asset Progress Strip */}
      <div className="relative mt-2 bg-white/95 backdrop-blur-sm border border-white rounded-xl p-3.5 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">
            Struktur Pembiayaan ({formatRupiah(hargaAset, true)})
          </span>
          {danaEkstra > 0 && bulanDipangkas > 0 ? (
            <span className="font-semibold text-emerald-700">
              Hemat {formatBulanToTahunBulan(bulanDipangkas)} · {formatRupiah(bungaDihemat, true)}
            </span>
          ) : (
            <span className="font-mono font-semibold text-slate-800 tabular-nums">
              DP {dpPercent}% · Kredit {(100 - dpPercent).toFixed(0)}%
            </span>
          )}
        </div>

        {/* Visual DP vs Loan bar */}
        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
          <motion.div
            className="h-full bg-emerald-500"
            initial={false}
            animate={{ width: `${dpWidth}%` }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            title={`Uang Muka: ${dpPercent}%`}
          />
          <motion.div
            className="h-full bg-indigo-500"
            initial={false}
            animate={{ width: `${loanWidth}%` }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            title={`Pokok Pinjaman: ${formatRupiah(pokokPinjaman)}`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            Uang Muka {dpPercent}%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            Pinjaman Bank {formatRupiah(pokokPinjaman, true)}
          </span>
        </div>
      </div>
    </div>
  );
};
