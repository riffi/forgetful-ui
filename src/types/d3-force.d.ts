declare module 'd3-force' {
  export function forceSimulation<NodeDatum>(nodes?: NodeDatum[]): Simulation<NodeDatum, undefined>
  export function forceLink<NodeDatum, LinkDatum>(links?: LinkDatum[]): ForceLink<NodeDatum, LinkDatum>
  export function forceManyBody<NodeDatum>(): ForceManyBody<NodeDatum>
  export function forceCenter<NodeDatum>(x?: number, y?: number): ForceCenter<NodeDatum>
  export function forceCollide<NodeDatum>(radius?: number | ((node: NodeDatum) => number)): ForceCollide<NodeDatum>
  export function forceRadial<NodeDatum>(radius: number | ((node: NodeDatum) => number), x?: number, y?: number): ForceRadial<NodeDatum>
  export function forceX<NodeDatum>(x?: number | ((node: NodeDatum) => number)): ForceX<NodeDatum>
  export function forceY<NodeDatum>(y?: number | ((node: NodeDatum) => number)): ForceY<NodeDatum>

  interface Simulation<NodeDatum, LinkDatum> {
    nodes(nodes: NodeDatum[]): this
    force(name: string, force?: Force<NodeDatum, LinkDatum> | null): this
    alpha(alpha?: number): number | this
    alphaTarget(target?: number): number | this
    alphaDecay(decay?: number): number | this
    velocityDecay(decay?: number): number | this
    tick(iterations?: number): this
    restart(): this
    stop(): this
    on(typenames: string, listener?: ((this: this) => void) | null): this
  }

  interface Force<NodeDatum, LinkDatum> {
    (alpha: number): void
  }

  interface ForceLink<NodeDatum, LinkDatum> extends Force<NodeDatum, LinkDatum> {
    links(links: LinkDatum[]): this
    id(id: (node: NodeDatum) => string): this
    distance(distance: number | ((link: LinkDatum) => number)): this
    strength(strength: number | ((link: LinkDatum) => number)): this
  }

  interface ForceManyBody<NodeDatum> extends Force<NodeDatum, undefined> {
    strength(strength: number | ((node: NodeDatum) => number)): this
    distanceMin(distance: number): this
    distanceMax(distance: number): this
  }

  interface ForceCenter<NodeDatum> extends Force<NodeDatum, undefined> {
    x(x: number): this
    y(y: number): this
  }

  interface ForceCollide<NodeDatum> extends Force<NodeDatum, undefined> {
    radius(radius: number | ((node: NodeDatum) => number)): this
    strength(strength: number): this
  }

  interface ForceRadial<NodeDatum> extends Force<NodeDatum, undefined> {
    radius(radius: number | ((node: NodeDatum) => number)): this
    x(x: number): this
    y(y: number): this
    strength(strength: number): this
  }

  interface ForceX<NodeDatum> extends Force<NodeDatum, undefined> {
    x(x: number | ((node: NodeDatum) => number)): this
    strength(strength: number): this
  }

  interface ForceY<NodeDatum> extends Force<NodeDatum, undefined> {
    y(y: number | ((node: NodeDatum) => number)): this
    strength(strength: number): this
  }
}
