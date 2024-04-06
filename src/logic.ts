import type { PlayerId, RuneClient } from "rune-games-sdk/multiplayer"
import { Town, generateTown } from "./town";

export const TOWN_SIZE = 22;
export const COLS = ["#44aa80", "#aa4480", "#4480aa"];

export interface Actor {
  id: PlayerId;
  color: string;
  x: number;
  y: number;
  r: number;
}

export interface GameState {
  seed: number;
  actors: Actor[];
}

type GameActions = {
  update: (params: {x: number, y: number, r: number}) => void
}

declare global {
  const Rune: RuneClient<GameState, GameActions>
}

const town: Town = {
  seed: 0,
  map: [],
  items: [],
  size: 0,
  collisionGridSize: 0,
  collision: []
}

Rune.initLogic({
  minPlayers: 2,
  maxPlayers: 2,
  setup: (allPlayerIds) => {
    const state: GameState = {
      actors: [],
      seed: 548 //Math.floor(Math.random() * 10000)
    }

    console.log("World Seed: " + state.seed);

    generateTown(state.seed, TOWN_SIZE, town);
    for (const playerId of allPlayerIds) {
      const actor: Actor = {
        id: playerId,
        color: COLS[allPlayerIds.indexOf(playerId) % COLS.length],
        x: town.size / 2,
        y: town.size / 2,
        r: 0
      }
      state.actors.push(actor);
    }

    return state;
  },
  actions: {
    update: (params, context) => {
      // do nothing
      const actor = context.game.actors.find(a => a.id === context.playerId);
      if (actor) {
        actor.x = params.x;
        actor.y = params.y;
        actor.r = params.r;
      }
    }
  },
})
