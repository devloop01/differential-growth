import p5 from "p5";

import { settings as defaultSettings } from "./core/Settings";
import { Node } from "./core/Node";
import { Path } from "./core/Path";
import { World } from "./core/World";

/** @param {p5} p */
const sketch = (p) => {
  const settings = {
    dimensions: [p.windowWidth, p.windowHeight],
    // dimensions: [1080, 1080],
  };

  let world;

  p.setup = () => {
    p.createCanvas(settings.dimensions[0], settings.dimensions[1]);
    p.background(0);

    world = new World({ p5: p, settings: defaultSettings });

    const nodesStart = 12;
    const angInc = p.TWO_PI / nodesStart;
    const radius = 50;

    const nodes = [];
    for (let a = 0; a < p.TWO_PI; a += angInc) {
      const r = radius + p.random(-radius * 0.1, radius * 0.1);
      const x = p.width / 2 + p.cos(a) * r;
      const y = p.height / 2 + p.sin(a) * (r / 4);
      nodes.push(new Node({ p5: p, x, y, settings: defaultSettings }));
    }

    world.addPath(new Path({ p5: p, nodes, settings: defaultSettings }));
  };

  p.draw = () => {
    p.background(0);

    world.update();
    world.draw();
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

new p5(sketch);
