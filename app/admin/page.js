'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const STATUSES_STANDARD = ['Received', 'Washing', 'Drying', 'Ready', 'Collected'];
const STATUSES_DELIVERY = ['Received', 'Washing', 'Drying', 'Out for delivery', 'Delivered'];
const ADMIN_PIN = '1234';

function LogisticsTag({ o }) {
  const both = o.dropoff === 'pickup' && o.returnMode === 'deliver';
  const pickupOnly = o.dropoff === 'pickup' && o.returnMode !== 'deliver';
  const deliverOnly = o.dropoff !== 'pickup' && o.returnMode === 'deliver';
  const label = both ? 'Pickup + Delivery' : pickupOnly ? 'Pickup requested' : deliverOnly ? 'Delivery requested' : 'Self drop-off';
  const color = both || deliverOnly ? '#a78bfa' : pickupOnly ? '#60a5fa' : '#6b7280';
  return (
    <span style={{ fontSize: 10, background: '#1c1c1c', color, border: `1px solid ${color}33`, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
      {label}
    </span>
  );
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#080808', padding: '0 24px' }}>
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
              style={{ background: k === 'del' ? '#1c1c1c' : '#161616', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px', fontSize: k === 'del' ? 13 : 18, fontWeight: 600, color: k === 'del' ? '#6b7280' : '#e5e7eb', cursor: 'pointer' }}>
              {k === 'del' ? '⌫' : k}
            </button>
        ))}
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 20 }}>Incorrect PIN. Try again.</p>}
    </div>
  );
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => { if (unlocked) fetchOrders(); }, [unlocked]);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase.from('orders').select('*');
    if (error) { console.error(error); showToast('Error loading orders'); }
    else { setOrders(data.map(o => ({ ...o, returnMode: o.return_mode, pickupTime: o.pickup_time, deliveryTime: o.delivery_time }))); }
    setLoading(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function updateStatus(id, status) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) { showToast('Error updating status'); return; }
    setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
    showToast(`${id} → ${status}`);
  }

  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;

  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧺</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#f3f4f6' }}>Kwapong Laundry</div>
            <div style={{ fontSize: 11, color: '#4b5563' }}>Admin Dashboard</div>
          </div>
        </div>
        <button onClick={() => setUnlocked(false)}
          style={{ fontSize: 11, color: '#ef4444', background: '#1c1010', border: '1px solid #ef444433', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          Lock
        </button>
      </div>

      <div style={{ padding: '16px 20px' }}>
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

        <p style={{ fontSize: 10, fontWeight: 600, color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Manage Orders</p>

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
  {(o.status === 'Ready' || o.status === 'Out for delivery') && (
    <button onClick={() => {
      const msg = o.returnMode === 'deliver'
        ? `Hi ${o.name}! 👋\n\nYour laundry (*${o.id}*) is on its way to Room ${o.room}! 🚚\n\nThank you for using Kwapong Laundry. 🧺`
        : `Hi ${o.name}! 👋\n\nYour laundry (*${o.id}*) is ready for pickup! 🧺\n\nPlease come collect it at your earliest convenience.\n\nThank you for using Kwapong Laundry!`;
      window.open(`https://wa.me/233${o.phone.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }}
      style={{ fontSize: 10, background: '#0d2e1a', color: '#25d366', border: '1px solid #25d36633', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 600 }}>
      📲 Notify
    </button>
  )}
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

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 12, zIndex: 100, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </main>
  );
}