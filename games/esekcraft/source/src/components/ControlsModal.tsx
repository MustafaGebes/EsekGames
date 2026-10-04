/**
 * EsekCraft - Keybinding Controls Configuration Modal
 */
import React, { useState, useEffect } from 'react';
import { KeyBindings, DEFAULT_KEY_BINDINGS } from '../game/types';
import { Sound } from '../game/audio';

interface ControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyBindings: KeyBindings;
  onSave: (newBindings: KeyBindings) => void;
}

const ACTION_LABELS: Record<keyof KeyBindings, string> = {
  forward: 'İleri Git',
  backward: 'Geri Git',
  left: 'Sola Git',
  right: 'Sağa Git',
  jump: 'Zıpla',
  sprint: 'Koşma (Sprint)',
  sneak: 'Eğilme / Çökme',
  inventory: 'Envanter',
  drop: 'Eşyayı Yere At',
  offhand: 'Sol Ele Al',
  perspective: '3. Şahıs / Kamera',
};

export function formatKeyCode(code: string): string {
  if (!code) return 'Yok';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  switch (code) {
    case 'Space':
      return 'Boşluk (Space)';
    case 'ShiftLeft':
      return 'Sol Shift';
    case 'ShiftRight':
      return 'Sağ Shift';
    case 'ControlLeft':
      return 'Sol Ctrl';
    case 'ControlRight':
      return 'Sağ Ctrl';
    case 'AltLeft':
      return 'Sol Alt';
    case 'AltRight':
      return 'Sağ Alt';
    case 'Tab':
      return 'Tab';
    case 'CapsLock':
      return 'Caps Lock';
    case 'Backspace':
      return 'Geri Tuşu';
    case 'Enter':
      return 'Enter';
    default:
      return code;
  }
}

export const ControlsModal: React.FC<ControlsModalProps> = ({
  isOpen,
  onClose,
  keyBindings,
  onSave,
}) => {
  const [bindings, setBindings] = useState<KeyBindings>({ ...keyBindings });
  const [listeningAction, setListeningAction] = useState<keyof KeyBindings | null>(null);

  useEffect(() => {
    setBindings({ ...keyBindings });
  }, [keyBindings, isOpen]);

  useEffect(() => {
    if (!isOpen || !listeningAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.code === 'Escape') {
        // Cancel binding
        setListeningAction(null);
        Sound.click();
        return;
      }

      const next = { ...bindings, [listeningAction]: e.code };
      setBindings(next);
      setListeningAction(null);
      Sound.click();
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, listeningAction, bindings]);

  if (!isOpen) return null;

  const handleResetDefaults = () => {
    Sound.click();
    setBindings({ ...DEFAULT_KEY_BINDINGS });
  };

  const handleSave = () => {
    Sound.click();
    onSave(bindings);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !listeningAction) {
          handleSave();
        }
      }}
    >
      <div
        className="mc-panel p-6 flex flex-col gap-4 w-[500px] max-w-[95vw] max-h-[88vh]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b-2 border-[#555] pb-2">
          <h2 className="text-2xl font-bold text-white drop-shadow-[2px_2px_0_#222]">
            Kontroller (Tuş Atamaları)
          </h2>
          <button
            onClick={() => {
              Sound.click();
              onClose();
            }}
            className="text-xs font-bold px-2 py-1 bg-[#8b8b8b] hover:bg-red-800 hover:text-white border border-[#373737]"
          >
            ✕ Kapat
          </button>
        </div>

        <p className="text-xs text-neutral-300">
          Değiştirmek istediğiniz tuşa tıklayın, ardından klavyenizdeki yeni tuşa basın. İptal için{' '}
          <span className="text-yellow-400 font-bold">ESC</span> tuşuna basabilirsiniz.
        </p>

        {/* Scrollable Key List */}
        <div className="flex-1 overflow-y-auto mc-scroll flex flex-col gap-2 pr-1 max-h-[50vh]">
          {(Object.keys(ACTION_LABELS) as (keyof KeyBindings)[]).map((action) => {
            const isListening = listeningAction === action;
            const currentCode = bindings[action];

            return (
              <div
                key={action}
                className="flex items-center justify-between p-2 bg-[#252525] border-2 border-[#444] hover:border-[#666] transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-white">{ACTION_LABELS[action]}</span>
                  {action === 'sprint' && (
                    <span className="text-[10px] text-emerald-400">Varsayılan: Sol Shift</span>
                  )}
                  {action === 'sneak' && (
                    <span className="text-[10px] text-amber-300">Varsayılan: C (Düşmeyi önler)</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    Sound.click();
                    setListeningAction(action);
                  }}
                  className={`min-w-[140px] px-3 py-1.5 font-mono text-xs font-bold border-2 transition-all ${
                    isListening
                      ? 'bg-yellow-500 text-black border-yellow-200 animate-pulse'
                      : 'bg-[#4a4a4a] text-white border-[#888] hover:bg-[#5a5a5a] active:bg-[#333]'
                  }`}
                >
                  {isListening ? 'Tuşa Basın...' : formatKeyCode(currentCode)}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-2 pt-2 border-t-2 border-[#555]">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="mc-btn flex-1 !text-xs !py-2 bg-amber-950/80 border-amber-700 hover:bg-amber-900"
          >
            Varsayılana Sıfırla
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="mc-btn flex-1 !text-xs !py-2 bg-emerald-800 border-emerald-600 hover:bg-emerald-700"
          >
            Kaydet & Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
