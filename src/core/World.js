import p5 from "p5";
import RBush from "rbush";

import { Path } from "./Path";
import { Recorder } from "./Recorder";

export class World {
  constructor({ p5, paths, settings }) {
    /** @type {p5} */
    this.p5 = p5;
    /** @type {Path[]} */
    this.paths = paths || [];
    this.settings = settings;

    this.lastNodeInjectTime = 0;

    this.isPaused = false;

    this.tree = new MyRBush(9); // holds nodes
    this.buildTree();

    this.recorder = new Recorder({ canvas: this.p5.canvas, fps: 60 });
    // this.recorder.start();
  }

  buildTree() {
    this.tree.clear();
    this.paths.forEach((path) => {
      this.tree.load(path.nodes);
    });
  }

  update() {
    if (this.isPaused) return;

    this.buildTree();

    this.paths.forEach((path) => {
      if (path.nodes.length <= path.maxNodes) {
        path.update(this.tree);
      } else {
        this.p5.noLoop();
        // this.recorder.stop();
      }
    });
  }

  draw() {
    this.paths.forEach((path) => {
      //   if (path.nodes.length <= path.maxNodes) {
      path.draw();
      //   }
    });
  }

  addPath(path) {
    this.paths.push(path);
  }

  addPaths(paths) {
    this.paths.push(...paths);
  }

  clearPaths() {
    this.paths = [];
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }
}

class MyRBush extends RBush {
  toBBox(node) {
    return {
      minX: node.position.x,
      minY: node.position.y,
      maxX: node.position.x,
      maxY: node.position.y,
    };
  }
}
