/**
 * Command: Show Complexity Report
 */

import * as vscode from 'vscode';
import { DashboardPanel } from '../panels/DashboardPanel';
import { discoverSourceFiles } from '../utils/fileSystem';
import { getSettings } from '../config/settings';
import { getParserService } from '../services/parserService';
import { analyzeFunctions } from '../analyzers/functionAnalyzer';
import { getCacheService } from '../services/cacheService';
import { ComplexityReport, ComplexityEntry } from '../models/analysis';
import { RiskLevel } from '../models/types';
import * as path from 'path';

export async function complexityAnalysisCommand(context: vscode.ExtensionContext) {
  const rootUri = vscode.workspace.workspaceFolders?.[0]?.uri;
  if (!rootUri) {
    vscode.window.showErrorMessage('CodeScope: Please open a workspace folder first.');
    return;
  }

  const rootPath = rootUri.fsPath;
  const settings = getSettings();

  try {
    DashboardPanel.createOrShow(context.extensionUri);

    const cache = getCacheService();
    if (cache.getComplexityReport(rootPath)) {
        const cached = cache.getComplexityReport(rootPath)!;
        DashboardPanel.postMessage({ type: 'complexityReportResult', payload: { success: true, data: cached, duration: 0, timestamp: Date.now() } });
        return;
    }

    DashboardPanel.postMessage({ type: 'progress', payload: { status: 'running', message: 'Analyzing code complexity...', current: 0, total: 100, percentage: 10 } });

    const start = Date.now();
    const files = await discoverSourceFiles(rootPath, settings.analysis.excludePatterns);
    const parser = getParserService();
    
    const allEntries: ComplexityEntry[] = [];
    let totalCyclomatic = 0;
    let totalCognitive = 0;
    let maxCyclomatic = 0;
    let maxCognitive = 0;
    const riskDistribution: Record<RiskLevel, number> = {
        [RiskLevel.Low]: 0,
        [RiskLevel.Medium]: 0,
        [RiskLevel.High]: 0,
        [RiskLevel.Critical]: 0
    };

    let current = 0;
    for (const filePath of files) {
        current++;
        if (current % 10 === 0) {
            DashboardPanel.postMessage({ type: 'progress', payload: { status: 'running', message: `Analyzing code complexity (${current}/${files.length})...`, current, total: files.length, percentage: 10 + Math.floor((current/files.length) * 80) } });
        }

        const parsed = parser.parseFile(filePath);
        if (!parsed) {continue;}

        const relativePath = path.relative(rootPath, filePath);
        const fns = analyzeFunctions(parsed.sourceFile, filePath, relativePath);

        for (const fn of fns) {
            const entry: ComplexityEntry = {
                functionName: fn.name,
                filePath,
                relativePath,
                line: fn.location.line,
                cyclomaticComplexity: fn.cyclomaticComplexity,
                cognitiveComplexity: fn.cognitiveComplexity,
                nestedLoopDepth: fn.nestedLoopDepth,
                linesOfCode: fn.linesOfCode,
                parameterCount: fn.parameters.length,
                codeSmellScore: fn.codeSmellScore,
                riskLevel: fn.riskLevel,
                estimatedTimeComplexity: fn.estimatedTimeComplexity,
                estimatedSpaceComplexity: fn.estimatedSpaceComplexity,
                issues: getComplexityIssues(fn)
            };

            allEntries.push(entry);

            totalCyclomatic += fn.cyclomaticComplexity;
            totalCognitive += fn.cognitiveComplexity;
            maxCyclomatic = Math.max(maxCyclomatic, fn.cyclomaticComplexity);
            maxCognitive = Math.max(maxCognitive, fn.cognitiveComplexity);
            riskDistribution[fn.riskLevel]++;
        }
    }

    // Sort entries by code smell score (highest first)
    allEntries.sort((a, b) => b.codeSmellScore - a.codeSmellScore);

    const report: ComplexityReport = {
        projectPath: rootPath,
        totalFunctions: allEntries.length,
        averageCyclomatic: allEntries.length > 0 ? Number((totalCyclomatic / allEntries.length).toFixed(1)) : 0,
        averageCognitive: allEntries.length > 0 ? Number((totalCognitive / allEntries.length).toFixed(1)) : 0,
        maxCyclomatic,
        maxCognitive,
        riskDistribution,
        topComplexFunctions: allEntries.slice(0, 50),
        allEntries,
        generatedAt: Date.now()
    };

    cache.setComplexityReport(rootPath, report);

    DashboardPanel.postMessage({ type: 'complexityReportResult', payload: { success: true, data: report, duration: Date.now() - start, timestamp: report.generatedAt } });

  } catch (error: any) {
    vscode.window.showErrorMessage(`CodeScope: Failed to generate complexity report. ${error.message}`);
    DashboardPanel.postMessage({ type: 'complexityReportResult', payload: { success: false, error: error.message, duration: 0, timestamp: Date.now() } });
  }
}

function getComplexityIssues(fn: any): string[] {
    const issues: string[] = [];
    if (fn.cyclomaticComplexity > 10) issues.push(`High cyclomatic complexity (${fn.cyclomaticComplexity})`);
    if (fn.cognitiveComplexity > 15) issues.push(`High cognitive complexity (${fn.cognitiveComplexity})`);
    if (fn.nestedLoopDepth > 2) issues.push(`Deeply nested loops (depth: ${fn.nestedLoopDepth})`);
    if (fn.parameters.length > 4) issues.push(`Too many parameters (${fn.parameters.length})`);
    if (fn.linesOfCode > 50) issues.push(`Function too long (${fn.linesOfCode} lines)`);
    if (fn.functionCalls.length > 15) issues.push(`High coupling — ${fn.functionCalls.length} function calls`);
    return issues;
}
