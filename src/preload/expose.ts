import {
  DefaulLevel,
  LoggerRequest,
  RestClientRequest,
  RestClientResponse
} from '@tser-framework/commons';
import { TranslatorRenderer } from '@tser-framework/renderer';
import { IpcRendererEvent, ipcRenderer } from 'electron';

import { author, name } from '../../package.json';
import translations from '../../translations.i18n.json';

export const exposed = {
  api: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cfg(): Record<string, any> {
      return ipcRenderer.invoke('cfg');
    },
    log(data: LoggerRequest): void {
      ipcRenderer.send('log', data);
    },
    rest<T>(request: RestClientRequest<T>): Promise<RestClientResponse<T>> {
      return ipcRenderer.invoke('rest', request);
    },
    syncInProgress(callback: (event: IpcRendererEvent, value: boolean) => void): () => void {
      ipcRenderer.on('sync-in-progress', callback);
      return () => {
        ipcRenderer.removeListener('sync-in-progress', callback);
      };
    },
    exploreExecutable(): Promise<string> {
      return ipcRenderer.invoke('explore-exe');
    },
    exploreLocal(): Promise<string> {
      return ipcRenderer.invoke('explore-local');
    },
    exploreRemote(): Promise<string> {
      return ipcRenderer.invoke('explore-remote');
    },
    getLocalFiles(localDir: string): Promise<string[]> {
      return ipcRenderer.invoke('list-local', localDir);
    },
    receiveType(callback: (event: IpcRendererEvent, type: string) => void): void {
      ipcRenderer.on('new-type', callback);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getGames(type: string): Promise<Array<any>> {
      return ipcRenderer.invoke('get-games', type);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getRunningGames(type: string): Promise<Array<string>> {
      return ipcRenderer.invoke('get-running-games', type);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAllGames(): Promise<Array<any>> {
      return ipcRenderer.invoke('get-all-games');
    },
    launch(name: string): void {
      return ipcRenderer.send('launch', name);
    },
    sync(name: string): void {
      return ipcRenderer.send('sync', name);
    },
    saveEntry(game: object): Promise<void> {
      return ipcRenderer.invoke('save-entry', game);
    },
    deleteEntry(name: string): Promise<void> {
      return ipcRenderer.invoke('delete-entry', name);
    },
    listenRunning(
      callback: (event: IpcRendererEvent, app: string, running: boolean) => void
    ): () => void {
      ipcRenderer.on('listen-running', callback);
      return () => {
        ipcRenderer.removeListener('listen-running', callback);
      };
    },
    listenUpdate(callback: (event: IpcRendererEvent, pendingUpdate: boolean) => void): () => void {
      ipcRenderer.on('listen-update', callback);
      return () => {
        ipcRenderer.removeListener('listen-update', callback);
      };
    },
    triggerUpdate(): void {
      ipcRenderer.send('trigger-update');
    },
    buyMeACoffee(): void {
      ipcRenderer.send('buy-me-a-coffee');
    }
  },
  app: {
    name: name,
    email: author.email
  },
  env: {
    LOG_LEVEL: process.env.LOG_LEVEL || DefaulLevel
  },
  translations: TranslatorRenderer.buildTranslations(translations)
};

export type ExposedDefinition = typeof exposed;
