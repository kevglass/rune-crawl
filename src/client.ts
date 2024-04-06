import { disableShadows, lookAt, renderScene, worldSetup } from './renderer';
import { animateModel, attach, createFromKayAnimations, getAnimations, loadModel, onAllLoaded, recolor, updateAnimations } from './modelLoader';
import { Object3D, Object3DEventMap, Vector3 } from 'three';
import nipplejs, { JoystickManager } from 'nipplejs';
import { loadAllTownModels } from './townModels';
import { generateTown, getTownCollisionAt } from './town';
import { renderSize } from './contants';
import { renderTown } from './renderTown';

const prototype = loadModel("prototype.glb", true, false);
const survivor = loadModel("character_survivor.gltf", true, true);
const shotgun = loadModel("shotgun.gltf.glb", true, false);

let playerModel: Object3D<Object3DEventMap>;

const controls = {
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

const keys: Record<string, boolean> = {};
const fpsInterval = 1000 / 30;
let lastFrame = 0;
const movePerFrame = 0.5;
const turnPerFrame = 0.1

window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
});
window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

const town = generateTown(100);
let over = 0;

loadAllTownModels();

onAllLoaded(() => {
  console.log(getAnimations(prototype));
  shotgun.model!.scene.translateX(-0.4);
  shotgun.model!.scene.translateY(0.2);

  const scene = worldSetup(false);

  // playerModel = createAnimated(scene, prototype, duck, "character_duck");
  // playerModel = applyTexture(instanceModel(scene, monster), textureB);
  playerModel = createFromKayAnimations(scene, prototype, survivor, "character_survivor");
  recolor(playerModel, "BlueDarker", "#44aa80");
  
  scene.add(playerModel);
  attach(playerModel, shotgun, "handSlotRight")
  animateModel(playerModel, "Idle");

  renderTown(scene, town);

  playerModel.position.x = (town.size / 2 * renderSize);
  playerModel.position.z = town.size / 2 * renderSize - (renderSize / 2);
  playerModel.position.y = 0.5;
  lookAt(playerModel);
});

function moveForwards(amount: number) {
  const direction = playerModel.getWorldDirection(new Vector3());
  let bestHeight = 0;
  for (let i=-0.25;i<0.25;i+=0.125) {
    const xp = playerModel.position.x + (direction.x * amount * 2) + (direction.z * i);
    const yp = playerModel.position.z + (direction.z * amount * 2) + (direction.x * i);
    const heightAt = getTownCollisionAt(town, xp, yp);
    if (heightAt > 0.15) {
      return;
    }

    bestHeight = Math.max(bestHeight, heightAt);
  }

  playerModel.translateZ(amount);
  if (bestHeight !== 0) {
    playerModel.position.y = (bestHeight*renderSize/2);
  }
}

function moveBackwards(amount: number) {
  moveForwards(-amount / 2);
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
      let change = false;

      if (keys["ArrowUp"] || keys["w"]) {
        moveForwards(movePerFrame);
        change = true;
      }
      if (keys["ArrowDown"] || keys["s"]) {
        moveBackwards(movePerFrame);
        change = true;
      }
      if (keys["ArrowLeft"] || keys["a"]) {
        playerModel.rotateY(turnPerFrame);
        change = true;
      }
      if (keys["ArrowRight"] || keys["d"]) {
        playerModel.rotateY(-turnPerFrame);
        change = true;
      }

      if (Math.abs(controls.x) > 0.4) {
        playerModel.rotateY(-controls.x * turnPerFrame);
        change = true;
      }
      if (Math.abs(controls.y) > 0.1) {
        if (controls.y < 0) {
          moveBackwards(-controls.y * movePerFrame);
        } else {
          moveForwards(controls.y * movePerFrame);
        }
        change = true;
      }
      if (change) {
        lookAt(playerModel);
        animateModel(playerModel, "Run");
      } else {
        animateModel(playerModel, "Idle");
      }
    }
    updateAnimations(elapsed / 1000)
    lastFrame = now;

    renderScene();
  }
  requestAnimationFrame(animate);
}
animate();

Rune.initClient({
  onChange: () => {
    // do nothing
  }
});