import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { ClosetView } from './components/ClosetView';
import { Toaster } from 'react-hot-toast';
import './styles/globals.css';

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
        <ClosetView />
        <Toaster position="top-right" />
      </div>
    </AppProvider>
  );
}

export default App;