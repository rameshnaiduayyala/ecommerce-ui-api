import React, { useState } from 'react';

const SettingsManager = ({
  settings = {},
  setSettings,
  updateStoreSettings,
  uploadImage,
  openAssetLibrary
}) => {
  const [settingsStatus, setSettingsStatus] = useState('');
  const [newHeroSlide, setNewHeroSlide] = useState({ title: '', description: '', image_url: '' });
  const [slideUploading, setSlideUploading] = useState(false);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsStatus('Saving settings...');
    try {
      await updateStoreSettings(settings);
      setSettingsStatus('Settings saved successfully!');
      setTimeout(() => setSettingsStatus(''), 3000);
    } catch (err) {
      setSettingsStatus(`Error: ${err.message || 'Failed to save settings'}`);
    }
  };

  const handleAddHeroSlide = () => {
    if (!newHeroSlide.image_url) {
      alert("Please upload or select an image for the slide.");
      return;
    }
    const currentSlides = settings.hero_carousel_slides || [];
    const updatedSlides = [...currentSlides, { ...newHeroSlide, id: Date.now() }];
    setSettings(prev => ({ ...prev, hero_carousel_slides: updatedSlides }));
    setNewHeroSlide({ title: '', description: '', image_url: '' });
  };

  const handleRemoveHeroSlide = (id) => {
    const currentSlides = settings.hero_carousel_slides || [];
    const updatedSlides = currentSlides.filter(s => s.id !== id);
    setSettings(prev => ({ ...prev, hero_carousel_slides: updatedSlides }));
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold font-serif text-[#333] mb-6">Store & Payment Settings</h2>
      {settingsStatus && <div className="bg-primary/10 text-primary p-3 rounded-lg mb-6 text-sm font-semibold border border-primary/20">{settingsStatus}</div>}
      
      <form onSubmit={handleSettingsSubmit} className="flex flex-col gap-8">
        {/* Shipping Settings */}
        <div className="flex flex-col gap-4 p-4 bg-[#fafafa] border border-border/60 rounded-xl">
          <h3 className="font-bold text-lg text-[#333]">Shipping Rules</h3>
          <p className="text-sm text-muted-foreground">Configure shipping fees and free delivery thresholds.</p>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Flat Shipping Fee (₹)</label>
              <input 
                type="number" 
                step="0.01"
                value={settings.shipping_fee !== undefined ? settings.shipping_fee : 50.00} 
                onChange={(e) => setSettings({ ...settings, shipping_fee: parseFloat(e.target.value) || 0 })}
                className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary w-full text-[#333] font-medium" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Free Shipping Threshold (₹)</label>
              <input 
                type="number" 
                step="0.01"
                value={settings.free_shipping_threshold !== undefined ? settings.free_shipping_threshold : 999.00} 
                onChange={(e) => setSettings({ ...settings, free_shipping_threshold: parseFloat(e.target.value) || 0 })}
                className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary w-full text-[#333] font-medium" 
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-[#fafafa] border border-border/60 rounded-xl">
          <div>
            <h3 className="font-bold text-lg text-[#333]">Cash on Delivery (COD)</h3>
            <p className="text-sm text-muted-foreground">Allow customers to pay when their order is delivered.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer font-medium">
            <input type="checkbox" className="sr-only peer" checked={settings.cod_enabled || false} onChange={(e) => setSettings({ ...settings, cod_enabled: e.target.checked })} />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex flex-col gap-4 p-4 bg-[#fafafa] border border-border/60 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-[#333]">Partial Payment (Layaway)</h3>
              <p className="text-sm text-muted-foreground">Allow customers to pay a percentage upfront and the rest later.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer font-medium">
              <input type="checkbox" className="sr-only peer" checked={settings.partial_payment_enabled || false} onChange={(e) => setSettings({ ...settings, partial_payment_enabled: e.target.checked })} />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          {settings.partial_payment_enabled && (
            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
              <label className="text-sm text-muted-foreground font-bold uppercase tracking-wide">Upfront Percentage (%)</label>
              <input 
                type="number" 
                min="1" 
                max="99" 
                value={settings.partial_payment_percent || 50} 
                onChange={(e) => setSettings({ ...settings, partial_payment_percent: parseInt(e.target.value) })}
                className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary w-full md:w-1/3 text-[#333] font-medium" 
              />
            </div>
          )}
        </div>

        {/* Homepage Hero Customization */}
        <div className="flex flex-col gap-4 p-4 bg-[#fafafa] border border-border/60 rounded-xl">
          <h3 className="font-bold text-lg text-primary">Homepage Hero Showcase</h3>
          <p className="text-sm text-muted-foreground">Customize the main hero cover picture or set up a looping multi-image carousel.</p>

          {/* Single Hero Image Upload */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Hero Background / Main Image</label>
              <button 
                type="button"
                onClick={() => openAssetLibrary((url) => setSettings(prev => ({ ...prev, hero_image_url: url })))}
                className="text-[10px] text-primary hover:underline font-bold bg-transparent border-none cursor-pointer"
              >
                📁 Browse Cloud Library
              </button>
            </div>
            <div className="flex items-center gap-4">
              {settings.hero_image_url && (
                <img 
                  src={settings.hero_image_url} 
                  alt="Hero Cover" 
                  className="w-16 h-16 rounded-xl object-cover border border-border"
                />
              )}
              <label className="flex-1 flex items-center justify-center h-16 border border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer bg-white transition-all">
                <span className="text-xs text-muted-foreground font-medium hover:text-foreground">Upload New Hero Image</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setSettingsStatus('Uploading hero cover image...');
                    try {
                      const uploadData = await uploadImage(file);
                      if (!uploadData?.url) throw new Error('No URL returned from backend');
                      setSettings({ ...settings, hero_image_url: uploadData.url });
                      setSettingsStatus('Hero image uploaded successfully!');
                      setTimeout(() => setSettingsStatus(''), 3000);
                    } catch (err) {
                      console.error("Hero upload error:", err);
                      setSettingsStatus('Failed to upload hero image.');
                    }
                  }}
                />
              </label>
            </div>
            <input 
              type="text" 
              value={settings.hero_image_url || ''} 
              onChange={(e) => setSettings({ ...settings, hero_image_url: e.target.value })}
              placeholder="Or paste direct cover URL..." 
              className="bg-white border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary w-full mt-1 text-[#333]"
            />
          </div>

          {/* Carousel Toggle Switch */}
          <div className="flex items-center justify-between p-3 bg-white border border-border rounded-xl mt-2">
            <div>
              <h4 className="font-bold text-sm text-[#333]">Enable Multi-Image Carousel Mode</h4>
              <p className="text-xs text-muted-foreground">If enabled, the hero section will loop through all carousel confections.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer font-medium">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.hero_use_carousel || false} 
                onChange={(e) => setSettings({ ...settings, hero_use_carousel: e.target.checked })} 
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Carousel Urls Management */}
          {settings.hero_use_carousel && (
            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-4">
              <h4 className="font-bold text-md text-primary">Advanced Carousel Slide Manager</h4>
              <p className="text-xs text-muted-foreground">Add slides with gorgeous custom titles, descriptions, and images. They will fade in sync!</p>

              {/* Add Slide Builder form */}
              <div className="p-4 bg-white border border-border/60 rounded-2xl flex flex-col gap-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Create New Slide</h5>
                
                <input 
                  type="text" 
                  placeholder="Slide Title / Confection Name" 
                  value={newHeroSlide.title} 
                  onChange={(e) => setNewHeroSlide({ ...newHeroSlide, title: e.target.value })}
                  className="bg-[#fafafa] border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary w-full text-[#333] font-medium"
                />

                <textarea 
                  rows="2" 
                  placeholder="Slide Description / Captivating Details" 
                  value={newHeroSlide.description} 
                  onChange={(e) => setNewHeroSlide({ ...newHeroSlide, description: e.target.value })}
                  className="bg-[#fafafa] border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary w-full text-[#333] font-medium"
                />

                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] text-muted-foreground">Slide Photo URL</span>
                    <button 
                      type="button"
                      onClick={() => openAssetLibrary((url) => setNewHeroSlide(prev => ({ ...prev, image_url: url })))}
                      className="text-[9px] text-primary hover:underline font-bold bg-transparent border-none cursor-pointer"
                    >
                      📁 Choose from Storage
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {newHeroSlide.image_url ? (
                      <div className="relative rounded-lg overflow-hidden w-10 h-10 border border-primary/20 flex-shrink-0">
                        <img src={newHeroSlide.image_url} className="w-full h-full object-cover" alt="" />
                      </div>
                    ) : (
                      <label className="flex-1 flex items-center justify-center h-10 border border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer bg-[#fafafa] transition-all text-[11px] text-muted-foreground">
                        {slideUploading ? "Uploading..." : "📷 Upload Photo"}
                        <input 
                          type="file" 
                          accept="image/*" 
                          disabled={slideUploading}
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            setSlideUploading(true);
                            try {
                              const uploadData = await uploadImage(file);
                              if (!uploadData?.url) throw new Error('No URL returned');
                              setNewHeroSlide(prev => ({ ...prev, image_url: uploadData.url }));
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setSlideUploading(false);
                            }
                          }}
                        />
                      </label>
                    )}
                    <input 
                      type="text" 
                      placeholder="Or paste direct slide URL..."
                      value={newHeroSlide.image_url}
                      onChange={e => setNewHeroSlide({ ...newHeroSlide, image_url: e.target.value })}
                      className="flex-1 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-[#333]"
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleAddHeroSlide}
                  className="bg-[#222] hover:bg-primary text-white text-xs font-bold py-2.5 rounded-xl transition-all border-none cursor-pointer mt-1"
                >
                  Save & Add Slide
                </button>
              </div>

              {/* Loop and Display Active Carousel Slides */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase px-1">Active Slides Carousel list ({settings.hero_carousel_slides?.length || 0})</span>
                {(settings.hero_carousel_slides || []).map((slide) => (
                  <div key={slide.id} className="flex items-center gap-3 p-3 bg-white border border-border rounded-2xl">
                    <img src={slide.image_url} className="w-12 h-12 rounded-xl object-cover bg-black/5" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-[#333] truncate">{slide.title || "No Title"}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{slide.description || "No Description"}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveHeroSlide(slide.id)}
                      className="text-xs text-red-500 font-bold hover:bg-red-50 p-2 rounded-lg border-none cursor-pointer bg-transparent"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Setup details */}
        <div className="flex flex-col gap-4 p-4 bg-[#fafafa] border border-border/60 rounded-xl mt-6">
          <h3 className="font-bold text-lg text-[#333]">Fulfillment & Support Details</h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Courier Provider Name</label>
              <input 
                type="text" 
                value={settings.courier_partner || ''} 
                onChange={(e) => setSettings({ ...settings, courier_partner: e.target.value })}
                placeholder="E.g. Ghee Express Courier"
                className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm font-medium" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Fulfillment Kitchen Origin Address</label>
            <textarea 
              value={settings.origin_address || ''} 
              onChange={(e) => setSettings({ ...settings, origin_address: e.target.value })}
              placeholder="E.g. Ravulapalem, East Godavari District, Andhra Pradesh"
              rows="2"
              className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm leading-relaxed font-medium" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Support Email Address</label>
              <input 
                type="email" 
                value={settings.support_email || ''} 
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                placeholder="E.g. support@ahakonaseema.com"
                className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm font-medium" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Support Contact Phone</label>
              <input 
                type="text" 
                value={settings.support_phone || ''} 
                onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                placeholder="E.g. +91 888 777 6666"
                className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm font-medium" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Quality Seal / Invoice Terms Guarantee</label>
            <textarea 
              value={settings.guarantee_text || ''} 
              onChange={(e) => setSettings({ ...settings, guarantee_text: e.target.value })}
              placeholder="Items separated by bullet '•' will be printed as checkboxes (e.g. Pure Ghee verified • Vacuum leakage protection sealed)"
              rows="3"
              className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm leading-relaxed font-medium" 
            />
            <p className="text-[10px] text-muted-foreground italic">Use the dot symbol '•' (Alt + 0149 / option + 8) to separate bulleted quality seals printed on packing slips.</p>
          </div>
        </div>
        
        <button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold py-4 rounded-xl transition-all shadow-[0_4px_12px_rgba(186,36,42,0.15)] active:scale-98 cursor-pointer border-none mt-6 w-full">
          Save Settings
        </button>
      </form>
    </div>
  );
};

export default SettingsManager;
