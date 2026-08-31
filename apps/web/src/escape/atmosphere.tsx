/**
 * Camada de atmosfera do modo Escape:
 * - GhostHint: mão espectral que demonstra a interação esperada na primeira
 *   visita a cada sala (desligável em "Ajuda visual");
 * - ArchivistCameo: O ARQUIVISTA — figura original do jogo que aparece uma
 *   única vez por partida, observando de longe. Nunca vemos o rosto.
 */

/** Mão translúcida que flutua até o objeto e "toca" duas vezes. */
export function GhostHint({ x, y }: { x: number; y: number }) {
  return (
    <div className="ghost-hint" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true">
      <svg viewBox="0 0 60 70" width="64" height="76">
        <path
          d="M22 70 q-3 -20 5 -26 q3 -2 6 -1 l1 -6 q1 -3 3 -2 q2 0 2 3 l0 6 q1 -7 2 -9 q1 -3 3 -2 q2 1 1 4 l-1 8 q1 -6 3 -8 q2 -2 4 -1 q1 2 0 4 l-3 10 q2 -4 4 -5 q2 -1 3 2 q1 2 -1 4 q-4 6 -6 12 q-2 5 -2 7 z"
          fill="rgba(170,235,228,.35)" stroke="rgba(190,240,232,.8)" strokeWidth="1.1"
        />
      </svg>
      <i className="ghost-hint__ripple" />
    </div>
  );
}

/** Silhueta do Arquivista, parada junto à parede, quase imperceptível. */
export function ArchivistCameo() {
  return (
    <div className="archivist" aria-hidden="true">
      <svg viewBox="0 0 40 100" preserveAspectRatio="xMidYMax meet">
        <path
          d="M20 8 a7 7 0 0 1 7 7 q0 4 -2 6 q7 3 9 12 l3 55 q0 4 -4 4 l-26 0 q-4 0 -4 -4 l3 -55 q2 -9 9 -12 q-2 -2 -2 -6 a7 7 0 0 1 7 -7 z"
          fill="#05080a" stroke="rgba(25,167,166,.22)" strokeWidth=".8"
        />
        <path d="M11 40 l-2 46 M29 40 l2 46" stroke="rgba(0,0,0,.5)" strokeWidth="1.4" />
      </svg>
    </div>
  );
}
