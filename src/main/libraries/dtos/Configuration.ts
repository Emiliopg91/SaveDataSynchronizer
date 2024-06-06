import { Game } from './Game';

export interface Configuration {
  checkInterval: number;
  remote: string;
  games: Array<Game>;
}
