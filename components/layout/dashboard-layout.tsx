"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/types";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Material {
  [key: string]: any;
}

export default function DashboardRplPage() {
  const router = useRouter();
  const { role, companyName } = useAuthStore();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const [filterMaterial, setFilterMaterial] = useState("all");
  const [filterVendor, setFilterVendor] = useState("all");
  const [filterRemark, setFilterRemark] = useState("all");

  // =========================
  // HYDRATION SAFE
  // =========================
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!role && isClient) router.push("/");
  }, [role, isClient, router]);

  // =========================
  // FETCH DATA
  // =========================
  useEffect(() => {
    if (!role) return;

    const fetchData = async () => {
      setIsLoading(true);

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!baseUrl) {
          console.error("ENV NEXT_PUBLIC_API_URL belum diset");
          return;
        }

        const res = await fetch(`${baseUrl}/api/materials/`, {
          headers: {
            "X-User-Role": role,
            "X-User-Company": companyName || "",
          },
        });

        if (!res.ok) throw new Error("Fetch gagal");

        const json = await res.json();

        let fetchedData = [];
        if (Array.isArray(json)) fetchedData = json;
        else if (Array.isArray(json?.data)) fetchedData = json.data;

        setMaterials(fetchedData);

        setLastUpdated(
          new Date().toLocaleString("id-ID", {
            dateStyle: "full",
            timeStyle: "short",
          })
        );
      } catch (err) {
        console.error(err);
        setMaterials([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [role, companyName]);

  // =========================
  // STATUS LOGIC
  // =========================
  const getMaterialStatus = useCallback((m: Material): string => {
    const type = String(m.Tipe || m.productType || m.tipe || m.type || "").toLowerCase();
    const remark = String(m["Remark Status"] || m.remark || m.remarkStatus || "").toLowerCase();

    // 1. FILTER UTAMA: Kalau tipenya block atau remarknya blocked, mutlak BLOCKED
    if (type === "block" || remark.includes("blocked")) {
      return "blocked";
    }

    // 2. KECUALI TYPE BLOCKED (Masuk ke sini berarti kanban, option, consumable, special)
    if (type !== "block" && !remark.includes("blocked")) {
      
      // Define shortage dari text remark-nya dulu
      if (remark.includes("shortage")) return "shortage";
      if (remark.includes("preshortage") || remark.includes("pre-shortage")) return "preshortage";
    }

    // Kalau aman semua, berarti OK
    return "ok";
  }, []);  

  // =========================
  // FILTER OPTION
  // =========================
  const { uniqueVendors, uniqueMaterials, uniqueRemarks } = useMemo(() => {
    const v = new Set<string>();
    const m = new Set<string>();
    const r = new Set<string>();

    materials.forEach((x) => {
      const vendor = x.Vendor || x.vendorCode || x.vendorName || x.vendor;
      const material = x["Kode Mate"] || x.materialCode || x.kodeMaterial;

      if (vendor) v.add(vendor);
      if (material) m.add(material);

      r.add(getMaterialStatus(x));
    });

    return {
      uniqueVendors: Array.from(v).sort(),
      uniqueMaterials: Array.from(m).sort(),
      uniqueRemarks: Array.from(r).sort(),
    };
  }, [materials, getMaterialStatus]);

  // =========================
  // FILTERED DATA
  // =========================
  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const vendor = m.Vendor || m.vendorCode || m.vendorName || m.vendor;
      const material = m["Kode Mate"] || m.materialCode || m.kodeMaterial;
      const status = getMaterialStatus(m);

      return (
        (filterVendor === "all" || vendor === filterVendor) &&
        (filterMaterial === "all" || material === filterMaterial) &&
        (filterRemark === "all" || status === filterRemark)
      );
    });
  }, [materials, filterVendor, filterMaterial, filterRemark, getMaterialStatus]);

  // =========================
  // AGGREGATION
  // =========================
  const summary = useMemo(() => {
    let shortage = 0,
      preshortage = 0,
      ok = 0,
      blocked = 0;
    let vendorStock = 0,
      openPO = 0;

    const typeMap: Record<string, number> = {};
    const vendorMap: Record<string, number> = {};

    filtered.forEach((m) => {
      const status = getMaterialStatus(m);

      if (status === "shortage") shortage++;
      else if (status === "preshortage") preshortage++;
      else if (status === "blocked") blocked++;
      else ok++;

      openPO += Number(m["Open PO"] || m.openPo || 0);
      const vStock = Number(m["Vendor Sto"] || m["Vendor Stock"] || m.vendorStock || 0);
      vendorStock += vStock;

      const vendor = m.Vendor || m.vendorCode || m.vendorName || "Tanpa Vendor";
      vendorMap[vendor] = (vendorMap[vendor] || 0) + vStock;

      const type = String(m.Tipe || m.productType || m.tipe || "UNKNOWN").toUpperCase();
      typeMap[type] = (typeMap[type] || 0) + 1;
    });

    return {
      totalMaterials: filtered.length,
      totalShortage: shortage,
      totalPreshortage: preshortage,
      totalBlocked: blocked,
      totalVendorStock: vendorStock,
      totalOpenPO: openPO,
      typeData: Object.entries(typeMap).map(([name, Jumlah]) => ({ name, Jumlah })),
      vendorData: Object.entries(vendorMap)
        .map(([name, VendorStock]) => ({
          name,
          VendorStock,
        }))
        .sort((a, b) => b.VendorStock - a.VendorStock),
      pieData: [
        { name: "Shortage", value: shortage, color: "#ef4444" },
        { name: "Preshortage", value: preshortage, color: "#facc15" },
        { name: "Blocked", value: blocked, color: "#f97316" },
        { name: "OK", value: ok, color: "#10b981" },
      ].filter((d) => d.value > 0),
    };
  }, [filtered, getMaterialStatus]);

  if (!isClient) return null;
  if (!role) return null;
  if (isLoading)
    return (
      <div className="p-10 text-center text-gray-500 font-medium">
        Loading dashboard...
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard Summary</h1>
        <p className="text-sm text-gray-500 mt-1">
          Terakhir diperbarui: {lastUpdated}
        </p>

        {/* KOTAK HITAM BUAT NGECEK DATA */}
        {materials.length > 0 && (
          <div className="mt-4 p-4 bg-gray-900 text-green-400 text-xs rounded-lg overflow-auto max-h-64 shadow-inner text-left">
            <p className="text-white mb-2 font-bold tracking-wider">--- CEK NAMA KOLOM DARI GOLANG ---</p>
            <pre className="font-mono">{JSON.stringify(materials[0], null, 2)}</pre>
          </div>
        )}
      </div>

      {/* FILTER */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl shadow-sm border">
        <select
          className="border rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500"
          value={filterMaterial}
          onChange={(e) => setFilterMaterial(e.target.value)}
        >
          <option value="all">Semua Material</option>
          {uniqueMaterials.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          className="border rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500"
          value={filterVendor}
          onChange={(e) => setFilterVendor(e.target.value)}
        >
          <option value="all">Semua Vendor</option>
          {uniqueVendors.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          className="border rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500 capitalize"
          value={filterRemark}
          onChange={(e) => setFilterRemark(e.target.value)}
        >
          <option value="all">Semua Status</option>
          {uniqueRemarks.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card title="Total Material" value={summary.totalMaterials} />
        <Card title="Shortage" value={summary.totalShortage} />
        <Card title="Preshortage" value={summary.totalPreshortage} />
        <Card title="Blocked" value={summary.totalBlocked} />
        <Card title="Vendor Stock" value={summary.totalVendorStock} />
        <Card title="Open PO" value={summary.totalOpenPO} />
      </div>

      {/* CHART ROW 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border h-[350px]">
          <h3 className="text-sm font-semibold mb-4 text-gray-700">Tipe Material</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.typeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <RechartsTooltip cursor={{ fill: "#f3f4f6" }} />
              <Bar dataKey="Jumlah" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border h-[350px]">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">Status Material</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={summary.pieData}
                dataKey="value"
                cx="50%"
                cy="45%"
                outerRadius={90}
              >
                {summary.pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "12px" }} />
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* VENDOR CHART */}
      <div className="bg-white p-6 rounded-xl shadow-sm border h-[400px]">
        <h3 className="text-sm font-semibold mb-4 text-gray-700">Stok Berdasarkan Vendor</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={summary.vendorData} layout="vertical" margin={{ left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
            <RechartsTooltip cursor={{ fill: "#f3f4f6" }} />
            <Bar dataKey="VendorStock" fill="#a855f7" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// SIMPLE CARD COMPONENT
function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border text-center flex flex-col justify-center items-center">
      <h3 className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">
        {title}
      </h3>
      <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
    </div>
  );
}