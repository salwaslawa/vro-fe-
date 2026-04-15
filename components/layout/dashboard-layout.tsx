"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
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

        if (Array.isArray(json)) setMaterials(json);
        else if (Array.isArray(json?.data))
          setMaterials(json.data);
        else setMaterials([]);

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
  const getMaterialStatus = useCallback((m: Material) => {
    const type = String(
      m.productType || m.tipe || m.type || ""
    ).toLowerCase();

    const remark = String(
      m.remark || m.remarkStatus || ""
    ).toLowerCase();

    const alasan = String(
      m.alasanBlock || m["Alasan Block"] || ""
    ).toLowerCase();

    if (type === "block" || remark.includes("blocked"))
      return "blocked";

    if (
      remark.includes("shortage") ||
      alasan.includes("rusak") ||
      alasan.includes("reject")
    )
      return "shortage";

    if (
      remark.includes("preshortage") ||
      remark.includes("pre-shortage")
    )
      return "preshortage";

    const max = Number(m.maxBinQty || m.maxStock || 0);
    const curr = Number(m.currentQuantity || m.stock || 0);

    if (max > 0) {
      if (curr <= Math.ceil(max * 0.3)) return "shortage";
      if (curr <= Math.ceil(max * 0.6))
        return "preshortage";
    }

    return "ok";
  }, []);

  // =========================
  // FILTER OPTION
  // =========================
  const { uniqueVendors, uniqueMaterials, uniqueRemarks } =
    useMemo(() => {
      const v = new Set<string>();
      const m = new Set<string>();
      const r = new Set<string>();

      materials.forEach((x) => {
        const vendor =
          x.vendorCode || x.vendorName || x.vendor;
        const material =
          x.materialCode || x.kodeMaterial;

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
      const vendor =
        m.vendorCode || m.vendorName || m.vendor;
      const material =
        m.materialCode || m.kodeMaterial;
      const status = getMaterialStatus(m);

      return (
        (filterVendor === "all" ||
          vendor === filterVendor) &&
        (filterMaterial === "all" ||
          material === filterMaterial) &&
        (filterRemark === "all" ||
          status === filterRemark)
      );
    });
  }, [
    materials,
    filterVendor,
    filterMaterial,
    filterRemark,
    getMaterialStatus,
  ]);

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

      openPO += Number(m.openPo || 0);
      const vStock = Number(m.vendorStock || 0);
      vendorStock += vStock;

      const vendor =
        m.vendorCode || m.vendorName || "Tanpa Vendor";
      vendorMap[vendor] =
        (vendorMap[vendor] || 0) + vStock;

      const type = String(
        m.productType || m.tipe || "UNKNOWN"
      ).toUpperCase();

      typeMap[type] = (typeMap[type] || 0) + 1;
    });

    return {
      totalMaterials: filtered.length,
      totalShortage: shortage,
      totalPreshortage: preshortage,
      totalBlocked: blocked,
      totalVendorStock: vendorStock,
      totalOpenPO: openPO,
      typeData: Object.entries(typeMap).map(
        ([name, Jumlah]) => ({ name, Jumlah })
      ),
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
      <div className="p-10 text-center">
        Loading dashboard...
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">
          Dashboard Summary
        </h1>
        <p className="text-sm text-gray-500">
          Terakhir diperbarui: {lastUpdated}
        </p>
      </div>

      {/* FILTER */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow">
        <select
          value={filterMaterial}
          onChange={(e) =>
            setFilterMaterial(e.target.value)
          }
        >
          <option value="all">Semua Material</option>
          {uniqueMaterials.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>

        <select
          value={filterVendor}
          onChange={(e) =>
            setFilterVendor(e.target.value)
          }
        >
          <option value="all">Semua Vendor</option>
          {uniqueVendors.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>

        <select
          value={filterRemark}
          onChange={(e) =>
            setFilterRemark(e.target.value)
          }
        >
          <option value="all">Semua Status</option>
          {uniqueRemarks.map((r) => (
            <option key={r}>{r}</option>
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
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <RechartsTooltip />
              <Bar dataKey="Jumlah" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={summary.pieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={90}
              >
                {summary.pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* VENDOR CHART */}
      <div className="bg-white p-6 rounded-xl shadow h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={summary.vendorData}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" />
            <RechartsTooltip />
            <Bar
              dataKey="VendorStock"
              fill="#a855f7"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// SIMPLE CARD COMPONENT
function Card({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow text-center">
      <h3 className="text-xs text-gray-500 uppercase">
        {title}
      </h3>
      <p className="text-2xl font-semibold mt-2">
        {value}
      </p>
    </div>
  );
}