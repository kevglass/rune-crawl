import { lookAt, renderScene, worldSetup } from './worldSetup';
import { animateModel, attach, createFromKayAnimations, getAnimations, instanceModel, loadModel, onAllLoaded, updateAnimations } from './modelLoader';
import { Object3D, Object3DEventMap } from 'three';
import nipplejs, { JoystickManager } from 'nipplejs';
import { getTownModel, loadAllTownModels } from './townModels';
import { generateTown, townModelMapping } from './townGenerator';

const prototype = loadModel("prototype.glb", true, false);
const survivor = loadModel("character_survivor.gltf", true, false);
const shotgun = loadModel("shotgun.gltf.glb", true, false);

let playerModel: Object3D<Object3DEventMap>;

const joystick: JoystickManager = nipplejs.create({
  mode: "static",
  zone: document.getElementById("joystick") ?? document.body,
  position: { left: '25%', bottom: '35%' },
  threshold: 0.2,
});
joystick.on("move", (event, joystick) => {
  // controls.x = Math.abs(joystick.vector.x) < 0.1 ? 0 : joystick.vector.x;
  // controls.y = Math.abs(joystick.vector.y) < 0.1 ? 0 : joystick.vector.y;
});
joystick.on("end", () => {
  // controls.x = 0;
  // controls.y = 0;
});

const town = generateTown(100);

loadAllTownModels();

onAllLoaded(() => {
  // console.log(getAnimations(prototype));
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

  for (let x=0;x<town.size;x++) {
    for (let y=0;y<town.size;y++) {
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
  lookAt(playerModel.position.x, playerModel.position.y, playerModel.position.z + 3);
});


let lastUpdate = Date.now();

function animate() {
  if (playerModel) {
    // playerModel.rotateY(0.05);
  }
  const delta = (Date.now() - lastUpdate) / 1000;
  updateAnimations(delta)
  lastUpdate = Date.now();

  requestAnimationFrame(animate);
  renderScene();
}
animate();

Rune.initClient({
  onChange: () => {
    // do nothing
  }
});