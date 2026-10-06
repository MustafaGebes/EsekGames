import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { MinecraftEngine } from '../game/engine';

export type ChatLine = {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
};

export const MinecraftChat: React.FC<{
  engine: MinecraftEngine;
  enabled: boolean;
  open: boolean;
  messages: ChatLine[];
  onOpenChange: (open: boolean) => void;
  onSend: (text: string) => void;
}> = ({ engine, enabled, open, messages, onOpenChange, onSend }) => {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const closeChat = () => {
    engine.isGUIOpen = false;
    onOpenChange(false);
    if (!engine.mobileControlsEnabled && !engine.isPaused && !engine.isDead) engine.requestPointerLock();
  };

  useEffect(() => {
    if (!enabled || engine.mobileControlsEnabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'KeyT' || event.repeat || event.ctrlKey || event.metaKey || event.altKey || open) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      if (engine.isPaused || engine.isDead || engine.isGUIOpen) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onOpenChange(true);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [enabled, engine, open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    engine.isGUIOpen = true;
    engine.mouseLeft = false;
    engine.mouseRight = false;
    engine.exitPointerLock();
    return () => {
      engine.isGUIOpen = false;
      engine.mouseLeft = false;
      engine.mouseRight = false;
    };
  }, [open, engine]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      closeChat();
    };
    window.addEventListener('keydown', onEscape, true);
    return () => window.removeEventListener('keydown', onEscape, true);
  }, [open, engine]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (text) onSend(text);
    setDraft('');
    closeChat();
  };

  const shownMessages = messages.slice(open ? -12 : -5);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[60] select-text" aria-label="Sohbet">
      {shownMessages.length > 0 && (
        <div
          className={`pointer-events-none absolute left-3 w-[min(460px,92vw)] overflow-hidden text-left font-mono text-sm leading-5 ${open ? 'bottom-[calc(150px+env(safe-area-inset-bottom))] max-h-[38vh] overflow-y-auto rounded-t-md bg-black/70 p-2' : 'bottom-[calc(210px+env(safe-area-inset-bottom))]'}`}
          aria-live="polite"
        >
          {shownMessages.map((line) => (
            <div key={line.id} className="break-words text-white drop-shadow-[1px_1px_1px_#000]">
              <span className="font-bold text-[#8fceff]">{line.sender}: </span>{line.text}
            </div>
          ))}
        </div>
      )}
      {open && (
        <div className="pointer-events-auto absolute bottom-[calc(92px+env(safe-area-inset-bottom))] left-3 w-[min(460px,92vw)] rounded-md border border-white/35 bg-black/85 p-2 shadow-xl backdrop-blur-sm">
          <form onSubmit={submit} className="flex gap-2">
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, 200))}
              maxLength={200}
              autoComplete="off"
              aria-label="Sohbet mesajı"
              placeholder="Mesajını yaz..."
              className="min-w-0 flex-1 rounded border border-white/25 bg-black/80 px-3 py-2 font-mono text-sm text-white outline-none focus:border-sky-400"
            />
            <button type="submit" className="rounded border border-sky-300/70 bg-sky-700 px-3 py-2 font-bold text-white hover:bg-sky-600">Gönder</button>
          </form>
          <div className="mt-1 text-[10px] text-white/55">Enter: gönder · Esc: kapat</div>
        </div>
      )}
    </div>
  );
};
