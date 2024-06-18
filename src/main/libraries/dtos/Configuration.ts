import { Game } from './Game';

export interface Configuration {
  checkInterval: number;
  remote: string;
  minimized: boolean;
  bigpicture: boolean;
  games: Array<Game>;
}
