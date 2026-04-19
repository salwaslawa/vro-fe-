"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ChartSection({ stats, materialPerType, materialPerVendor }: any) {
  // Setup data buat Pie Chart
  const pieData = [
    { name: "Shortage", value: stats.shortage, color: "#ef4444" },
    { name: "Blocked", value: stats.blocked, color: "#f97316" },
    { name: "OK", value: stats.ok, color: "#10b981" },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex flex-col gap-6">
      
      {/* --- BARIS 1: Status & Tipe (2 Kolom Sejajar) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Status Material */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center">
          <h2 className="text-lg font-bold text-gray-800 mb-4 text-center w-full">Status Material</h2>
          <div className="h-64 w-full"> 
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Material per Tipe */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center">
          <h2 className="text-lg font-bold text-gray-800 mb-4 text-center w-full">Material per Tipe</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materialPerType} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* --- BARIS 2: Material per Vendor (Full Width / Penuh ke Samping) --- */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center w-full">
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center w-full">Material per Vendor</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={materialPerVendor} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }} 
                interval={0} 
                angle={-15} 
                textAnchor="end"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}