import World from "../components/world";

export interface IWorldEntity {
  addToWorld(world: World): void;
  update(): void;
}
