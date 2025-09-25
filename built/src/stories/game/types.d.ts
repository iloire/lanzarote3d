import { Location } from "../flyzones/locations/index";
export type GameStartOptions = {
    startingLocation: Location;
    windSpeedMetresPerSecond: number;
    windDirectionDegreesFromNorth: number;
};
export declare enum GameStatus {
    NonStarted = 0,
    Started = 1,
    Paused = 2,
    Finished = 3
}
//# sourceMappingURL=types.d.ts.map