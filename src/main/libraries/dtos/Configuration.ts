import { Game } from './Game';

export interface Configuration {
  checkInterval: number;
  remote: string;
  bigpicture: boolean;
  games: Array<Game>;
}
