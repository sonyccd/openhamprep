/** Which screen the bulk importer is on. */
export type ImportStep = 'upload' | 'conflicts' | 'importing';

export type ResolutionAction = 'keep' | 'replace' | 'merge';

export interface ConflictItem<T> {
  id: string;
  existing: T;
  incoming: T;
  resolution: ResolutionAction;
}
