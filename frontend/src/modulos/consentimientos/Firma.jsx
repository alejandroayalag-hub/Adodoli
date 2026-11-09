// Firma con dedo, pluma o mouse sobre un canvas. onChange(dataURL | null)
import { useEffect, useRef } from 'react';

export default function Firma({ onChange }) {
  const ref = useRef(null);
  const trazando = useRef(false);
  const vacia = useRef(true);

  useEffect(() => {
    const c = ref.current, escala = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * escala; c.height = c.offsetHeight * escala;
    const ctx = c.getContext('2d');
    ctx.scale(escala, escala); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#111';
  }, []);

  const punto = (e) => { const r = ref.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const inicio = (e) => {
    ref.current.setPointerCapture(e.pointerId);
    trazando.current = true;
    const ctx = ref.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(...punto(e));
  };
  const mover = (e) => {
    if (!trazando.current) return;
    const ctx = ref.current.getContext('2d');
    ctx.lineTo(...punto(e)); ctx.stroke();
    vacia.current = false;
  };
  const fin = () => {
    if (!trazando.current) return;
    trazando.current = false;
    if (!vacia.current) onChange(ref.current.toDataURL('image/png'));
  };
  const borrar = () => {
    const c = ref.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    vacia.current = true; onChange(null);
  };

  return (
    <div>
      <canvas ref={ref} className="w-full h-40 border-2 border-dashed border-zinc-300 rounded-lg bg-white touch-none cursor-crosshair"
              onPointerDown={inicio} onPointerMove={mover} onPointerUp={fin} onPointerLeave={fin} />
      <div className="flex text-xs text-zinc-500 mt-1">
        <span className="flex-1">Firme dentro del recuadro</span>
        <button type="button" className="hover:underline" onClick={borrar}>Borrar firma</button>
      </div>
    </div>
  );
}
