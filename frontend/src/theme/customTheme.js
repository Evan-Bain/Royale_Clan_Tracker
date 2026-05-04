import { createTheme } from '@mui/material/styles'
import ClashFontRegular from "../assets/fonts/Clash_Regular.otf"
import ClashFontBold from "../assets/fonts/Clash_Bold.otf"

const customTheme = createTheme({
  typography: {
    fontFamily: '"ClashFont", Arial, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'ClashFont';
          src: url(${ClashFontRegular}) format('opentype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'ClashFont';
          src: url(${ClashFontBold}) format('opentype');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }

        body {
          margin: 0;
          background: #101c3a;
        }
      `
    }
  }
})

export default customTheme;