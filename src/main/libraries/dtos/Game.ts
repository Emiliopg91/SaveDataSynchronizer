export interface Game {
  icon?: string;
  name: string;
  category: 'game' | 'emulator' | 'tools';
  executable: string;
  localDir: string;
  remoteDir: string;
  defaultIO?: boolean;
  inclusions?: Array<string>;
  exclusions?: Array<string>;
  process?: string;
  psProcess?: string;
  wasRunning?: boolean;
}
