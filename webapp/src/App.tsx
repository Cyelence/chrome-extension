import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { Toaster } from 'react-hot-toast';
import './styles/globals.css';

function App() {
  return (
    <AppProvider>
      <div className="App">
        <Layout />
        <Toaster position="top-right" />
      </div>
    </AppProvider>
  );
}

export default App; 