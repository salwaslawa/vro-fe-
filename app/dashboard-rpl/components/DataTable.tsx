// vro-fe/app/dashboard-rpl/components/DataTable.tsx
export default function DataTable({ data, getStatus }: { data: any[], getStatus: any }) {
  return (
    <div className="bg-white p-4 rounded-xl border overflow-y-auto max-h-[350px]">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white border-b z-10">
          <tr>
            <th className="p-2">Material</th>
            <th className="p-2">Stock</th>
            <th className="p-2">Remark</th>
          </tr>
        </thead>
        <tbody>
          {data.map((m, i) => {
            const status = getStatus(m);
            return (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{m.material}</td>
                <td className="p-2">{m.currentQuantity}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    status === "shortage" ? "bg-red-100 text-red-700" :
                    status === "blocked" ? "bg-orange-100 text-orange-700" :
                    status === "preshortage" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                  }`}>
                    {status === "blocked" ? m.remarkBlock?.String : status.toUpperCase()}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}