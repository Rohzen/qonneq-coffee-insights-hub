// Settings storage for Odoo connection configuration

const SETTINGS_KEY = 'qonneq_settings';

export interface OdooSettings {
  serverUrl: string;
  database: string;
}

const DEFAULT_SETTINGS: OdooSettings = {
  serverUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8069',
  database: import.meta.env.VITE_ODOO_DATABASE || '',
};

export function getSettings(): OdooSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Partial<OdooSettings>): void {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function clearSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
}

export function getServerUrl(): string {
  return getSettings().serverUrl;
}

export function getDatabase(): string {
  return getSettings().database;
}
