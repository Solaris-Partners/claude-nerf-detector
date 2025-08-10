interface TestState {
    testsDisplayed: boolean;
    testStartTime: number;
    capturedResponses: string[];
}
export declare function saveTestState(state: TestState): void;
export declare function loadTestState(): TestState | null;
export declare function clearTestState(): void;
export declare function setupResponseCapture(): {
    getCaptured: () => string;
    stopCapture: () => void;
};
export declare function loadCapturedResponses(): string | null;
export declare function clearCapturedResponses(): void;
export {};
//# sourceMappingURL=capture.d.ts.map