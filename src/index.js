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
    p.background(0, 7);
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

  let intervalId;

  function resetWorld() {
    world.clearPaths();
    p.background(0);

    clearInterval(intervalId);

    const bigBound = new Bound({
      p5: p,
      polygon: createPolygon(3, p.width / 2.4, p.PI / 6).toArray(),
    });
    const smallBound = new Bound({
      p5: p,
      polygon: createPolygon(3, p.width / 12, p.PI / 6).toArray(),
      reverse: true,
    });

    const count = 6;
    const lines = [];
    for (let i = 0; i < count; i++) {
      const angle = p.map(i, 0, count, 0, p.TWO_PI) + p.PI / 6;
      const radius = 150;
      const length = 10;
      const x1 = p.cos(angle) * (radius + length);
      const y1 = p.sin(angle) * (radius + length);
      const x2 = p.cos(angle) * (radius - length);
      const y2 = p.sin(angle) * (radius - length);

      const line = createLine(x1, y1, x2, y2);
      line.moveTo(p.width / 2, p.height / 2);
      line.moveTo(0, 100);
      line.addBounds([smallBound, bigBound]);
      lines.push(line);
    }
    world.addPaths(lines);

    intervalId = setTimeout(() => {
      lines.forEach((line) => {
        line.clearBounds();
      });
    }, 15 * 1000);
  }

  function createPolygon(nodeCount = 3, radius = 50, rotation = 0) {
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const a = p.map(i, 0, nodeCount, 0, p.TWO_PI) + rotation;
      const x = p.cos(a) * radius;
      const y = p.sin(a) * radius;
      nodes.push(new Node({ p5: p, x, y, settings: defaultSettings }));
    }
    const path = new Path({ p5: p, nodes, settings: defaultSettings });
    path.moveTo(p.width / 2, p.height / 2 + 100);
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
