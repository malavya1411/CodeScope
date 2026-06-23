import { useEffect, useState } from 'react';

// To support development mode outside of VS Code, we provide a mock API
declare global {
  interface Window {
    acquireVsCodeApi?: () => {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    };
    __CODESCOPE_DATA__?: any;
  }
}

let vscode: ReturnType<NonNullable<typeof window.acquireVsCodeApi>> | undefined;

if (typeof window !== 'undefined' && window.acquireVsCodeApi) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vscode = (window as any).vscodeAPI;
  if (!vscode) {
    vscode = window.acquireVsCodeApi();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).vscodeAPI = vscode;
  }
}

export function useExtensionMessage() {
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      setLastMessage(event.data);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const postMessage = (message: any) => {
    if (vscode) {
      vscode.postMessage(message);
    } else {
      console.log('Would post message to VS Code:', message);
    }
  };

  return { lastMessage, postMessage };
}
