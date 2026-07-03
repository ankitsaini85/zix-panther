import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { api } from '../api/axios.js';

const EMPTY_FORM = {
  customerName: '',
  customerMobile: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  landmark: ''
};

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const course = location.state?.course;

  const [profile, setProfile] = useState(user || null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [paymentAccepted, setPaymentAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  useEffect(() => {
    if (!user?.userId) {
      return;
    }

    let cancelled = false;

    api.get(`/api/users/${user.userId}`).then(({ data }) => {
      if (!cancelled) {
        setProfile(data.data);
        setForm((current) => ({
          ...current,
          customerName: data.data?.fullName || user.fullName || '',
          customerMobile: data.data?.mobile || user.mobile || ''
        }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user?.userId, user?.fullName, user?.mobile]);

  useEffect(() => {
    if (!course) {
      navigate('/shop', { replace: true });
    }
  }, [course, navigate]);

  const placeOrder = async () => {
    if (!course) return;

    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/api/orders', {
        userId: user?.userId,
        courseId: course.id,
        courseName: course.name,
        courseDescription: course.description,
        courseImage: course.image || '',
        price: course.price,
        customerName: form.customerName || profile?.fullName || user?.fullName || '',
        customerMobile: form.customerMobile || profile?.mobile || user?.mobile || '',
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        landmark: form.landmark,
        paymentAccepted
      });

      setSuccessOrder(data.data);
    } catch (placeError) {
      setError(placeError.response?.data?.message || 'Unable to place order.');
    } finally {
      setSaving(false);
    }
  };

  const closeSuccess = () => {
    setSuccessOrder(null);
    window.location.assign('/dashboard');
  };

  if (!course) {
    return null;
  }

  return (
    <div className="page-stack checkout-shell">
      <div className="panel-card checkout-hero">
        <p className="eyebrow">Checkout</p>
        <h2>{course.name}</h2>
        <p className="muted">Fill your address and confirm the payment checkbox to place the order.</p>
        <div className="checkout-price">₹{course.price}</div>
      </div>

      <div className="panel-card checkout-grid">
        <div className="checkout-summary">
          <div className="checkout-image">
            {course.image ? <img src={course.image} alt={course.name} /> : <div className="course-placeholder">Course image</div>}
          </div>
          <h3>{course.name}</h3>
          <p>{course.description}</p>
          <p className="muted">Name and mobile are pulled from your user profile.</p>
          <div className="checkout-meta">
            <div className="checkout-pill">
              <span>Name</span>
              <strong>{profile?.fullName || user?.fullName || '-'}</strong>
            </div>
            <div className="checkout-pill">
              <span>Mobile</span>
              <strong>{profile?.mobile || user?.mobile || '-'}</strong>
            </div>
          </div>
        </div>

        <div className="checkout-form">
          <div className="grid-form">
            <label className="stack-form">
              <span className="muted">Name</span>
              <input value={form.customerName || profile?.fullName || user?.fullName || ''} onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))} />
            </label>
            <label className="stack-form">
              <span className="muted">Mobile</span>
              <input value={form.customerMobile || profile?.mobile || user?.mobile || ''} onChange={(event) => setForm((current) => ({ ...current, customerMobile: event.target.value }))} />
            </label>
            <label className="stack-form full-width">
              <span className="muted">Address</span>
              <textarea rows="3" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="House no, street, area" />
            </label>
            <label className="stack-form">
              <span className="muted">City</span>
              <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
            </label>
            <label className="stack-form">
              <span className="muted">State</span>
              <input value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} />
            </label>
            <label className="stack-form">
              <span className="muted">Pincode</span>
              <input value={form.pincode} onChange={(event) => setForm((current) => ({ ...current, pincode: event.target.value }))} />
            </label>
            <label className="stack-form full-width">
              <span className="muted">Landmark</span>
              <input value={form.landmark} onChange={(event) => setForm((current) => ({ ...current, landmark: event.target.value }))} />
            </label>
          </div>

          {error && <div className="alert error">{error}</div>}

          <label className="payment-check">
            <input type="checkbox" checked={paymentAccepted} onChange={(event) => setPaymentAccepted(event.target.checked)} />
            <span>I agree to pay ₹{course.price} for this course.</span>
          </label>

          <button className="primary-btn" disabled={!paymentAccepted || saving} onClick={placeOrder}>
            {saving ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>

      {successOrder && (
        <div className="modal-backdrop success-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card success-card">
            <div className="success-badge">Order Placed</div>
            <h3>Your account is now active</h3>
            <p>Your order for {successOrder.courseName} has been placed successfully.</p>
            <div className="success-details">
              <span>Order ID: {successOrder._id}</span>
              <span>User ID: {successOrder.userId}</span>
              <span>Amount: ₹{successOrder.price}</span>
            </div>
            <button className="primary-btn" onClick={closeSuccess}>Go to Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}