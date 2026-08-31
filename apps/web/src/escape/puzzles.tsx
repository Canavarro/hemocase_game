import { useMemo, useState } from "react";
import { Check, Delete, Hand } from "lucide-react";
import type { EscapeClientStep, EscapeSmearKind } from "@hemocase/shared";

export interface PuzzleProps {
  step: EscapeClientStep;
  sending: boolean;
  onSubmit: (answer: string[]) => void;
  onGesture?: (gesture: "grab" | "type" | "reach") => void;
}

/** Roteia o enigma para o componente do seu tipo. */
export function PuzzleBody(props: PuzzleProps) {
  const { step } = props;
  switch (step.type) {
    case "use-item": return <UseItemPuzzle {...props} />;
    case "code": return <CodePuzzle {...props} />;
    case "board-select": return <BoardSelectPuzzle {...props} />;
    case "microscope": return <MicroscopePuzzle {...props} />;
    case "assemble": return <AssemblePuzzle {...props} />;
    case "sequence-spot": return <SequenceSpotPuzzle {...props} />;
    case "chain-fill":
    case "mechanism-fill":
    case "dial-safe": return <SlotFillPuzzle {...props} />;
    default: return <ChoicePuzzle {...props} />;
  }
}

function UseItemPuzzle({ step, sending, onSubmit, onGesture }: PuzzleProps) {
  const [picked, setPicked] = useState(false);
  return (
    <div className="puzzle-body">
      {!picked
        ? <button className="button button--full" onClick={() => { onGesture?.("grab"); setPicked(true); }}><Hand size={18} /> Pegar {step.grantsItem?.toLocaleLowerCase("pt-BR")}</button>
        : <button className="button button--danger button--full" disabled={sending} onClick={() => { onGesture?.("reach"); onSubmit(["usar"]); }}>Passar o crachá no leitor</button>}
    </div>
  );
}

function CodePuzzle({ step, sending, onSubmit, onGesture }: PuzzleProps) {
  const length = step.codeLength ?? 4;
  const [digits, setDigits] = useState("");
  const press = (digit: string) => {
    onGesture?.("type");
    setDigits((current) => (current.length < length ? current + digit : current));
  };
  return (
    <div className="puzzle-body">
      <div className="code-display" role="status" aria-label="Código digitado">
        {Array.from({ length }, (_, index) => <span key={index} className={digits[index] ? "is-filled" : ""}>{digits[index] ?? "•"}</span>)}
      </div>
      <div className="keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((key, index) => (
          <button
            key={index}
            className={`keypad-key ${key === "C" ? "keypad-key--clear" : ""}`}
            title={key === "C" ? "Limpar tudo" : key === "⌫" ? "Apagar o último dígito" : undefined}
            onClick={() => {
              if (key === "C") return setDigits("");
              if (key === "⌫") return setDigits((current) => current.slice(0, -1));
              press(key);
            }}
          >
            {key === "⌫" ? <Delete size={17} /> : key}
          </button>
        ))}
      </div>
      <button className="button button--danger button--full" disabled={digits.length < length || sending} onClick={() => onSubmit([digits])}>Confirmar código</button>
    </div>
  );
}

function ChoicePuzzle({ step, sending, onSubmit }: PuzzleProps) {
  const [selected, setSelected] = useState<string>();
  return (
    <div className="puzzle-body">
      <div className="choice-list">
        {step.choices?.map((choice, index) => (
          <button key={choice.id} style={{ "--i": index } as React.CSSProperties} className={`choice ${selected === choice.id ? "is-selected" : ""}`} onClick={() => setSelected(choice.id)}>
            <span>{String.fromCharCode(65 + index)}</span><strong>{choice.text}</strong>{selected === choice.id && <Check size={18} />}
          </button>
        ))}
      </div>
      <button className="button button--danger button--full" disabled={!selected || sending} onClick={() => selected && onSubmit([selected])}>Confirmar</button>
    </div>
  );
}

function BoardSelectPuzzle({ step, sending, onSubmit }: PuzzleProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const target = step.selectCount ?? 1;
  const toggle = (id: string) => setSelected((current) => current.includes(id)
    ? current.filter((item) => item !== id)
    : current.length < target ? [...current, id] : current);
  return (
    <div className="puzzle-body">
      <p className="select-counter">{selected.length} de {target} marcados</p>
      <div className="chip-grid">
        {step.choices?.map((choice, index) => (
          <button key={choice.id} style={{ "--i": index } as React.CSSProperties} className={`evidence-chip ${selected.includes(choice.id) ? "is-selected" : ""}`} onClick={() => toggle(choice.id)}>
            {choice.text}
          </button>
        ))}
      </div>
      <button className="button button--danger button--full" disabled={selected.length !== target || sending} onClick={() => onSubmit(selected)}>Fixar no quadro</button>
    </div>
  );
}

/* ---------- Esfregaço do microscópio: um campo distinto por lâmina ---------- */

const smearSeeds: Record<EscapeSmearKind, number> = {
  "normal": 11, "falciforme": 47, "microcitica-hipocromica": 83, "plaquetas-gigantes": 29, "esferocitos": 61, "plaquetas-pequenas": 97, "celulas-alvo": 73,
};

/** Gerador determinístico: o mesmo esfregaço aparece igual para toda a equipe. */
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SmearCell { x: number; y: number; jitter: number; angle: number }

/** Espalha células sem sobreposição pesada dentro do campo circular. */
function scatterCells(random: () => number, count: number, minGap: number): SmearCell[] {
  const cells: SmearCell[] = [];
  for (let attempt = 0; attempt < count * 40 && cells.length < count; attempt++) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 41;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    if (cells.every((cell) => Math.hypot(cell.x - x, cell.y - y) >= minGap)) {
      cells.push({ x, y, jitter: random(), angle: random() * 360 });
    }
  }
  return cells;
}

function Sickle({ cell }: { cell: SmearCell }) {
  const scale = 0.9 + cell.jitter * 0.35;
  return (
    <g transform={`translate(${cell.x} ${cell.y}) rotate(${cell.angle}) scale(${scale})`}>
      <path d="M -7 0 C -3 -4.8, 3 -4.8, 7 0 C 3 -1.7, -3 -1.7, -7 0 Z" fill="url(#smear-sickle)" stroke="#7e2226" strokeWidth=".28" />
    </g>
  );
}

function TargetCell({ cell, r }: { cell: SmearCell; r: number }) {
  return (
    <g transform={`translate(${cell.x} ${cell.y})`}>
      <circle r={r} fill="url(#smear-hypo)" stroke="#b9564f" strokeWidth=".3" />
      <circle r={r * 0.34} fill="#cf6a62" opacity=".9" />
    </g>
  );
}

function Neutrophil({ cell }: { cell: SmearCell }) {
  return (
    <g transform={`translate(${cell.x} ${cell.y})`}>
      <circle r="7.4" fill="#ecdcE8" stroke="#c9a8c4" strokeWidth=".35" />
      <circle cx="-2.2" cy="-1" r="2.5" fill="#5d3a75" />
      <circle cx="1.4" cy="1.6" r="2.3" fill="#69417f" />
      <circle cx="2.4" cy="-2" r="2" fill="#553569" />
      <path d="M -.6 -1.4 L .6 .4 M 1.6 0 L 2 -.8" stroke="#4a2c5c" strokeWidth=".8" strokeLinecap="round" />
    </g>
  );
}

export function SmearField({ kind }: { kind: EscapeSmearKind }) {
  const layout = useMemo(() => {
    const random = mulberry32(smearSeeds[kind] ?? 7);
    const blurred = scatterCells(random, 5, 8);
    switch (kind) {
      case "falciforme": {
        const cells = scatterCells(random, 22, 9);
        return { blurred, rbc: cells.slice(0, 11), sickle: cells.slice(11, 20), target: cells.slice(20, 21), platelet: cells.slice(21), small: [], sphero: [], giant: [], neutro: [] as SmearCell[], tiny: [] as SmearCell[] };
      }
      case "microcitica-hipocromica": {
        const cells = scatterCells(random, 26, 7.6);
        return { blurred, rbc: [], sickle: [], target: cells.slice(18, 23), platelet: cells.slice(23), small: cells.slice(0, 18), sphero: [], giant: [], neutro: [] as SmearCell[], tiny: [] as SmearCell[] };
      }
      case "plaquetas-gigantes": {
        const cells = scatterCells(random, 20, 9.4);
        return { blurred, rbc: cells.slice(0, 14), sickle: [], target: [], platelet: cells.slice(19), small: [], sphero: [], giant: cells.slice(14, 19), neutro: [] as SmearCell[], tiny: [] as SmearCell[] };
      }
      case "esferocitos": {
        const cells = scatterCells(random, 24, 8);
        return { blurred, rbc: cells.slice(16, 21), sickle: [], target: [], platelet: cells.slice(21), small: [], sphero: cells.slice(0, 16), giant: [], neutro: [] as SmearCell[], tiny: [] as SmearCell[] };
      }
      case "celulas-alvo": {
        // HbC: células em alvo dominam o campo, com células densas ocasionais.
        const cells = scatterCells(random, 24, 8);
        return { blurred, rbc: cells.slice(14, 18), sickle: [], target: cells.slice(0, 14), platelet: cells.slice(22), small: [], sphero: cells.slice(18, 22), giant: [], neutro: [] as SmearCell[], tiny: [] as SmearCell[] };
      }
      case "plaquetas-pequenas": {
        // Microtrombocitopenia: hemácias normais, plaquetas raras e minúsculas.
        const cells = scatterCells(random, 20, 9.4);
        return { blurred, rbc: cells.slice(0, 17), sickle: [], target: [], platelet: [], small: [], sphero: [], giant: [], neutro: [] as SmearCell[], tiny: cells.slice(17) };
      }
      default: {
        const cells = scatterCells(random, 21, 9.6);
        return { blurred, rbc: cells.slice(0, 17), sickle: [], target: [], platelet: cells.slice(17, 20), small: [], sphero: [], giant: [], neutro: cells.slice(20), tiny: [] as SmearCell[] };
      }
    }
  }, [kind]);

  const rbc = (cell: SmearCell, r: number, fill: string) => (
    <g key={`${cell.x}-${cell.y}`} transform={`translate(${cell.x} ${cell.y}) rotate(${cell.angle})`}>
      <ellipse rx={r} ry={r * (0.86 + cell.jitter * 0.14)} fill={fill} stroke="#a84a48" strokeWidth=".26" />
    </g>
  );

  return (
    <svg viewBox="0 0 100 100" aria-label="Campo do microscópio">
      <defs>
        <radialGradient id="smear-plasma" cx=".42" cy=".38" r=".72">
          <stop offset="0" stopColor="#fbeee6" /><stop offset=".62" stopColor="#f4dfd5" /><stop offset=".88" stopColor="#e8cbbf" /><stop offset="1" stopColor="#caa89c" />
        </radialGradient>
        <radialGradient id="smear-rbc" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#f3c3b4" /><stop offset=".42" stopColor="#eba193" /><stop offset=".78" stopColor="#d4695f" /><stop offset="1" stopColor="#c25a55" />
        </radialGradient>
        <radialGradient id="smear-hypo" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#f7e2d6" /><stop offset=".58" stopColor="#f2cbBB" /><stop offset=".86" stopColor="#dd8b7d" /><stop offset="1" stopColor="#cc6f66" />
        </radialGradient>
        <radialGradient id="smear-sphero" cx=".42" cy=".4" r=".6">
          <stop offset="0" stopColor="#dd7a70" /><stop offset=".7" stopColor="#c94f4c" /><stop offset="1" stopColor="#ad3d3d" />
        </radialGradient>
        <linearGradient id="smear-sickle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c14a49" /><stop offset="1" stopColor="#93262b" />
        </linearGradient>
        <radialGradient id="smear-plt" cx=".4" cy=".4" r=".62">
          <stop offset="0" stopColor="#b391cc" /><stop offset="1" stopColor="#77519b" />
        </radialGradient>
        <filter id="smear-defocus" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1" /></filter>
        <radialGradient id="smear-rim" cx=".5" cy=".5" r=".5">
          <stop offset=".8" stopColor="transparent" /><stop offset=".93" stopColor="rgba(40,16,12,.35)" /><stop offset="1" stopColor="#0a0a0a" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill="url(#smear-plasma)" />
      {/* Células fora do plano de corte: profundidade do campo. */}
      <g filter="url(#smear-defocus)" opacity=".38">
        {layout.blurred.map((cell) => rbc(cell, 5.6, "url(#smear-rbc)"))}
      </g>
      {layout.rbc.map((cell) => rbc(cell, 4.6 + cell.jitter * 1.1, "url(#smear-rbc)"))}
      {layout.small.map((cell) => rbc(cell, 3 + cell.jitter * 0.7, "url(#smear-hypo)"))}
      {layout.sphero.map((cell) => rbc(cell, 3.4 + cell.jitter * 0.6, "url(#smear-sphero)"))}
      {layout.sickle.map((cell) => <Sickle key={`${cell.x}-${cell.y}`} cell={cell} />)}
      {layout.target.map((cell) => <TargetCell key={`${cell.x}-${cell.y}`} cell={cell} r={4.4} />)}
      {layout.giant.map((cell) => (
        <g key={`${cell.x}-${cell.y}`} transform={`translate(${cell.x} ${cell.y})`}>
          <circle r={4.2 + cell.jitter} fill="url(#smear-plt)" stroke="#5c3f7c" strokeWidth=".3" />
          <circle cx=".8" cy="-.6" r="1.5" fill="#5c3f7c" opacity=".65" />
        </g>
      ))}
      {layout.platelet.map((cell) => <circle key={`${cell.x}-${cell.y}`} cx={cell.x} cy={cell.y} r={1.15} fill="url(#smear-plt)" />)}
      {layout.tiny.map((cell) => <circle key={`${cell.x}-${cell.y}`} cx={cell.x} cy={cell.y} r={0.6} fill="url(#smear-plt)" />)}
      {layout.neutro.map((cell) => <Neutrophil key={`${cell.x}-${cell.y}`} cell={cell} />)}
      <circle cx="50" cy="50" r="49" fill="url(#smear-rim)" />
      <circle cx="50" cy="50" r="48.2" fill="none" stroke="rgba(90,140,190,.18)" strokeWidth=".9" />
    </svg>
  );
}

function MicroscopePuzzle({ step, sending, onSubmit, onGesture }: PuzzleProps) {
  const [slide, setSlide] = useState<string>();
  const [focus, setFocus] = useState(0);
  const focused = focus >= 88;
  const smear = step.choices?.find((choice) => choice.id === slide)?.smear ?? "normal";
  return (
    <div className="puzzle-body">
      {!slide ? (
        <div className="choice-list">
          {step.choices?.map((choice, index) => (
            <button key={choice.id} style={{ "--i": index } as React.CSSProperties} className="choice" onClick={() => { onGesture?.("grab"); setSlide(choice.id); setFocus(0); }}>
              <span>{String.fromCharCode(65 + index)}</span><strong>{choice.text}</strong>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="scope-view" style={{ "--blur": `${Math.max(0, (100 - focus) / 12)}px` } as React.CSSProperties}>
            <SmearField kind={smear} />
          </div>
          <p className="puzzle-note">Lâmina {slide} sob a objetiva de imersão.</p>
          <label className="focus-control">Foco do charriot
            <input type="range" min={0} max={100} value={focus} onChange={(event) => { onGesture?.("type"); setFocus(Number(event.target.value)); }} />
          </label>
          <button className="button button--danger button--full" disabled={!focused || sending} onClick={() => onSubmit([slide])}>
            {focused ? "Registrar achado" : "Ajustem o foco até a imagem ficar nítida"}
          </button>
          <button className="text-button" onClick={() => { setSlide(undefined); setFocus(0); }}>Trocar de lâmina</button>
        </>
      )}
    </div>
  );
}

function AssemblePuzzle({ step, sending, onSubmit, onGesture }: PuzzleProps) {
  const slots = step.slots ?? [];
  const [placed, setPlaced] = useState<(string | undefined)[]>(() => slots.map(() => undefined));
  const nextSlot = placed.findIndex((value) => value === undefined);
  const place = (id: string) => {
    if (nextSlot === -1) return;
    onGesture?.("grab");
    setPlaced((current) => current.map((value, index) => (index === nextSlot ? id : value)));
  };
  const complete = placed.every(Boolean);
  return (
    <div className="puzzle-body">
      <div className="assembly-slots">
        {slots.map((slot, index) => (
          <button key={slot} className={`assembly-slot ${placed[index] ? "is-filled" : ""} ${index === nextSlot ? "is-next" : ""}`}
            onClick={() => setPlaced((current) => current.map((value, position) => (position === index ? undefined : value)))}>
            <small>{slot}</small>
            <strong>{step.choices?.find((choice) => choice.id === placed[index])?.text ?? "—"}</strong>
          </button>
        ))}
      </div>
      <div className="chip-grid">
        {step.choices?.map((choice) => (
          <button key={choice.id} className="evidence-chip" disabled={nextSlot === -1} onClick={() => place(choice.id)}>{choice.text}</button>
        ))}
      </div>
      <p className="puzzle-note">Peças podem repetir. Toquem num suporte preenchido para esvaziá-lo.</p>
      <button className="button button--danger button--full" disabled={!complete || sending} onClick={() => onSubmit(placed as string[])}>Travar o modelo</button>
    </div>
  );
}

function SequenceSpotPuzzle({ step, sending, onSubmit }: PuzzleProps) {
  const [picked, setPicked] = useState<number>();
  const reference = step.sequence?.reference ?? [];
  const sample = step.sequence?.sample ?? [];
  return (
    <div className="puzzle-body">
      <p className="puzzle-note">{step.sequence?.label}. Toquem no códon do PACIENTE que diverge da referência.</p>
      <div className="sequence-track" role="group" aria-label="Alinhamento de sequências">
        <div className="sequence-row"><span className="sequence-tag">REF</span>{reference.map((codon, index) => <code key={index}>{codon}</code>)}</div>
        <div className="sequence-row">
          <span className="sequence-tag">PAC</span>
          {sample.map((codon, index) => (
            <button key={index} className={`sequence-codon ${picked === index ? "is-picked" : ""}`} onClick={() => setPicked(index)}>{codon}</button>
          ))}
        </div>
      </div>
      <button className="button button--danger button--full" disabled={picked === undefined || sending} onClick={() => picked !== undefined && onSubmit([String(picked)])}>Marcar divergência</button>
    </div>
  );
}

/** chain-fill, mechanism-fill e dial-safe: um seletor por lacuna. */
function SlotFillPuzzle({ step, sending, onSubmit, onGesture }: PuzzleProps) {
  const slots = step.slots ?? [];
  const slotChoices = step.slotChoices ?? [];
  const fillable = slots.map((_, index) => (slotChoices[index]?.length ?? 0) > 0);
  const [picked, setPicked] = useState<Record<number, string | undefined>>({});
  const cycle = (index: number) => {
    const options = slotChoices[index] ?? [];
    if (!options.length) return;
    onGesture?.(step.type === "dial-safe" ? "grab" : "type");
    setPicked((current) => {
      const currentId = current[index];
      const position = options.findIndex((option) => option.id === currentId);
      return { ...current, [index]: options[(position + 1) % options.length]?.id };
    });
  };
  const answer = slots.map((_, index) => picked[index]).filter((_, index) => fillable[index]);
  const complete = answer.length === fillable.filter(Boolean).length && answer.every(Boolean);
  return (
    <div className="puzzle-body">
      <div className={step.type === "dial-safe" ? "dial-row" : "slot-row"}>
        {slots.map((slot, index) => fillable[index] ? (
          <button key={index} className={`fill-slot ${picked[index] ? "is-filled" : ""} ${step.type === "dial-safe" ? "fill-slot--dial" : ""}`} onClick={() => cycle(index)}>
            <small>{slot}</small>
            <strong>{slotChoices[index]?.find((option) => option.id === picked[index])?.text ?? "girar"}</strong>
          </button>
        ) : (
          <span key={index} className="fixed-slot">{slot}</span>
        ))}
      </div>
      <p className="puzzle-note">{step.type === "dial-safe" ? "Toquem num seletor para girá-lo à próxima posição." : "Toquem numa lacuna para alternar as opções."}</p>
      <button className="button button--danger button--full" disabled={!complete || sending} onClick={() => onSubmit(answer as string[])}>
        {step.type === "dial-safe" ? "Girar a alavanca do cofre" : "Confirmar"}
      </button>
    </div>
  );
}
