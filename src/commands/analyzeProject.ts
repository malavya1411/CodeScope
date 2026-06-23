/**
 * Command: Analyze Repository / Project Overview
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { DashboardPanel } from '../panels/DashboardPanel';
import { buildDependencyGraph, generateReadingOrder } from '../analyzers/dependencyAnalyzer';
import { discoverSourceFiles, getFileSize, readFile, countLines } from '../utils/fileSystem';
import { getSettings } from '../config/settings';
import { getParserService } from '../services/parserService';
import { analyzeFunctions } from '../analyzers/functionAnalyzer';
import { analyzeClasses } from '../analyzers/classAnalyzer';
import { analyzeArchitecture } from '../analyzers/architectureAnalyzer';
import { ProjectAnalysis, ProjectType, ProjectMetrics, FolderMetrics, ArchitectureLayer } from '../models/types';
import { detectCircularDependencies, findUnusedExports } from '../analyzers/dependencyAnalyzer';

export async function analyzeProjectCommand(context: vscode.ExtensionContext) {
  const rootUri = vscode.workspace.workspaceFolders?.[0]?.uri;
  if (!rootUri) {
    vscode.window.showErrorMessage('CodeScope: Please open a workspace folder first.');
    return;
  }

  const rootPath = rootUri.fsPath;
  const settings = getSettings();
  
  try {
    DashboardPanel.createOrShow(context.extensionUri);
    
    // Check total files first
    const files = await discoverSourceFiles(rootPath, settings.analysis.excludePatterns);
    if (files.length > settings.analysis.maxFiles) {
        vscode.window.showWarningMessage(`CodeScope: Project too large (${files.length} files). Limited to ${settings.analysis.maxFiles}. Adjust settings if needed.`);
        files.length = settings.analysis.maxFiles;
    }

    DashboardPanel.postMessage({ type: 'progress', payload: { status: 'running', message: 'Building dependency graph...', current: 0, total: 100, percentage: 10 } });

    const start = Date.now();
    const parser = getParserService();
    
    // 1. Dependency Graph & Architecture
    const graph = await buildDependencyGraph(rootPath, (current, total) => {
         DashboardPanel.postMessage({ type: 'progress', payload: { status: 'running', message: `Resolving imports (${current}/${total})...`, current, total: total*2, percentage: 10 + Math.floor((current/total) * 40) } });
    });

    const architectureLayers = analyzeArchitecture(graph, rootPath);
    const readingOrder = generateReadingOrder(graph, rootPath);

    // 2. Project Metrics & Tree Construction
    DashboardPanel.postMessage({ type: 'progress', payload: { status: 'running', message: 'Analyzing project metrics...', current: 50, total: 100, percentage: 50 } });

    const metrics: ProjectMetrics = {
        totalFiles: graph.nodes.size,
        totalLines: 0,
        totalFunctions: 0,
        totalClasses: 0,
        averageComplexity: 0,
        highRiskFiles: 0,
        circularDependencies: 0,
        unusedExports: 0,
        languageDistribution: {}
    };

    let totalFunctionComplexity = 0;

    const folderMap = new Map<string, FolderMetrics>();
    const rootFolder: FolderMetrics = { path: rootPath, relativePath: '', fileCount: 0, totalLines: 0, averageComplexity: 0, children: [] };
    folderMap.set(rootPath, rootFolder);

    for (const [filePath, node] of graph.nodes.entries()) {
        metrics.totalLines += node.data.linesOfCode;
        
        // Language distribution
        const lang = node.data.language;
        metrics.languageDistribution[lang] = (metrics.languageDistribution[lang] || 0) + 1;

        // Folders
        const dir = path.dirname(filePath);
        let currDir = dir;
        while (currDir !== rootPath && currDir.length >= rootPath.length) {
            if (!folderMap.has(currDir)) {
                 const relPath = path.relative(rootPath, currDir);
                 folderMap.set(currDir, { path: currDir, relativePath: relPath, fileCount: 0, totalLines: 0, averageComplexity: 0, children: [] });
                 const parentDir = path.dirname(currDir);
                 if (folderMap.has(parentDir)) {
                     folderMap.get(parentDir)!.children.push(folderMap.get(currDir)!);
                 }
            }
            const f = folderMap.get(currDir)!;
            f.fileCount++;
            f.totalLines += node.data.linesOfCode;
            currDir = path.dirname(currDir);
        }
        rootFolder.fileCount++;
        rootFolder.totalLines += node.data.linesOfCode;

        // Parse file for deep metrics
        const parsed = parser.parseFile(filePath);
        if (parsed) {
             const fns = analyzeFunctions(parsed.sourceFile, filePath, node.data.relativePath);
             const classes = analyzeClasses(parsed.sourceFile, filePath, node.data.relativePath);
             
             metrics.totalFunctions += fns.length;
             metrics.totalClasses += classes.length;
             
             let fileComplexity = 0;
             for (const fn of fns) {
                 totalFunctionComplexity += fn.cyclomaticComplexity;
                 fileComplexity += fn.cyclomaticComplexity;
             }

             if (fns.length > 0 && (fileComplexity / fns.length) > 10) {
                 metrics.highRiskFiles++;
             }
        }
    }

    metrics.averageComplexity = metrics.totalFunctions > 0 ? Number((totalFunctionComplexity / metrics.totalFunctions).toFixed(1)) : 0;

    DashboardPanel.postMessage({ type: 'progress', payload: { status: 'running', message: 'Detecting project type and issues...', current: 80, total: 100, percentage: 80 } });

    // 3. Project Type & Entry Points
    const packageJsonPath = path.join(rootPath, 'package.json');
    let framework = 'vanilla';
    let buildTool = 'tsc';
    let testFramework = 'unknown';

    if (getFileSize(packageJsonPath) > 0) {
        const pkgStr = readFile(packageJsonPath);
        if (pkgStr) {
            try {
                const pkg = JSON.parse(pkgStr);
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                if (deps['react']) framework = 'react';
                if (deps['vue']) framework = 'vue';
                if (deps['@angular/core']) framework = 'angular';
                if (deps['express']) framework = 'express';
                if (deps['next']) framework = 'next';
                if (deps['@nestjs/core']) framework = 'nestjs';

                if (deps['vite']) buildTool = 'vite';
                else if (deps['webpack']) buildTool = 'webpack';
                
                if (deps['jest']) testFramework = 'jest';
                else if (deps['vitest']) testFramework = 'vitest';
            } catch (e) {}
        }
    }

    const projectType: ProjectType = {
        name: path.basename(rootPath),
        framework,
        language: metrics.languageDistribution['typescript'] ? 'typescript' : 'javascript',
        buildTool,
        testFramework
    };

    // Find Entry points (in-degree == 0, not a test, not utility)
    const entryPoints = Array.from(graph.nodes.values())
        .filter(n => n.data.inDegree === 0 && n.data.layer !== ArchitectureLayer.Test && n.data.layer !== ArchitectureLayer.Utility)
        .map(n => ({ filePath: n.data.filePath, relativePath: n.data.relativePath, kind: 'main' as any }));

    // 4. Issues
    const circularDeps = detectCircularDependencies(graph, rootPath);
    const unusedExports = await findUnusedExports(graph, rootPath);
    metrics.circularDependencies = circularDeps.length;
    metrics.unusedExports = unusedExports.length;

    const issues: any[] = [];
    if (circularDeps.length > 0) {
        issues.push({ type: 'circular-dependency', message: `Found ${circularDeps.length} circular dependencies.`, severity: 'high' });
    }
    if (unusedExports.length > 0) {
        issues.push({ type: 'unused-export', message: `Found ${unusedExports.length} unused exports.`, severity: 'medium' });
    }
    if (metrics.highRiskFiles > 0) {
        issues.push({ type: 'high-complexity', message: `${metrics.highRiskFiles} files have high average complexity.`, severity: 'medium' });
    }

    const analysis: ProjectAnalysis = {
        name: projectType.name,
        rootPath,
        projectType,
        entryPoints,
        folderTree: rootFolder,
        metrics,
        files: [], // Omitted for payload size, fetch individually
        suggestedReadingOrder: readingOrder,
        architectureLayers,
        issues,
        analysisTime: Date.now() - start,
        timestamp: Date.now()
    };

    DashboardPanel.postMessage({ type: 'projectAnalysisResult', payload: { success: true, data: analysis, duration: analysis.analysisTime, timestamp: analysis.timestamp } });

  } catch (error: any) {
    vscode.window.showErrorMessage(`CodeScope: Failed to analyze project. ${error.message}`);
    DashboardPanel.postMessage({ type: 'projectAnalysisResult', payload: { success: false, error: error.message, duration: 0, timestamp: Date.now() } });
  }
}
