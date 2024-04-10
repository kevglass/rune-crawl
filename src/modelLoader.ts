import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { ASSETS } from "./lib/assets";
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

export interface ModelRef {
    model?: THREE.Object3D;
    loaded: boolean;
}

const gltfLoader = new GLTFLoader();

let allLoadedCallback: () => void;
const models: ModelRef[] = [];
const textures: THREE.Texture[] = [];

export type KayBone = "armRight" | "armLeft" | "Head" | "Body" | "handSlotLeft" | "handSlotRight";

export function dumpColors(model: THREE.Object3D): void {
    model.traverse(child => {
        if (child instanceof THREE.Mesh) {
            console.log(child.material.name);
        }
    })
}

export function recolor(model: THREE.Object3D, name: string, col: string): void {
    model.traverse(child => {
        if (child instanceof THREE.Mesh) {
            if (child.material.name === name) {
                child.material = child.material.clone();
                child.material.color = new THREE.Color(col);
            }
        }
    })
}

export function applyTexture(model: THREE.Object3D<THREE.Object3DEventMap>, texture: THREE.Texture): THREE.Object3D<THREE.Object3DEventMap> {
    model.traverse(child => {
        if (child instanceof THREE.SkinnedMesh) {
            child.material.map = texture;
        }
    })

    return model;
}

export function cloneModel(modelRef: ModelRef): THREE.Object3D<THREE.Object3DEventMap> {
    if (!modelRef.model) {
        throw "Model hasn't loaded yet";
    }

    const cloned = clone(modelRef.model);

    return cloned;
}

export function loadTexture(ref: string): THREE.Texture {
    const texture = new THREE.TextureLoader().load(ASSETS[ref]);
    texture.flipY = false;

    textures.push(texture);
    return texture;
}

export function loadModel(ref: string): ModelRef {
    const modelRef: ModelRef = {
        loaded: false
    };
    models.push(modelRef);

    gltfLoader.load(ASSETS[ref], (model) => {
        model.scene.traverse(child => {
            child.receiveShadow = true;
            child.castShadow = true;
        });

        modelRef.loaded = true;
        modelRef.model = model.scene;

        if (models.every(m => m.loaded)) {
            allLoadedCallback();
        }
    });

    return modelRef;
}

export function onAllLoaded(callback: () => void) {
    allLoadedCallback = callback;
}

export function getAnimations(modelRef: ModelRef): string[] {
    if (!modelRef.model) {
        throw "Model hasn't loaded yet";
    }

    return modelRef.model.animations.map(anim => anim.name);
}