
// This is kept separate because it breaks tests.
export const layoutReady = new Promise<void>(resolve => app.workspace.onLayoutReady(resolve))
