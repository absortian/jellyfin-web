import { createTheme } from '@mui/material/styles';

import { DEFAULT_THEME_OPTIONS } from './_base/theme';
import absorflix from './absorflix';

/** The default theme containing all color scheme variants. */
const DEFAULT_THEME = createTheme({
    cssVariables: {
        cssVarPrefix: 'jf',
        colorSchemeSelector: '[data-theme="%s"]',
        disableCssColorScheme: true
    },
    defaultColorScheme: 'absorflix',
    ...DEFAULT_THEME_OPTIONS,
    colorSchemes: {
        absorflix
    }
});

export default DEFAULT_THEME;
