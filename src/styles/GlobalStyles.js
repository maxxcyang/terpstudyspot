import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${theme.fonts.body};
    background-color: ${theme.colors.background};
    color: ${theme.colors.text};
    line-height: 1.5;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${theme.fonts.heading};
    color: ${theme.colors.primary};
  }

  a {
    color: ${theme.colors.primary};
    text-decoration: none;
    
    &:hover {
      color: ${theme.colors.accent};
    }
  }

  button {
    cursor: pointer;
    font-family: ${theme.fonts.body};
  }
`; 