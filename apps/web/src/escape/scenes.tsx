import type { EscapeRoomId } from "@hemocase/shared";

/** Posição dos objetos interativos em cada cena (percentuais da viewport da cena). */
export interface SceneSpot { x: number; y: number; w: number; h: number; label: string }

export const sceneSpots: Record<EscapeRoomId, Record<string, SceneSpot>> = {
  R0: {
    "armario-epi": { x: 70, y: 38, w: 20, h: 34, label: "Armário de EPI" },
    "painel-sentinela": { x: 40, y: 30, w: 20, h: 26, label: "Painel da SENTINELA" },
  },
  R1: {
    "impressora": { x: 66, y: 56, w: 16, h: 16, label: "Impressora" },
    "quadro-branco": { x: 8, y: 22, w: 26, h: 32, label: "Quadro branco" },
  },
  R2: {
    "microscopio": { x: 40, y: 34, w: 18, h: 30, label: "Microscópio" },
    "analisador": { x: 66, y: 30, w: 22, h: 28, label: "Analisador hematológico" },
    "geladeira": { x: 6, y: 20, w: 18, h: 52, label: "Geladeira de amostras" },
    "arquivo-morto": { x: 88, y: 62, w: 10, h: 16, label: "Arquivo morto" },
  },
  R3: {
    "modelo-molecular": { x: 38, y: 18, w: 24, h: 36, label: "Modelo molecular" },
    "quadro-negro": { x: 6, y: 20, w: 22, h: 32, label: "Quadro-negro" },
    "balanca": { x: 76, y: 48, w: 16, h: 22, label: "Balança de dois pratos" },
  },
  R4: {
    "terminal": { x: 34, y: 32, w: 22, h: 28, label: "Terminal de alinhamento" },
    "heredograma": { x: 64, y: 20, w: 28, h: 32, label: "Heredograma no vidro" },
    "interfone": { x: 8, y: 34, w: 10, h: 16, label: "Interfone" },
    "freezer": { x: 84, y: 58, w: 14, h: 26, label: "Freezer −80 °C" },
  },
  R5: {
    "cofre": { x: 34, y: 26, w: 32, h: 46, label: "Cofre do Diagnóstico" },
  },
};

/** Fundos 2.5D estilizados de cada sala. Camadas com data-depth ganham parallax via CSS vars. */
export function SceneBackdrop({ roomId }: { roomId: EscapeRoomId }) {
  return (
    <svg className="scene-svg" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#101416" /><stop offset="1" stopColor="#070909" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#131a1a" /><stop offset="1" stopColor="#050606" />
        </linearGradient>
        <radialGradient id="spotWarm" cx="0.5" cy="0.3" r="0.7">
          <stop offset="0" stopColor="rgba(213,169,64,.32)" /><stop offset="1" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="spotTeal" cx="0.5" cy="0.3" r="0.7">
          <stop offset="0" stopColor="rgba(25,167,166,.3)" /><stop offset="1" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="spotRed" cx="0.5" cy="0.3" r="0.8">
          <stop offset="0" stopColor="rgba(167,16,23,.4)" /><stop offset="1" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* estrutura comum: parede, rodapé e piso em fuga */}
      <rect x="0" y="0" width="100" height="46" fill="url(#wall)" />
      <rect x="0" y="46" width="100" height="16" fill="url(#floor)" />
      <line x1="0" y1="46" x2="100" y2="46" stroke="#232827" strokeWidth=".25" />
      <path d="M0 62 L14 46 M100 62 L86 46 M30 62 L36 46 M70 62 L64 46" stroke="#1b201f" strokeWidth=".2" />

      {roomId === "R0" && (
        <g>
          <rect x="36" y="14" width="28" height="32" rx="1" fill="#151a1c" stroke="#2c3436" strokeWidth=".4" />
          <rect x="47" y="26" width="6" height="10" rx=".6" className="r0-panel" fill="#20090b" stroke="#df3035" strokeWidth=".3" />
          <circle cx="50" cy="29" r="1.1" className="r0-panel-light" fill="#df3035" />
          <rect x="68" y="20" width="18" height="26" rx=".8" fill="#12181a" stroke="#2c3436" strokeWidth=".4" />
          <rect x="69.5" y="21.5" width="7" height="23" fill="#0d1213" stroke="#233" strokeWidth=".2" transform="rotate(-8 69.5 21.5)" />
          <rect x="8" y="18" width="16" height="20" rx=".5" fill="#101617" stroke="#26302f" strokeWidth=".35" />
          <text x="16" y="24" textAnchor="middle" fontSize="2.1" fill="#5b6663" fontFamily="monospace">AVISOS LAGEM</text>
          <g className="r0-beacon"><ellipse cx="50" cy="6" rx="46" ry="18" fill="url(#spotRed)" /></g>
        </g>
      )}

      {roomId === "R1" && (
        <g>
          <rect x="36" y="40" width="42" height="7" rx=".6" fill="#141a1b" stroke="#2b3335" strokeWidth=".35" />
          <rect x="40" y="30" width="12" height="9" rx=".5" fill="#0b1d22" stroke="#19a7a6" strokeWidth=".3" className="glow-teal" />
          <path d="M42 32 h8 M42 34 h6 M42 36 h7" stroke="#19a7a6" strokeWidth=".35" opacity=".7" />
          <rect x="64" y="34" width="14" height="7" rx=".8" fill="#161c1d" stroke="#2b3335" strokeWidth=".35" />
          <rect x="66" y="32.4" width="9" height="2" fill="#d8d4c8" className="r1-paper" />
          <rect x="6" y="12" width="28" height="20" rx=".6" fill="#dfdccf" opacity=".92" />
          <path d="M9 16 h14 M9 19 h18 M9 22 h11 M9 25 h16" stroke="#8b2c30" strokeWidth=".5" opacity=".65" />
          <rect x="72" y="10" width="24" height="22" rx=".6" fill="#0a1114" stroke="#233" strokeWidth=".4" />
          <path className="r1-vitals" d="M74 21 h4 l2 -5 l3 9 l2 -4 h9" fill="none" stroke="#63a978" strokeWidth=".45" />
          <ellipse cx="30" cy="8" rx="34" ry="14" fill="url(#spotWarm)" />
          <ellipse cx="82" cy="8" rx="26" ry="12" fill="url(#spotTeal)" />
          <path d="M52 47 l6 9 l-13 0 z" fill="#10201e" opacity=".5" />
        </g>
      )}

      {roomId === "R2" && (
        <g>
          <rect x="30" y="42" width="66" height="6" rx=".5" fill="#151b1c" stroke="#2b3335" strokeWidth=".35" />
          <path d="M44 40 q1 -8 5 -8 q-6 -2 -4 -8 l3 0 q-1 5 4 6 q5 2 4 10 z" fill="#1d2527" stroke="#3a4547" strokeWidth=".3" />
          <circle cx="47" cy="24" r="1.5" fill="#0e2a2c" stroke="#19a7a6" strokeWidth=".3" className="glow-teal" />
          <rect x="64" y="28" width="20" height="12" rx=".8" fill="#0c161c" stroke="#2b3335" strokeWidth=".4" />
          <path d="M66 32 h6 M66 34 h9 M66 36 h7" stroke="#4fc3f7" strokeWidth=".35" opacity=".6" />
          <rect x="5" y="14" width="17" height="32" rx=".8" fill="#12181a" stroke="#2b3335" strokeWidth=".45" />
          <rect x="7" y="17" width="13" height="10" fill="#0b2124" stroke="#1c4548" strokeWidth=".25" />
          <circle cx="13.5" cy="34" r="1.6" fill="#1c2224" stroke="#d5a940" strokeWidth=".35" className="r2-lock" />
          <rect x="86" y="58" width="12" height="4" transform="rotate(-12 86 58)" fill="#20262a" stroke="#333" strokeWidth=".25" />
          <rect x="26" y="10" width="10" height="3" rx=".4" fill="#1a1206" stroke="#d5a940" strokeWidth=".25" opacity=".8" />
          <ellipse cx="50" cy="6" rx="40" ry="14" fill="url(#spotTeal)" className="r2-flicker" />
        </g>
      )}

      {roomId === "R3" && (
        <g>
          <ellipse cx="50" cy="10" rx="30" ry="12" fill="url(#spotWarm)" />
          <g className="r3-model">
            <circle cx="45" cy="26" r="4.5" fill="#3a1d20" stroke="#df3035" strokeWidth=".4" />
            <circle cx="54" cy="24" r="4.5" fill="#12333a" stroke="#19a7a6" strokeWidth=".4" />
            <circle cx="47" cy="33" r="4.5" fill="#12333a" stroke="#19a7a6" strokeWidth=".4" />
            <circle cx="56" cy="31" r="4.5" fill="#3a1d20" stroke="#df3035" strokeWidth=".4" />
            <path d="M50 12 v8" stroke="#40484a" strokeWidth=".3" />
          </g>
          <rect x="5" y="13" width="24" height="20" rx=".5" fill="#0e1412" stroke="#2b332f" strokeWidth=".4" />
          <path d="M8 18 h9 M8 22 h14 M8 26 h11" stroke="#9fb8a8" strokeWidth=".35" opacity=".55" />
          <path d="M76 56 l0 -8 M70 50 h12 M70 50 q-3 4 0 5 q3 1 3 -5 M82 50 q3 4 0 5 q-3 1 -3 -5" stroke="#8d7b45" strokeWidth=".5" fill="none" />
          <rect x="32" y="44" width="46" height="5" rx=".5" fill="#141a1b" stroke="#2b3335" strokeWidth=".35" />
          <rect x="60" y="40" width="14" height="4" rx=".4" fill="#0d1a20" stroke="#26454f" strokeWidth=".3" />
        </g>
      )}

      {roomId === "R4" && (
        <g>
          <rect x="0" y="0" width="100" height="46" fill="#0a1216" opacity=".85" />
          <rect x="32" y="30" width="24" height="12" rx=".6" fill="#04140d" stroke="#155" strokeWidth=".35" />
          <path className="r4-seq" d="M34 34 h18 M34 36.5 h14 M34 39 h17" stroke="#4be08a" strokeWidth=".4" opacity=".75" />
          <rect x="62" y="14" width="32" height="24" rx=".6" fill="#0c1a20" stroke="#2a4a55" strokeWidth=".35" opacity=".9" />
          <g stroke="#9fc3cf" strokeWidth=".35" fill="none" opacity=".8">
            <rect x="68" y="18" width="3" height="3" /><circle cx="78" cy="19.5" r="1.6" />
            <path d="M71 19.5 h5 M73.5 21.5 v4 M69 25.5 h9" />
            <rect x="66" y="27" width="3" height="3" fill="#df3035" opacity=".7" /><circle cx="80" cy="28.5" r="1.6" />
          </g>
          <rect x="6" y="30" width="8" height="12" rx=".6" fill="#10171a" stroke="#2b3335" strokeWidth=".35" />
          <circle cx="10" cy="34" r="1" fill="#d5a940" opacity=".8" />
          <rect x="82" y="50" width="16" height="12" rx=".6" fill="#0d1418" stroke="#28434b" strokeWidth=".4" />
          <text x="90" y="57" textAnchor="middle" fontSize="2.4" fill="#507a8c" fontFamily="monospace">−80 °C</text>
          <ellipse cx="50" cy="4" rx="50" ry="16" fill="url(#spotTeal)" opacity=".8" />
        </g>
      )}

      {roomId === "R5" && (
        <g>
          <rect x="0" y="0" width="100" height="46" fill="#0c0a0a" />
          <ellipse cx="50" cy="10" rx="22" ry="26" fill="url(#spotWarm)" />
          <g className="r5-safe">
            <rect x="36" y="16" width="28" height="30" rx="2" fill="#191d1f" stroke="#40484a" strokeWidth=".6" />
            <circle cx="50" cy="30" r="8" fill="#101415" stroke="#5a6467" strokeWidth=".6" />
            <circle cx="50" cy="30" r="5.4" fill="none" stroke="#d5a940" strokeWidth=".35" strokeDasharray="1 1.4" />
            <path d="M50 25 v3 M50 32 v3 M45 30 h3 M52 30 h3" stroke="#8a9396" strokeWidth=".4" />
          </g>
          <rect x="8" y="14" width="12" height="16" rx=".5" fill="#12100e" stroke="#3a2f22" strokeWidth=".3" opacity=".8" />
          <rect x="80" y="14" width="12" height="16" rx=".5" fill="#12100e" stroke="#3a2f22" strokeWidth=".3" opacity=".8" />
          <ellipse cx="50" cy="58" rx="30" ry="4" className="r5-countdown-glow" fill="url(#spotRed)" />
        </g>
      )}
    </svg>
  );
}
