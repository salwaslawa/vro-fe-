"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuthStore } from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function DashboardRplPage() {
  const { role, companyName } = useAuthStore();
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterVendor, setFilterVendor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMaterial, setFilterMaterial] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${baseUrl}/api/materials/`, {
          headers: {
            "X-User-Role": role || "",
            "X-User-Company": companyName || "",
          },
        });

        const data = await res.json();
        console.log("=== RAW BACKEND DATA ===");
        console.log(JSON.stringify(data, null, 2));
        setMaterials(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Gagal tarik data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (role) fetchData();
  }, [role, companyName]);

  // ===== STATUS LOGIC (PAKAI DATA BACKEND, BUKAN HITUNG ULANG) =====
const getMaterialStatus = useCallback((m: any): string => {
  const type = String(m.productType || "").toLowerCase();
  const remark = m.remarkBlock?.String || "";
  const remarkValid = m.remarkBlock?.Valid || false;

  const current = Number(m.currentQuantity ?? 0);
  const max = Number(m.maxBinQty ?? 0);

  // BLOCKED (prioritas tertinggi)
  if (type === "block" || (remarkValid && remark !== "")) {
    return "blocked";
  }

  // Safety kalau max = 0
  if (max === 0) return "ok";

  // SHORTAGE (<= 30% dari max)
  if (current <= 0.3 * max) {
    return "shortage";
  }

  // PRE-SHORTAGE (<= 60% dari max)
  if (current <= 0.6 * max) {
    return "preshortage";
  }

  return "ok";
}, []);

  // ===== FILTER =====
  const filteredData = useMemo(() => {
    return materials.filter((m) => {
      const vendor = m.VendorCode || "";
      const status = getMaterialStatus(m);

      return (
        (filterVendor === "all" || vendor === filterVendor) &&
        (filterStatus === "all" || status === filterStatus) &&
        m.material?.toLowerCase().includes(filterMaterial.toLowerCase())
      );
    });
  }, [materials, filterVendor, filterStatus, filterMaterial, getMaterialStatus,]);

  // ===== STATISTIC SUMMARY =====
  // ===== MATERIAL PER TYPE =====
const materialPerType = useMemo(() => {
  const map: Record<string, number> = {};

  filteredData.forEach((m) => {
    const type = m.productType || "unknown";
    map[type] = (map[type] || 0) + 1;
  });

  return Object.entries(map).map(([key, value]) => ({
    name: key,
    value,
  }));
}, [filteredData]);

// ===== MATERIAL PER VENDOR =====
const materialPerVendor = useMemo(() => {
  const map: Record<string, number> = {};

  filteredData.forEach((m) => {
    const vendor = m.vendorCode || "unknown";
    map[vendor] = (map[vendor] || 0) + 1;
  });

  return Object.entries(map).map(([key, value]) => ({
    name: key,
    value,
  }));
}, [filteredData]);

  const stats = useMemo(() => {
    let shortage = 0,
      preshortage = 0,
      blocked = 0,
      ok = 0,
      openPOSum = 0,
      vendorStockSum = 0;

    filteredData.forEach((m) => {
      const s = getMaterialStatus(m);
      if (s === "shortage") shortage++;
      else if (s === "preshortage") preshortage++;
      else if (s === "blocked") blocked++;
      else ok++;

    openPOSum += Number(m.openPO || 0);
    vendorStockSum += Number(m.vendorStock || 0);
  });
    return { shortage, preshortage, blocked, ok, openPOSum, vendorStockSum, total: filteredData.length };
  }, [filteredData, getMaterialStatus]);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

   return (
      <div className="flex flex-col h-full space-y-4 p-4">
        {/* HEADER */}
        <div className="flex justify-between items-end">
          <h1 className="text-xl font-bold text-gray-800">
            RPL Dashboard
          </h1>

          <div className="flex gap-2">
           {/* FILTER MATERIAL */}
            <input
              type="text"
              placeholder="Filter Material..."
              className="text-sm border p-1 rounded"
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
            />
            <select
              className="text-sm border p-1 rounded"
              onChange={(e) => setFilterVendor(e.target.value)}
            >
              <option value="all">Semua Vendor</option>
              {[...new Set(materials.map((m) => m.vendorCode))].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <select
              className="text-sm border p-1 rounded"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="shortage">Shortage</option>
              <option value="preshortage">Pre-Shortage</option>
              <option value="blocked">Blocked</option>
              <option value="ok">OK</option>
            </select>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card title="Shortage" value={stats.shortage} color="red" />
          <Card title="Blocked" value={stats.blocked} color="orange" />
          <Card title="Pre-Shortage" value={stats.preshortage} color="yellow" />
          <Card title="Total Items" value={stats.total} color="green" />
          <Card title="Open PO Total" value={stats.openPOSum} color="blue" />
          <Card title="Vendor Stock Total" value={stats.vendorStockSum} color="purple" />
        </div>

        {/* CHART + TABLE */}
        {/* CHART AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* STATUS PIE */}
          <div className="bg-white p-4 rounded-xl border h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Shortage", value: stats.shortage },
                    { name: "Blocked", value: stats.blocked },
                    { name: "OK", value: stats.ok },
                  ]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#f97316" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

  {/* MATERIAL PER TYPE */}
  <div className="bg-white p-4 rounded-xl border h-[350px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={materialPerType}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  </div>

  {/* MATERIAL PER VENDOR */}
  <div className="bg-white p-4 rounded-xl border h-[350px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={materialPerVendor}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#8b5cf6" />
      </BarChart>
    </ResponsiveContainer>
  </div>

</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Shortage", value: stats.shortage },
                    { name: "Blocked", value: stats.blocked },
                    { name: "OK", value: stats.ok },
                  ]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#f97316" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded-xl border overflow-y-auto max-h-[350px]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white border-b">
                <tr>
                  <th className="p-2">Material</th>
                  <th className="p-2">Stock</th>
                  <th className="p-2">Remark</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((m, i) => {
                  const status = getMaterialStatus(m);

                  return (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">
                        {m.material}
                      </td>
                      <td className="p-2">
                        {m.currentQuantity}
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            status === "shortage"
                              ? "bg-red-100 text-red-700"
                              : status === "blocked"
                              ? "bg-orange-100 text-orange-700"
                              : status === "preshortage"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {status === "blocked"
                            ? m.remarkBlock?.String
                            : m.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}

// ===== REUSABLE CARD =====
function Card({ title, value, color }: any) {
  const colorMap: any = {
    red: "border-red-500 text-red-600",
    orange: "border-orange-500 text-orange-600",
    yellow: "border-yellow-500 text-yellow-600",
    green: "border-green-500 text-green-600",
    blue: "border-blue-500 text-blue-600",
    purple: "border-purple-500 text-purple-600",
  };

  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${
        colorMap[color] || "border-gray-500 text-gray-600"
      }`}
    >
      <p className="text-xs text-gray-500 uppercase">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}