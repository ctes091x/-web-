import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router/AppRouter';
import './assets/styles/global.css'; //

function App() {
  return (
    <BrowserRouter>
      <div className="App min-h-screen bg-gray-50 text-gray-900">
        {/* ここに将来Headerなどを配置します */}
        
        {/* ルーティングされたページがここに表示されます */}
        <AppRouter />
      
      </div>
    </BrowserRouter>
  );
}

export default App;