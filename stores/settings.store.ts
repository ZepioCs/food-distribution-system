import { makeAutoObservable } from "mobx";
import type { RootStore } from "./root.store";

interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es';
  notifications: boolean;
  autoLogout: boolean;
  tablePageSize: number;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  language: 'en',
  notifications: true,
  autoLogout: false,
  tablePageSize: 10
};

const isClient = typeof window !== 'undefined';

export class SettingsStore {
  settings: Settings;
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.settings = DEFAULT_SETTINGS;
    makeAutoObservable(this);
    
    if (isClient) {
      // Load settings after initialization on client side
      this.settings = this.loadSettings();
    }
  }

  private loadSettings(): Settings {
    if (!isClient) return DEFAULT_SETTINGS;
    
    try {
      const savedSettings = localStorage.getItem('foodDist_settings');
      if (savedSettings) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return DEFAULT_SETTINGS;
  }

  private saveSettings() {
    if (!isClient) return;
    
    try {
      localStorage.setItem('foodDist_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    this.settings = {
      ...this.settings,
      [key]: value
    };
    this.saveSettings();
  }

  resetSettings() {
    this.settings = DEFAULT_SETTINGS;
    this.saveSettings();
  }
} 