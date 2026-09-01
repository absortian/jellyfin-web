import { buildCustomColorScheme } from 'themes/utils';

/** The "AbsorFlix Glass" color scheme. */
const theme = buildCustomColorScheme({
    palette: {
        background: {
            default: '#050507',
            paper: '#14161e'
        },
        primary: {
            main: '#0a84ff',
            dark: '#0668cc',
            light: '#6baeff',
            contrastText: '#fff'
        },
        secondary: {
            main: '#7c8cff',
            contrastText: '#05070d'
        },
        text: {
            primary: '#f5f7ff',
            secondary: 'rgba(235, 240, 255, 0.72)'
        },
        divider: 'rgba(255, 255, 255, 0.08)',
        action: {
            focus: 'rgba(10, 132, 255, 0.24)',
            hover: 'rgba(255, 255, 255, 0.06)'
        },
        AppBar: {
            defaultBg: 'rgba(11, 13, 19, 0.68)'
        },
        Button: {
            inheritContainedBg: 'rgba(28, 31, 42, 0.6)',
            inheritContainedHoverBg: 'rgba(10, 132, 255, 0.2)'
        },
        FilledInput: {
            bg: 'rgba(16, 18, 26, 0.55)'
        },
        Alert: {
            infoFilledBg: '#0a84ff',
            infoFilledColor: '#fff'
        },
        SnackbarContent: {
            bg: '#1c1f2a',
            color: 'rgba(245, 247, 255, 0.92)'
        }
    }
});

export default theme;
