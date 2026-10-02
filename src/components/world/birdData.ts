/**
 * Shared bird and perch data for the meadow (kept out of the component
 * files so fast refresh keeps working).
 */

/** Feather colours for the flock: body, belly and wing. */
export const PLUMAGE = [
  { body: "#5ab4f0", belly: "#e6f6ff", wing: "#2f8ad1" },
  { body: "#ffcd3c", belly: "#fff6d6", wing: "#f0a500" },
  { body: "#ff8fab", belly: "#ffe8ee", wing: "#e85d84" },
  { body: "#8ad672", belly: "#effbe8", wing: "#58ad40" },
] as const;

export interface Perch {
  x: number;
  y: number;
}

/** Where on the oak (relative to its base) a bird can sit. */
export function oakPerches(x: number, y: number): Perch[] {
  return [
    { x: x + 14, y: y - 18.5 },
    { x: x - 12.5, y: y - 16 },
    { x: x - 1, y: y - 33 },
  ];
}
