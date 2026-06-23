import { useState, useEffect } from 'react';

type ThemeKind = 'dark' | 'light' | 'high-contrast';

export function useVSCodeTheme() {
  const [themeKind, setThemeKind] = useState<ThemeKind>('dark');

  useEffect(() => {
    // Check initial classes added by VS Code
    const isLight = document.body.classList.contains('vscode-light');
    const isHighContrast = document.body.classList.contains('vscode-high-contrast');
    
    if (isHighContrast) setThemeKind('high-contrast');
    else if (isLight) setThemeKind('light');
    else setThemeKind('dark');

    // Observation for class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isLight = document.body.classList.contains('vscode-light');
          const isHighContrast = document.body.classList.contains('vscode-high-contrast');
          
          if (isHighContrast) setThemeKind('high-contrast');
          else if (isLight) setThemeKind('light');
          else setThemeKind('dark');
        }
      });
    });

    observer.observe(document.body, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return {
    themeKind,
    isDark: themeKind === 'dark' || themeKind === 'high-contrast',
    isLight: themeKind === 'light',
  };
}
