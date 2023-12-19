import p5 from "p5";
import { Node } from "./Node";

export class Path {
  constructor({ p5, nodes } = {}) {
    /** @type {p5} */
    this.p5 = p5;

    /** @type {Node[]} */
    this.nodes = nodes || [];

    this.maxNodes = 1400;

    this.insertDist = 10;
    this.repulsionDist = this.insertDist * 5;
    this.kFactor = 20;
  }

  createNode(x, y) {
    return new Node({ p5: this.p5, x, y });
  }

  addNode(node) {
    this.nodes.push(node);
  }

  addNodeAt(node, index) {
    this.nodes.splice(index, 0, node);
  }

  update() {
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];

      //   update forces

      const forces = this.p5.createVector();

      this.nodes.forEach((p) => {
        if (p !== node) {
          const diff = p.position.copy().sub(node.position);
          const distance = diff.mag();

          if (distance < this.repulsionDist) {
            diff.normalize();
            diff.mult(-1 / (distance * distance));
            forces.add(diff);
          }
        }
      });

      // neightbour on the right
      let neighbourIndex = (i + 1) % this.nodes.length;
      let neighbour = this.nodes[neighbourIndex];
      let diff = neighbour.position.copy().sub(node.position);
      let distance = diff.mag();
      diff.normalize();
      diff.mult(1 / (distance * distance));
      if (distance < this.insertDist * 0.5) {
        diff.mult(-1);
      }
      forces.add(diff);

      // neightbour on the left
      neighbourIndex = (i - 1 + this.nodes.length) % this.nodes.length;
      neighbour = this.nodes[neighbourIndex];
      diff = neighbour.position.copy().sub(node.position);
      distance = diff.mag();
      diff.normalize();
      diff.mult(1 / (distance * distance));
      if (distance < this.insertDist * 0.5) {
        diff.mult(-1);
      }
      forces.add(diff);

      forces.mult(this.kFactor);

      const acc = forces.copy();
      acc.div(1);

      node.velocity.add(acc);

      //

      node.update();
    }

    this.break();
  }

  break() {
    for (let i = 0; i < this.nodes.length; i++) {
      const node0 = this.nodes[i];
      const node1 = this.nodes[(i + 1) % this.nodes.length];

      const diff = node0.position.copy().sub(node1.position);

      if (diff.mag() > this.insertDist) {
        diff.mult(0.5);
        const newNode = this.createNode(node1.position.x + diff.x, node1.position.y + diff.y);
        this.addNodeAt(newNode, i + 1);
      }
    }
  }

  draw() {
    // console.log(this.nodes.length);

    // this.p5.fill(0);
    // this.p5.noStroke();

    // this.p5.noFill();
    // this.p5.stroke(255);
    // this.p5.strokeWeight(2);

    // this.p5.beginShape();

    // for (let i = 0; i < this.nodes.length; i++) {
    //   const node0 = this.nodes[i];
    //   const node1 = this.nodes[(i + 1) % this.nodes.length];

    //   this.p5.vertex(node0.position.x, node0.position.y);
    //   this.p5.vertex(node1.position.x, node1.position.y);
    // }

    // this.p5.endShape(this.p5.CLOSE);

    this.p5.fill(255, 80);
    this.p5.noStroke();
    // this.p5.stroke(255);
    this.p5.strokeWeight(1);

    for (let i = 0; i < this.nodes.length; i++) {
      const node0 = this.nodes[i];

      this.p5.ellipse(node0.position.x, node0.position.y, 1);
    }
  }
}
