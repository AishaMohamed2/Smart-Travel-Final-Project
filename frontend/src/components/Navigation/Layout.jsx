import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from "./Sidebar";
import "../../styles/Navigation/Layout.css";
import { UserContext } from '../../utils/UserContext';
import api from '../../api';

function Layout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/api/user/');
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <div className="app-container">

        <div className="main-layout">
          <Sidebar />
          <main className="content-area">
            <Outlet /> 
          </main>
        </div>

        <footer className="app-footer">
          <p>&copy; SmartTravel. All rights reserved.</p>
        </footer>
      </div>
    </UserContext.Provider>
  );
}

export default Layout;