/*jshint esversion: 6 */
// @ts-check

import { Skyscraper } from "./skyscraper.js";
import { Helicopter, Helipad } from "./helicopter.js";
import { StraightRoad } from "./road.js";
import { SimpleCar } from "./car.js";
import { AppleTree } from "./tree.js";
import { Bird } from "./bird.js";
import { SimpleBike } from "./bike.js";

export function main(world) {
  // Layout of buildings (skipping middle blocks for plaza)
  const blocks = [
    { x: -12, z: -12 }, { x: -4, z: -12 }, { x: 4, z: -12 }, { x: 12, z: -12 },
    { x: -12, z: 0 },                        { x: 12, z: 0 },
    { x: -12, z: 12 }, { x: -4, z: 12 }, { x: 4, z: 12 }, { x: 12, z: 12 },
  ];

  for (const pos of blocks) {
    world.add(new Skyscraper({ x: pos.x, z: pos.z }));
    world.add(new Helipad(pos.x, 12.6, pos.z));
  }

  const bike = new SimpleBike(12, 0.003);
  world.add(bike);

  // Park in the center
  for (let x = -4; x <= 4; x += 4) {
    for (let z = -4; z <= 4; z += 4) {
      if (x != 0 || z != 0) {
        world.add(new AppleTree(x, 0, z));
      }
    }
  }

  // Z-direction roads (horizontal)
  const zRoads = [-16, -8, 8, 16];
  for (const z of zRoads) {
    world.add(new StraightRoad({ x: 0, z: z, length: 40, width: 2, rotation: 0 }));

    // Add cars moving along z-direction
    for (let x of [-16, -8, 8, 16]) {
      const offset = Math.random() * 2;
      const speed = 0.01 + Math.random() * 0.01;
      if (x == -16 || x == 8) { 
        world.add(new SimpleCar(x, z + offset, speed, world, false, true)); // backward
      } else {
        world.add(new SimpleCar(x, z + offset, speed, world, false, false)); // forward
      }
    }
  }

  // X-direction roads (vertical)
  const xRoads = [-16, -8, 8, 16];
  for (const x of xRoads) {
    world.add(new StraightRoad({ x: x, z: 0, length: 40, width: 2, rotation: Math.PI / 2 }));

    for (let z of [-16, -8, 8, 16]) {
      const offset = Math.random() * 2;
      const speed = 0.008 + Math.random() * 0.01;
      if (z == -16 || z == 8) {
        world.add(new SimpleCar(x + offset, z, speed, world, true, false)); // forward
      } else {
        world.add(new SimpleCar(x + offset, z, speed, world, true, true)); // backward
      }
    }
  }

  // Helicopter
  const copter = new Helicopter();
  world.add(copter);
  copter.getPads(world.objects);

  // Add a bird that occasionally flies in
  const bird = new Bird(world);
  world.add(bird);
  const bird2 = new Bird(world, 3, 0.0006, "yellow");
  world.add(bird2);
}
