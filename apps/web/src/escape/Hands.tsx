export type HandGesture = "idle" | "reach" | "grab" | "type";

/** Mãos do personagem em primeira pessoa, sobrepostas na base da cena. */
export function Hands({ gesture }: { gesture: HandGesture }) {
  return (
    <div className={`fp-hands fp-hands--${gesture}`} aria-hidden="true">
      <svg viewBox="0 0 200 90" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="glove" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d7a79" /><stop offset="1" stopColor="#0d4a4a" />
          </linearGradient>
        </defs>
        {/* mão esquerda */}
        <g className="hand hand--left">
          <path d="M45 90 q-4 -26 6 -34 q4 -3 8 -1 l1 -8 q1 -4 4 -3 q3 0 3 4 l0 8 q2 -9 3 -12 q1 -4 4 -3 q3 1 2 5 l-2 11 q2 -8 4 -10 q2 -3 5 -1 q2 2 1 5 l-4 13 q3 -5 5 -6 q3 -1 4 2 q1 2 -1 5 q-5 8 -8 16 q-3 7 -3 9 z" fill="url(#glove)" stroke="#0a3231" strokeWidth="1.2" />
        </g>
        {/* mão direita */}
        <g className="hand hand--right">
          <path d="M155 90 q4 -26 -6 -34 q-4 -3 -8 -1 l-1 -8 q-1 -4 -4 -3 q-3 0 -3 4 l0 8 q-2 -9 -3 -12 q-1 -4 -4 -3 q-3 1 -2 5 l2 11 q-2 -8 -4 -10 q-2 -3 -5 -1 q-2 2 -1 5 l4 13 q-3 -5 -5 -6 q-3 -1 -4 2 q-1 2 1 5 q5 8 8 16 q3 7 3 9 z" fill="url(#glove)" stroke="#0a3231" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
}
