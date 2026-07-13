import React, { useState } from 'react';

const AnnouncementManager = ({
  announcements = [],
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  loadData
}) => {
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [newAnn, setNewAnn] = useState({ text: '', type: 'info', is_active: true });
  const [annStatus, setAnnStatus] = useState('');

  const handleAnnToggle = async (id, currentActive) => {
    try {
      await updateAnnouncement(id, { is_active: !currentActive });
      loadData();
    } catch (err) {
      alert("Failed to toggle status.");
    }
  };

  const handleAnnDelete = async (id) => {
    if (!window.confirm("Delete this alert?")) return;
    try {
      await deleteAnnouncement(id);
      loadData();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setAnnStatus('Publishing...');
    try {
      if (editingAnn) {
        await updateAnnouncement(editingAnn.id, newAnn);
        setAnnStatus('Announcement updated!');
      } else {
        await addAnnouncement(newAnn);
        setAnnStatus('Announcement published!');
      }
      loadData();
      setTimeout(() => {
        setAnnStatus('');
        setIsAnnModalOpen(false);
      }, 1000);
    } catch (err) {
      setAnnStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col min-h-[70vh] animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#333]">Flash Update Alerts</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Publish or edit flash headers visible to all store visitors.</p>
        </div>
        <button 
          onClick={() => {
            setEditingAnn(null);
            setNewAnn({ text: '', type: 'info', is_active: true });
            setIsAnnModalOpen(true);
          }}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-[0_4px_12px_rgba(186,36,42,0.15)] hover:scale-102 active:scale-98 cursor-pointer border-none"
        >
          + Create Flash Update
        </button>
      </div>

      <div className="overflow-y-auto pr-2 flex flex-col gap-4 flex-1">
        {announcements.map(ann => (
          <div 
            key={ann.id} 
            className={`flex flex-col md:flex-row md:items-center justify-between p-5 border rounded-2xl transition-all gap-4 ${
              ann.is_active 
                ? 'bg-[#fafafa] border-primary/30 shadow-sm' 
                : 'bg-neutral-50/50 border-border/60 opacity-60'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                  ann.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  ann.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  ann.type === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-cyan-50 text-cyan-700 border border-cyan-200'
                }`}>
                  {ann.type}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(ann.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-[#333]">{ann.text}</p>
            </div>
            
            <div className="flex items-center gap-4 self-end md:self-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={ann.is_active} 
                  onChange={() => handleAnnToggle(ann.id, ann.is_active)} 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              
              <button 
                onClick={() => {
                  setEditingAnn(ann);
                  setNewAnn({ text: ann.text, type: ann.type, is_active: ann.is_active });
                  setIsAnnModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-white border border-border hover:bg-primary hover:text-white text-muted-foreground rounded-lg transition-all text-xs font-bold active:scale-98 cursor-pointer"
              >
                Edit Update
              </button>
              <button 
                onClick={() => handleAnnDelete(ann.id)} 
                className="px-3.5 py-1.5 bg-white border border-border hover:bg-destructive hover:text-white text-destructive rounded-lg transition-all text-xs font-bold active:scale-98 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <p className="text-center py-8 text-muted-foreground text-sm font-medium">No announcements created yet.</p>
        )}
      </div>

      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="absolute inset-0" onClick={() => setIsAnnModalOpen(false)}></div>
          
          <div className="relative w-full max-w-lg bg-white border border-border rounded-3xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto z-10 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-xl font-bold font-serif text-[#333]">
                {editingAnn ? 'Edit Flash Alert' : 'Create Flash Update Alert'}
              </h2>
              <button 
                onClick={() => setIsAnnModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-[#fafafa] border border-border rounded-full hover:bg-black/5 transition-colors text-[#333] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {annStatus && <div className="bg-primary/10 text-primary border border-primary/20 p-3 rounded-lg text-sm font-semibold">{annStatus}</div>}
            
            <form onSubmit={handleAnnouncementSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Alert Message Text</label>
                <textarea 
                  name="text" 
                  placeholder="Type flash update message..." 
                  value={newAnn.text} 
                  onChange={(e) => setNewAnn({ ...newAnn, text: e.target.value })} 
                  required 
                  rows="3" 
                  className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm leading-relaxed font-medium"
                ></textarea>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Alert Styling Type</label>
                <select 
                  value={newAnn.type} 
                  onChange={(e) => setNewAnn({ ...newAnn, type: e.target.value })}
                  className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm font-medium"
                >
                  <option value="info">Info Alert (Cyan Glow)</option>
                  <option value="success">Success / Promo (Green Glow)</option>
                  <option value="warning">Warning / Alert (Amber Glow)</option>
                  <option value="critical">Critical / Emergency (Red Glow)</option>
                </select>
              </div>
              
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer py-1 font-medium">
                <input 
                  type="checkbox" 
                  checked={newAnn.is_active} 
                  onChange={(e) => setNewAnn({ ...newAnn, is_active: e.target.checked })} 
                  className="accent-primary w-4 h-4" 
                />
                Make Active Immediately on Header Announcement Bar
              </label>
              
              <div className="flex gap-2 mt-2">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(186,36,42,0.15)] hover:scale-102 active:scale-98 cursor-pointer border-none">
                  {editingAnn ? 'Apply Flash Update Changes' : 'Publish Flash Announcement'}
                </button>
                <button type="button" onClick={() => setIsAnnModalOpen(false)} className="px-5 bg-[#fafafa] border border-border rounded-xl hover:bg-black/5 transition-all text-xs font-bold text-[#333] cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManager;
