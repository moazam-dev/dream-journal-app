/**
 * One row of the `dreams` table in Supabase.
 * Field names match the database columns exactly, so no conversion is needed.
 */

/** Where the AI reflection is: not done yet, done, or failed (the user can retry). */
export type AnalysisStatus = 'pending' | 'completed' | 'failed';

/** Where the AI image is: not started, being created on the server, done, or failed (retry). */
export type ImageStatus = 'pending' | 'generating' | 'completed' | 'failed';

/** Where the spoken reflection is: not made yet, being made, done, or failed (retry). */
export type AudioStatus = 'pending' | 'generating' | 'completed' | 'failed';

export type Dream = {
  id: string;
  dream_text: string;
  /** ISO date string, e.g. "2026-09-26T07:30:00+00:00" */
  created_at: string;

  // AI reflection fields. They are `null` until analysis_status is 'completed'.
  title: string | null;
  summary: string | null;
  mood: string | null;
  themes: string[] | null;
  reflection: string | null;
  analysis_status: AnalysisStatus;

  // AI image. `image_url` is a public link to the file in the `dream-images` bucket.
  image_url: string | null;
  image_status: ImageStatus;

  // Spoken reflection. `audio_url` is a public link to the WAV file in the `dream-audio` bucket.
  audio_url: string | null;
  audio_status: AudioStatus;

  // Details the dreamer adds themselves after the reflection. Missing on rows saved
  // before these columns existed, so read them with a fallback.
  user_mood?: string | null;
  people?: string[];
  places?: string[];

  // Card colour picked on the Entries screen (one of DREAM_COLORS in utils/entries).
  // Missing or null means the colour comes from the mood.
  color?: string | null;
};

/** The parts of a dream the dreamer can change. */
export type DreamDetails = {
  user_mood: string | null;
  people: string[];
  places: string[];
};
