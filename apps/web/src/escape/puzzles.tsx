import { useState } from "react";
import { Check, Delete, Hand } from "lucide-react";
import type { EscapeClientStep } from "@hemocase/shared";

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
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key, index) => key === ""
          ? <i key={index} />
          : <button key={index} className="keypad-key" onClick={() => key === "⌫" ? setDigits((current) => current.slice(0, -1)) : press(key)}>{key === "⌫" ? <Delete size={17} /> : key}</button>)}
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

function MicroscopePuzzle({ step, sending, onSubmit, onGesture }: PuzzleProps) {
  const [slide, setSlide] = useState<string>();
  const [focus, setFocus] = useState(0);
  const focused = focus >= 88;
  return (
    <div className="puzzle-body">
      {!slide ? (
        <div className="choice-list">
          {step.choices?.map((choice, index) => (
            <button key={choice.id} style={{ "--i": index } as React.CSSProperties} className="choice" onClick={() => { onGesture?.("grab"); setSlide(choice.id); }}>
              <span>{String.fromCharCode(65 + index)}</span><strong>{choice.text}</strong>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="scope-view" style={{ "--blur": `${Math.max(0, (100 - focus) / 12)}px` } as React.CSSProperties}>
            <svg viewBox="0 0 100 100" aria-label="Campo do microscópio">
              <defs><radialGradient id="field" cx=".5" cy=".5" r=".5"><stop offset=".82" stopColor="#f8e8e2" /><stop offset="1" stopColor="#0a0a0a" /></radialGradient></defs>
              <circle cx="50" cy="50" r="49" fill="url(#field)" />
              {[[24, 30, 0], [58, 22, 40], [40, 56, -25], [70, 60, 15], [30, 74, 60], [62, 82, -40]].map(([x, y, r], index) => (
                <ellipse key={index} cx={x} cy={y} rx="9" ry="3.1" transform={`rotate(${r} ${x} ${y})`} fill="#b8383f" opacity=".85" />
              ))}
              {[[46, 18], [18, 52], [52, 40], [80, 42], [46, 88], [78, 76]].map(([x, y], index) => (
                <circle key={index} cx={x} cy={y} r="5.2" fill="#d76a6f" opacity=".8" />
              ))}
            </svg>
          </div>
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
