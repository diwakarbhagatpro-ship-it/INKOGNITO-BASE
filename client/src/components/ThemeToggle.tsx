import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ContrastMode = 'low' | 'medium' | 'high';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [contrast, setContrast] = useState<ContrastMode>('medium');

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply contrast mode classes
    root.classList.remove('contrast-low', 'contrast-medium', 'contrast-high');
    root.classList.add(`contrast-${contrast}`);
  }, [isDark, contrast]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    console.log('Theme toggled:', !isDark ? 'dark' : 'light');
  };

  const setContrastMode = (mode: ContrastMode) => {
    setContrast(mode);
    console.log('Contrast mode changed to:', mode);
  };

  return (
    <div className="flex items-center gap-2" data-testid="theme-controls">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        data-testid="button-theme-toggle"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Adjust contrast level"
            data-testid="button-contrast-toggle"
          >
            <Eye className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setContrastMode('low')}
            className={contrast === 'low' ? 'bg-accent' : ''}
            data-testid="contrast-low"
          >
            Low Contrast
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setContrastMode('medium')}
            className={contrast === 'medium' ? 'bg-accent' : ''}
            data-testid="contrast-medium"
          >
            Medium Contrast
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setContrastMode('high')}
            className={contrast === 'high' ? 'bg-accent' : ''}
            data-testid="contrast-high"
          >
            High Contrast
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}