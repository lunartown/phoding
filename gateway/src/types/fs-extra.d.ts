declare module 'fs-extra' {
  import type { PathLike } from 'fs';

  export function pathExists(path: PathLike): Promise<boolean>;
  export function readFile(path: PathLike, encoding: string): Promise<string>;
  export function readFile(
    path: PathLike,
    options: { encoding: string },
  ): Promise<string>;
  export function writeFile(
    path: PathLike,
    data: string,
    options?: string | { encoding?: string },
  ): Promise<void>;
  export function ensureDir(path: PathLike): Promise<void>;
  export function lstatSync(path: PathLike): import('fs').Stats;
  export function remove(path: PathLike): Promise<void>;
  export function move(
    src: PathLike,
    dest: PathLike,
    options?: { overwrite?: boolean },
  ): Promise<void>;
}
