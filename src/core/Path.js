import p5 from "p5";
import knn from "./lib/knn";
import { Node } from "./Node";
import { Bound } from "./Bound";

export class Path {
  constructor({ p5, nodes = [], settings, bound, isClosed = true } = {}) {
    /** @type {p5} */
    this.p5 = p5;
    /** @type {Node[]} */
    this.nodes = nodes;
    this.settings = settings;
    /** @type {Bound | undefined} */
    this.bound = bound;
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
      this.applyBound(i);

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

  applyBound(index) {
    if (
      this.bound !== undefined &&
      !this.bound.contains([this.nodes[index].position.x, this.nodes[index].position.y])
    ) {
      this.nodes[index].isFixed = true;
    } else {
      this.nodes[index].isFixed = false;
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
    this.p5.stroke(255, 50);
    this.p5.strokeWeight(1);

    // this.p5.noStroke();
    // this.p5.fill(255);

    this.p5.beginShape();

    for (let i = 0; i < this.nodes.length - 1; i++) {
      const node0 = this.nodes[i];
      const node1 = this.nodes[(i + 1) % this.nodes.length];

      this.p5.vertex(node0.position.x, node0.position.y);
      this.p5.vertex(node1.position.x, node1.position.y);
      // this.p5.ellipse(node0.position.x, node0.position.y, 2);
    }

    this.p5.endShape(this.isClosed ? this.p5.CLOSE : undefined);

    if (this.settings.ShowBound) this.drawBound();
  }

  drawBound() {
    if (this.bound !== undefined) {
      this.bound.draw();
    }
  }

  addNode(node) {
    this.nodes.push(node);
  }

  addNodeAt(node, index) {
    this.nodes.splice(index, 0, node);
  }

  setBound(bound) {
    this.bound = bound;
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
