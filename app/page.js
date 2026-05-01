'use client';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const STATUSES_STANDARD = ['Received', 'Washing', 'Drying', 'Ready', 'Collected'];
const STATUSES_DELIVERY = ['Received', 'Washing', 'Drying', 'Out for delivery', 'Delivered'];

const STATUS_COLORS = {
  Received: { bg: '#1a2a3a', text: '#60a5fa' },
  Washing: { bg: '#2a1f0e', text: '#fbbf24' },
  Drying: { bg: '#0e2a1a', text: '#34d399' },
  Ready: { bg: '#0e2a1a', text: '#6ee7b7' },
  Collected: { bg: '#1a1a1a', text: '#9ca3af' },
  'Out for delivery': { bg: '#1e1a2e', text: '#a78bfa' },
  Delivered: { bg: '#1a1a1a', text: '#9ca3af' },
};

const ITEMS = ['Shirts', 'Trousers', 'Shorts', 'Socks', 'Underwear', 'Bedsheet', 'Towels'];
const TIME_SLOTS = ['7:00 AM – 9:00 AM', '9:00 AM – 11:00 AM', '12:00 PM – 2:00 PM', '4:00 PM – 6:00 PM'];
const ADMIN_PIN = '1234';

let localCounter = Date.now();
function genId() {
  localCounter++;
  return 'KLS-' + String(localCounter).slice(-4);
}

function LogisticsTag({ o }) {
  const both = o.dropoff === 'pickup' && o.returnMode === 'deliver';
  const pickupOnly = o.dropoff === 'pickup' && o.returnMode !== 'deliver';
  const deliverOnly = o.dropoff !== 'pickup' && o.returnMode === 'deliver';
  const label = both ? 'Pickup + Delivery' : pickupOnly ? 'Pickup requested' : deliverOnly ? 'Delivery requested' : 'Self drop-off';
  const color = both || deliverOnly ? '#a78bfa' : pickupOnly ? '#60a5fa' : '#6b7280';
  return (
    <span style={{ fontSize: 10, background: '#1c1c1c', color, border: `1px solid ${color}33`, padding: '2px 8px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.04em' }}>
      {label}
    </span>
  );
}

function ProgressBar({ order }) {
  const statuses = order.returnMode === 'deliver' ? STATUSES_DELIVERY : STATUSES_STANDARD;
  const si = statuses.indexOf(order.status);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', margin: '16px 0 10px' }}>
      {statuses.map((s, i) => (
        <div key={`step-${s}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          {i < statuses.length - 1 && (
            <div style={{ position: 'absolute', top: 5, left: '50%', width: '100%', height: 2, background: i < si ? '#10b981' : '#2a2a2a', zIndex: 0 }} />
          )}
          <div style={{ width: 12, height: 12, borderRadius: '50%', zIndex: 1, background: i < si ? '#10b981' : i === si ? '#f59e0b' : '#2a2a2a', border: `2px solid ${i < si ? '#10b981' : i === si ? '#f59e0b' : '#3a3a3a'}`, transition: 'all 0.3s' }} />
          <span style={{ fontSize: 9, marginTop: 6, textAlign: 'center', color: i < si ? '#10b981' : i === si ? '#f59e0b' : '#4a4a4a', fontWeight: i === si ? 600 : 400, lineHeight: 1.3 }}>{s}</span>
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order, showSelect, onStatusChange }) {
  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.Received;
  const statuses = order.returnMode === 'deliver' ? STATUSES_DELIVERY : STATUSES_STANDARD;
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: '16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#e5e7eb', letterSpacing: '0.05em' }}>{order.id}</span>
            <LogisticsTag o={order} />
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{order.name} · Room {order.room} · {order.date}</div>
        </div>
        {showSelect ? (
          <select style={{ fontSize: 11, background: '#1a1a1a', color: '#e5e7eb', border: '1px solid #333', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}
            value={order.status} onChange={e => onStatusChange(order.id, e.target.value)}>
            {statuses.map(s => <option key={`opt-${s}`} style={{ background: '#1a1a1a' }}>{s}</option>)}
          </select>
        ) : (
          <span style={{ fontSize: 11, background: sc.bg, color: sc.text, padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>{order.status}</span>
        )}
      </div>
      <ProgressBar order={order} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
        {order.items.map(it => (
          <span key={`item-${it}`} style={{ fontSize: 11, background: '#1c1c1c', color: '#9ca3af', padding: '3px 10px', borderRadius: 6, border: '1px solid #2a2a2a' }}>{it}</span>
        ))}
      </div>
      {order.pickupTime && <div style={{ fontSize: 11, color: '#4b5563', marginTop: 6 }}>Pickup: {order.pickupTime}</div>}
      {order.deliveryTime && <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>Delivery: {order.deliveryTime}</div>}
      {order.notes && <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>Note: {order.notes}</div>}
    </div>
  );
}

function Toggle({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', border: '1px solid #2a2a2a', borderRadius: 10, overflow: 'hidden', marginTop: 6 }}>
      {options.map(([val, label]) => (
        <button key={`toggle-${val}`} onClick={() => onChange(val)}
          style={{ flex: 1, padding: '9px 4px', fontSize: 12, fontWeight: value === val ? 600 : 400, background: value === val ? '#10b981' : 'transparent', color: value === val ? '#fff' : '#6b7280', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 5, display: 'block', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>}
      <input style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#e5e7eb', outline: 'none', boxSizing: 'border-box' }} {...props} />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 5, display: 'block', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>}
      <select style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#e5e7eb', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }} {...props}>
        {children}
      </select>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: '#1e1e1e', margin: '18px 0' }} />;
}

function SectionLabel({ children }) {
  return <p style={{ fontSize: 10, fontWeight: 600, color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>{children}</p>;
}

function PinLock({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function handleKey(val) {
    if (val === 'del') { setPin(p => p.slice(0, -1)); setError(false); return; }
    if (pin.length >= 4) return;
    const newPin = pin + val;
    setPin(newPin);
    if (newPin.length === 4) {
      if (newPin === ADMIN_PIN) { onUnlock(); }
      else { setError(true); setTimeout(() => { setPin(''); setError(false); }, 600); }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '0 24px' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
      <h2 style={{ color: '#e5e7eb', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Admin Access</h2>
      <p style={{ color: '#4b5563', fontSize: 13, marginBottom: 32 }}>Enter your 4-digit PIN to continue</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={`dot-${i}`} style={{ width: 14, height: 14, borderRadius: '50%', background: i < pin.length ? (error ? '#ef4444' : '#10b981') : '#2a2a2a', border: `2px solid ${i < pin.length ? (error ? '#ef4444' : '#10b981') : '#3a3a3a'}`, transition: 'all 0.15s' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 240 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, i) => (
          k === '' ? <div key={`empty-${i}`} /> :
            <button key={`key-${k}`} onClick={() => handleKey(k)}
              style={{ background: k === 'del' ? '#1c1c1c' : '#161616', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px', fontSize: k === 'del' ? 13 : 18, fontWeight: 600, color: k === 'del' ? '#6b7280' : '#e5e7eb', cursor: 'pointer', transition: 'all 0.1s' }}>
              {k === 'del' ? '⌫' : k}
            </button>
        ))}
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 20 }}>Incorrect PIN. Try again.</p>}
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState('book');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', room: '', date: '', notes: '' });
  const [selectedItems, setSelectedItems] = useState([]);
  const [dropoff, setDropoff] = useState('self');
  const [returnMode, setReturnMode] = useState('collect');
  const [pickupTime, setPickupTime] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase.from('orders').select('*');
    if (error) { console.error(error); showToast('Error loading orders'); }
    else {
      setOrders(data.map(o => ({ ...o, returnMode: o.return_mode, pickupTime: o.pickup_time, deliveryTime: o.delivery_time })));
    }
    setLoading(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }
  function toggleItem(item) { setSelectedItems(p => p.includes(item) ? p.filter(i => i !== item) : [...p, item]); }

  async function updateStatus(id, status) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) { showToast('Error updating status'); return; }
    setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
    showToast(`${id} → ${status}`);
  }

  async function submitBooking() {
    if (!form.name || !form.phone || !form.room || !form.date || !selectedItems.length) { showToast('Please fill all required fields'); return; }
    if (dropoff === 'pickup' && !pickupTime) { showToast('Select a pickup time slot'); return; }
    if (returnMode === 'deliver' && !deliveryTime) { showToast('Select a delivery time slot'); return; }

    const newOrder = {
      id: genId(),
      name: form.name,
      phone: form.phone,
      room: form.room,
      date: form.date,
      notes: form.notes,
      items: selectedItems,
      status: 'Received',
      dropoff,
      return_mode: returnMode,
      pickup_time: pickupTime,
      delivery_time: deliveryTime,
    };

    const { error } = await supabase.from('orders').insert([newOrder]);
    if (error) { console.error(JSON.stringify(error)); showToast('Error loading orders'); }

    showToast(`Booked! Your ID is ${newOrder.id}`);
const msg = `Hi Kwapong Laundry! 👋\n\nI just made a booking.\n\n*Order ID:* ${newOrder.id}\n*Name:* ${newOrder.name}\n*Room:* ${newOrder.room}\n*Date:* ${newOrder.date}\n*Items:* ${newOrder.items.join(', ')}\n\nPlease confirm my booking. 🧺`;
const waLink = `https://wa.me/233204912848?text=${encodeURIComponent(msg)}`;
setTimeout(() => { window.location.href = waLink; }, 500);
    setForm({ name: '', phone: '', room: '', date: '', notes: '' });
    setSelectedItems([]); setDropoff('self'); setReturnMode('collect'); setPickupTime(''); setDeliveryTime('');
    fetchOrders();
  }

  function searchOrder() {
    const o = orders.find(x => x.id === trackId.trim().toUpperCase());
    if (o) { setTrackResult(o); setTrackError(''); }
    else { setTrackResult(null); setTrackError('Order not found. Check the ID and try again.'); }
  }

  const logisticsFee = (dropoff === 'pickup' ? 2 : 0) + (returnMode === 'deliver' ? 2 : 0);
  const card = { background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: 16, padding: '20px' };

  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap" rel="stylesheet" />

      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧺</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#f3f4f6' }}>Kwapong Laundry</div>
          <div style={{ fontSize: 11, color: '#4b5563' }}>University of Ghana</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '16px 20px 8px', borderBottom: '1px solid #141414' }}>
        {['book', 'track'].map(t => (
          <button key={`tab-${t}`} onClick={() => setTab(t)}
            style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: tab === t ? 'none' : '1px solid #222', background: tab === t ? '#10b981' : 'transparent', color: tab === t ? '#fff' : '#6b7280', cursor: 'pointer', transition: 'all 0.2s' }}>
            {t === 'admin' ? '🔐 Admin' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px' }}>

        {tab === 'book' && (
          <div style={card}>
            <SectionLabel>New Booking</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Full name" placeholder="Ama Mensah" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <Input label="WhatsApp Number" placeholder="024 000 0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <Input label="Room number" placeholder="A12" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
              <Input label="Preferred date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>

            <Divider />
            <SectionLabel>Drop-off logistics</SectionLabel>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>How will you bring in your laundry?</p>
            <Toggle options={[['self', "I'll drop it off"], ['pickup', 'Request a pickup']]} value={dropoff} onChange={setDropoff} />
            {dropoff === 'pickup' && (
              <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 10, padding: 12, marginTop: 10 }}>
                <Select label="Pickup time slot" value={pickupTime} onChange={e => setPickupTime(e.target.value)}>
                  <option value="">Select time</option>
                  {TIME_SLOTS.map(s => <option key={`pt-${s}`}>{s}</option>)}
                </Select>
                <p style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>+ GHS 2.00 pickup fee</p>
              </div>
            )}

            <Divider />
            <SectionLabel>Return logistics</SectionLabel>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>How do you want your clean laundry back?</p>
            <Toggle options={[['collect', "I'll collect it"], ['deliver', 'Deliver to my room']]} value={returnMode} onChange={setReturnMode} />
            {returnMode === 'deliver' && (
              <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 10, padding: 12, marginTop: 10 }}>
                <Select label="Delivery time preference" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)}>
                  <option value="">Select time</option>
                  {TIME_SLOTS.map(s => <option key={`dt-${s}`}>{s}</option>)}
                </Select>
                <p style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>+ GHS 2.00 delivery fee</p>
              </div>
            )}

            <Divider />
            <SectionLabel>Items</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {ITEMS.map(item => (
                <button key={`item-${item}`} onClick={() => toggleItem(item)}
                  style={{ fontSize: 12, padding: '7px 14px', borderRadius: 20, border: `1px solid ${selectedItems.includes(item) ? '#10b981' : '#2a2a2a'}`, background: selectedItems.includes(item) ? '#10b98122' : 'transparent', color: selectedItems.includes(item) ? '#10b981' : '#6b7280', cursor: 'pointer', fontWeight: selectedItems.includes(item) ? 600 : 400, transition: 'all 0.15s' }}>
                  {item}
                </button>
              ))}
            </div>

            <Input label="Notes (optional)" placeholder="e.g. no bleach, handle with care..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

            {logisticsFee > 0 && (
              <div style={{ background: '#0a1a0f', border: '1px solid #10b98133', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#6b7280' }}>
                Logistics fee: <strong style={{ color: '#10b981' }}>GHS {logisticsFee}.00</strong>
              </div>
            )}

            <button onClick={submitBooking}
              style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: '0.02em' }}>
              Submit Booking
            </button>
          </div>
        )}

        {tab === 'track' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input style={{ flex: 1, background: '#0e0e0e', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#e5e7eb', outline: 'none', fontFamily: 'monospace' }}
                placeholder="Enter order ID e.g. KLS-0001" value={trackId} onChange={e => setTrackId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchOrder()} />
              <button onClick={searchOrder}
                style={{ background: '#10b981', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                Search
              </button>
            </div>
            {trackResult && <OrderCard order={trackResult} showSelect={false} />}
            {trackError && <p style={{ fontSize: 13, color: '#4b5563', textAlign: 'center', padding: '16px 0' }}>{trackError}</p>}
            {!trackResult && !trackError && (
              <p style={{ fontSize: 13, color: '#4b5563', textAlign: 'center', padding: '40px 0' }}>Enter your order ID above to track your laundry 👆</p>
            )}
          </div>
        )}

        {tab === 'admin' && (
          adminUnlocked ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <SectionLabel>Dashboard</SectionLabel>
                <button onClick={() => setAdminUnlocked(false)}
                  style={{ fontSize: 11, color: '#ef4444', background: '#1c1010', border: '1px solid #ef444433', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>
                  Lock
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  ['Total', orders.length, '#60a5fa'],
                  ['In progress', orders.filter(o => ['Washing', 'Drying', 'Out for delivery'].includes(o.status)).length, '#f59e0b'],
                  ['Ready', orders.filter(o => ['Ready', 'Out for delivery'].includes(o.status)).length, '#10b981']
                ].map(([label, val, color]) => (
                  <div key={`metric-${label}`} style={{ background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: 14, padding: '14px 12px' }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: 'monospace' }}>{val}</div>
                    <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button onClick={fetchOrders} style={{ fontSize: 11, color: '#10b981', background: 'transparent', border: '1px solid #10b98133', borderRadius: 8, padding: '4px 12px', cursor: 'pointer' }}>
                  ↻ Refresh
                </button>
              </div>

              <SectionLabel>Manage orders</SectionLabel>
              {loading ? (
                <p style={{ fontSize: 13, color: '#4b5563', textAlign: 'center', padding: '24px 0' }}>Loading orders...</p>
              ) : (
                <div style={{ background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: 16, overflow: 'hidden' }}>
                  {orders.length === 0 && <p style={{ fontSize: 13, color: '#4b5563', textAlign: 'center', padding: '24px 0' }}>No orders yet</p>}
                  {orders.map((o, i) => (
                    <div key={`admin-${o.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < orders.length - 1 ? '1px solid #141414' : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', fontFamily: 'monospace' }}>{o.id} <span style={{ fontFamily: 'sans-serif', fontWeight: 400, color: '#9ca3af' }}>— {o.name}</span></div>
                        <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span>Room {o.room}</span>
                          <LogisticsTag o={o} />
                        </div>
                      </div>
                      <select style={{ fontSize: 11, background: '#1a1a1a', color: '#e5e7eb', border: '1px solid #2a2a2a', borderRadius: 8, padding: '5px 8px', cursor: 'pointer' }}
                        value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
                        {(o.returnMode === 'deliver' ? STATUSES_DELIVERY : STATUSES_STANDARD).map(s => (
                          <option key={`s-${o.id}-${s}`} style={{ background: '#1a1a1a' }}>{s}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <PinLock onUnlock={() => setAdminUnlocked(true)} />
          )
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 12, zIndex: 100, whiteSpace: 'nowrap', boxShadow: '0 4px 24px #10b98144' }}>
          {toast}
        </div>
      )}
    </main>
  );
}