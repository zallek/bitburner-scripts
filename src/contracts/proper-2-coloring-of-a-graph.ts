/**
 * Proper 2-Coloring of a Graph
You are attempting to solve a Coding Contract. You have 5 tries remaining, after which the contract will self-destruct.


You are given the following data, representing a graph:
[12,[[3,5],[7,9],[4,11],[8,11],[0,5],[6,9],[0,7],[9,11],[2,3],[7,8],[3,6],[0,5],[3,7],[2,4],[0,6],[5,10],[1,9]]]
Note that "graph", as used here, refers to the field of graph theory, and has no relation to statistics or plotting.
The first element of the data represents the number of vertices in the graph. Each vertex is a unique number between 0 and 11.
The next element of the data represents the edges of the graph.
Two vertices u,v in a graph are said to be adjacent if there exists an edge [u,v].
Note that an edge [u,v] is the same as an edge [v,u], as order does not matter.

You must construct a 2-coloring of the graph, meaning that you have to assign each vertex in the graph a "color", either 0 or 1, 
such that no two adjacent vertices have the same color. Submit your answer in the form of an array, where element i represents the color of vertex i.
If it is impossible to construct a 2-coloring of the given graph, instead submit an empty array.

Examples:

Input: [4, [[0, 2], [0, 3], [1, 2], [1, 3]]]
Output: [0, 0, 1, 1]

Input: [3, [[0, 1], [0, 2], [1, 2]]]
Output: []

*/

import { NS } from "@ns";

/** @param {NS} ns */
export function proper2coloringOfAGraph(ns: NS, input: [number, number[][]]): number[] {
  const nbVertices = input[0];
  const edges = input[1];

  const vertices: Record<number, number[]> = {};
  for (let i = 0; i < nbVertices; i++) {
    vertices[i] = [];
  }
  for (const edge of edges) {
    for (const vertice of edge) {
      for (const verticeB of edge) {
        if (verticeB != vertice && !vertices[vertice].includes(verticeB)) {
          vertices[vertice].push(verticeB);
        }
      }
    }
  }
  ns.print(vertices);

  const groups = [];

  const verticesToAssign = [parseInt(Object.keys(vertices)[0])];
  const verticesAssigned = [];
  while (verticesToAssign.length > 0) {
    const verticeToAssign = verticesToAssign.shift() as number;
    const adjacents = vertices[verticeToAssign];

    let assigned = false;
    for (const group of groups) {
      if (group.filter((x) => adjacents.includes(x)).length == 0) {
        group.push(verticeToAssign);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      groups.push([verticeToAssign]);
      assigned = true;
    }

    verticesAssigned.push(verticeToAssign);

    for (const adjacent of adjacents) {
      if (!verticesToAssign.includes(adjacent) && !verticesAssigned.includes(adjacent)) {
        verticesToAssign.push(adjacent);
      }
    }
  }
  // Add lonely vertices
  for (let i = 0; i < nbVertices; i++) {
    if (!verticesAssigned.includes(i)) {
      groups[0].push(i);
    }
  }

  ns.print("groups");
  ns.print(groups);

  const verticesGroups = [];
  for (let i = 0; i < groups.length; i++) {
    for (const vertice of groups[i]) {
      verticesGroups[vertice] = i;
    }
  }

  if (verticesGroups.length != nbVertices) {
    throw Error("Algo is buggy, missing vertices");
  }

  ns.print("verticesGroups");
  ns.print(verticesGroups);

  return groups.length > 2 ? [] : verticesGroups;
}
