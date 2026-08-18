import { Node, Edge } from "@xyflow/react";

export type LayoutMode = "radial" | "top-down";

interface NodeData {
  text: string;
  description?: string | null;
  icon?: string | null;
  color?: string;
  parentId?: string | null;
  collapsed?: boolean;
  isRoot?: boolean;
  [key: string]: any;
}

export function applyAutoLayout(
  nodes: Node<NodeData>[],
  edges: Edge[],
  mode: LayoutMode = "radial"
): { nodes: Node<NodeData>[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  // Find root node or fallback to first node
  const rootNode = nodes.find((n) => n.data.isRoot || !n.data.parentId) || nodes[0];
  const nodeMap = new Map<string, Node<NodeData>>(nodes.map((n) => [n.id, { ...n }]));

  // Build adjacency tree
  const childrenMap = new Map<string, string[]>();
  nodes.forEach((n) => childrenMap.set(n.id, []));

  edges.forEach((e) => {
    const list = childrenMap.get(e.source) || [];
    if (!list.includes(e.target)) {
      list.push(e.target);
      childrenMap.set(e.source, list);
    }
  });

  if (mode === "radial") {
    // 1. Position root at (0, 0)
    const updatedRoot = nodeMap.get(rootNode.id)!;
    updatedRoot.position = { x: 0, y: 0 };

    const directChildren = childrenMap.get(rootNode.id) || [];
    const rightChildren: string[] = [];
    const leftChildren: string[] = [];

    // Split direct children evenly between right and left
    directChildren.forEach((childId, index) => {
      if (index % 2 === 0) {
        rightChildren.push(childId);
      } else {
        leftChildren.push(childId);
      }
    });

    // Helper to calculate subtree height
    const getSubtreeLeafCount = (nodeId: string): number => {
      const children = childrenMap.get(nodeId) || [];
      if (children.length === 0) return 1;
      return children.reduce((acc, child) => acc + getSubtreeLeafCount(child), 0);
    };

    // Recursive branch layout
    const layoutSubtree = (
      nodeId: string,
      startX: number,
      startY: number,
      direction: 1 | -1, // 1 = right, -1 = left
      level: number
    ): number => {
      const node = nodeMap.get(nodeId);
      if (!node) return startY;

      const children = childrenMap.get(nodeId) || [];
      const horizontalStep = 280;
      const verticalUnit = 90;

      if (children.length === 0) {
        node.position = { x: startX, y: startY };
        return startY + verticalUnit;
      }

      let currentY = startY;
      const childYPositions: number[] = [];

      children.forEach((childId) => {
        const nextX = startX + direction * horizontalStep;
        const endY = layoutSubtree(childId, nextX, currentY, direction, level + 1);
        const childNode = nodeMap.get(childId);
        if (childNode) {
          childYPositions.push(childNode.position.y);
        }
        currentY = endY;
      });

      // Center parent node relative to its children
      const avgY =
        childYPositions.reduce((acc, y) => acc + y, 0) / (childYPositions.length || 1);
      node.position = { x: startX, y: avgY };

      return currentY;
    };

    // Layout Right side
    const rightTotalLeaves = rightChildren.reduce((acc, id) => acc + getSubtreeLeafCount(id), 0);
    let rightStartY = -(rightTotalLeaves * 90) / 2 + 45;
    rightChildren.forEach((childId) => {
      rightStartY = layoutSubtree(childId, 280, rightStartY, 1, 1);
    });

    // Layout Left side
    const leftTotalLeaves = leftChildren.reduce((acc, id) => acc + getSubtreeLeafCount(id), 0);
    let leftStartY = -(leftTotalLeaves * 90) / 2 + 45;
    leftChildren.forEach((childId) => {
      leftStartY = layoutSubtree(childId, -280, leftStartY, -1, 1);
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges,
    };
  } else {
    // Top-Down Hierarchical Layout
    const updatedRoot = nodeMap.get(rootNode.id)!;
    updatedRoot.position = { x: 0, y: 0 };

    const layoutTopDown = (
      nodeId: string,
      startX: number,
      startY: number,
      level: number
    ): number => {
      const node = nodeMap.get(nodeId);
      if (!node) return startX;

      const children = childrenMap.get(nodeId) || [];
      const horizontalStep = 240;
      const verticalStep = 150;

      if (children.length === 0) {
        node.position = { x: startX, y: startY };
        return startX + horizontalStep;
      }

      let currentX = startX;
      const childXPositions: number[] = [];

      children.forEach((childId) => {
        const nextY = startY + verticalStep;
        const endX = layoutTopDown(childId, currentX, nextY, level + 1);
        const childNode = nodeMap.get(childId);
        if (childNode) {
          childXPositions.push(childNode.position.x);
        }
        currentX = endX;
      });

      const avgX =
        childXPositions.reduce((acc, x) => acc + x, 0) / (childXPositions.length || 1);
      node.position = { x: avgX, y: startY };

      return currentX;
    };

    const totalLeaves = (childrenMap.get(rootNode.id) || []).reduce((acc, id) => acc + 1, 0);
    const startX = -(totalLeaves * 240) / 2 + 120;
    layoutTopDown(rootNode.id, startX, 0, 0);

    return {
      nodes: Array.from(nodeMap.values()),
      edges,
    };
  }
}
