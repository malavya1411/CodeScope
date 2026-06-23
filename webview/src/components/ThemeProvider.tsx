import { useVSCodeTheme } from '../hooks/useVSCodeTheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeKind } = useVSCodeTheme();
  
  // The themeKind is mostly used for specific component overrides if needed,
  // as the heavy lifting is done by CSS variables.
  // We can provide it via context if needed, but for now we just observe it.

  return (
    <div className={`theme-${themeKind} h-full w-full flex flex-col`}>
      {children}
    </div>
  );
}
