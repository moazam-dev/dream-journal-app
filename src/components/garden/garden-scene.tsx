'use dom';

import type { DOMProps } from 'expo/dom';
import { useEffect, useRef } from 'react';

import { createGarden, type Garden, type GardenPick, type LostCounts } from './garden-engine';

/**
 * One change to the garden. A new `id` applies it once (props arrive again on every
 * re-render, so older ids are ignored).
 */
export type SceneCommand = {
  id: number;
  growth: number;
  wilted: boolean;
  /** Jump here first, then grow or wilt into `growth` after `delay` ms. */
  from?: { growth: number; wilted: boolean; delay: number };
  burst?: 'grow' | 'wilt' | null;
  /** Report what fades between these two growths back through `onLost`. */
  lost?: [number, number];
};

type GardenSceneProps = {
  command: SceneCommand;
  autoSpin: boolean;
  /** Stop drawing while another screen covers the garden. */
  paused: boolean;
  onReady: () => Promise<void>;
  onPick: (pick: GardenPick | null) => Promise<void>;
  onDrag: () => Promise<void>;
  onLost: (counts: LostCounts) => Promise<void>;
  dom?: DOMProps;
};

/**
 * The dream garden in 3D (three.js). A DOM component: on phones it runs in a web view,
 * on the web it's an ordinary element. Drag to turn it, tap a plant to pick it.
 */
export default function GardenScene({ command, autoSpin, paused, onReady, onPick, onDrag, onLost }: GardenSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const garden = useRef<Garden | null>(null);
  const applied = useRef(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The latest callbacks, for the scene's taps and drags.
  const callbacks = useRef({ onPick, onDrag });

  useEffect(() => {
    callbacks.current = { onPick, onDrag };
  }, [onPick, onDrag]);

  useEffect(() => {
    if (!host.current) return;
    const scene = createGarden(host.current, {
      onPick: (pick) => void callbacks.current.onPick(pick),
      onDrag: () => void callbacks.current.onDrag(),
    });
    garden.current = scene;
    void onReady();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      scene.dispose();
      garden.current = null;
      applied.current = -1;
    };
    // Built once; onReady is only needed the first time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const scene = garden.current;
    if (!scene || command.id === applied.current) return;
    applied.current = command.id;
    if (timer.current) clearTimeout(timer.current);

    if (command.lost) void onLost(scene.countLost(command.lost[0], command.lost[1]));

    const settle = () => {
      scene.setGrowth(command.growth);
      scene.setWilt(command.wilted ? 1 : 0);
      if (command.burst) scene.burst(command.burst);
    };
    if (command.from) {
      scene.setGrowth(command.from.growth, true);
      scene.setWilt(command.from.wilted ? 1 : 0, true);
      timer.current = setTimeout(settle, command.from.delay);
    } else {
      settle();
    }
  }, [command, onLost]);

  useEffect(() => {
    garden.current?.setAuto(autoSpin);
  }, [autoSpin]);

  useEffect(() => {
    garden.current?.setPaused(paused);
  }, [paused]);

  return <div ref={host} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#1d1838' }} />;
}
