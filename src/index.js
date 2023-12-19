import p5 from "p5";

import { Path } from "./core/Path";

const chunks = [];

/** @param {p5} p */
const sketch = (p) => {
  let rec;

  const settings = {
    // dimensions: [p.windowWidth, p.windowHeight],
    dimensions: [512, 512],
  };

  const path = new Path({ p5: p });

  p.setup = () => {
    p.createCanvas(settings.dimensions[0], settings.dimensions[1]);

    // rec = record();

    p.background(0);

    const nodesStart = 12;
    const angInc = p.TWO_PI / nodesStart;
    const radius = 20;
    for (let a = 0; a < p.TWO_PI; a += angInc) {
      const r = radius + p.random(-radius * 0.1, radius * 0.1);
      const x = p.width / 2 + p.cos(a) * r;
      const y = p.height / 2 + p.sin(a) * r;
      const node = path.createNode(x, y);

      path.addNode(node);
    }
  };

  p.draw = () => {
    // p.background(0);

    path.update();
    path.draw();

    if (path.nodes.length > path.maxNodes) {
      p.noLoop();
      //   p.saveCanvas("frame", "png");
      //   rec.stop();
    }
  };

  // p.windowResized = () => {
  //   p.resizeCanvas(p.windowWidth, p.windowHeight);
  // };
};

new p5(sketch);

function record() {
  chunks.length = 0;
  let stream = document.querySelector("#defaultCanvas0").captureStream(60),
    recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => {
    if (e.data.size) {
      chunks.push(e.data);
    }
  };
  recorder.onstop = exportVideo;
  recorder.start();

  return recorder;
}

function exportVideo() {
  const blob = new Blob(chunks);
  const vid = document.createElement("video");
  vid.id = "recorded";
  vid.src = URL.createObjectURL(blob);

  //now download the video
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = vid.src;
  a.download = "recorded.webm";
  a.click();
}
