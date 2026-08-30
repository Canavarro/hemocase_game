const CELLS = Array.from({ length: 9 }, (_, index) => index);

export function BrandBackground({ intense = false }: { intense?: boolean }) {
  return (
    <div className={`brand-background${intense ? " brand-background--intense" : ""}`} aria-hidden="true">
      <div className="brand-silhouette brand-silhouette--primary"><img src="/assets/lagem-logo.png" alt="" /></div>
      <div className="brand-silhouette brand-silhouette--ghost"><img src="/assets/lagem-logo.png" alt="" /></div>
      <div className="dna-helix">
        {Array.from({ length: 18 }, (_, index) => (
          <span className="dna-rung" style={{ "--i": index } as React.CSSProperties} key={index}>
            <i /><b /><i />
          </span>
        ))}
      </div>
      <div className="cell-field">
        {CELLS.map((index) => (
          <i className="cell-drift" style={{ "--i": index } as React.CSSProperties} key={index} />
        ))}
      </div>
      <div className="scan-beam" />
      <div className="bg-vignette" />
    </div>
  );
}
