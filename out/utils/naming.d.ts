/**
 * Naming convention inference — purpose detection from file names,
 * function names, class names, and import patterns.
 */
import { FileRole, ArchitectureLayer } from '../models/types';
/**
 * Infer the role of a file from its path and extension.
 */
export declare function inferFileRole(filePath: string): FileRole;
/**
 * Detect the architectural layer of a file from its path and dependencies.
 */
export declare function inferArchitectureLayer(filePath: string, importSources: string[]): ArchitectureLayer;
/**
 * Infer a human-readable description of a file's purpose.
 */
export declare function inferFilePurpose(filePath: string, exportNames: string[], importSources: string[], fileOverviewComment?: string): string;
/** Convert camelCase or PascalCase to a human-readable label. */
export declare function camelToLabel(name: string): string;
/** Check if a name follows React component naming (PascalCase). */
export declare function isPascalCase(name: string): boolean;
/** Check if a name follows hook naming convention (useXxx). */
export declare function isHookName(name: string): boolean;
//# sourceMappingURL=naming.d.ts.map