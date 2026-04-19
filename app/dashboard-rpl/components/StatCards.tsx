"use client";

import React from "react";

export default function StatCards({ stats }: any) {
  const cards = [
    { label: "SHORTAGE", value: stats.shortage, color: "border-l-red-500 text-red-600" },
    { label: "BLOCKED", value: stats.blocked, color: "border-l-orange-500 text-orange-600" },
    { label: "TOTAL ITEMS", value: stats.total, color: "border-l-green-500 text-green-600" },
    { label: "OPEN PO TOTAL", value: stats.openPo || 0, color: "border-l-blue-500 text-blue-600" },
    // Kalau mau pas 4 kotak sesuai gambar Paint, hapus salah satu. 
    // Tapi kalau mau 5 tetap 1 baris, grid-cols-5 di bawah akan otomatis nyesuain.
    { label: "VENDOR STOCK", value: stats.vendorStock || 0, color: "border-l-purple-500 text-purple-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4"> {/* md:grid-cols-5 bikin jadi 1 baris pas desktop */}
      {cards.map((card, i) => (
        <div 
          key={i} 
          className={`bg-white p-4 rounded-xl border border-l-4 shadow-sm flex flex-col items-center justify-center text-center ${card.color}`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {card.label}
          </span>
          <span className="text-2xl font-bold mt-1">
            {card.value}
          </span>
        </div>
      ))}
    </div>
  );
}