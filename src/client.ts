import { disableShadows, lookAt, renderScene, worldSetup } from './renderer';
import { animateModel, attach, createFromKayAnimations, getAnimations, loadModel, onAllLoaded, recolor, updateAnimations } from './modelLoader';
import { Object3D, Object3DEventMap, Scene, Vector3 } from 'three';
import nipplejs, { JoystickManager } from 'nipplejs';
import { loadAllTownModels } from './townModels';
import { getTownCollisionAt } from './town';
import { renderSize } from './contants';
import { renderTown } from './renderTown';
import { Actor, ControlState, towns } from './logic';

const prototype = loadModel("prototype.glb", true, false);
const survivor = loadModel("character_survivor.gltf", true, true);
const shotgun = loadModel("shotgun.gltf.glb", true, false);

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

const fpsInterval = 1000 / 30;
let lastFrame = 0;
let actorModels: Record<string, Object3D> = {};

let scene!: Scene;
let lastUpdateToServer = 0;
let townIndex = -1;

window.addEventListener("keydown", ({ key }) => {
  if (key === "ArrowUp" || key === "w") {
    controls.y = -1;
  }
  if (key === "ArrowDown" || key === "s") {
    controls.y = 1;
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

let over = 0;
const UP = new Vector3(0, 1, 0);

loadAllTownModels();

onAllLoaded(() => {
  console.log(getAnimations(prototype));
  if (shotgun.model) {
    shotgun.model.scene.translateX(-0.4);
    shotgun.model.scene.translateY(0.2);
  }
  scene = worldSetup(false);

  Rune.initClient({
    onChange: (update) => {
      // do nothing
      if (update.game.townIndex !== townIndex) {
        townIndex = update.game.townIndex;
        actorModels = {};
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
        model.setRotationFromAxisAngle(UP, actor.r);

        const height = getTownCollisionAt(towns[townIndex], actor.x, actor.y);
        if (height < 0.15 && height > 0) {
          model.position.y = height * renderSize / 2;
        }

        if (actor.controls.x || actor.controls.y) {
          if (actor.controls.y > 0) {
            animateModel(model, "Walk");
          } else {
            animateModel(model, "Run");
          }
        } else {
          animateModel(model, "Idle");
        }
      }

      const infoDiv = document.getElementById("info");
      if (infoDiv) {
        let info = "";
        info += JSON.stringify({ x: update.game.actors[0].x, y: update.game.actors[0].y, r: update.game.actors[0].r });
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
  const model = createFromKayAnimations(scene, prototype, survivor, "character_survivor");
  recolor(model, "BlueDarker", actor.color);

  scene.add(model);
  attach(model, shotgun, "handSlotRight")
  animateModel(model, "Idle");

  renderTown(scene, towns[townIndex]);

  model.position.x = actor.x * renderSize;
  model.position.z = actor.y * renderSize;
  model.position.y = 0.5;
  const height = getTownCollisionAt(towns[townIndex], model.position.x, model.position.z);
  if (height < 0.15 && height > 0) {
    model.position.y = height * renderSize / 2;
  }

  return model;
}

function animate() {
  const now = Date.now();
  const elapsed = now - lastFrame;

  if (elapsed > fpsInterval) {
    const o = elapsed - fpsInterval;
    if (o > 20 && over < 100) {
      over++;
      if (over >= 100) {
        disableShadows();
      }
    }

    if (playerModel) {
      maybeSendUpdate();
      lookAt(playerModel);
    }
    updateAnimations(elapsed / 1000)
    lastFrame = now;

    renderScene();
  }
  requestAnimationFrame(animate);
}
animate();