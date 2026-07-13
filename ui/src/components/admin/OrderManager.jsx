import React, { useState, useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel, 
  getSortedRowModel, 
  getFilteredRowModel, 
  flexRender 
} from '@tanstack/react-table';

const OrderManager = ({
  orders = [],
  settings = {},
  updateOrderStatus,
  deleteOrder,
  loadData
}) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [orderSorting, setOrderSorting] = useState([]);
  const [orderPagination, setOrderPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [selectedFulfillmentOrder, setSelectedFulfillmentOrder] = useState(null);
  const [orderEdits, setOrderEdits] = useState({});

  const handleStatusSave = async (id) => {
    const val = orderEdits[id];
    if (!val) return;
    try {
      await updateOrderStatus(id, val);
      alert("Order status updated!");
      loadData();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleOrderDelete = async (id) => {
    if (!window.confirm("Permanently delete this order record?")) return;
    try {
      await deleteOrder(id);
      loadData();
    } catch (err) {
      alert("Failed to delete order record.");
    }
  };

  const exportOrdersToCSV = () => {
    const headers = ['Order ID', 'Customer Email', 'Fulfillment Name', 'Zip', 'Total Amount', 'Status', 'Date Placed'];
    const rows = orders.map(o => [
      o.id,
      o.users?.email || 'Guest',
      `${o.shipping_address?.firstName || ''} ${o.shipping_address?.lastName || ''}`,
      o.shipping_address?.postalCode || '',
      o.total_amount,
      o.status,
      new Date(o.created_at).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ahakonaseema_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const orderColumns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'Order ID',
      cell: info => <span className="font-mono text-[10px] font-bold text-[#333]">#{info.getValue().substring(0, 8).toUpperCase()}</span>
    },
    {
      id: 'customer',
      header: 'Customer Details',
      cell: info => {
        const u = info.row.original.users || {};
        const sa = info.row.original.shipping_address || {};
        return (
          <div>
            <p className="font-bold text-xs text-[#222]">{sa.firstName} {sa.lastName}</p>
            <p className="text-[10px] text-muted-foreground">{u.email || 'Guest'}</p>
          </div>
        );
      }
    },
    {
      accessorKey: 'total_amount',
      header: 'Grand Total',
      cell: info => <span className="font-bold text-[#222]">₹{Number(info.getValue() || 0).toFixed(0)}</span>
    },
    {
      accessorKey: 'status',
      header: 'Fulfillment Status',
      cell: info => {
        const id = info.row.original.id;
        const currentVal = orderEdits[id] || info.getValue();
        return (
          <div className="flex items-center gap-2">
            <select
              value={currentVal}
              onChange={e => setOrderEdits(prev => ({ ...prev, [id]: e.target.value }))}
              className="bg-white border border-border text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-primary text-[#333] cursor-pointer font-semibold"
            >
              <option value="pending">Pending Verification</option>
              <option value="preparing">Preparing in Kitchen</option>
              <option value="shipped">Dispatched / Shipped</option>
              <option value="delivered">Delivered Successfully</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {orderEdits[id] && orderEdits[id] !== info.getValue() && (
              <button 
                onClick={() => handleStatusSave(id)}
                className="bg-primary text-white text-[10px] px-2.5 py-1 rounded-lg font-bold shadow-sm cursor-pointer border-none"
              >
                Save
              </button>
            )}
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: 'Fulfillment Slip',
      cell: info => (
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedFulfillmentOrder(info.row.original)}
            className="px-3.5 py-1.5 bg-[#fafafa] border border-border rounded-lg text-xs font-bold text-[#333] hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            📋 Logistics Slip
          </button>
          <button
            onClick={() => handleOrderDelete(info.row.original.id)}
            className="px-3 py-1.5 bg-[#fafafa] border border-border rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      )
    }
  ], [orders, orderEdits]);

  const orderTable = useReactTable({
    data: orders,
    columns: orderColumns,
    state: {
      globalFilter: globalFilter,
      sorting: orderSorting,
      pagination: orderPagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setOrderSorting,
    onPaginationChange: setOrderPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  const printStoreName = settings.store_name || 'Aha Konaseema';
  const printOriginAddress = settings.origin_address || 'Ravulapalem, East Godavari District, Andhra Pradesh';
  const printCourierPartner = settings.courier_partner || 'Ghee Express Courier';
  const printSupportEmail = settings.support_email || 'admin@rameshayyala.online';
  const printSupportPhone = settings.support_phone || '+91 888 777 6666';
  const printGuaranteeText = settings.guarantee_text || 'Pure Milk Ghee Freshness verified • Vacuum leakage protection sealed • Brand seal attached';
  const guaranteeItems = printGuaranteeText.split('•').map(s => s.trim()).filter(Boolean);

  return (
    <div className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm flex flex-col min-h-[70vh] animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#333]">Fulfillment Control</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Manage, inspect, seal, and dispatch fresh Godavari confections.</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div>
            Total Sales Volume: <span className="text-primary font-black">₹{orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total_amount : 0), 0)}</span>
          </div>
          <button 
            onClick={exportOrdersToCSV}
            className="bg-white hover:bg-neutral-50 border border-border text-muted-foreground hover:text-[#333] font-bold text-xs px-4 py-2 rounded-xl transition-all hover:scale-102 flex items-center gap-1.5 shadow-sm active:scale-98 cursor-pointer border-none"
          >
            📤 Export CSV
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <input 
          type="text"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="🔍 Search orders by Customer, Email, Products, or ID..."
          className="bg-[#fafafa] border border-border rounded-xl px-4 py-2.5 text-xs text-[#333] placeholder:text-muted-foreground/60 w-full md:w-96 focus:outline-none focus:border-primary font-medium shadow-sm"
        />
        {globalFilter && (
          <button 
            onClick={() => setGlobalFilter('')}
            className="text-xs text-primary font-bold hover:underline self-end md:self-auto cursor-pointer bg-transparent border-none"
          >
            Clear Search
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-border/50 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            {orderTable.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-border bg-[#fafafa]/50 text-muted-foreground text-xs uppercase tracking-wider">
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    className={`p-4 font-bold ${header.column.getCanSort() ? 'cursor-pointer hover:text-primary select-none' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 justify-start">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-[10px] opacity-75">
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted()] || ' ↕️'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {orderTable.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b border-border/40 hover:bg-neutral-50/50 transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-4 text-xs font-medium text-[#333]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {orderTable.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-10 text-muted-foreground text-sm font-medium">
                  No matching orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
        <div className="text-xs text-muted-foreground font-medium">
          Showing page <span className="text-primary font-black">{orderTable.getState().pagination.pageIndex + 1}</span> of <span className="font-black text-[#333]">{orderTable.getPageCount() || 1}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-bold">Rows per page:</span>
          <select 
            value={orderTable.getState().pagination.pageSize}
            onChange={e => orderTable.setPageSize(Number(e.target.value))}
            className="bg-white border border-border rounded-lg text-xs px-2 py-1 focus:outline-none cursor-pointer"
          >
            {[5, 10, 20, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => orderTable.previousPage()}
              disabled={!orderTable.getCanPreviousPage()}
              className="px-4 py-2 border border-border bg-white rounded-xl text-xs font-bold text-muted-foreground hover:text-[#333] hover:bg-neutral-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => orderTable.nextPage()}
              disabled={!orderTable.getCanNextPage()}
              className="px-4 py-2 border border-border bg-white rounded-xl text-xs font-bold text-muted-foreground hover:text-[#333] hover:bg-neutral-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Fulfillment Docket overlay */}
      {selectedFulfillmentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md transition-opacity">
          <div className="absolute inset-0" onClick={() => setSelectedFulfillmentOrder(null)}></div>
          
          <div className="relative w-full max-w-2xl bg-white border border-border rounded-3xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto z-10 shadow-2xl">
            <div className="flex justify-between items-center no-print border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-bold font-serif text-[#333] tracking-tight">
                  Fulfillment Docket
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">{printStoreName} Logistics Manager</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.open('/print/packing-slip/' + selectedFulfillmentOrder.id, '_blank')}
                  className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all hover:scale-102 shadow-sm cursor-pointer border-none"
                >
                  🖨️ Packing Slip
                </button>
                <button 
                  onClick={() => window.open('/print/invoice/' + selectedFulfillmentOrder.id, '_blank')}
                  className="bg-[#fafafa] hover:bg-black/5 border border-border text-[#333] font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer border-none"
                >
                  🧾 Customer Invoice
                </button>
                <button 
                  onClick={() => setSelectedFulfillmentOrder(null)}
                  className="bg-[#fafafa] hover:bg-black/5 border border-border text-[#333] font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer border-none"
                >
                  Close
                </button>
              </div>
            </div>

            <div id="packing-slip-print-area" className="flex flex-col gap-6 bg-[#fafafa] text-[#333] rounded-2xl p-6 border border-border">
              <div className="flex justify-between items-start border-b border-border pb-6">
                <div>
                  <h2 className="text-2xl font-black text-primary font-serif tracking-tight">
                    {printStoreName.toUpperCase()}
                  </h2>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Sweets & Savories Fulfillment Slip</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#333]">
                    ORDER ID: #{selectedFulfillmentOrder.id.toUpperCase()}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Date Placed: {new Date(selectedFulfillmentOrder.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border text-xs">
                <div>
                  <h4 className="font-bold text-primary uppercase tracking-wider mb-2 text-[10px]">Ship To Address</h4>
                  <div className="flex flex-col gap-1 text-muted-foreground font-medium">
                    <span className="font-bold text-[#333] text-sm">
                      {selectedFulfillmentOrder.shipping_address?.firstName} {selectedFulfillmentOrder.shipping_address?.lastName}
                    </span>
                    <span>{selectedFulfillmentOrder.shipping_address?.address}</span>
                    <span>{selectedFulfillmentOrder.shipping_address?.city}, {selectedFulfillmentOrder.shipping_address?.postalCode}</span>
                    <span>{selectedFulfillmentOrder.shipping_address?.country || 'India'}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-primary uppercase tracking-wider mb-2 text-[10px]">Logistics Info</h4>
                  <div className="flex flex-col gap-1 text-muted-foreground font-medium">
                    <span><strong>Carrier:</strong> {printCourierPartner}</span>
                    <span><strong>Origin:</strong> {printOriginAddress}</span>
                    <span><strong>Support Contact:</strong> {printSupportPhone} ({printSupportEmail})</span>
                    <span><strong>Status:</strong> {selectedFulfillmentOrder.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-primary uppercase tracking-wider text-[10px]">Order Details</h4>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2">Confection Item</th>
                      <th className="py-2 text-center">Quantity</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFulfillmentOrder.order_items?.map((item, idx) => {
                      const symbols = { INR: '₹', USD: '$', GBP: '£' };
                      const orderCurrency = selectedFulfillmentOrder.currency || 'INR';
                      const symbol = symbols[orderCurrency] || '₹';
                      const rates = { INR: 1.0, USD: 0.012, GBP: 0.0094 };
                      const rate = rates[orderCurrency] || 1.0;
                      
                      const formatOrderPrice = (val) => {
                        const converted = Number(val) * rate;
                        const decimals = orderCurrency === 'INR' ? 0 : 2;
                        return `${symbol}${converted.toFixed(decimals)}`;
                      };

                      return (
                        <tr key={idx} className="border-b border-border/40 text-muted-foreground">
                          <td className="py-2.5 font-bold text-[#333]">{item.products?.name}</td>
                          <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                          <td className="py-2.5 text-right">{formatOrderPrice(item.price_at_time)}</td>
                          <td className="py-2.5 text-right font-bold text-[#333]">{formatOrderPrice(item.quantity * item.price_at_time)}</td>
                        </tr>
                      );
                    })}
                    <tr className="text-[#333] font-bold">
                      <td colSpan="3" className="py-4 text-right uppercase font-black text-[10px]">Grand Payment Total</td>
                      <td className="py-4 text-right text-sm text-primary font-black">
                        {(() => {
                          const symbols = { INR: '₹', USD: '$', GBP: '£' };
                          const orderCurrency = selectedFulfillmentOrder.currency || 'INR';
                          const symbol = symbols[orderCurrency] || '₹';
                          const rates = { INR: 1.0, USD: 0.012, GBP: 0.0094 };
                          const rate = rates[orderCurrency] || 1.0;
                          const converted = Number(selectedFulfillmentOrder.total_amount) * rate;
                          const decimals = orderCurrency === 'INR' ? 0 : 2;
                          return `${symbol}${converted.toFixed(decimals)}`;
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-white rounded-xl border border-border flex flex-col gap-2 mt-2">
                <span className="text-[10px] text-primary font-black uppercase tracking-widest">
                  🛡️ {printStoreName.toUpperCase()} QUALITY GUARANTEE SEAL
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] text-muted-foreground font-medium">
                  {guaranteeItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="accent-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
