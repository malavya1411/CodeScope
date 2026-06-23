/**
 * Variable Tracker — uses TypeScript Language Service to find references
 * to a variable and categorizes them (read, write, etc.).
 */
import { VariableTrackResult } from '../models/types';
export declare class VariableTracker {
    private host;
    private ls;
    constructor();
    trackVariable(rootPath: string, filePath: string, line: number, column: number): Promise<VariableTrackResult | null>;
    private getNodeAtPosition;
    private getSymbolName;
    private getContainingFunction;
    private isDeclaration;
    private detectVariableKind;
    private isModification;
}
//# sourceMappingURL=variableTracker.d.ts.map