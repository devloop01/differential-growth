import p5 from "p5";

export class Node {
  constructor({ p5, x, y, isFixed = false, settings } = {}) {
    /** @type {p5} */
    this.p5 = p5;

    this.position = this.p5.createVector(x, y);
    this.velocity = this.p5.createVector(0, 0);

    this.nextPosition = this.p5.createVector(x, y);

    this.isFixed = isFixed;
    this.settings = settings;

    this.minDistance = settings.MinDistance;
    this.repulsionRadius = settings.RepulsionRadius;
  }

  update() {
    // this.position.add(this.velocity);
    // this.velocity.mult(0.1);

    this.position.lerp(this.nextPosition, this.settings.MaxVelocity);
  }

  draw() {
    this.p5.ellipse(this.position.x, this.position.y, 10);
  }
}
