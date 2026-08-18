export interface CanvasSnapshot<TNode = any, TEdge = any> {
  nodes: TNode[];
  edges: TEdge[];
  timestamp: number;
}

export class CanvasHistoryManager<TNode = any, TEdge = any> {
  private past: CanvasSnapshot<TNode, TEdge>[] = [];
  private future: CanvasSnapshot<TNode, TEdge>[] = [];
  private maxHistory: number = 40;

  constructor(maxHistory = 40) {
    this.maxHistory = maxHistory;
  }

  public push(nodes: TNode[], edges: TEdge[]) {
    // Clone snapshots
    const snapshot: CanvasSnapshot<TNode, TEdge> = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now(),
    };

    this.past.push(snapshot);
    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }
    // Clear redo stack on new action
    this.future = [];
  }

  public canUndo(): boolean {
    return this.past.length > 0;
  }

  public canRedo(): boolean {
    return this.future.length > 0;
  }

  public undo(
    currentNodes: TNode[],
    currentEdges: TEdge[]
  ): CanvasSnapshot<TNode, TEdge> | null {
    if (!this.canUndo()) return null;

    // Push current state to future
    this.future.push({
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
      timestamp: Date.now(),
    });

    const previous = this.past.pop();
    return previous || null;
  }

  public redo(
    currentNodes: TNode[],
    currentEdges: TEdge[]
  ): CanvasSnapshot<TNode, TEdge> | null {
    if (!this.canRedo()) return null;

    // Push current state to past
    this.past.push({
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
      timestamp: Date.now(),
    });

    const next = this.future.pop();
    return next || null;
  }

  public clear() {
    this.past = [];
    this.future = [];
  }

  public getCounts() {
    return {
      undoCount: this.past.length,
      redoCount: this.future.length,
    };
  }
}
