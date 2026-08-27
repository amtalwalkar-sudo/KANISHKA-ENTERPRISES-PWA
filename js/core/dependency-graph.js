// Directional calculation dependency graph. Contains structure only, no formulas.
export function createDependencyGraph(){const nodes=new Map(),edges=new Map();return {
  addNode(id,meta={}){if(nodes.has(id))throw new Error(`Duplicate dependency node: ${id}`);nodes.set(id,Object.freeze({id,...meta}));edges.set(id,new Set());return nodes.get(id);},
  addDependency(from,to){if(!nodes.has(from)||!nodes.has(to))throw new Error('Dependency endpoints must exist');if(from===to)throw new Error('Circular self-dependency');edges.get(from).add(to);if(hasPath(to,from,edges)) {edges.get(from).delete(to);throw new Error('Circular calculation dependency');}return true;},
  dependenciesOf(id){return [...(edges.get(id)||[])];},
  nodes(){return [...nodes.values()];},
  edges(){return [...edges.entries()].flatMap(([from,set])=>[...set].map(to=>({from,to})))},
  topologicalOrder(){const indegree=new Map([...nodes.keys()].map(k=>[k,0]));for(const tos of edges.values())for(const to of tos)indegree.set(to,indegree.get(to)+1);const q=[...indegree].filter(([,n])=>n===0).map(([k])=>k),out=[];while(q.length){const n=q.shift();out.push(n);for(const to of edges.get(n)){indegree.set(to,indegree.get(to)-1);if(indegree.get(to)===0)q.push(to);}}if(out.length!==nodes.size)throw new Error('Calculation dependency graph contains a cycle');return out;}
};}
function hasPath(start,target,edges,seen=new Set()){if(start===target)return true;if(seen.has(start))return false;seen.add(start);for(const next of edges.get(start)||[])if(hasPath(next,target,edges,seen))return true;return false;}
