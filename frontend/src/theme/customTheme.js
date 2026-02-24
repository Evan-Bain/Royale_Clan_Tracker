import { createTheme } from '@mui/material/styles'
import ClashFontRegular from "../assets/fonts/Clash_Bold.otf"
import ClashFontBold from "../assets/fonts/Clash_Regular.otf"

const customTheme = createTheme({
    typography: {
        fontFamily: '"CustomFont"',
        fontWeightRegular: 400,
        fontWeightBold: 700
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: `
                @font-face {
                    font-family: 'CustomFont';
                    src:(${ClashFontRegular}) format('opentype')
                    font-weight: 400;
                    font-style: normal;
                    font-display: swap;
                }

                @font-face {
                    font-family: 'CustomFont';
                    src: url(${ClashFontBold}) format('opentype');
                    font-weight: 700;
                    font-style: normal;
                    font-display: swap;
                }
            `
        }
    }
})

export default customTheme;