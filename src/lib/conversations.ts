import { File, Paths } from 'expo-file-system';

import type { TranscriptEntry } from '@/lib/deepgram/types';

/**
 * Voice conversations, kept on the phone only.
 *
 * A dream saved from the voice companion stores just the dreamer's own words (that is what
 * `analyze-dream` reads, and what `dream_text` holds). The back-and-forth — what the companion
 * asked and what they answered — has nowhere to go on the server, so it is kept here, keyed by
 * the dream it became, and read back by the Dream screen's transcript tab.
 */

/** One line of a kept conversation. Same shape as a live transcript entry, minus the id. */
export type ConversationLine = { role: 'user' | 'assistant'; text: string };

/** The longest conversation worth keeping on the phone. */
const MAX_LINES = 200;

function indexFile() {
  return new File(Paths.document, 'conversations.json');
}

function isLine(value: unknown): value is ConversationLine {
  if (!value || typeof value !== 'object') return false;
  const line = value as Record<string, unknown>;
  return (line.role === 'user' || line.role === 'assistant') && typeof line.text === 'string';
}

/** Every kept conversation, by dream id (empty if the file can't be read). */
function loadAll(): Record<string, ConversationLine[]> {
  try {
    const file = indexFile();
    if (!file.exists) return {};
    const parsed = JSON.parse(file.textSync()) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const all: Record<string, ConversationLine[]> = {};
    for (const [id, lines] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(lines)) all[id] = lines.filter(isLine);
    }
    return all;
  } catch {
    return {};
  }
}

/** The conversation a dream was told in, or null when it wasn't told out loud. */
export function loadConversation(dreamId: string): ConversationLine[] | null {
  const lines = loadAll()[dreamId];
  return lines && lines.length > 0 ? lines : null;
}

/**
 * Keeps the conversation a dream came from. Never throws: losing the transcript is a
 * small loss next to the dream itself, which is already saved on the server.
 */
export function saveConversation(dreamId: string, entries: readonly TranscriptEntry[]): void {
  const lines: ConversationLine[] = entries
    .map((entry) => ({ role: entry.role, text: entry.text.trim() }))
    .filter((line) => line.text.length > 0)
    .slice(-MAX_LINES);
  if (lines.length === 0) return;

  try {
    const all = loadAll();
    all[dreamId] = lines;
    const file = indexFile();
    if (!file.exists) file.create();
    file.write(JSON.stringify(all));
  } catch (error) {
    console.warn('Could not keep the voice conversation', error);
  }
}
