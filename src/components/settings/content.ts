// Copy and choices from the Afterdream Settings design. Nothing here is saved yet:
// the settings screen is UI only for now.

export type SettingsPage =
  | 'main'
  | 'reminders'
  | 'passcode'
  | 'face'
  | 'export'
  | 'delete'
  | 'feedback'
  | 'terms'
  | 'privacy'
  | 'insta'
  | 'tiktok'
  | 'about';

export const PAGE_TITLES: Record<SettingsPage, string> = {
  main: 'settings',
  reminders: 'reminders',
  passcode: 'passcode',
  face: 'Face ID',
  export: 'export',
  delete: 'delete account',
  feedback: 'feedback',
  terms: 'terms',
  privacy: 'privacy',
  insta: 'Instagram',
  tiktok: 'TikTok',
  about: 'about us',
};

export const REMINDER_TIMES = ['6:30am', '7:00am', '7:30am', '8:00am', '8:30am'];
export const WEEK_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export type ExportFormat = 'pdf' | 'txt' | 'csv';
export type ExportRange = 'all' | 'month' | 'week';

export const EXPORT_FORMATS: { key: ExportFormat; title: string; note: string }[] = [
  { key: 'pdf', title: 'PDF', note: 'to read' },
  { key: 'txt', title: 'TXT', note: 'plain text' },
  { key: 'csv', title: 'CSV', note: 'spreadsheet' },
];

export const EXPORT_RANGES: { key: ExportRange; title: string }[] = [
  { key: 'all', title: 'all time' },
  { key: 'month', title: 'this month' },
  { key: 'week', title: 'this week' },
];

/** Placeholder entry counts until export reads the real journal. */
export const EXPORT_COUNTS: Record<ExportRange, number> = { all: 42, month: 12, week: 5 };

/** Shapes the design draws with CSS border-radius (see `shapeStyle`). */
export type Shape = 'circle' | 'dome' | 'rounded' | 'soft' | 'leaf' | 'drop';

export const FEEDBACK_MOODS: { title: string; color: string; shape: Shape }[] = [
  { title: 'meh', color: '#FF7A35', shape: 'soft' },
  { title: 'good', color: '#A8D8F0', shape: 'circle' },
  { title: 'great', color: '#C9B8F2', shape: 'dome' },
  { title: 'love it', color: '#E2EB98', shape: 'drop' },
];

export const FEEDBACK_TAGS = ['insights', 'visualize', 'reminders', 'speed', 'design', 'bug'];

export const DOCS: Record<'terms' | 'privacy', { heading: string; body: string }[]> = {
  terms: [
    {
      heading: 'using afterdream',
      body: 'afterdream is a personal dream journal. you must be 13 or older to use it, and you’re responsible for keeping your login and passcode safe.',
    },
    {
      heading: 'your content',
      body: 'the dreams you write belong to you. we only process them to give you insights, visualizations and patterns inside the app.',
    },
    {
      heading: 'insights aren’t advice',
      body: 'dream readings are reflective prompts, not medical or psychological advice. if you’re struggling, please reach out to a professional.',
    },
    {
      heading: 'ending your account',
      body: 'you can export or delete your journal any time from settings. deleted data is erased within 30 days.',
    },
  ],
  privacy: [
    {
      heading: 'what we collect',
      body: 'your entries, the moods and tags you add, and basic app usage. we never sell your data or use it for ads.',
    },
    {
      heading: 'how dreams are processed',
      body: 'entries are encrypted in transit and at rest. insights are generated privately and are never used to train public models.',
    },
    {
      heading: 'on your device',
      body: 'passcode and Face ID stay on your phone. we can’t see them and can’t unlock your journal.',
    },
    { heading: 'your controls', body: 'export everything, delete everything, or turn off insights — all from settings.' },
  ],
};

export const SOCIALS: Record<'insta' | 'tiktok', { handle: string; blurb: string; cta: string }> = {
  insta: {
    handle: '@afterdream.app',
    blurb: 'weekly dream prompts, symbol meanings and art made from dreams our community shared.',
    cta: 'open Instagram',
  },
  tiktok: {
    handle: '@afterdream',
    blurb: 'short videos on what your dreams might mean — and the strangest ones we’ve read.',
    cta: 'open TikTok',
  },
};

/** Tile colours for the social preview grid: background, shape colour, shape. */
export const SOCIAL_TILES: { background: string; color: string; shape: Shape }[] = [
  { background: '#2B1B5A', color: '#FF7A35', shape: 'circle' },
  { background: '#E2EB98', color: '#14301C', shape: 'dome' },
  { background: '#FF7A35', color: '#E2EB98', shape: 'rounded' },
  { background: '#14301C', color: '#C9B8F2', shape: 'leaf' },
  { background: '#C9B8F2', color: '#2B1B5A', shape: 'circle' },
  { background: '#A8D8F0', color: '#2B1B5A', shape: 'dome' },
];

export const ABOUT_ROWS: { key: string; value: string }[] = [
  { key: 'version', value: '2.4.0' },
  { key: 'made in', value: 'bangalore & berlin' },
  { key: 'contact', value: 'hello@afterdream.app' },
];
