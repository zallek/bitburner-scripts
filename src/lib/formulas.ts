import { NS } from "@ns";

export function hasFormulas(ns: NS) {
  return ns.fileExists("Formulas.exe");
}
