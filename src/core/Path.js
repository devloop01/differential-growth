import p5 from "p5";
import knn from "./lib/knn";
import { Node } from "./Node";

export class Path {
  constructor({ p5, nodes, settings } = {}) {
    /** @type {p5} */
    this.p5 = p5;
    /** @type {Node[]} */
    this.nodes = nodes || [];
    this.settings = settings;

    this.maxNodes = 1000;
  }

  draw() {
    // this.p5.fill(255);
    // this.p5.noStroke();

    // this.p5.noFill();
    // this.p5.stroke(255);
    // this.p5.strokeWeight(1);

    this.p5.noStroke();
    this.p5.fill(255);

    this.p5.beginShape();
    for (let i = 0; i < this.nodes.length; i++) {
      const node0 = this.nodes[i];
      const node1 = this.nodes[(i + 1) % this.nodes.length];

      // this.p5.vertex(node0.position.x, node0.position.y);
      // this.p5.vertex(node1.position.x, node1.position.y);

      this.p5.ellipse(node0.position.x, node0.position.y, 2);
    }
    this.p5.endShape(this.p5.CLOSE);
  }

  update(tree) {
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];

      if (this.settings.UseBrownianMotion) this.applyBrownianMotion(i);

      this.applyAttraction(i);
      this.applyRepulsion(i, tree);
      this.applyAlignment(i);

      node.update();
    }

    this.splitEdges();
    this.pruneNodes();
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
    if (connectedNodes.nextNode != undefined && connectedNodes.nextNode instanceof Node) {
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
    if (connectedNodes.previousNode != undefined && connectedNodes.previousNode instanceof Node) {
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
    // radius must be squared as per https://github.com/mourner/rbush-knn/issues/13

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
      connectedNodes.previousNode != undefined &&
      connectedNodes.previousNode instanceof Node &&
      connectedNodes.nextNode != undefined &&
      connectedNodes.nextNode instanceof Node
    ) {
      // Find the midpoint between the neighbors of this node
      let midpoint = this.getMidpointNode(connectedNodes.previousNode, connectedNodes.nextNode);

      // Move this point towards this midpoint
      this.nodes[index].nextPosition.lerp(midpoint.position, this.settings.AlignmentForce);
    }
  }

  splitEdges() {
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      let connectedNodes = this.getConnectedNodes(i);

      if (
        connectedNodes.previousNode != undefined &&
        connectedNodes.previousNode instanceof Node &&
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
    // if (this.nodes.length < this.maxNodes) {
    this.injectRandomNode();
    // }
  }

  injectRandomNode() {
    // Choose two connected nodes at random
    let index = this.p5.floor(this.p5.random(1, this.nodes.length));
    let connectedNodes = this.getConnectedNodes(index);

    if (
      connectedNodes.previousNode != undefined &&
      connectedNodes.previousNode instanceof Node &&
      connectedNodes.nextNode != undefined &&
      connectedNodes.nextNode instanceof Node &&
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
        connectedNodes.previousNode != undefined &&
        connectedNodes.previousNode instanceof Node &&
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
    let previousNode = this.nodes[(index - 1 + this.nodes.length) % this.nodes.length];
    let nextNode = this.nodes[(index + 1) % this.nodes.length];

    return {
      previousNode,
      nextNode,
    };
  }

  addNode(node) {
    this.nodes.push(node);
  }

  addNodeAt(node, index) {
    this.nodes.splice(index, 0, node);
  }
}
