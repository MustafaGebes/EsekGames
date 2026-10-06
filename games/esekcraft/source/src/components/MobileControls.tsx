import React, { useEffect, useRef, useState } from 'react';
import { MinecraftEngine } from '../game/engine';
import { KeyBindings } from '../game/types';

type MovementAction = 'forward' | 'backward' | 'left' | 'right';
type HoldAction = 'jump' | 'sprint';

const ACTION_LABELS: Record<HoldAction, string> = { jump: 'Zıpla', sprint: 'Koş' };

export const MobileControls: React.FC<{
  engine: MinecraftEngine;
  onOpenChat: () => void;
  onDropItem: () => void;
  onOpenInventory: () => void;
  onPause: () => void;
}> = ({ engine, onOpenChat, onDropItem, onOpenInventory, onPause }) => {
  const padRef = useRef<HTMLDivElement>(null);
  const padPointerRef = useRef<number | null>(null);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [sneakOn, setSneakOn] = useState(false);
  const [held, setHeld] = useState<Record<string, boolean>>({});

  const setMovement = (x: number, y: number) => {
    const bindings: KeyBindings = engine.keyBindings;
    engine.keys[bindings.forward] = y < -0.18;
    engine.keys[bindings.backward] = y > 0.18;
    engine.keys[bindings.left] = x < -0.18;
    engine.keys[bindings.right] = x > 0.18;
  };

  const moveStick = (event: React.PointerEvent<HTMLDivElement>) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const rawX = event.clientX - (rect.left + rect.width / 2);
    const rawY = event.clientY - (rect.top + rect.height / 2);
    const max = rect.width * 0.34;
    const length = Math.hypot(rawX, rawY) || 1;
    const scale = Math.min(1, max / length);
    const x = rawX * scale / max;
    const y = rawY * scale / max;
    setStick({ x: x * max, y: y * max });
    setMovement(x, y);
  };

  const releaseStick = (event?: React.PointerEvent<HTMLDivElement>) => {
    if (event && padPointerRef.current !== event.pointerId) return;
    padPointerRef.current = null;
    setStick({ x: 0, y: 0 });
    setMovement(0, 0);
  };

  const setKeyAction = (action: HoldAction | 'sneak', pressed: boolean) => {
    const code = engine.keyBindings[action];
    if (code) engine.keys[code] = pressed;
  };

  const beginHold = (action: HoldAction) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setKeyAction(action, true);
    setHeld((current) => ({ ...current, [action]: true }));
  };
  const endHold = (action: HoldAction) => () => {
    setKeyAction(action, false);
    setHeld((current) => ({ ...current, [action]: false }));
  };

  const beginMouseAction = (action: 'attack' | 'use') => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (action === 'attack') engine.mouseLeft = true;
    else engine.mouseRight = true;
    setHeld((current) => ({ ...current, [action]: true }));
  };
  const endMouseAction = (action: 'attack' | 'use') => () => {
    if (action === 'attack') engine.mouseLeft = false;
    else engine.mouseRight = false;
    setHeld((current) => ({ ...current, [action]: false }));
  };

  const toggleSneak = () => {
    const next = !sneakOn;
    setSneakOn(next);
    setKeyAction('sneak', next);
  };

  useEffect(() => {
    const canvas = engine.renderer.domElement;
    const oldTouchAction = canvas.style.touchAction;
    canvas.style.touchAction = 'none';
    let lookPointer: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (engine.isPaused || engine.isDead || engine.isGUIOpen || lookPointer !== null) return;
      lookPointer = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      try { canvas.setPointerCapture(event.pointerId); } catch {}
    };
    const onPointerMove = (event: PointerEvent) => {
      if (lookPointer !== event.pointerId || engine.isPaused || engine.isDead || engine.isGUIOpen) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      const sensitivity = 0.0045 * engine.mouseSensitivity;
      engine.yaw -= dx * sensitivity;
      engine.pitch = Math.max(-1.55, Math.min(1.55, engine.pitch - dy * sensitivity));
      lastX = event.clientX;
      lastY = event.clientY;
      event.preventDefault();
    };
    const releaseLook = (event: PointerEvent) => {
      if (lookPointer !== event.pointerId) return;
      lookPointer = null;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove, { passive: false });
    canvas.addEventListener('pointerup', releaseLook);
    canvas.addEventListener('pointercancel', releaseLook);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', releaseLook);
      canvas.removeEventListener('pointercancel', releaseLook);
      canvas.style.touchAction = oldTouchAction;
      (['forward', 'backward', 'left', 'right', 'jump', 'sprint', 'sneak'] as const).forEach((action) => {
        const code = engine.keyBindings[action];
        if (code) engine.keys[code] = false;
      });
      engine.mouseLeft = false;
      engine.mouseRight = false;
    };
  }, [engine]);

  const baseButton = 'pointer-events-auto touch-none select-none rounded-full border-2 border-white/55 bg-slate-950/55 text-white shadow-lg backdrop-blur-sm active:scale-95 active:bg-blue-500/65';
  const labelButton = (active: boolean) => `${baseButton} flex flex-col items-center justify-center gap-0.5 ${active ? 'border-blue-300 bg-blue-600/70 ring-2 ring-blue-300/50' : ''}`;

  return (
    <div className="pointer-events-none absolute inset-0 z-[30] overflow-hidden" aria-label="Mobil oyun kontrolleri">
      <div className="pointer-events-none absolute right-3 top-3 flex gap-2">
        <button type="button" className={`${labelButton(false)} h-12 w-12 text-[9px] font-bold`} aria-label="Sohbeti aç" title="Sohbet" onClick={onOpenChat}>
          <span aria-hidden="true" className="text-lg leading-none">💬</span><span>Sohbet</span>
        </button>
        <button type="button" className={`${labelButton(false)} h-12 w-12 text-[9px] font-bold`} aria-label="Eşyayı at" title="Eşyayı at" onClick={onDropItem}>
          <span aria-hidden="true" className="text-lg leading-none">↓</span><span>At</span>
        </button>
        <button type="button" className={`${labelButton(false)} h-12 w-12 text-[9px] font-bold`} aria-label="Envanteri aç" title="Envanter" onClick={onOpenInventory}>
          <span aria-hidden="true" className="text-lg leading-none">▤</span><span>Çanta</span>
        </button>
        <button type="button" className={`${labelButton(false)} h-12 w-12 text-[9px] font-bold`} aria-label="Menüyü aç" title="Menü" onClick={onPause}>
          <span aria-hidden="true" className="text-lg leading-none">Ⅱ</span><span>Menü</span>
        </button>
      </div>
      <div
        ref={padRef}
        className="pointer-events-auto absolute bottom-[calc(92px+env(safe-area-inset-bottom))] left-4 h-[clamp(104px,15vh,142px)] w-[clamp(104px,15vh,142px)] touch-none rounded-full border-2 border-white/45 bg-slate-950/35 shadow-lg backdrop-blur-[2px]"
        aria-label="Hareket kolu"
        onPointerDown={(event) => {
          event.preventDefault();
          if (padPointerRef.current !== null) return;
          padPointerRef.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          moveStick(event);
        }}
        onPointerMove={(event) => { if (padPointerRef.current === event.pointerId) moveStick(event); }}
        onPointerUp={releaseStick}
        onPointerCancel={releaseStick}
        onLostPointerCapture={releaseStick}
      >
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white/55 text-xl font-bold" aria-hidden="true">＋</div>
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/65 bg-slate-200/45 shadow-inner"
          style={{ transform: `translate(calc(-50% + ${stick.x}px), calc(-50% + ${stick.y}px))` }}
        />
      </div>

      <div className="pointer-events-none absolute bottom-[calc(94px+env(safe-area-inset-bottom))] right-3 flex flex-col items-end gap-2">
        <div className="flex items-end gap-2">
          <button type="button" className={`${labelButton(!!held.sprint)} h-12 w-12 text-[9px] font-bold`} aria-label="Koş" title="Koş" onPointerDown={beginHold('sprint')} onPointerUp={endHold('sprint')} onPointerCancel={endHold('sprint')} onLostPointerCapture={endHold('sprint')}>
            <span aria-hidden="true" className="text-lg leading-none">»</span><span>{ACTION_LABELS.sprint}</span>
          </button>
          <button type="button" className={`${labelButton(sneakOn)} h-12 w-12 text-[9px] font-bold`} aria-label="Eğil" title="Eğil" aria-pressed={sneakOn} onClick={toggleSneak}>
            <span aria-hidden="true" className="text-lg leading-none">⌄</span><span>{sneakOn ? 'Kalk' : 'Eğil'}</span>
          </button>
          <button type="button" className={`${labelButton(!!held.jump)} h-[clamp(56px,8vh,68px)] w-[clamp(56px,8vh,68px)] text-[10px] font-bold`} aria-label="Zıpla" title="Zıpla" onPointerDown={beginHold('jump')} onPointerUp={endHold('jump')} onPointerCancel={endHold('jump')} onLostPointerCapture={endHold('jump')}>
            <span aria-hidden="true" className="text-2xl leading-none">↑</span><span>{ACTION_LABELS.jump}</span>
          </button>
        </div>
        <div className="flex gap-2">
          <button type="button" className={`${labelButton(!!held.attack)} h-[clamp(58px,8vh,70px)] w-[clamp(58px,8vh,70px)] text-[10px] font-bold`} aria-label="Saldır veya blok kır" title="Saldır / Kır" onPointerDown={beginMouseAction('attack')} onPointerUp={endMouseAction('attack')} onPointerCancel={endMouseAction('attack')} onLostPointerCapture={endMouseAction('attack')}>
            <span aria-hidden="true" className="text-2xl leading-none">⛏</span><span>Kır</span>
          </button>
          <button type="button" className={`${labelButton(!!held.use)} h-[clamp(58px,8vh,70px)] w-[clamp(58px,8vh,70px)] text-[10px] font-bold`} aria-label="Kullan veya blok yerleştir" title="Kullan / Yerleştir" onPointerDown={beginMouseAction('use')} onPointerUp={endMouseAction('use')} onPointerCancel={endMouseAction('use')} onLostPointerCapture={endMouseAction('use')}>
            <span aria-hidden="true" className="text-2xl leading-none">▣</span><span>Kullan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
