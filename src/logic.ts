import type { PlayerId, RuneClient } from "rune-games-sdk/multiplayer"
import { Town, generateTown, getTownCollisionAt } from "./town";

export const TOWN_SIZE = 22;
export const COLS = ["#44aa80", "#aa4480", "#4480aa"];

const movePerFrame = 0.03;
const turnPerFrame = 0.1

export type ControlState = {
  x: number;
  y: number;
}


export interface Actor {
  id: PlayerId;
  color: string;
  x: number;
  y: number;
  r: number;
  controls: ControlState;
}

export interface GameState {
  townIndex: number;
  actors: Actor[];
}

type GameActions = {
  update: (params: ControlState) => void
}

declare global {
  const Rune: RuneClient<GameState, GameActions>
}

export const towns: Town[] = [
  generateTown(548, 22),
];

Rune.initLogic({
  minPlayers: 1,
  maxPlayers: 2,
  setup: (allPlayerIds) => {
    const state: GameState = {
      actors: [],
      townIndex: 0,
    }
    const town = towns[0];

    for (const playerId of allPlayerIds) {
      const actor: Actor = {
        id: playerId,
        color: COLS[allPlayerIds.indexOf(playerId) % COLS.length],
        x: town.size / 2,
        y: town.size / 2,
        r: 0,
        controls: {
          x: 0,
          y: 0
        }
      }
      state.actors.push(actor);
    }

    return state;
  },
  updatesPerSecond: 30,
  update: ({ game }) => {
    for (const actor of game.actors) {
      const controls = actor.controls;

      if (Math.abs(controls.x) > 0.4) {
        actor.r += -controls.x * turnPerFrame;
      }
      if (Math.abs(controls.y) > 0.1) {
        const town = towns[0];

        if (controls.y < 0) {
          move(town, actor, -controls.y * movePerFrame);
        } else {
          move(town, actor, -controls.y * movePerFrame / 2);
        }
      }
    }
  },
  actions: {
    update: ({ x, y }, context) => {
      // do nothing
      const actor = context.game.actors.find(a => a.id === context.playerId);
      if (actor) {
        actor.controls.x = x;
        actor.controls.y = y;
      }
    }
  },
})

function move(town: Town, actor: Actor, delta: number): void {
  const x = Math.sin(actor.r);
  const y = Math.cos(actor.r);

  let bestHeight = 0;
  const scanSize = 0.01;

  for (let i = -scanSize; i <= scanSize; i += scanSize / 2) {
    const xp = actor.x + (x * delta * 2) + (y * i);
    const yp = actor.y + (y * delta * 2) + (x * i);
    const heightAt = getTownCollisionAt(town, xp, yp);
    if (heightAt > 0.15) {
      return;
    }

    bestHeight = Math.max(bestHeight, heightAt);
  }

  actor.x += delta * x;
  actor.y += delta * y;
}