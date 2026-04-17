"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar"; 
import { Header } from "./header"; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    // 1. Ubah min-h-screen jadi h-screen, dan kunci overflow di paling luar
    <div className="flex h-screen overflow-hidden bg-gray-50 w-full">
      
      <Sidebar isCollapsed={isCollapsed} />
      
      {/* 2. Set h-screen juga buat bagian kanan */}
      <div className="flex-1 w-full flex flex-col h-screen relative">
        
        <Header toggleSidebar={toggleSidebar} isSidebarCollapsed={isCollapsed} />

        {/* 3. KASIH overflow-y-auto DI SINI! Ini kunci biar konten lu bisa di-scroll ke bawah */}
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden p-4 relative">
          {children}
        </main>

      </div>
    </div>
  );
}