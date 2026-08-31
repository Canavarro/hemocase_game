/**
 * Transição de sala: as portas de contenção se abrem, uma silhueta atravessa
 * o vão e a luz da próxima sala toma a tela. Puro SVG + CSS (leve, sem vídeo).
 * `back` inverte a leitura (revisão de sala já visitada, em âmbar).
 */
export function DoorTransition({ roomName, back }: { roomName: string; back: boolean }) {
  return (
    <div className={`door-transition ${back ? "door-transition--back" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="dt-panel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b3438" /><stop offset=".5" stopColor="#1a2225" /><stop offset="1" stopColor="#10161a" />
          </linearGradient>
          <radialGradient id="dt-glow" cx=".5" cy=".5" r=".65">
            <stop offset="0" stopColor="rgba(190,240,232,.95)" /><stop offset=".55" stopColor="rgba(70,190,180,.5)" /><stop offset="1" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="dt-glow-back" cx=".5" cy=".5" r=".65">
            <stop offset="0" stopColor="rgba(240,220,170,.95)" /><stop offset=".55" stopColor="rgba(213,169,64,.5)" /><stop offset="1" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="dt-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#12181a" /><stop offset="1" stopColor="#050707" />
          </linearGradient>
        </defs>

        {/* corredor escuro */}
        <rect x="0" y="0" width="100" height="46" fill="#0a0e10" />
        <rect x="0" y="46" width="100" height="16" fill="url(#dt-floor)" />
        <path d="M0 62 L20 46 M100 62 L80 46" stroke="#1a2120" strokeWidth=".25" />

        {/* luz da próxima sala vazando pelo vão */}
        <g className="dt-light">
          <rect x="49" y="12" width="2" height="33" fill={back ? "url(#dt-glow-back)" : "url(#dt-glow)"} />
          <ellipse cx="50" cy="46.5" rx="14" ry="2.6" fill={back ? "url(#dt-glow-back)" : "url(#dt-glow)"} opacity=".8" />
        </g>

        {/* batente e portas de contenção deslizantes */}
        <rect x="31.5" y="9" width="37" height="37.6" rx="1.2" fill="none" stroke="#39434a" strokeWidth="1.6" />
        <g className="dt-door dt-door--left">
          <rect x="33" y="10.5" width="17" height="34.6" fill="url(#dt-panel)" stroke="#404b52" strokeWidth=".35" />
          <path d="M35 16 h13 M35 40 h13" stroke="#222b2f" strokeWidth=".4" />
          <circle cx="42" cy="14" r="1.4" fill="#0d1417" stroke="#4a565c" strokeWidth=".3" />
          <path d="M33.6 44 h15.8" stroke="#d5a940" strokeWidth=".8" strokeDasharray="2 1.4" opacity=".5" />
        </g>
        <g className="dt-door dt-door--right">
          <rect x="50" y="10.5" width="17" height="34.6" fill="url(#dt-panel)" stroke="#404b52" strokeWidth=".35" />
          <path d="M52 16 h13 M52 40 h13" stroke="#222b2f" strokeWidth=".4" />
          <circle cx="58" cy="14" r="1.4" fill="#0d1417" stroke="#4a565c" strokeWidth=".3" />
          <path d="M50.6 44 h15.8" stroke="#d5a940" strokeWidth=".8" strokeDasharray="2 1.4" opacity=".5" />
        </g>

        {/* silhueta caminhando pelo vão (vista de costas) */}
        <g className="dt-walker">
          <ellipse cx="0" cy="0.6" rx="4.2" ry=".9" fill="rgba(0,0,0,.55)" />
          <g className="dt-leg dt-leg--a"><rect x="-1.9" y="-5.4" width="1.7" height="6" rx=".8" fill="#0b0f11" /></g>
          <g className="dt-leg dt-leg--b"><rect x="0.2" y="-5.4" width="1.7" height="6" rx=".8" fill="#0d1214" /></g>
          <path d="M -2.5 -14.6 q 2.5 -1.6 5 0 l -0.4 9.4 q -2.1 1 -4.2 0 z" fill="#0c1113" stroke="rgba(25,167,166,.35)" strokeWidth=".22" />
          <g className="dt-arm dt-arm--a"><rect x="-3.3" y="-14" width="1.3" height="7.4" rx=".65" fill="#0b0f11" /></g>
          <g className="dt-arm dt-arm--b"><rect x="2" y="-14" width="1.3" height="7.4" rx=".65" fill="#0d1214" /></g>
          <circle cx="0" cy="-17" r="2.3" fill="#0c1113" stroke="rgba(25,167,166,.35)" strokeWidth=".22" />
        </g>

        {/* clarão final que revela a sala */}
        <rect className="dt-flash" x="0" y="0" width="100" height="62" fill={back ? "rgba(240,220,170,.9)" : "rgba(200,240,234,.9)"} />
      </svg>
      <span className="door-transition__label">{back ? "Revendo" : "Entrando"}: {roomName}</span>
    </div>
  );
}
