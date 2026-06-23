/**
 * Naming convention inference — purpose detection from file names,
 * function names, class names, and import patterns.
 */

import * as path from 'path';
import { FileRole, ArchitectureLayer } from '../models/types';
import { FILE_ROLE_PATTERNS, LAYER_PATTERNS } from '../config/constants';

// ─── File Role Detection ──────────────────────────────────────────────────────

/**
 * Infer the role of a file from its path and extension.
 */
export function inferFileRole(filePath: string): FileRole {
  const base = path.basename(filePath, path.extname(filePath));
  const ext = path.extname(filePath);
  const parts = filePath.split(path.sep);
  const lowerParts = parts.map(p => p.toLowerCase());

  // Test files
  if (FILE_ROLE_PATTERNS.test.patterns.some(p => filePath.includes(p))) {
    return FileRole.Test;
  }
  // Hooks (useXxx.ts/tsx)
  if (FILE_ROLE_PATTERNS.hook.prefixes.some(p => base.startsWith(p)) &&
    (ext === '.ts' || ext === '.tsx')) {
    return FileRole.Hook;
  }
  // Component (ends with Component/View/Screen/Page etc., or .tsx/.jsx)
  if (FILE_ROLE_PATTERNS.component.suffixes.some(s => base.endsWith(s)) ||
    (['.tsx', '.jsx'].includes(ext) && base[0] === base[0].toUpperCase())) {
    return FileRole.Component;
  }
  // Service
  if (FILE_ROLE_PATTERNS.service.suffixes.some(s => base.endsWith(s))) {
    return FileRole.Service;
  }
  // Route
  if (FILE_ROLE_PATTERNS.route.suffixes.some(s => base.endsWith(s)) ||
    FILE_ROLE_PATTERNS.route.folders.some(f => lowerParts.includes(f))) {
    return FileRole.Route;
  }
  // Controller
  if (FILE_ROLE_PATTERNS.controller.suffixes.some(s => base.endsWith(s)) ||
    lowerParts.includes('controllers')) {
    return FileRole.Controller;
  }
  // Model / Entity
  if (FILE_ROLE_PATTERNS.model.suffixes.some(s => base.endsWith(s)) ||
    FILE_ROLE_PATTERNS.model.folders.some(f => lowerParts.includes(f))) {
    return FileRole.Model;
  }
  // Type definition
  if (ext === '.d.ts' ||
    FILE_ROLE_PATTERNS.type.folders.some(f => lowerParts.includes(f))) {
    return FileRole.Type;
  }
  // Config
  if (FILE_ROLE_PATTERNS.config.folders.some(f => lowerParts.includes(f))) {
    return FileRole.Config;
  }
  // Utility
  if (FILE_ROLE_PATTERNS.utility.folders.some(f => lowerParts.includes(f))) {
    return FileRole.Utility;
  }

  return FileRole.Unknown;
}

// ─── Architecture Layer Detection ─────────────────────────────────────────────

/**
 * Detect the architectural layer of a file from its path and dependencies.
 */
export function inferArchitectureLayer(
  filePath: string,
  importSources: string[],
): ArchitectureLayer {
  const lowerPath = filePath.toLowerCase();
  const ext = path.extname(filePath);

  // Test layer
  if (
    LAYER_PATTERNS.test.patterns.some((p) => lowerPath.includes(p.replace('*', ''))) ||
    LAYER_PATTERNS.test.folders.some((f) => lowerPath.includes(`/${f}/`)) ||
    LAYER_PATTERNS.test.imports.some((i) => importSources.includes(i))
  ) {
    return ArchitectureLayer.Test;
  }

  // Frontend layer
  if (
    LAYER_PATTERNS.frontend.folders.some((f) => lowerPath.includes(`/${f}/`)) ||
    LAYER_PATTERNS.frontend.extensions.includes(ext as '.tsx') ||
    LAYER_PATTERNS.frontend.imports.some((i) => importSources.some((s) => s.includes(i)))
  ) {
    return ArchitectureLayer.Frontend;
  }

  // API / Routes layer
  if (
    LAYER_PATTERNS.api.folders.some((f) => lowerPath.includes(`/${f}/`)) ||
    LAYER_PATTERNS.api.imports.some((i) => importSources.some((s) => s.includes(i)))
  ) {
    return ArchitectureLayer.API;
  }

  // Service layer
  if (LAYER_PATTERNS.service.folders.some((f) => lowerPath.includes(`/${f}/`))) {
    return ArchitectureLayer.Service;
  }

  // Data layer
  if (
    LAYER_PATTERNS.data.folders.some((f) => lowerPath.includes(`/${f}/`)) ||
    LAYER_PATTERNS.data.imports.some((i) => importSources.some((s) => s.includes(i)))
  ) {
    return ArchitectureLayer.Data;
  }

  // Config layer
  if (LAYER_PATTERNS.configuration.folders.some((f) => lowerPath.includes(`/${f}/`))) {
    return ArchitectureLayer.Configuration;
  }

  // Utility layer
  if (LAYER_PATTERNS.utility.folders.some((f) => lowerPath.includes(`/${f}/`))) {
    return ArchitectureLayer.Utility;
  }

  return ArchitectureLayer.Unknown;
}

// ─── Purpose Inference ────────────────────────────────────────────────────────

/**
 * Infer a human-readable description of a file's purpose.
 */
export function inferFilePurpose(
  filePath: string,
  exportNames: string[],
  importSources: string[],
  fileOverviewComment?: string,
): string {
  if (fileOverviewComment) {
    return fileOverviewComment.trim();
  }

  const base = path.basename(filePath, path.extname(filePath));
  const role = inferFileRole(filePath);

  switch (role) {
    case FileRole.Component: return `React component: ${base}`;
    case FileRole.Hook: return `Custom React hook: ${base}`;
    case FileRole.Service: return `Service module: ${base}`;
    case FileRole.Route: return `Route handler: ${base}`;
    case FileRole.Controller: return `Controller: ${base}`;
    case FileRole.Model: return `Data model / entity: ${base}`;
    case FileRole.Type: return `Type definitions for ${base}`;
    case FileRole.Config: return `Configuration: ${base}`;
    case FileRole.Utility: return `Utility functions: ${base}`;
    case FileRole.Test: return `Test suite for ${base.replace(/\.(test|spec)$/, '')}`;
    default: {
      if (exportNames.length > 0) {
        return `Module exporting: ${exportNames.slice(0, 3).join(', ')}${exportNames.length > 3 ? '…' : ''}`;
      }
      return `Module: ${base}`;
    }
  }
}

// ─── Naming Utilities ─────────────────────────────────────────────────────────

/** Convert camelCase or PascalCase to a human-readable label. */
export function camelToLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/** Check if a name follows React component naming (PascalCase). */
export function isPascalCase(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

/** Check if a name follows hook naming convention (useXxx). */
export function isHookName(name: string): boolean {
  return /^use[A-Z]/.test(name);
}
