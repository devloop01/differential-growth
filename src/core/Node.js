import p5 from "p5";

export class Node {
  constructor({ p5, x, y } = {}) {
    /** @type {p5} */
    this.p5 = p5;

    this.position = this.p5.createVector(x, y);
    this.velocity = this.p5.createVector(0, 0);
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.mult(0.1);
  }

  draw() {
    this.p5.ellipse(this.position.x, this.position.y, 10);
  }
}
