import p5 from "p5";
import knn from "./lib/knn";
import { Node } from "./Node";
import { Bound } from "./Bound";

function getPointOnCurve(p0, p1, p2, p3, t) {
  let v0 = (p2 - p0) * 0.5;
  let v1 = (p3 - p1) * 0.5;
  let t2 = t * t;
  let t3 = t * t * t;

  let c0 = 2 * t3 - 3 * t2 + 1;
  let c1 = t3 - 2 * t2 + t;
  let c2 = -2 * t3 + 3 * t2;
  let c3 = t3 - t2;

  return c0 * p1 + c1 * v0 + c2 * p2 + c3 * v1;
}

export class Path {
  constructor({ p5, nodes = [], settings, bounds = [], isClosed = true } = {}) {
    /** @type {p5} */
    this.p5 = p5;
    /** @type {Node[]} */
    this.nodes = nodes;
    this.settings = settings;
    /** @type {Bound[]} */
    this.bounds = bounds;
    this.isClosed = isClosed;

    this.lastNodeInjectTime = 0;

    this.maxNodes = 2000;
  }

  update(tree) {
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];

      if (this.settings.UseBrownianMotion) this.applyBrownianMotion(i);
      this.applyAttraction(i);
      this.applyRepulsion(i, tree);
      this.applyAlignment(i);
      this.applyBounds(i);

      node.update();
    }

    this.splitEdges();
    this.pruneNodes();

    // if (this.p5.millis() - this.lastNodeInjectTime >= this.settings.NodeInjectionInterval) {
    //   this.injectNode();
    //   this.lastNodeInjectTime = this.p5.millis();
    // }
  }

  applyBrownianMotion(index) {
    this.nodes[index].position.x += this.p5.random(
      -this.settings.BrownianMotionRange / 2,
      this.settings.BrownianMotionRange / 2
    );
    this.nodes[index].position.y += this.p5.random(
      -this.settings.BrownianMotionRange / 2,
      this.settings.BrownianMotionRange / 2
    );
  }

  applyAttraction(index) {
    let distance, leastMinDistance;
    let connectedNodes = this.getConnectedNodes(index);

    // Move towards next node, if there is one
    if (connectedNodes.nextNode !== undefined && !this.nodes[index].isFixed) {
      distance = this.nodes[index].position.dist(connectedNodes.nextNode.position);
      leastMinDistance = Math.min(
        this.nodes[index].minDistance,
        connectedNodes.nextNode.minDistance
      );

      if (distance > leastMinDistance) {
        this.nodes[index].nextPosition.lerp(
          connectedNodes.nextNode.position,
          this.settings.AttractionForce
        );
      }
    }

    // Move towards previous node, if there is one
    if (connectedNodes.previousNode !== undefined && !this.nodes[index].isFixed) {
      distance = this.nodes[index].position.dist(connectedNodes.previousNode.position);
      leastMinDistance = Math.min(
        this.nodes[index].minDistance,
        connectedNodes.previousNode.minDistance
      );

      if (distance > leastMinDistance) {
        this.nodes[index].nextPosition.lerp(
          connectedNodes.previousNode.position,
          this.settings.AttractionForce
        );
      }
    }
  }

  applyRepulsion(index, tree) {
    // Perform knn search to find all neighbors within certain radius
    const neighbors = knn(
      tree,
      this.nodes[index].position.x,
      this.nodes[index].position.y,
      undefined,
      undefined,
      this.nodes[index].repulsionRadius
    );

    // Move this node away from all nearby neighbors
    // TODO: Make this proportional to distance?
    for (let node of neighbors) {
      this.nodes[index].nextPosition.x = this.p5.lerp(
        this.nodes[index].position.x,
        node.position.x,
        -this.settings.RepulsionForce
      );
      this.nodes[index].nextPosition.y = this.p5.lerp(
        this.nodes[index].position.y,
        node.position.y,
        -this.settings.RepulsionForce
      );
    }
  }

  applyAlignment(index) {
    let connectedNodes = this.getConnectedNodes(index);

    if (
      connectedNodes.previousNode !== undefined &&
      connectedNodes.nextNode !== undefined &&
      !this.nodes[index].isFixed
    ) {
      // Find the midpoint between the neighbors of this node
      let midpoint = this.getMidpointNode(connectedNodes.previousNode, connectedNodes.nextNode);

      // Move this point towards this midpoint
      this.nodes[index].nextPosition.lerp(midpoint.position, this.settings.AlignmentForce);
    }
  }

  applyBounds(index) {
    if (this.bounds !== undefined) {
      const isValid = this.bounds.some(
        (bound) => !bound.contains([this.nodes[index].position.x, this.nodes[index].position.y])
      );

      if (isValid) {
        this.nodes[index].isFixed = true;
      } else {
        this.nodes[index].isFixed = false;
      }
    }
  }

  splitEdges() {
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      let connectedNodes = this.getConnectedNodes(i);

      if (
        connectedNodes.previousNode !== undefined &&
        node.position.dist(connectedNodes.previousNode.position) >= this.settings.MaxDistance
      ) {
        let midpointNode = this.getMidpointNode(node, connectedNodes.previousNode);

        // Inject the new midpoint node into the global list
        if (i === 0) {
          this.addNodeAt(midpointNode, this.nodes.length);
        } else {
          this.addNodeAt(midpointNode, i);
        }
      }
    }
  }

  injectNode() {
    this.injectRandomNode();
  }

  injectRandomNode() {
    // Choose two connected nodes at random
    let index = this.p5.floor(this.p5.random(1, this.nodes.length));
    let connectedNodes = this.getConnectedNodes(index);

    if (
      connectedNodes.previousNode !== undefined &&
      connectedNodes.nextNode !== undefined &&
      this.nodes[index].position.dist(connectedNodes.previousNode.position) >
        this.settings.MinDistance
    ) {
      // Create a new node in the middle
      let midpointNode = this.getMidpointNode(this.nodes[index], connectedNodes.previousNode);

      // Splice new node into array
      this.addNodeAt(midpointNode, index);
    }
  }

  getMidpointNode(node1, node2) {
    return new Node({
      p5: this.p5,
      x: (node1.position.x + node2.position.x) / 2,
      y: (node1.position.y + node2.position.y) / 2,
      settings: this.settings,
    });
  }

  pruneNodes() {
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      let connectedNodes = this.getConnectedNodes(i);

      if (
        connectedNodes.previousNode !== undefined &&
        node.position.dist(connectedNodes.previousNode.position) <= this.settings.MinDistance
      ) {
        if (i === 0) {
          if (!this.nodes[this.nodes.length - 1].isFixed) {
            this.nodes.splice(this.nodes.length - 1, 1);
          }
        } else {
          if (!this.nodes[i - 1].isFixed) {
            this.nodes.splice(i - 1, 1);
          }
        }
      }
    }
  }

  getConnectedNodes(index) {
    let previousNode, nextNode;

    // Find previous node, if there is one
    if (index === 0 && this.isClosed) {
      previousNode = this.nodes[this.nodes.length - 1];
    } else if (index >= 1) {
      previousNode = this.nodes[index - 1];
    }

    // Find next node, if there is one
    if (index === this.nodes.length - 1 && this.isClosed) {
      nextNode = this.nodes[0];
    } else if (index <= this.nodes.length - 1) {
      nextNode = this.nodes[index + 1];
    }

    return {
      previousNode,
      nextNode,
    };
  }

  draw() {
    // this.p5.fill(255);
    // this.p5.noStroke();

    this.p5.noFill();
    this.p5.stroke(255, 30);
    // this.p5.stroke(`hsla(${100 + (this.p5.frameCount % 155)}, 100%, 50%, 0.05)`);
    // this.p5.stroke(255);
    this.p5.strokeWeight(1);

    // this.p5.noStroke();
    // this.p5.fill(255);

    this.p5.beginShape();
    for (let i = 0; i < this.nodes.length - 1; i++) {
      let n0 = this.nodes[i > 0 ? i - 1 : i];
      // let n1 = this.nodes[i];
      // let n2 = this.nodes[i + 1];
      // let n3 = this.nodes[i + 2 < this.nodes.length ? i + 2 : this.nodes.length - 1];

      // for (let t = 0; t <= 1; t += 0.1) {
      //   let x = getPointOnCurve(n0.position.x, n1.position.x, n2.position.x, n3.position.x, t);
      //   let y = getPointOnCurve(n0.position.y, n1.position.y, n2.position.y, n3.position.y, t);
      //   this.p5.curveVertex(x, y);
      // }

      this.p5.curveVertex(n0.position.x, n0.position.y);
      // this.p5.ellipse(n0.position.x, n0.position.y, 2);
    }

    this.p5.endShape(this.isClosed ? this.p5.CLOSE : undefined);

    if (this.settings.ShowBound) this.drawBounds();
  }

  drawBounds() {
    if (this.bounds !== undefined) {
      this.bounds.forEach((bound) => {
        bound.draw();
      });
    }
  }

  addNode(node) {
    this.nodes.push(node);
  }

  addNodeAt(node, index) {
    this.nodes.splice(index, 0, node);
  }

  addBound(bound) {
    this.bounds.push(bound);
  }

  addBounds(bounds) {
    this.bounds.push(...bounds);
  }

  clearBounds() {
    this.bounds = [];
  }

  toArray() {
    return this.nodes.map((node) => [node.position.x, node.position.y]);
  }

  moveTo(xOffset, yOffset) {
    this.nodes.forEach((node) => {
      node.position.add(xOffset, yOffset);
    });
  }

  scale(factor) {
    this.nodes.forEach((node) => {
      node.position.mult(factor);
    });
  }
}
