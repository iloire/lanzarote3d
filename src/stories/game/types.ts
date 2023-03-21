import * as THREE from "three";
import { Location } from "../locations/index";

export type GameStartOptions = {
  startingLocation: Location;
  windSpeedMetresPerSecond: number;
  windDirectionDegreesFromNorth: number;
};

export enum GameStatus {
  NonStarted,
  Started,
  Paused,
  Finished,
}
