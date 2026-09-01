import { useCallback } from 'react';

import { useThemes } from './useThemes';
import { useUserSettings } from './useUserSettings';

export const FALLBACK_THEME_ID = 'absorflix';

export function useUserTheme() {
    const { theme, dashboardTheme } = useUserSettings();
    const { themes, defaultTheme } = useThemes();

    // Saved settings may reference a theme that no longer exists
    const validateTheme = useCallback((id?: string | null) => {
        if (id && themes.some(t => t.id === id)) return id;
        return defaultTheme?.id || FALLBACK_THEME_ID;
    }, [ themes, defaultTheme ]);

    return {
        theme: validateTheme(theme),
        dashboardTheme: validateTheme(dashboardTheme)
    };
}
