import { lookAt, renderScene, worldSetup } from './renderer';
import { cloneModel, loadModel, onAllLoaded } from './modelLoader';
import { Object3D, Object3DEventMap, Scene, Vector3 } from 'three';
import nipplejs, { JoystickManager } from 'nipplejs';
import { loadAllTownModels } from './townModels';
import { renderSize } from './contants';
import { renderTown } from './renderTown';
import { Actor, ControlState, towns } from './logic';

const player = loadModel("sedan.glb");

let fps = 0;
let fpsCount = 0;
let lastFps = 0;

let playerModel: Object3D<Object3DEventMap>;

const lastSentControls: ControlState = {
  x: 0,
  y: 0
}

const controls: ControlState = {
  x: 0,
  y: 0
};

const joystick: JoystickManager = nipplejs.create({
  mode: "static",
  zone: document.getElementById("joystick") ?? document.body,
  position: { left: '25%', bottom: '35%' },
  threshold: 0.2,
});

joystick.on("move", (event, joystick) => {
  controls.x = joystick.vector.x;
  controls.y = joystick.vector.y;
});
joystick.on("end", () => {
  controls.x = 0;
  controls.y = 0;
});

let lastFrame = 0;
let actorModels: Record<string, Object3D> = {};

let scene!: Scene;
let lastUpdateToServer = 0;
let townIndex = -1;
let townModels: Object3D[] = [];

window.addEventListener("keydown", ({ key }) => {
  if (key === "ArrowUp" || key === "w") {
    controls.y = 1;
  }
  if (key === "ArrowDown" || key === "s") {
    controls.y = -1;
  }
  if (key === "ArrowLeft" || key === "a") {
    controls.x = -1;
  }
  if (key === "ArrowRight" || key === "d") {
    controls.x = 1;
  }
});
window.addEventListener("keyup", ({ key }) => {
  if (key === "ArrowUp" || key === "w") {
    controls.y = 0;
  }
  if (key === "ArrowDown" || key === "s") {
    controls.y = 0;
  }
  if (key === "ArrowLeft" || key === "a") {
    controls.x = 0;
  }
  if (key === "ArrowRight" || key === "d") {
    controls.x = 0;
  }
});

const UP = new Vector3(0, 1, 0);

loadAllTownModels();

onAllLoaded(() => {
  scene = worldSetup();

  Rune.initClient({
    onChange: (update) => {
      if (update.event?.name !== 'update') {
        return;
      }
      // do nothing
      if (update.game.townIndex !== townIndex) {
        townIndex = update.game.townIndex;
        actorModels = {};
        townModels = renderTown(scene, towns[townIndex]);
      }

      for (const actor of update.game.actors) {
        let model = actorModels[actor.id];

        if (!model) {
          model = actorModels[actor.id] = createActorModel(actor);
          if (actor.id === update.yourPlayerId) {
            playerModel = model;
            lookAt(model);
          }
        }

        model.position.x = actor.x * renderSize;
        model.position.z = actor.y * renderSize;
        model.setRotationFromAxisAngle(UP, Math.PI + actor.r);

        // const height = getTownCollisionAt(towns[townIndex], actor.x, actor.y);
        // if (height < 0.15 && height > 0) {
        //   model.position.y = height * renderSize / 2;
        // }
      }

      const infoDiv = document.getElementById("info");
      if (infoDiv) {
        const info = "" + fps;
        infoDiv.innerHTML = info;
      }
    }
  });
});

function maybeSendUpdate(): void {
  if (lastSentControls.x !== controls.x || lastSentControls.y !== controls.y) {
    if (Date.now() - lastUpdateToServer > 200) {
      lastUpdateToServer = Date.now();
      Rune.actions.update({ x: controls.x, y: controls.y })
      lastSentControls.x = controls.x;
      lastSentControls.y = controls.y;
    }
  }
}
function createActorModel(actor: Actor): Object3D {
  const model = cloneModel(player);
  model.scale.set(2, 2, 2);
  scene.add(model);

  return model;
}

function animate() {
  const now = Date.now();

  fpsCount++;
  if (now - lastFps > 1000) {
    fps = fpsCount;
    fpsCount = 0;
    lastFps = now;
  }

  if (playerModel) {
    maybeSendUpdate();
    lookAt(playerModel);
  }
  lastFrame = now;

  if (scene && playerModel) {
    const cx = playerModel.position.x;
    const cz = playerModel.position.z;
    for (const obj of townModels) {
      if (obj.userData.cull) {
        const shouldBeVisible = (Math.abs(cx - obj.position.x) < renderSize * 2.5) && (Math.abs(cz - obj.position.z) < renderSize * 3.5);
        if (shouldBeVisible) {
          if (!obj.parent) {
            scene.add(obj);
          }
        } else {
          if (obj.parent) {
            obj.removeFromParent();
          }
        }
      }
    }
    renderScene();
  }
  requestAnimationFrame(animate);
}
animate();