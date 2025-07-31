// Map of incorrectly translated app names to correct names
const APP_NAME_CORRECTIONS: Record<string, string> = {
  'Folga': 'Slack',
  'Equipes da Microsoft': 'Microsoft Teams',
  'Discórdia': 'Discord',
  'Ampliação': 'Zoom',
  'Telegrama': 'Telegram',
  'Calendário Google': 'Google Calendar',
  'Documentos Google': 'Google Docs',
  // Add more corrections as needed
};

/**
 * Corrects app names that were incorrectly translated
 * @param appName The potentially incorrect app name
 * @returns The corrected app name
 */
export function correctAppName(appName: string): string {
  return APP_NAME_CORRECTIONS[appName] || appName;
}