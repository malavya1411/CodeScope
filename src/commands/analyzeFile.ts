/**
 * Command: Analyze Current File
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { getParserService } from '../services/parserService';
import { getCacheService } from '../services/cacheService';
import { analyzeFunctions } from '../analyzers/functionAnalyzer';
import { analyzeClasses } from '../analyzers/classAnalyzer';
import { extractImports, extractExports, extractTopLevelVariables, getLanguageId, getFileOverviewComment } from '../analyzers/astAnalyzer';
import { inferFilePurpose, inferFileRole, inferArchitectureLayer } from '../utils/naming';
import { DashboardPanel } from '../panels/DashboardPanel';
import { FileAnalysis, FileMetrics } from '../models/types';
import { COMPLEXITY_THRESHOLDS } from '../config/constants';

export async function analyzeFileCommand(context: vscode.ExtensionContext, uri?: vscode.Uri) {
  // Determine file to analyze
  const editor = vscode.window.activeTextEditor;
  const targetUri = uri || editor?.document.uri;

  if (!targetUri) {
    vscode.window.showErrorMessage('CodeScope: No file selected for analysis.');
    return;
  }

  const filePath = targetUri.fsPath;
  const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || path.dirname(filePath);
  const relativePath = path.relative(rootPath, filePath);

  try {
    // Show UI quickly
    DashboardPanel.createOrShow(context.extensionUri);
    DashboardPanel.postMessage({ type: 'progress', payload: { status: 'running', message: `Analyzing ${path.basename(filePath)}...`, current: 0, total: 100, percentage: 10 } });

    // Check cache
    const cache = getCacheService();
    if (cache.hasFileAnalysis(filePath)) {
        const cached = cache.getFileAnalysis(filePath)!;
        DashboardPanel.postMessage({ type: 'fileAnalysisResult', payload: { success: true, data: cached, duration: 0, timestamp: Date.now() } });
        return;
    }

    const start = Date.now();
    const parser = getParserService();
    const parsed = parser.parseFile(filePath);

    if (!parsed) {
        throw new Error('Unsupported file type or unparsable file.');
    }

    DashboardPanel.postMessage({ type: 'progress', payload: { status: 'running', message: `Extracting AST features...`, current: 50, total: 100, percentage: 50 } });

    // 1. Core Extraction
    const language = getLanguageId(filePath);
    const imports = extractImports(parsed.sourceFile, filePath);
    const exports = extractExports(parsed.sourceFile, filePath);
    const variables = extractTopLevelVariables(parsed.sourceFile, filePath);
    const functions = analyzeFunctions(parsed.sourceFile, filePath, relativePath);
    const classes = analyzeClasses(parsed.sourceFile, filePath, relativePath);

    // 2. Metadata Inference
    const role = inferFileRole(filePath);
    const layer = inferArchitectureLayer(filePath, imports.map(i => i.source));
    const overviewComment = getFileOverviewComment(parsed.sourceFile);
    const purpose = inferFilePurpose(filePath, exports.map(e => e.name), imports.map(i => i.source), overviewComment);

    // 3. Metrics
    const lines = parsed.sourceCode.split('\n');
    let commentLines = 0;
    let blankLines = 0;
    let inBlock = false;
    for (const line of lines) {
        const t = line.trim();
        if (!t) { blankLines++; continue; }
        if (inBlock) { commentLines++; if (t.includes('*/')) inBlock = false; continue; }
        if (t.startsWith('/*')) { commentLines++; if (!t.includes('*/')) inBlock = true; continue; }
        if (t.startsWith('//')) { commentLines++; continue; }
    }

    const maxComplexity = functions.reduce((max, f) => Math.max(max, f.cyclomaticComplexity), 0);
    const totalComplexity = functions.reduce((sum, f) => sum + f.cyclomaticComplexity, 0);
    const avgComplexity = functions.length > 0 ? Number((totalComplexity / functions.length).toFixed(1)) : 0;
    const highRisk = functions.filter(f => f.cyclomaticComplexity > COMPLEXITY_THRESHOLDS.cyclomatic.medium).length;

    const metrics: FileMetrics = {
        totalLines: lines.length,
        codeLines: lines.length - commentLines - blankLines,
        commentLines,
        blankLines,
        functionCount: functions.length,
        classCount: classes.length,
        importCount: imports.length,
        exportCount: exports.length,
        averageComplexity: avgComplexity,
        maxComplexity,
        highRiskFunctionCount: highRisk
    };

    const analysis: FileAnalysis = {
        id: `file_${Buffer.from(relativePath).toString('base64')}`,
        filePath,
        relativePath,
        language,
        role,
        purpose,
        layer,
        imports,
        exports,
        functions,
        classes,
        variables,
        metrics,
        analysisTime: Date.now() - start,
        timestamp: Date.now()
    };

    // Update Cache
    cache.setFileAnalysis(filePath, analysis);

    // Send Result
    DashboardPanel.postMessage({ type: 'fileAnalysisResult', payload: { success: true, data: analysis, duration: analysis.analysisTime, timestamp: analysis.timestamp } });

  } catch (error: any) {
    vscode.window.showErrorMessage(`CodeScope: Failed to analyze file. ${error.message}`);
    DashboardPanel.postMessage({ type: 'fileAnalysisResult', payload: { success: false, error: error.message, duration: 0, timestamp: Date.now() } });
  }
}
