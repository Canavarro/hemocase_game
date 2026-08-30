export function BrandBackground({ intense = false }: { intense?: boolean }) {
  return (
    <div className={`brand-background${intense ? " brand-background--intense" : ""}`} aria-hidden="true">
      <div className="brand-watermark"><img src="/assets/lagem-logo.png" alt="" /></div>
      <div className="dna-helix">
        {Array.from({ length: 18 }, (_, index) => (
          <span className="dna-rung" style={{ "--i": index } as React.CSSProperties} key={index}>
            <i /><b /><i />
          </span>
        ))}
      </div>
      <div className="scan-beam" />
    </div>
  );
}
