import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/apiClient';

const CustomerManager = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Fetch users with customer roles (default user listing endpoint)
      const res = await apiClient.get('/admin/users').catch(() => ({ data: [] }));
      // Filter out admin users if necessary, or just list everyone
      const usersList = Array.isArray(res.data) ? res.data : (res.data?.users || []);
      setCustomers(usersList);
    } catch (err) {
      console.warn("Failed to fetch customer directory:", err);
      // Fallback Mock Users for demonstrations
      setCustomers([
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+1 555-019-2834', status: 'ACTIVE', createdAt: new Date() },
        { id: '2', firstName: 'Ramesh', lastName: 'Ayala', email: 'ramesh.ayyala@gmail.com', phone: '+91 999 888 7777', status: 'ACTIVE', createdAt: new Date() },
        { id: '3', firstName: 'Sarah', lastName: 'Smith', email: 'sarah.smith@yahoo.co.uk', phone: '+44 7911 123456', status: 'ACTIVE', createdAt: new Date() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => {
    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const email = (c.email || '').toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    const query = search.toLowerCase();
    return fullName.includes(query) || email.includes(query) || phone.includes(query);
  });

  return (
    <div className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col min-h-[70vh] animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#333]">Customer Directory</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">View client directory, contact records, and active account profiles.</p>
        </div>
      </div>

      <div className="mb-4">
        <input 
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search customers by Name, Email address, or Phone number..."
          className="bg-[#fafafa] border border-border rounded-xl px-4 py-2.5 text-xs text-[#333] placeholder:text-muted-foreground/60 w-full md:w-96 focus:outline-none focus:border-primary font-medium shadow-sm"
        />
      </div>

      <div className="overflow-x-auto border border-border/50 rounded-2xl bg-white shadow-sm flex-1">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-[#fafafa]/50 text-muted-foreground text-xs uppercase tracking-wider">
              <th className="p-4 font-bold">Customer Name</th>
              <th className="p-4 font-bold">Email Address</th>
              <th className="p-4 font-bold">Contact Phone</th>
              <th className="p-4 font-bold">Account Status</th>
              <th className="p-4 font-bold">Registered Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-muted-foreground text-sm font-medium">
                  Scanning directory...
                </td>
              </tr>
            ) : filteredCustomers.map(customer => (
              <tr key={customer.id} className="border-b border-border/40 hover:bg-neutral-50/50 transition-colors">
                <td className="p-4 text-xs font-bold text-[#333]">
                  {customer.firstName} {customer.lastName}
                </td>
                <td className="p-4 text-xs text-[#333] font-mono">
                  {customer.email}
                </td>
                <td className="p-4 text-xs text-muted-foreground font-mono">
                  {customer.phone || 'N/A'}
                </td>
                <td className="p-4 text-xs">
                  <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                    customer.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-muted-foreground'
                  }`}>
                    {customer.status}
                  </span>
                </td>
                <td className="p-4 text-xs text-muted-foreground">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {!loading && filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-10 text-muted-foreground text-sm font-medium">
                  No matching customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerManager;
