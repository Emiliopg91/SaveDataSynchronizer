import { Game } from './Game';

export interface Configuration {
  checkInterval: number;
  games: Array<Game>;
}
