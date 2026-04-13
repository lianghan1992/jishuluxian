import { AppData, AppConfig } from '../types';

export class FileSystemManager {
  private directoryHandle: FileSystemDirectoryHandle | null = null;

  async requestPermission() {
    try {
      this.directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      return true;
    } catch (error) {
      console.error('Directory picker error:', error);
      return false;
    }
  }

  async saveData(data: AppData) {
    if (!this.directoryHandle) return;
    const fileHandle = await this.directoryHandle.getFileHandle('data.json', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  }

  async loadData(): Promise<AppData | null> {
    if (!this.directoryHandle) return null;
    try {
      const fileHandle = await this.directoryHandle.getFileHandle('data.json');
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async saveConfig(config: AppConfig) {
    if (!this.directoryHandle) return;
    const fileHandle = await this.directoryHandle.getFileHandle('config.json', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(config, null, 2));
    await writable.close();
  }

  async loadConfig(): Promise<AppConfig | null> {
    if (!this.directoryHandle) return null;
    try {
      const fileHandle = await this.directoryHandle.getFileHandle('config.json');
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async saveSource(filename: string, content: string) {
    if (!this.directoryHandle) return;
    try {
      const sourcesDir = await this.directoryHandle.getDirectoryHandle('sources', { create: true });
      const fileHandle = await sourcesDir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (error) {
      console.error('Save source error:', error);
    }
  }
}

export const fsManager = new FileSystemManager();
