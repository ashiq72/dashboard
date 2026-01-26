import { ThemeProvider } from './components/ThemeProvider';

export const App = () => {
  return (
    <>
      <ThemeProvider
        defaultTheme='dark'
        storageKey='vite-ui-theme'
      >
        App
      </ThemeProvider>
    </>
  );
};
