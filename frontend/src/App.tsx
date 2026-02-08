import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppRouter } from './router';
import { useAuthStore } from './store/authStore';
import { socketService } from './services/socketService';

function App() {
  const { isAuthenticated, token, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && token && user) {
      socketService.connect(token, user._id);
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, token, user]);

  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;

// 
