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

/** Sombra macia de contato sob móveis e objetos. */
function ContactShadow({ cx, cy, rx, opacity = 0.5 }: { cx: number; cy: number; rx: number; opacity?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.16} fill="url(#shadow-soft)" opacity={opacity} />;
}

/** Luminária de teto com cone de luz volumétrica. */
function CeilingLight({ cx, cone = "url(#cone-teal)", width = 34 }: { cx: number; cone?: string; width?: number }) {
  return (
    <g>
      <rect x={cx - 4} y="1.4" width="8" height="1.8" rx=".5" fill="#20262a" stroke="#31393d" strokeWidth=".2" />
      <rect x={cx - 3.2} y="2.9" width="6.4" height=".7" rx=".3" fill="#e8f4f2" opacity=".85" />
      <path d={`M ${cx - 3.2} 3.6 L ${cx - width / 2} 46 L ${cx + width / 2} 46 L ${cx + 3.2} 3.6 Z`} fill={cone} />
    </g>
  );
}

/** Tubos de ensaio com tampas coloridas, para prateleiras e racks. */
function TubeRack({ x, y, caps }: { x: number; y: number; caps: string[] }) {
  return (
    <g>
      <rect x={x} y={y + 1.6} width={caps.length * 1.5 + 1} height="1.6" rx=".3" fill="#252d30" stroke="#39434666" strokeWidth=".15" />
      {caps.map((cap, index) => (
        <g key={index}>
          <rect x={x + 0.7 + index * 1.5} y={y - 1.4} width=".9" height="3.2" rx=".4" fill="rgba(214,226,228,.5)" />
          <rect x={x + 0.6 + index * 1.5} y={y - 1.8} width="1.1" height=".8" rx=".25" fill={cap} />
        </g>
      ))}
    </g>
  );
}

/**
 * Fundos 2.5D das salas: estrutura comum (teto técnico, parede com painéis,
 * piso com juntas em fuga e reflexo) + mobiliário detalhado por sala, tudo
 * vetorial para continuar leve em celular.
 */
export function SceneBackdrop({ roomId }: { roomId: EscapeRoomId }) {
  return (
    <svg className="scene-svg" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#161c1f" /><stop offset=".55" stopColor="#101517" /><stop offset="1" stopColor="#080b0c" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2222" /><stop offset=".4" stopColor="#101616" /><stop offset="1" stopColor="#040606" />
        </linearGradient>
        <linearGradient id="ceiling" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#050707" /><stop offset="1" stopColor="#0d1214" />
        </linearGradient>
        <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4448" /><stop offset=".5" stopColor="#242d30" /><stop offset="1" stopColor="#161d1f" />
        </linearGradient>
        <linearGradient id="metal-lit" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2b3438" /><stop offset=".5" stopColor="#47555a" /><stop offset="1" stopColor="#232b2e" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgba(140,190,200,.16)" /><stop offset=".5" stopColor="rgba(70,110,120,.08)" /><stop offset="1" stopColor="rgba(140,190,200,.13)" />
        </linearGradient>
        <linearGradient id="screen-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c2126" /><stop offset="1" stopColor="#051013" />
        </linearGradient>
        <radialGradient id="shadow-soft" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="rgba(0,0,0,.75)" /><stop offset="1" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="spot-warm" cx="0.5" cy="0.3" r="0.7">
          <stop offset="0" stopColor="rgba(213,169,64,.30)" /><stop offset="1" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="spot-teal" cx="0.5" cy="0.3" r="0.7">
          <stop offset="0" stopColor="rgba(25,167,166,.28)" /><stop offset="1" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="spot-red" cx="0.5" cy="0.3" r="0.8">
          <stop offset="0" stopColor="rgba(167,16,23,.4)" /><stop offset="1" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="cone-teal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(160,220,215,.14)" /><stop offset="1" stopColor="rgba(160,220,215,0)" />
        </linearGradient>
        <linearGradient id="cone-warm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(228,190,110,.15)" /><stop offset="1" stopColor="rgba(228,190,110,0)" />
        </linearGradient>
        <linearGradient id="cone-red" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(223,48,53,.16)" /><stop offset="1" stopColor="rgba(223,48,53,0)" />
        </linearGradient>
        <linearGradient id="floor-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(120,170,170,.10)" /><stop offset="1" stopColor="transparent" />
        </linearGradient>
        <filter id="wall-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .05 0" />
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
        <linearGradient id="ao-left" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(0,0,0,.55)" /><stop offset="1" stopColor="transparent" />
        </linearGradient>
        <linearGradient id="ao-right" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="rgba(0,0,0,.55)" /><stop offset="1" stopColor="transparent" />
        </linearGradient>
        <radialGradient id="floor-pool" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="rgba(150,210,205,.12)" /><stop offset="1" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* estrutura comum: teto técnico, parede com painéis, piso em fuga */}
      <rect x="0" y="0" width="100" height="6" fill="url(#ceiling)" />
      <path d="M0 6 h100" stroke="#1e2629" strokeWidth=".3" />
      <rect x="0" y="6" width="100" height="40" fill="url(#wall)" />
      <rect x="0" y="6" width="100" height="40" filter="url(#wall-grain)" opacity=".6" />
      <path d="M20 6 v40 M50 6 v40 M80 6 v40" stroke="#1b2224" strokeWidth=".25" opacity=".8" />
      <path d="M0 42.6 h100" stroke="#232c2e" strokeWidth=".5" />
      <rect x="0" y="44.6" width="100" height="1.4" fill="#0c1112" />
      <rect x="0" y="46" width="100" height="16" fill="url(#floor)" />
      <rect x="0" y="46" width="100" height="8" fill="url(#floor-sheen)" />
      <line x1="0" y1="46" x2="100" y2="46" stroke="#2a3232" strokeWidth=".3" />
      <path d="M0 62 L16 46 M100 62 L84 46 M28 62 L37 46 M72 62 L63 46 M50 62 L50 46" stroke="#1c2322" strokeWidth=".2" />
      <path d="M8 50.5 h84 M17 56 h66" stroke="#1a2120" strokeWidth=".2" opacity=".8" />
      {/* infraestrutura do teto: tubulações, braçadeiras e um cabo pendente */}
      <path d="M0 3 h100" stroke="#20282c" strokeWidth="1.1" />
      <path d="M0 3 h100" stroke="#39444a" strokeWidth=".25" opacity=".7" />
      <path d="M0 4.8 h100" stroke="#161d20" strokeWidth=".7" />
      <path d="M12 2.4 v1.6 M34 2.4 v1.6 M68 2.4 v1.6 M90 2.4 v1.6" stroke="#39444a" strokeWidth=".45" />
      <path d="M74 3.4 q4 4.6 9 3.4" fill="none" stroke="#11181b" strokeWidth=".35" />
      {/* poeira em suspensão na luz */}
      <g className="dust-motes" opacity=".85">
        <circle cx="44" cy="16" r=".32" fill="rgba(220,240,235,.5)" />
        <circle cx="52" cy="24" r=".26" fill="rgba(220,240,235,.42)" style={{ animationDelay: "-1.6s" }} />
        <circle cx="48" cy="32" r=".38" fill="rgba(220,240,235,.36)" style={{ animationDelay: "-3.1s" }} />
        <circle cx="57" cy="14" r=".24" fill="rgba(220,240,235,.45)" style={{ animationDelay: "-4.4s" }} />
        <circle cx="40" cy="27" r=".22" fill="rgba(220,240,235,.4)" style={{ animationDelay: "-5.7s" }} />
        <circle cx="54" cy="37" r=".3" fill="rgba(220,240,235,.32)" style={{ animationDelay: "-6.9s" }} />
        <circle cx="46" cy="21" r=".2" fill="rgba(220,240,235,.45)" style={{ animationDelay: "-2.4s" }} />
      </g>
      {/* reflexo da luz principal no piso e oclusão dos cantos */}
      <ellipse cx="50" cy="49.5" rx="17" ry="2.6" fill="url(#floor-pool)" />
      <rect x="0" y="0" width="9" height="62" fill="url(#ao-left)" />
      <rect x="91" y="0" width="9" height="62" fill="url(#ao-right)" />

      {roomId === "R0" && (
        <g>
          <CeilingLight cx={50} cone="url(#cone-red)" width={40} />
          {/* porta de contenção dupla com batente e faixas de risco */}
          <rect x="34" y="10" width="32" height="36" rx="1" fill="#10161a" stroke="#2c3436" strokeWidth=".5" />
          <rect x="36" y="12" width="13.4" height="34" fill="url(#metal)" stroke="#333d40" strokeWidth=".3" />
          <rect x="50.6" y="12" width="13.4" height="34" fill="url(#metal)" stroke="#333d40" strokeWidth=".3" />
          <path d="M36 18 h13.4 M50.6 18 h13.4 M36 40 h13.4 M50.6 40 h13.4" stroke="#222b2e" strokeWidth=".3" />
          <circle cx="43" cy="16" r="1.6" fill="url(#glass)" stroke="#39464a" strokeWidth=".25" />
          <circle cx="57" cy="16" r="1.6" fill="url(#glass)" stroke="#39464a" strokeWidth=".25" />
          <path d="M34.6 44 h30.8" stroke="#d5a940" strokeWidth=".9" strokeDasharray="2.4 1.6" opacity=".55" />
          {/* leitor/painel da SENTINELA sobre a porta */}
          <rect x="46.6" y="24.5" width="6.8" height="11" rx=".6" className="r0-panel" fill="#1c090b" stroke="#df3035" strokeWidth=".35" />
          <rect x="47.4" y="25.4" width="5.2" height="5" rx=".3" fill="#2b0c0f" />
          <path d="M48 27 h4 M48 28.6 h3" stroke="#df3035" strokeWidth=".3" opacity=".8" />
          <circle cx="50" cy="32.6" r="1.15" className="r0-panel-light" fill="#df3035" />
          <ContactShadow cx={50} cy={47.4} rx={17} />
          {/* armário de EPI entreaberto com traje pendurado */}
          <rect x="68" y="17" width="19" height="30" rx=".8" fill="url(#metal)" stroke="#333d40" strokeWidth=".45" />
          <rect x="68.8" y="18" width="8.4" height="28" fill="#0c1213" stroke="#242e30" strokeWidth=".25" />
          <g transform="rotate(-14 78.4 18)">
            <rect x="78.4" y="18" width="8.4" height="28" fill="url(#metal-lit)" stroke="#333d40" strokeWidth=".25" />
            <circle cx="80" cy="32" r=".5" fill="#79878c" />
          </g>
          <path d="M71 20 q-.4 3 .4 4 l1.6 8 h2.4 l1.4 -8 q1 -1.4 .4 -4 l-2.6 -1 z" fill="#39525b" stroke="#57747d" strokeWidth=".3" />
          <path d="M72 22 v7 M74.6 22 v7" stroke="#2b3f46" strokeWidth=".3" />
          <circle cx="73.1" cy="18.4" r="1.1" fill="#2b3f46" stroke="#57747d" strokeWidth=".3" />
          <path d="M69.6 36 h6.6 M69.6 40.5 h6.6" stroke="#242e30" strokeWidth=".3" />
          <ContactShadow cx={77.5} cy={47.8} rx={11} />
          {/* mural de avisos e sinalização */}
          <rect x="8" y="15" width="17" height="21" rx=".5" fill="#11181a" stroke="#2a3436" strokeWidth=".4" />
          <rect x="9.4" y="16.4" width="6.4" height="8" fill="#d8d4c6" opacity=".85" transform="rotate(-2 9.4 16.4)" />
          <rect x="16.8" y="17" width="6.6" height="8.6" fill="#cfd6ce" opacity=".8" transform="rotate(2 16.8 17)" />
          <path d="M10.4 18.4 h4.4 M10.4 19.8 h3.4 M10.4 21.2 h4 M17.8 19 h4.4 M17.8 20.6 h3.6" stroke="#8b3034" strokeWidth=".3" opacity=".7" />
          <path d="M12 27.8 l2.6 4.6 h-5.2 z" fill="#2b2410" stroke="#d5a940" strokeWidth=".35" />
          <text x="16.5" y="34.6" textAnchor="middle" fontSize="1.9" fill="#5b6663" fontFamily="monospace">AVISOS LAGEM</text>
          <g className="r0-beacon"><ellipse cx="50" cy="6" rx="46" ry="18" fill="url(#spot-red)" /></g>
          <ellipse cx="16.5" cy="47.4" rx="9" ry="1.4" fill="url(#shadow-soft)" opacity=".35" />
        </g>
      )}

      {roomId === "R1" && (
        <g>
          <CeilingLight cx={22} cone="url(#cone-warm)" width={30} />
          <CeilingLight cx={76} cone="url(#cone-teal)" width={30} />
          {/* quadro branco com bandeja e anotações */}
          <rect x="5" y="11" width="30" height="22" rx=".7" fill="#e3e0d3" stroke="#9a978c" strokeWidth=".4" />
          <rect x="5.8" y="11.8" width="28.4" height="20.4" fill="#efece0" />
          <path d="M8.5 15.5 h13 M8.5 18.5 h17 M8.5 21.5 h10 M8.5 24.5 h15 M8.5 27.5 h8" stroke="#8b2c30" strokeWidth=".45" opacity=".6" />
          <path d="M24 22 q3 -2.6 6 0 q-3 2.6 -6 0" fill="none" stroke="#27585c" strokeWidth=".4" opacity=".65" />
          <rect x="10" y="33" width="20" height="1.1" rx=".4" fill="#b8b4a6" />
          <rect x="12" y="32.2" width="3" height=".8" rx=".3" fill="#8b2c30" />
          <rect x="16" y="32.2" width="3" height=".8" rx=".3" fill="#27585c" />
          {/* bancada com computador do prontuário e impressora */}
          <rect x="38" y="39.8" width="44" height="1.6" rx=".4" fill="url(#metal-lit)" stroke="#39434666" strokeWidth=".2" />
          <path d="M40 41.4 v5.4 M79 41.4 v5.4 M41 46.8 h39" stroke="#1c2426" strokeWidth=".8" />
          <rect x="41.5" y="28.5" width="13" height="10.4" rx=".6" fill="#10181a" stroke="#2b3538" strokeWidth=".35" />
          <rect x="42.3" y="29.3" width="11.4" height="8" rx=".3" fill="url(#screen-dark)" className="glow-teal" />
          <path d="M43.4 31 h8 M43.4 32.6 h6.4 M43.4 34.2 h7.2 M43.4 35.8 h5" stroke="#19a7a6" strokeWidth=".35" opacity=".75" />
          <rect x="46" y="38.9" width="4" height=".9" fill="#1a2224" />
          <rect x="44" y="39.4" width="8" height=".5" rx=".2" fill="#242e31" />
          {/* impressora com folha presa */}
          <rect x="63.5" y="34.6" width="15" height="5.4" rx=".9" fill="url(#metal)" stroke="#333d40" strokeWidth=".35" />
          <rect x="64.5" y="36" width="13" height="1.4" rx=".3" fill="#0c1213" />
          <rect x="66" y="31.8" width="9.6" height="3" fill="#ddd8ca" className="r1-paper" />
          <path d="M67 32.8 h7 M67 33.7 h5.4" stroke="#8b8676" strokeWidth=".25" />
          <circle cx="76.8" cy="35.6" r=".5" fill="#4be08a" opacity=".9" />
          <ContactShadow cx={60} cy={47.8} rx={22} opacity={0.4} />
          {/* janela de observação do paciente com monitor de sinais */}
          <rect x="84" y="9.5" width="14.5" height="24" rx=".7" fill="#0a1114" stroke="#26333a" strokeWidth=".45" />
          <rect x="85" y="10.5" width="12.5" height="22" fill="url(#glass)" />
          <path d="M86.5 32.5 q3 -7 5 -7.4 q4 -.4 5 2.4 l0 5" fill="#0d181d" opacity=".9" />
          <circle cx="92.6" cy="23.4" r="1.7" fill="#0d181d" opacity=".9" />
          <rect x="85.6" y="12" width="7.4" height="4.6" rx=".4" fill="url(#screen-dark)" stroke="#1c3a42" strokeWidth=".25" />
          <path className="r1-vitals" d="M86.4 14.4 h1.6 l.8 -1.6 l1 2.8 l.8 -1.4 h2" fill="none" stroke="#63a978" strokeWidth=".35" />
          {/* suporte de soro */}
          <path d="M80.5 24 v18.4 M78.6 25 h3.8 M79.2 24 q0 -1.4 1.3 -1.4 q1.3 0 1.3 1.4" fill="none" stroke="#4a565a" strokeWidth=".4" />
          <rect x="77.9" y="25.6" width="1.6" height="3" rx=".5" fill="rgba(190,220,225,.5)" stroke="#4a565a" strokeWidth=".2" />
          <ellipse cx="30" cy="8" rx="34" ry="14" fill="url(#spot-warm)" />
          <ellipse cx="82" cy="8" rx="26" ry="12" fill="url(#spot-teal)" />
        </g>
      )}

      {roomId === "R2" && (
        <g>
          <CeilingLight cx={49} cone="url(#cone-teal)" width={44} />
          {/* bancada principal contínua */}
          <rect x="28" y="40.2" width="70" height="1.8" rx=".4" fill="url(#metal-lit)" stroke="#39434666" strokeWidth=".2" />
          <path d="M31 42 v4.8 M64 42 v4.8 M94 42 v4.8" stroke="#1c2426" strokeWidth=".9" />
          <ContactShadow cx={62} cy={48} rx={30} opacity={0.4} />
          {/* microscópio detalhado: base, braço, platina, revólver e oculares */}
          <path d="M41 40.2 q-.6 -1.8 1.2 -2 l8.6 0 q1.8 .2 1.2 2 z" fill="#232c2f" stroke="#39464a" strokeWidth=".3" />
          <path d="M49.5 38.2 q2.4 -3.4 .8 -6.6 q-1.2 -2.6 -3.4 -3.2" fill="none" stroke="#2e393c" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="42.2" y="32.6" width="7.8" height="1" rx=".3" fill="#39464a" />
          <rect x="43.6" y="33.6" width="5" height=".7" fill="#232c2f" />
          <path d="M45.6 28.6 l1.6 0 l.6 2.6 l-2.8 0 z" fill="#2e393c" />
          <path d="M44.6 31.2 h4 M45.4 32 h2.4" stroke="#19a7a6" strokeWidth=".3" opacity=".7" />
          <rect x="45" y="24.6" width="2.6" height="3.6" rx=".5" transform="rotate(18 45 24.6)" fill="#2e393c" stroke="#414f53" strokeWidth=".2" />
          <circle cx="49.8" cy="30.4" r="1.35" fill="#1a2427" stroke="#d5a940" strokeWidth=".3" />
          <circle cx="44" cy="36.2" r="1" fill="#0e2a2c" stroke="#19a7a6" strokeWidth=".3" className="glow-teal" />
          {/* estante com as três lâminas */}
          <rect x="53.5" y="36.2" width="7.6" height="3.6" rx=".4" fill="#1a2225" stroke="#333d40" strokeWidth=".25" />
          <rect x="54.3" y="34.8" width="1.6" height="4.6" rx=".2" fill="rgba(205,225,230,.6)" stroke="#46565c" strokeWidth=".15" />
          <rect x="56.6" y="34.8" width="1.6" height="4.6" rx=".2" fill="rgba(205,225,230,.6)" stroke="#46565c" strokeWidth=".15" />
          <rect x="58.9" y="34.8" width="1.6" height="4.6" rx=".2" fill="rgba(205,225,230,.6)" stroke="#46565c" strokeWidth=".15" />
          <path d="M54.5 37.4 h1.2 M56.8 37.4 h1.2 M59.1 37.4 h1.2" stroke="#b8383f" strokeWidth=".5" opacity=".8" />
          {/* analisador hematológico com tela e alimentador */}
          <rect x="64.5" y="26" width="21" height="14.2" rx=".9" fill="url(#metal)" stroke="#333d40" strokeWidth=".4" />
          <rect x="66" y="27.6" width="10.4" height="7" rx=".4" fill="url(#screen-dark)" stroke="#1c3a42" strokeWidth=".25" />
          <path d="M67 29.4 h6 M67 31 h8 M67 32.6 h6.8" stroke="#4fc3f7" strokeWidth=".35" opacity=".65" />
          <path d="M77.6 28 h6.4 v5 h-6.4 z" fill="#0c1213" stroke="#242e30" strokeWidth=".25" />
          <TubeRack x={78} y={30.4} caps={["#c94f4c", "#8f6cc0", "#4fa7c9", "#c9a24f"]} />
          <rect x="66" y="36.2" width="18" height="2.6" rx=".4" fill="#12191b" />
          <circle cx="67.6" cy="37.5" r=".55" fill="#4be08a" /><circle cx="69.4" cy="37.5" r=".55" fill="#d5a940" />
          {/* geladeira de amostras com porta de vidro e racks */}
          <rect x="5" y="12" width="18" height="34.4" rx=".9" fill="url(#metal)" stroke="#333d40" strokeWidth=".5" />
          <rect x="6.4" y="13.6" width="15.2" height="26" rx=".5" fill="#081417" stroke="#26333a" strokeWidth=".3" />
          <rect x="6.4" y="13.6" width="15.2" height="26" fill="url(#glass)" />
          <path d="M7.2 20 h13.6 M7.2 26.5 h13.6 M7.2 33 h13.6" stroke="#1d2c31" strokeWidth=".35" />
          <TubeRack x={8} y={18.4} caps={["#c94f4c", "#c94f4c", "#4fa7c9"]} />
          <TubeRack x={8} y={24.9} caps={["#8f6cc0", "#c9a24f", "#c94f4c"]} />
          <TubeRack x={8} y={31.4} caps={["#4fa7c9", "#c94f4c"]} />
          <rect x="7" y="41" width="14" height="3.6" rx=".4" fill="#12191b" />
          <circle cx="14" cy="42.8" r="1.5" fill="#1c2224" stroke="#d5a940" strokeWidth=".35" className="r2-lock" />
          <text x="14" y="15.4" textAnchor="middle" fontSize="1.7" fill="#5f7076" fontFamily="monospace">AMOSTRAS</text>
          <ContactShadow cx={14} cy={47.6} rx={11} />
          {/* lâmpada UV e arquivo morto */}
          <path d="M27.5 9.4 v-1.4 M35.5 9.4 v-1.4" stroke="#333d40" strokeWidth=".5" />
          <rect x="26" y="9.4" width="11" height="1.7" rx=".8" fill="#191106" stroke="#8a6f2f" strokeWidth=".3" />
          <rect x="27.2" y="9.9" width="8.6" height=".7" rx=".35" fill="#d5a940" opacity=".65" />
          <path d="M27 11.4 L25.6 15.6 M31.5 11.4 L31.5 16 M36 11.4 L37.4 15.6" stroke="rgba(213,169,64,.22)" strokeWidth=".7" />
          <g transform="rotate(-10 86 56)">
            <rect x="86" y="54.4" width="12" height="4.6" rx=".4" fill="#1e2529" stroke="#333d40" strokeWidth=".3" />
            <path d="M86.8 56 h10.4" stroke="#151b1e" strokeWidth=".4" />
            <rect x="88" y="53.2" width="8" height="1.2" fill="#d0ccbc" opacity=".75" />
          </g>
          <ellipse cx="50" cy="6" rx="40" ry="14" fill="url(#spot-teal)" className="r2-flicker" />
        </g>
      )}

      {roomId === "R3" && (
        <g>
          <CeilingLight cx={50} cone="url(#cone-warm)" width={36} />
          <ellipse cx="50" cy="10" rx="30" ry="12" fill="url(#spot-warm)" />
          {/* modelo molecular suspenso: 4 subunidades com hastes e grupo heme */}
          <g className="r3-model">
            <path d="M50 6 v6.6" stroke="#4a5457" strokeWidth=".35" />
            <path d="M46 25.4 L53.6 23.6 M47.6 32.2 L55.4 30.4 M46.4 26.6 L48 31 M54.4 24.8 L55.8 29.2" stroke="#5b6669" strokeWidth=".5" />
            <circle cx="45.4" cy="25.6" r="4.6" fill="#3a1d20" stroke="#df3035" strokeWidth=".45" />
            <circle cx="43.8" cy="24" r="1.4" fill="rgba(255,255,255,.12)" />
            <circle cx="54.4" cy="23.6" r="4.6" fill="#12333a" stroke="#19a7a6" strokeWidth=".45" />
            <circle cx="52.8" cy="22" r="1.4" fill="rgba(255,255,255,.12)" />
            <circle cx="47.6" cy="32.6" r="4.6" fill="#12333a" stroke="#19a7a6" strokeWidth=".45" />
            <circle cx="46" cy="31" r="1.4" fill="rgba(255,255,255,.10)" />
            <circle cx="56.4" cy="30.6" r="4.6" fill="#3a1d20" stroke="#df3035" strokeWidth=".45" />
            <circle cx="54.8" cy="29" r="1.4" fill="rgba(255,255,255,.10)" />
            <circle cx="45.4" cy="25.6" r="1.1" fill="#d5a940" opacity=".9" />
            <circle cx="56.4" cy="30.6" r="1.1" fill="#d5a940" opacity=".9" />
          </g>
          {/* quadro-negro com giz e frase incompleta */}
          <rect x="4.5" y="11.5" width="25" height="21.5" rx=".6" fill="#3a2f24" stroke="#57493a" strokeWidth=".45" />
          <rect x="5.6" y="12.6" width="22.8" height="19.3" fill="#0e1412" stroke="#1e2a24" strokeWidth=".3" />
          <path d="M8 17 h10 M8 20.4 h14 M8 23.8 h11 M8 27.2 h8" stroke="#9fb8a8" strokeWidth=".4" opacity=".55" />
          <path d="M20 24.6 q1.6 -2 3.6 -.6" fill="none" stroke="#c9c3a8" strokeWidth=".35" opacity=".5" />
          <rect x="8" y="31.9" width="4" height=".7" rx=".3" fill="#d8d4c6" opacity=".7" />
          <rect x="13" y="31.9" width="2.6" height=".7" rx=".3" fill="#b8b4a6" opacity=".6" />
          {/* bancada com vidraria */}
          <rect x="31" y="43.4" width="48" height="1.8" rx=".4" fill="url(#metal-lit)" stroke="#39434666" strokeWidth=".2" />
          <path d="M34 45.2 v3.4 M76 45.2 v3.4" stroke="#1c2426" strokeWidth=".9" />
          <path d="M36.5 43.4 l1 -4.4 h2.6 l1 4.4 z" fill="rgba(190,220,225,.35)" stroke="#46565c" strokeWidth=".25" />
          <path d="M37.3 41.6 h3" stroke="#b8574f" strokeWidth="1.1" opacity=".7" />
          <rect x="43" y="40.2" width="1.9" height="3.2" rx=".3" fill="rgba(190,220,225,.35)" stroke="#46565c" strokeWidth=".2" />
          <path d="M43.2 42 h1.5" stroke="#4fa7c9" strokeWidth="1" opacity=".7" />
          <path d="M60.5 43.4 q-1.6 -2.4 0 -4 l4 0 q1.6 1.6 0 4 z" fill="rgba(190,220,225,.3)" stroke="#46565c" strokeWidth=".25" />
          <ContactShadow cx={55} cy={48.6} rx={22} opacity={0.4} />
          {/* balança de dois pratos */}
          <rect x="70.5" y="42.2" width="13" height="1.2" rx=".4" fill="#3a3220" stroke="#57493a" strokeWidth=".2" />
          <path d="M77 42.2 v-7.4 M71.6 36.4 h10.8" stroke="#8d7b45" strokeWidth=".55" />
          <path d="M72.6 36.6 l-1 3 q1.6 1.4 3.2 0 l-1 -3 M81.4 36.6 l-1 3 q1.6 1.4 3.2 0 l-1 -3" fill="none" stroke="#8d7b45" strokeWidth=".4" />
          <ellipse cx="73.2" cy="39.9" rx="1.9" ry=".5" fill="#6e6036" /><ellipse cx="80.8" cy="39.9" rx="1.9" ry=".5" fill="#6e6036" />
          <circle cx="77" cy="35.2" r=".8" fill="#a99552" />
          <ContactShadow cx={77} cy={47.4} rx={8} opacity={0.4} />
        </g>
      )}

      {roomId === "R4" && (
        <g>
          <rect x="0" y="6" width="100" height="40" fill="#0a1216" opacity=".85" />
          <CeilingLight cx={44} cone="url(#cone-teal)" width={30} />
          {/* rack de servidores ao fundo */}
          <rect x="22" y="12" width="8" height="30" rx=".5" fill="#0c1215" stroke="#22303a" strokeWidth=".35" />
          <path d="M23 15 h6 M23 18 h6 M23 21 h6 M23 24 h6 M23 27 h6 M23 30 h6 M23 33 h6 M23 36 h6" stroke="#182430" strokeWidth=".8" />
          <circle cx="28.2" cy="15" r=".4" fill="#4be08a" /><circle cx="28.2" cy="21" r=".4" fill="#d5a940" />
          <circle cx="28.2" cy="27" r=".4" fill="#4be08a" /><circle cx="28.2" cy="33" r=".4" fill="#df3035" />
          {/* mesa do terminal com monitor de alinhamento */}
          <rect x="32" y="40.6" width="26" height="1.6" rx=".4" fill="url(#metal-lit)" stroke="#39434666" strokeWidth=".2" />
          <path d="M34.5 42.2 v4.6 M55.5 42.2 v4.6" stroke="#161e24" strokeWidth=".9" />
          <rect x="33.5" y="26.5" width="23" height="14" rx=".8" fill="#0a1418" stroke="#204048" strokeWidth=".4" />
          <rect x="34.7" y="27.7" width="20.6" height="11" rx=".4" fill="#04140d" stroke="#155" strokeWidth=".3" />
          <g opacity=".85">
            <rect x="36" y="29.2" width="2.6" height="1.6" fill="#4fa7c9" /><rect x="38.8" y="29.2" width="2.6" height="1.6" fill="#4be08a" />
            <rect x="41.6" y="29.2" width="2.6" height="1.6" fill="#c9a24f" /><rect x="44.4" y="29.2" width="2.6" height="1.6" fill="#4be08a" />
            <rect x="36" y="31.4" width="2.6" height="1.6" fill="#4fa7c9" /><rect x="38.8" y="31.4" width="2.6" height="1.6" fill="#4be08a" />
            <rect x="41.6" y="31.4" width="2.6" height="1.6" fill="#df3035" /><rect x="44.4" y="31.4" width="2.6" height="1.6" fill="#4be08a" />
          </g>
          <path className="r4-seq" d="M36 35 h17 M36 36.8 h13 M36 38.4 h15" stroke="#4be08a" strokeWidth=".4" opacity=".75" />
          <rect x="42" y="41" width="7" height=".8" rx=".3" fill="#1a2430" />
          <ContactShadow cx={45} cy={47.8} rx={15} opacity={0.45} />
          {/* heredograma desenhado no vidro */}
          <rect x="61.5" y="11" width="34" height="25" rx=".8" fill="url(#glass)" stroke="#2a4a55" strokeWidth=".4" />
          <path d="M63 12.5 L70 11.2 M92 35 L95 33" stroke="rgba(190,230,240,.14)" strokeWidth=".8" />
          <g stroke="#9fc3cf" strokeWidth=".38" fill="none" opacity=".85">
            <rect x="68" y="15" width="3.2" height="3.2" /><circle cx="79.5" cy="16.6" r="1.8" />
            <path d="M71.2 16.6 h6.5 M74.4 16.6 v4.6 M67 21.2 h15 M67 21.2 v3 M74.4 21.2 v3 M82 21.2 v3" />
            <rect x="65.4" y="24.2" width="3.2" height="3.2" fill="#df3035" opacity=".75" />
            <circle cx="74.4" cy="25.8" r="1.8" /><rect x="80.4" y="24.2" width="3.2" height="3.2" />
            <circle cx="88.5" cy="16.6" r="1.8" fill="#df3035" opacity=".55" />
          </g>
          <text x="78.5" y="33.8" textAnchor="middle" fontSize="1.8" fill="#547684" fontFamily="monospace">FAMÍLIA A17</text>
          {/* interfone */}
          <rect x="7.5" y="20.5" width="9" height="11.5" rx=".7" fill="#10171a" stroke="#2b3335" strokeWidth=".4" />
          <rect x="8.6" y="21.6" width="6.8" height="4" rx=".4" fill="#0c1213" />
          <path d="M9.6 23 h4.8 M9.6 24.4 h3.6" stroke="#2e3d42" strokeWidth=".3" />
          <circle cx="12" cy="28.6" r="1.05" fill="#d5a940" opacity=".85" />
          <circle cx="12" cy="28.6" r="1.9" fill="none" stroke="#3a4348" strokeWidth=".25" />
          {/* freezer −80 °C com gelo e display */}
          <rect x="82" y="34" width="16" height="13.4" rx=".8" fill="url(#metal)" stroke="#28434b" strokeWidth=".45" />
          <rect x="83.2" y="35.2" width="13.6" height="8" rx=".4" fill="#0d1c22" stroke="#20363e" strokeWidth=".25" />
          <path d="M84 36 q2 1.6 3.6 .4 q2 -1.2 3.6 .2" fill="none" stroke="rgba(190,230,240,.25)" strokeWidth=".5" />
          <path d="M83.6 42.4 h5" stroke="rgba(190,230,240,.2)" strokeWidth=".8" />
          <rect x="91.4" y="44" width="5" height="2.2" rx=".3" fill="#03110c" stroke="#155" strokeWidth=".2" />
          <text x="93.9" y="45.7" textAnchor="middle" fontSize="1.7" fill="#4be08a" fontFamily="monospace">−80</text>
          <ContactShadow cx={90} cy={48.4} rx={10} />
          <ellipse cx="50" cy="4" rx="50" ry="16" fill="url(#spot-teal)" opacity=".8" />
        </g>
      )}

      {roomId === "R5" && (
        <g>
          <rect x="0" y="6" width="100" height="40" fill="#0c0a0a" />
          <CeilingLight cx={50} cone="url(#cone-warm)" width={26} />
          <ellipse cx="50" cy="10" rx="22" ry="26" fill="url(#spot-warm)" />
          {/* pilares laterais */}
          <rect x="10" y="6" width="7" height="40" fill="url(#metal)" stroke="#2c2620" strokeWidth=".3" opacity=".9" />
          <rect x="83" y="6" width="7" height="40" fill="url(#metal)" stroke="#2c2620" strokeWidth=".3" opacity=".9" />
          <path d="M10 14 h7 M10 38 h7 M83 14 h7 M83 38 h7" stroke="#1a1712" strokeWidth=".4" />
          {/* cofre monumental com dobradiças, parafusos e roda */}
          <g className="r5-safe">
            <rect x="33" y="12" width="34" height="34.4" rx="2.4" fill="#15181a" stroke="#3a4244" strokeWidth=".7" />
            <rect x="35" y="14" width="30" height="30.4" rx="1.6" fill="url(#metal)" stroke="#454f52" strokeWidth=".45" />
            <circle cx="37.4" cy="16.4" r=".55" fill="#5a6467" /><circle cx="62.6" cy="16.4" r=".55" fill="#5a6467" />
            <circle cx="37.4" cy="42" r=".55" fill="#5a6467" /><circle cx="62.6" cy="42" r=".55" fill="#5a6467" />
            <rect x="33.6" y="18" width="1.6" height="6" rx=".4" fill="#2a3134" /><rect x="33.6" y="34" width="1.6" height="6" rx=".4" fill="#2a3134" />
            <circle cx="50" cy="29" r="9.4" fill="#101415" stroke="#5a6467" strokeWidth=".7" />
            <circle cx="50" cy="29" r="7.4" fill="#0c1011" stroke="#3c4548" strokeWidth=".4" />
            <circle cx="50" cy="29" r="5.6" fill="none" stroke="#d5a940" strokeWidth=".4" strokeDasharray="1 1.35" />
            <path d="M50 22.4 v3.4 M50 32.2 v3.4 M43.4 29 h3.4 M53.2 29 h3.4 M45.4 24.4 l2.2 2.2 M52.4 31.4 l2.2 2.2 M54.6 24.4 l-2.2 2.2 M47.6 31.4 l-2.2 2.2" stroke="#8a9396" strokeWidth=".5" />
            <circle cx="50" cy="29" r="1.4" fill="#d5a940" opacity=".85" />
            <rect x="45" y="39" width="10" height="2.6" rx=".4" fill="#0c0f10" stroke="#3c4548" strokeWidth=".3" />
            <text x="50" y="41" textAnchor="middle" fontSize="1.8" fill="#8a6f2f" fontFamily="monospace">DIAGNÓSTICO</text>
          </g>
          <ContactShadow cx={50} cy={48} rx={19} opacity={0.6} />
          {/* faixa de contagem no piso */}
          <path d="M22 52 h56" stroke="rgba(223,48,53,.35)" strokeWidth="1" strokeDasharray="3 2" />
          <ellipse cx="50" cy="58" rx="30" ry="4" className="r5-countdown-glow" fill="url(#spot-red)" />
        </g>
      )}
    </svg>
  );
}
