import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

export class StraightRoad extends GrObject {
  constructor({ x = 0, z = 0, length = 10, width = 2, rotation = 0 }) {
    // Create a road group
    let roadGroup = new T.Group();

    // Create the road base
    let roadGeom = new T.PlaneGeometry(length, width);
    let roadMat = new T.MeshStandardMaterial({ color: 0x333333 });
    let roadMesh = new T.Mesh(roadGeom, roadMat);

    roadMesh.rotation.x = -Math.PI / 2; // flat into XZ-plane
    roadMesh.rotation.z = rotation;     // apply yaw rotation
    roadMesh.position.set(0, 0.01, 0);  // slight lift
    roadGroup.add(roadMesh);

    // --- Add dashed line for *this* road ---
    const dashMat = new T.LineDashedMaterial({
      color: 0xffff00,  // yellow
      dashSize: 1,
      gapSize: 1,
    });

    // Create a line geometry (in XY plane by default)
    const points = [];
    points.push(new T.Vector3(-length / 2, 0, 0)); // start
    points.push(new T.Vector3(length / 2, 0, 0));  // end
    const dashGeom = new T.BufferGeometry().setFromPoints(points);

    const dashLine = new T.Line(dashGeom, dashMat);
    dashLine.computeLineDistances();

    dashLine.rotation.x = -Math.PI / 2; // rotate line into XZ plane
    dashLine.rotation.z = rotation;    // apply same rotation as road
    dashLine.position.y = 0.02;         // slightly above the road
    roadGroup.add(dashLine);

    // Call the parent constructor
    super(`StraightRoad-${x}-${z}`, roadGroup);

    // Set the group position
    roadGroup.position.set(x, 0, z);
  }
}
