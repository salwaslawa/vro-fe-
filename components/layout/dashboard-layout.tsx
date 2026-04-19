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
    // 1. Root: Dikunci mentok layar (h-screen) dan gak boleh ada scroll bar utama
    <div className="flex h-screen overflow-hidden bg-gray-50 w-full">
      
      <Sidebar isCollapsed={isCollapsed} />
      
      {/* 2. Wrapper Kanan: flex-col biar header di atas, konten di bawah. Kasih overflow-hidden jg biar aman */}
      <div className="flex-1 w-full flex flex-col h-full overflow-hidden relative">
        
        <Header toggleSidebar={toggleSidebar} isSidebarCollapsed={isCollapsed} />

        {/* 3. AREA KONTEN: Di sini letak rel keretanya. Cuma ini yang boleh di-scroll (overflow-y-auto) */}
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden p-4 md:p-6 relative scroll-smooth">
          {/* Kasih bantalan bawah (pb-10) biar konten paling bawah gak nyangkut/kepotong */}
          <div className="pb-10">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}