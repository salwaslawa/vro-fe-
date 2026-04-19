"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuthStore } from "@/lib/types";

import StatCards from "./components/StatCards";
import ChartSection from "./components/ChartSection";
import DataTable from "./components/DataTable";

export default function DashboardRplPage() {
  const { role, companyName } = useAuthStore();
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States buat Filter
  const [filterVendor, setFilterVendor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMaterial, setFilterMaterial] = useState("");
  const [filterType, setFilterType] = useState("Semua Tipe");

  // 1. Tarik Data dari API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${baseUrl}/api/materials/`, {
          headers: { 
            "X-User-Role": role || "", 
            "X-User-Company": companyName || "" 
          },
        });
        const data = await res.json();
        setMaterials(Array.isArray(data) ? data : []);
      } catch (err) { 
        console.error("Gagal tarik data:", err); 
      } finally { 
        setIsLoading(false); 
      }
    };
    if (role) fetchData();
  }, [role, companyName]);

  // 2. Logic Status Material 
  const getMaterialStatus = useCallback((m: any): string => {
    const type = String(m.productType || "").toLowerCase();
    const remark = m.remarkBlock?.String || "";
    const remarkValid = m.remarkBlock?.Valid || false;
    const current = Number(m.currentQuantity ?? 0);
    const max = Number(m.maxBinQty ?? 0);

    if (type === "block" || (remarkValid && remark !== "")) return "blocked";
    if (max === 0) return "ok";
    if (current <= 0.3 * max) return "shortage";
    if (current <= 0.6 * max) return "preshortage";
    return "ok";
  }, []);

  // 3. Logic FILTERING 
  const filteredData = useMemo(() => {
    return materials.filter((m) => {
      // Pastikan bandingin string vs string dan trim spasi kosong
      const mVendor = String(m.vendorCode || "").trim();
      const mStatus = getMaterialStatus(m);
      const mName = String(m.material || "").toLowerCase();
      const mType = String(m.productType || "N/A").trim().toLowerCase();

      const matchVendor = filterVendor === "all" || mVendor === filterVendor;
      const matchStatus = filterStatus === "all" || mStatus === filterStatus;
      const matchType = filterType === "Semua Tipe" || mType === filterType.toLowerCase();;
      const matchSearch = mName.includes(filterMaterial.toLowerCase());

      return matchVendor && matchStatus && matchType && matchSearch;
    });
  }, [materials, filterVendor, filterStatus, filterMaterial, filterType, getMaterialStatus]);

  // 4. Hitung Statistik buat StatCards & Pie Chart (Berdasarkan Data Terfilter)
  const stats = useMemo(() => {
    let shortage = 0, preshortage = 0, blocked = 0, ok = 0, openPOSum = 0, vendorStockSum = 0;
    filteredData.forEach((m) => {
      const s = getMaterialStatus(m);
      if (s === "shortage") shortage++;
      else if (s === "preshortage") preshortage++;
      else if (s === "blocked") blocked++;
      else ok++;
      
      openPOSum += Number(m.openPO || 0);
      vendorStockSum += Number(m.vendorStock || 0);
    });
    return { shortage, preshortage, blocked, ok, openPo: openPOSum, vendorStock: vendorStockSum, total: filteredData.length };
  }, [filteredData, getMaterialStatus]);

  // 5. Siapin Data buat Bar Charts
  const materialPerType = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach((m) => {
      const type = m.productType || "N/A";
      map[type] = (map[type] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const materialPerVendor = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach((m) => {
      const vendor = m.vendorCode || "N/A";
      map[vendor] = (map[vendor] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  if (isLoading) return <div className="p-4 text-center mt-10">Loading Data...</div>;

  return (
      <div className="flex flex-col gap-6 w-full pb-32 h-[calc(100vh-90px)] overflow-y-auto px-4 md:px-6">
        
        {/* ROW 1: HEADER & FILTER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-4 rounded-xl shadow-sm border">
          <div>
            <h1 className="text-xl font-bold text-gray-800">RPL Dashboard</h1>
            <p className="text-xs text-gray-500">Monitoring Stock & Vendor Performance</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Cari Material..."
              className="text-sm border p-2 rounded-md flex-1 min-w-[150px] outline-none focus:ring-2 focus:ring-blue-500"
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
            />

            {/* Vendor Filter - FIXED! */}
            <select 
              className="text-sm border p-2 rounded-md outline-none bg-white"
              value={filterVendor} // Biar jadi controlled component
              onChange={(e) => setFilterVendor(e.target.value)}
            >
              <option value="all">Semua Vendor</option>
              {[...new Set(materials.map((m) => String(m.vendorCode || "").trim()).filter(Boolean))].sort().map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select 
              className="text-sm border p-2 rounded-md outline-none bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="shortage">Shortage</option>
              <option value="preshortage">Pre-Shortage</option>
              <option value="blocked">Blocked</option>
              <option value="ok">OK</option>
            </select>

            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border rounded-lg px-4 py-2 text-sm bg-white cursor-pointer"
            >
              <option value="Semua Tipe">Semua Tipe</option>
              <option value="special">Special</option>
              <option value="kanban">Kanban</option>
              <option value="block">Block</option>
            </select>
          </div>
        </div>

        {/* 6. Komponen StatCards */}
        <StatCards stats={stats} />
        
        {/* 7. Komponen Charts */}
        <ChartSection 
          stats={stats} 
          materialPerType={materialPerType} 
          materialPerVendor={materialPerVendor} 
        />
        
        {/* 8. Komponen Table */}
        {/* <DataTable data={filteredData} getStatus={getMaterialStatus} /> */}

      </div>
  );
}