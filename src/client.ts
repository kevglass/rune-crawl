import { disableShadows, lookAt, renderScene, worldSetup } from './renderer';
import { animateModel, attach, createFromKayAnimations, getAnimations, instanceModel, loadModel, onAllLoaded, updateAnimations } from './modelLoader';
import { Object3D, Object3DEventMap, Vector3 } from 'three';
import nipplejs, { JoystickManager } from 'nipplejs';
import { getTownModel, loadAllTownModels } from './townModels';
import { generateTown, townModelMapping } from './townGenerator';

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
  scene.add(playerModel);
  attach(playerModel, shotgun, "handSlotRight")
  animateModel(playerModel, "Idle");

  const pieceSize = 15;

  for (let x = 0; x < town.size; x++) {
    for (let y = 0; y < town.size; y++) {
      const segment = town.map[x + (y * town.size)];
      if (segment) {
        const ref = townModelMapping[segment.model];
        if (ref) {
          const template = getTownModel(ref);
          const model = instanceModel(template);
          scene.add(model);
          model.scale.set(pieceSize / 2, pieceSize / 2, pieceSize / 2);
          model.rotateY(segment.rotation);
          model.position.x = ((x + 0.5) * pieceSize)
          model.position.z = ((y + 0.5) * pieceSize)
        }
      }
    }
  }
  for (const item of town.items) {
    const ref = townModelMapping[item.model];
    if (ref) {
      const template = getTownModel(ref);
      const model = instanceModel(template);
      scene.add(model);
      model.scale.set(pieceSize / 2, pieceSize / 2, pieceSize / 2);
      model.rotateY(item.rotation);
      model.position.x = ((item.x + 0.5) * pieceSize)
      model.position.z = ((item.y + 0.5) * pieceSize)
    }
  }

  playerModel.position.x = (town.size / 2 * pieceSize);
  playerModel.position.z = town.size / 2 * pieceSize - (pieceSize / 2);
  playerModel.position.y = 0.5;
  lookAt(playerModel);
});

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
        playerModel.translateZ(movePerFrame);
        change = true;
      }
      if (keys["ArrowDown"] || keys["s"]) {
        playerModel.translateZ(-movePerFrame/2);
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
        playerModel.translateZ(controls.y * movePerFrame * (controls.y < 0 ? 0.5 : 1));
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