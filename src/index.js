import p5 from "p5";

import { settings as defaultSettings } from "./core/Settings";
import { Node } from "./core/Node";
import { Path } from "./core/Path";
import { World } from "./core/World";
import { Bound } from "./core/Bound";

/** @param {p5} p */
const sketch = (p) => {
  const settings = {
    // dimensions: [p.windowWidth, p.windowHeight],
    dimensions: [1080, 1080],
  };

  /** @type {World} */
  let world;

  p.setup = () => {
    p.createCanvas(settings.dimensions[0], settings.dimensions[1]);
    p.background(0);

    world = new World({ p5: p, settings: defaultSettings });

    resetWorld();
  };

  p.draw = () => {
    p.background(0, 4);
    // p.background(0);

    world.update();
    world.draw();
  };

  // p.windowResized = () => {
  //   p.resizeCanvas(p.windowWidth, p.windowHeight);
  // };

  let isRecording = false;

  p.keyPressed = () => {
    if (p.key === "s") {
      resetWorld();
      if (isRecording) {
        world.recorder.stop();
      } else {
        world.recorder.start();
      }
      isRecording = !isRecording;
    } else if (p.key === "r") {
      resetWorld();
    } else if (p.key === " ") {
      world.togglePause();
    }
  };

  let intervals = [];
  function resetWorld() {
    world.clearPaths();
    p.background(0);

    intervals.forEach((id) => clearInterval(id));

    const bound = new Bound({
      p5: p,
      polygon: createPolygon(4, p.width / 2.5, p.PI / 4).toArray(),
    });

    const circle1 = createPolygon(128, p.width / 8, p.PI / 4);
    circle1.moveTo(0, -p.width / 7);
    circle1.addBound(bound);
    world.addPath(circle1);

    const circle2 = createPolygon(128, p.width / 8, p.PI / 4);
    circle2.moveTo(0, p.width / 7);
    circle2.addBound(bound);
    world.addPath(circle2);

    const circle3 = createPolygon(128, p.width / 12, p.PI / 4);
    circle3.moveTo(-p.width / 5.5, 0);
    circle3.addBound(bound);
    world.addPath(circle3);

    const circle4 = createPolygon(128, p.width / 12, p.PI / 4);
    circle4.moveTo(p.width / 5.5, 0);
    circle4.addBound(bound);
    world.addPath(circle4);

    intervals = [
      setTimeout(() => {
        circle1.clearBounds();
        circle2.clearBounds();
      }, 14 * 1000),
    ];
  }

  function createPolygon(nodeCount = 3, radius = 50, rotation = 0, settings = {}) {
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const a = p.map(i, 0, nodeCount, 0, p.TWO_PI) + rotation;
      const x = p.cos(a) * radius;
      const y = p.sin(a) * radius;
      nodes.push(new Node({ p5: p, x, y, settings: { ...defaultSettings, ...settings } }));
    }
    const path = new Path({ p5: p, nodes, settings: { ...defaultSettings, ...settings } });
    path.moveTo(p.width / 2, p.height / 2);
    return path;
  }

  function createLine(x1, y1, x2, y2) {
    let nodes = [];
    nodes.push(new Node({ p5: p, x: x1, y: y1, settings: defaultSettings }));
    nodes.push(new Node({ p5: p, x: x2, y: y2, settings: defaultSettings }));
    const path = new Path({ p5: p, nodes, isClosed: false, settings: defaultSettings });
    return path;
  }

  function createSineWave(nodeCount = 100, length = 400, amp = 100, feq = 0.02, phase = 0) {
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const x = p.map(i, 0, nodeCount, 0, length);
      const y = p.sin(x * feq + phase) * amp;
      nodes.push(new Node({ p5: p, x, y, settings: defaultSettings }));
    }
    const path = new Path({ p5: p, nodes, isClosed: false, settings: defaultSettings });
    path.moveTo(p.width / 2 - length / 2, p.height / 2);
    return path;
  }
};

new p5(sketch);
