import { collisionCellsPerTownCell, collisionCellSize } from "./contants";
import { ASSETS } from "./lib/rawassets";

export interface Town {
    seed: number;
    map: Segment[];
    items: Item[];
    size: number;
    collisionGridSize: number;
    collision: number[];
}

export interface Segment {
    model: number;
    type: "ROAD" | "PARK" | "SHOP" | "HOUSE"
    rotation: number;
}

export interface Item {
    model: number;
    rotation: number;
    x: number;
    y: number;
}

interface Point {
    x: number;
    y: number;
}

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const townModelMapping: Record<number, string> = {
    1: "world/road-straight.glb",
    5: "world/road-straight-lightposts.glb",
    2: "world/road-intersection.glb",
    3: "world/road-split.glb",
    4: "world/road-corner.glb",
    10: "world/building-small-a.glb",
    11: "world/building-small-b.glb",
    12: "world/building-small-c.glb",
    13: "world/building-small-d.glb",
    14: "world/building-garage.glb",
    100: "world/pavement.glb",
}

export interface CollisionInfo {
    name: string;
    size: number;
    resolution: number;
    heights: number[];
}

type RandomFunc = () => number;

function seededRandom(a: number): RandomFunc {
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function generateRoad(town: Town, x: number, y: number, north: boolean, south: boolean, east: boolean, west: boolean) {
    if (north) {
        for (let i = y - 1; i >= 0; i--) {
            if (getSegment(town, x, i)) {
                break;
            }
            if (getSegment(town, x - 1, i)) {
                break;
            }
            if (getSegment(town, x + 1, i)) {
                break;
            }
            setSegment(town, x, i, { model: 1, type: "ROAD", rotation: 0 });
        }
    }
    if (south) {
        for (let i = y + 1; i < town.size; i++) {
            if (getSegment(town, x, i)) {
                break;
            }
            if (getSegment(town, x - 1, i)) {
                break;
            }
            if (getSegment(town, x + 1, i)) {
                break;
            }
            setSegment(town, x, i, { model: 1, type: "ROAD", rotation: 0 });
        }
    }
    if (west) {
        for (let i = x - 1; i >= 0; i--) {
            if (getSegment(town, i, y)) {
                break;
            }
            if (getSegment(town, i, y - 1)) {
                break;
            }
            if (getSegment(town, y, y + 1)) {
                break;
            }
            setSegment(town, i, y, { model: 1, type: "ROAD", rotation: 0 });
        }
    }
    if (east) {
        for (let i = x + 1; i < town.size; i++) {
            if (getSegment(town, i, y)) {
                break;
            }
            if (getSegment(town, i, y - 1)) {
                break;
            }
            if (getSegment(town, y, y + 1)) {
                break;
            }
            setSegment(town, i, y, { model: 1, type: "ROAD", rotation: 0 });
        }
    }
}

function contains(rect: Rect, x: number, y: number): boolean {
    return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}

function setSegment(town: Town, x: number, y: number, segment: Segment) {
    town.map[x + (y * town.size)] = segment;
}

function getSegment(town: Town, x: number, y: number): Segment | undefined {
    if (x < 0 || x >= town.size || y < 0 || y >= town.size) {
        return undefined;
    }

    return town.map[x + (y * town.size)]
}

function findPlots(town: Town): Rect[] {
    const plots: Rect[] = [];

    for (let x = 0; x < town.size; x++) {
        for (let y = 0; y < town.size; y++) {
            if (!getSegment(town, x, y)) {
                if (!plots.find(plot => contains(plot, x, y))) {
                    // start new plot
                    let xp = x;
                    let yp = y;
                    for (xp = x; xp < town.size; xp++) {
                        if (getSegment(town, xp, y)) {
                            break;
                        }
                    }
                    for (yp = y; yp < town.size; yp++) {
                        if (getSegment(town, x, yp)) {
                            break;
                        }
                    }

                    const plot = {
                        x, y, width: (xp - x), height: (yp - y)
                    };
                    plots.push(plot);
                }
            }
        }
    }

    return plots;
}

function splitPlot(town: Town, plot: Rect) {
    if (plot.width > plot.height) {
        const xp = plot.x + Math.floor(plot.width / 2);
        for (let y = plot.y; y < plot.y + plot.height; y++) {
            setSegment(town, xp, y, { model: 1, type: "ROAD", rotation: 0 })
        }
    } else {
        const yp = plot.y + Math.floor(plot.height / 2);
        for (let x = plot.x; x < plot.x + plot.width; x++) {
            setSegment(town, x, yp, { model: 1, type: "ROAD", rotation: 0 })
        }
    }
}

function rationalizeRoad(random: RandomFunc, town: Town, x: number, y: number, road: Segment): void {
    const north = getSegment(town, x, y - 1)?.type === "ROAD";
    const south = getSegment(town, x, y + 1)?.type === "ROAD";
    const west = getSegment(town, x - 1, y)?.type === "ROAD";
    const east = getSegment(town, x + 1, y)?.type === "ROAD";

    // cross roads
    if (north && south && east && west) {
        road.model = 2;
        road.rotation = random() > 0.5 ? 0 : Math.PI / 2;
    } else if (north && west && east) {
        road.model = 3;
        road.rotation = Math.PI
    } else if (south && west && east) {
        road.model = 3;
    } else if (south && north && west) {
        road.model = 3;
        road.rotation = Math.PI * 1.5
    } else if (south && north && east) {
        road.model = 3;
        road.rotation = Math.PI / 2
    } else if (south && east) {
        road.model = 4;
        road.rotation = Math.PI / 2
    } else if (south && west) {
        road.model = 4;
    } else if (north && west) {
        road.model = 4;
        road.rotation = Math.PI * 1.5
    } else if (north && east) {
        road.model = 4;
        road.rotation = Math.PI
    } else if ((west || east) && !north && !south) {
        road.rotation = Math.PI / 2;
    }

    if (road.model === 1 && random() < 0.05) {
        road.model = 5;
    }
}

export function updateCollision(town: Town, xp: number, yp: number, collisionEntry: number) {
    const current = town.collision[xp + (yp * town.collisionGridSize)];
    if (current) {
        if (current < collisionEntry) {
            town.collision[xp + (yp * town.collisionGridSize)] = collisionEntry;
        }
    } else {
        town.collision[xp + (yp * town.collisionGridSize)] = collisionEntry;
    }
}

export function getTownCollisionAt(town: Town, x: number, y: number): number {
    x = Math.floor(x / collisionCellSize);
    y = Math.floor(y / collisionCellSize);

    return town.collision[x + (y * town.collisionGridSize)]
}

export function generateTown(seed: number, size: number): Town {
    const town: Town = {
        seed: seed,
        map: [],
        items: [],
        size: size,
        collisionGridSize: 0,
        collision: []
    };

    const random = seededRandom(seed);

    let trafficHubCount = Math.floor(town.size / 4);
    const trafficHubs: Point[] = [];

    for (let i = 0; i < town.size; i++) {
        setSegment(town, i, 0, { model: Math.floor(random() * 5) + 10, type: "SHOP", rotation: 0 });
        setSegment(town, i, town.size - 1, { model: Math.floor(random() * 5) + 10, type: "SHOP", rotation: Math.PI });
        setSegment(town, 0, i, { model: Math.floor(random() * 5) + 10, type: "SHOP", rotation: Math.PI / 2 });
        setSegment(town, town.size - 1, i, { model: Math.floor(random() * 5) + 10, type: "SHOP", rotation: -Math.PI / 2 });
    }

    while (trafficHubCount > 0) {
        const x = Math.floor(random() * town.size);
        const y = Math.floor(random() * town.size);

        if (!trafficHubs.find(hub => Math.abs(hub.x - x) < 3 || Math.abs(hub.y - y) < 3)) {
            if (!getSegment(town, x, y)) {
                setSegment(town, x, y, { model: 1, type: "ROAD", rotation: 0 });
                trafficHubs.push({ x, y })
            }
            trafficHubCount--;
        }
    }


    for (let i = 1; i < town.size - 1; i++) {
        setSegment(town, i, 1, { model: 1, type: "ROAD", rotation: 0 });
        setSegment(town, i, town.size - 2, { model: 1, type: "ROAD", rotation: 0 });
        setSegment(town, 1, i, { model: 1, type: "ROAD", rotation: 0 });
        setSegment(town, town.size - 2, i, { model: 1, type: "ROAD", rotation: 0 });
    }

    // expand roads out
    for (const hub of trafficHubs) {
        generateRoad(town, hub.x, hub.y, true, true, true, true);
    }
    // see if we have any plots that are too big
    let plots = findPlots(town);
    while (plots.find(p => p.width > 5 || p.height > 5)) {
        const tooBig = plots.filter(p => p.width > 5 || p.height > 5);
        for (const plot of tooBig) {
            splitPlot(town, plot);
        }
        plots = findPlots(town);
    }

    // rationalise roads
    for (let x = 0; x < town.size; x++) {
        for (let y = 0; y < town.size; y++) {
            const segment = getSegment(town, x, y);
            if (segment && segment.type === "ROAD") {
                rationalizeRoad(random, town, x, y, segment);
            }
        }
    }

    for (const plot of plots) {
        for (let x = 0; x < plot.width; x++) {
            for (let y = 0; y < plot.height; y++) {
                const xp = x + plot.x;
                const yp = y + plot.y
                const north = getSegment(town, xp, yp - 1)?.type === "ROAD";
                const south = getSegment(town, xp, yp + 1)?.type === "ROAD";
                const west = getSegment(town, xp - 1, yp)?.type === "ROAD";
                const east = getSegment(town, xp + 1, yp)?.type === "ROAD";

                if (north || south || west || east) {
                    let r = 0;
                    if (south) {
                        r = 0;
                    } else if (west) {
                        r = -Math.PI / 2;
                    } else if (east) {
                        r = Math.PI / 2;
                    } else if (north) {
                        r = Math.PI;
                    }
                    setSegment(town, xp, yp, { model: Math.floor(random() * 5) + 10, type: "SHOP", rotation: r })
                } else {
                    setSegment(town, xp, yp, { model: 100, type: "SHOP", rotation: 0 })
                }
            }
        }
    }

    // generate collision from data files
    town.collisionGridSize = town.size * collisionCellsPerTownCell;

    const townModelCollisions: Record<number, CollisionInfo> = {

    }
    for (const key in townModelMapping) {
        const model = townModelMapping[key];
        const filename = model.replace("world", "collision") + ".json";
        if (ASSETS[filename]) {
            townModelCollisions[key] = JSON.parse(ASSETS[filename]);
        }
    }
    for (let x = 0; x < town.size; x++) {
        for (let y = 0; y < town.size; y++) {
            const segment = getSegment(town, x, y);
            if (segment) {
                // look up the collision data for the segment
                const collisionModel = townModelCollisions[segment.model];
                if (collisionModel) {
                    for (let cx = 0; cx < collisionModel.size; cx++) {
                        for (let cy = 0; cy < collisionModel.size; cy++) {
                            if (segment.rotation === 0) {
                                const xp = cx + (x * collisionCellsPerTownCell);
                                const yp = cy + (y * collisionCellsPerTownCell) + 1;
                                updateCollision(town, xp, yp, collisionModel.heights[cx + (cy * collisionModel.size)]);
                            }
                            if (segment.rotation === Math.PI) {
                                const xp = (collisionCellsPerTownCell - 1 - cx) + (x * collisionCellsPerTownCell);
                                const yp = (collisionCellsPerTownCell - 1 - cy) + (y * collisionCellsPerTownCell);
                                updateCollision(town, xp, yp, collisionModel.heights[cx + (cy * collisionModel.size)]);
                            }
                            if (segment.rotation === Math.PI / 2) {
                                const xp = cy + (x * collisionCellsPerTownCell);
                                const yp = (collisionCellsPerTownCell - 1 - cx) + (y * collisionCellsPerTownCell);
                                updateCollision(town, xp, yp, collisionModel.heights[cx + (cy * collisionModel.size)]);
                            }
                            if (segment.rotation === -Math.PI / 2 || segment.rotation === Math.PI * 0.75) {
                                const xp = (collisionCellsPerTownCell - 1 - cy) + (x * collisionCellsPerTownCell);
                                const yp = cx + (y * collisionCellsPerTownCell);
                                updateCollision(town, xp, yp, collisionModel.heights[cx + (cy * collisionModel.size)]);
                            }
                        }
                    }
                }
            }
        }
    }
    for (const item of town.items) {
        const x = item.x;
        const y = item.y;
        const collisionModel = townModelCollisions[item.model];
        for (let cx = 0; cx < collisionModel.size; cx++) {
            for (let cy = 0; cy < collisionModel.size; cy++) {
                if (item.rotation === 0) {
                    const xp = cx + (x * collisionCellsPerTownCell);
                    const yp = cy + (y * collisionCellsPerTownCell) + 1;
                    updateCollision(town, xp, yp, collisionModel.heights[cx + (cy * collisionModel.size)]);
                }
                if (item.rotation === Math.PI) {
                    const xp = (collisionCellsPerTownCell - 1 - cx) + (x * collisionCellsPerTownCell);
                    const yp = (collisionCellsPerTownCell - 1 - cy) + (y * collisionCellsPerTownCell);
                    updateCollision(town, xp, yp, collisionModel.heights[cx + (cy * collisionModel.size)]);
                }
                if (item.rotation === Math.PI / 2) {
                    const xp = cy + (x * collisionCellsPerTownCell);
                    const yp = (collisionCellsPerTownCell - 1 - cx) + (y * collisionCellsPerTownCell);
                    updateCollision(town, xp, yp, collisionModel.heights[cx + (cy * collisionModel.size)]);
                }
                if (item.rotation === -Math.PI / 2 || item.rotation === Math.PI * 0.75) {
                    const xp = (collisionCellsPerTownCell - 1 - cy) + (x * collisionCellsPerTownCell);
                    const yp = cx + (y * collisionCellsPerTownCell);
                    updateCollision(town, xp, yp, collisionModel.heights[cx + (cy * collisionModel.size)]);
                }
            }
        }
    }

    return town;
}