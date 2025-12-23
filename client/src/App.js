import './App.css';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

function App() {
  const [payments, setPayments] = useState([]);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [socket, setSocket] = useState(null);

  const API_URL = 'http://localhost:8556';

  // Connect to Socket.IO server
  useEffect(() => {
    const newSocket = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    // Listen for real-time payment updates
    newSocket.on('paymentsUpdated', (data) => {
      setPayments(data || []);
    });

    newSocket.on('paymentCreated', (payment) => {
      setPayments((prev) => [...prev, payment]);
    });

    newSocket.on('paymentUpdated', (updatedPayment) => {
      setPayments((prev) =>
        prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
      );
    });

    newSocket.on('paymentDeleted', (deletedPayment) => {
      setPayments((prev) => prev.filter((p) => p.id !== deletedPayment.id));
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch payments from backend
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/payments`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      const data = await response.json();
      setPayments(data || []);
      setError('');
    } catch (err) {
      setError('Error fetching payments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch payments on component mount (fallback if socket fails)
  useEffect(() => {
    fetchPayments();
  }, []);

  // Show success message for 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || !currency) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        // Update existing payment
        const response = await fetch(`${API_URL}/payments/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(amount), currency })
        });
        if (!response.ok) throw new Error('Failed to update payment');
        setSuccessMessage('Payment updated successfully!');
        setEditingId(null);
      } else {
        // Create new payment
        const response = await fetch(`${API_URL}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(amount), currency })
        });
        if (!response.ok) throw new Error('Failed to create payment');
        setSuccessMessage('Payment created successfully!');
      }

      // Reset form
      setAmount('');
      setCurrency('USD');
      setError('');

      // Refresh payment list
      fetchPayments();
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (payment) => {
    setAmount(payment.amount.toString());
    setCurrency(payment.currency);
    setEditingId(payment.id);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/payments/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete payment');
      setSuccessMessage('Payment deleted successfully!');
      fetchPayments();
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setAmount('');
    setCurrency('USD');
    setEditingId(null);
  };

  return (
    <div className="App">
      <div className='app-header'>
        <h1>💳 Payment Service Client</h1>
        <p>Manage your payments with ease</p>
      </div>

      <div className='app-body'>
        <div className='container-fluid'>
          <div className='row'>
            {/* Form Section */}
            <div className='col-lg-5'>
              <div className='card form-card'>
                <div className='card-header'>
                  <h4 className='card-title'>{editingId ? '✏️ Edit Payment' : '➕ Add New Payment'}</h4>
                </div>
                <div className='card-body'>
                  {error && <div className='alert alert-danger alert-dismissible' role='alert'>{error}</div>}
                  {successMessage && <div className='alert alert-success alert-dismissible' role='alert'>{successMessage}</div>}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="amount" className="form-label">Amount</label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        id="amount"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="currency" className="form-label">Currency</label>
                      <select
                        className="form-select form-select-lg"
                        id="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>

                    <div className='button-group'>
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : (editingId ? 'Update Payment' : 'Add Payment')}
                      </button>
                      {editingId && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-lg"
                          onClick={handleCancel}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className='col-lg-7'>
              <div className='card table-card'>
                <div className='card-header'>
                  <h4 className='card-title'>Payments List</h4>
                  <span className='badge bg-primary'>{payments.length} payments</span>
                </div>
                <div className='card-body'>
                  {loading && payments.length === 0 ? (
                    <div className='text-center py-5'>
                      <div className='spinner-border' role='status'>
                        <span className='visually-hidden'>Loading...</span>
                      </div>
                    </div>
                  ) : payments.length === 0 ? (
                    <div className='text-center py-5 text-muted'>
                      <p>No payments yet. Create one to get started!</p>
                    </div>
                  ) : (
                    <div className='table-responsive'>
                      <table className='table table-hover mb-0'>
                        <thead className='table-light'>
                          <tr>
                            <th>ID</th>
                            <th>Amount</th>
                            <th>Currency</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr key={payment.id} className={editingId === payment.id ? 'table-active' : ''}>
                              <td><strong>#{payment.id}</strong></td>
                              <td><strong>${payment.amount.toFixed(2)}</strong></td>
                              <td><span className='badge bg-info'>{payment.currency}</span></td>
                              <td>
                                <button
                                  className='btn btn-sm btn-primary'
                                  onClick={() => handleEdit(payment)}
                                  disabled={loading}
                                  title="Edit payment"
                                >
                                  Edit
                                </button>
                                <button
                                  className='btn btn-sm btn-danger ms-2'
                                  onClick={() => handleDelete(payment.id)}
                                  disabled={loading}
                                  title="Delete payment"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='app-footer'>
        <p>© 2025 Payment Service | All Rights Reserved</p>
      </div>
    </div>
  );
}

export default App;
