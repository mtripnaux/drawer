import { Contact, Relation, Link } from '../types';

export interface GraphEdge {
  target: string;
  relation: string;
}

const RELATION_WEIGHTS: Record<string, number> = {
  "Sibling": 0.5,
  "Spouse": 0.5,
  "Partner": 0.6,
  "Friend": 1,
  "Parent": 0.8,
  "Child": 0.8,
  "Boss": 2,
  "Employee": 2,
  "Colleague": 1,
  "Half-Sibling": 0.75,
  "Ex": 2
};

export function buildGraph(contacts: Contact[]): Map<string, GraphEdge[]> {
  const graph = new Map<string, GraphEdge[]>();

  const getNode = (id: string) => {
    if (!graph.has(id)) graph.set(id, []);
    return graph.get(id)!;
  };

  const inverses: Record<string, string> = {
    Parent: "Child",
    Child: "Parent",
    Boss: "Employee",
    Employee: "Boss"
  };

  for (const c of contacts) {
    for (const l of c.links || []) {
      getNode(c.identifier).push({ target: l.target, relation: l.relation });
      if (inverses[l.relation]) {
        getNode(l.target).push({ target: c.identifier, relation: inverses[l.relation] });
      }
    }
  }

  for (const a of contacts) {
      for (const b of contacts) {
          if (a.identifier === b.identifier) continue;
          if (!a.links || !b.links) continue;

          const parentsA = a.links.filter(l => l.relation === "Child").map(l => l.target);
          const parentsB = b.links.filter(l => l.relation === "Child").map(l => l.target);

          if (parentsA.length > 0 && parentsA.every(p => parentsB.includes(p))) {
            getNode(a.identifier).push({ target: b.identifier, relation: "Sibling" });
            getNode(b.identifier).push({ target: a.identifier, relation: "Sibling" });
          } else if (parentsA.length > 0 && parentsA.some(p => parentsB.includes(p))) {
            getNode(a.identifier).push({ target: b.identifier, relation: "Half-Sibling" });
            getNode(b.identifier).push({ target: a.identifier, relation: "Half-Sibling" });
          }
      }
  }

  return graph;
}

export function shortestPath(graph: Map<string, GraphEdge[]>, start: string, end: string): { distance: number, path: string[], relations: string[] } | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, { from: string, relation: string }>();
  const visited = new Set<string>();
  const queue: { id: string; d: number }[] = [{ id: start, d: 0 }];

  const inverses: Record<string, string> = {
    Parent: "Child",
    Child: "Parent",
    Boss: "Employee",
    Employee: "Boss"
  };

  dist.set(start, 0);

  // Dijkstra
  while (queue.length > 0) {
    queue.sort((a, b) => a.d - b.d);
    const { id, d } = queue.shift()!;

    if (id === end) {
      // Reconstruct path
      const path: string[] = [end];
      const relations: string[] = [];
      let curr = end;
      while (curr !== start) {
        const p = prev.get(curr);
        if (!p) break;
        path.unshift(p.from);
        
        // Invert the relation for display
        const displayRelation = inverses[p.relation] || p.relation;
        relations.unshift(displayRelation);
        
        curr = p.from;
      }
      return { distance: d, path, relations };
    }

    if (visited.has(id)) continue;
    visited.add(id);

    for (const edge of graph.get(id) || []) {
      const w = RELATION_WEIGHTS[edge.relation] ?? 1;
      const nd = d + w;
      if (nd < (dist.get(edge.target) ?? Infinity)) {
        dist.set(edge.target, nd);
        prev.set(edge.target, { from: id, relation: edge.relation });
        queue.push({ id: edge.target, d: nd });
      }
    }
  }

  return null;
}
