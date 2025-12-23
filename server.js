const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});
const port = 8556;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Connect to SQLite database
const db = new sqlite3.Database('./payments.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, amount REAL, currency TEXT)`, (err) => {
            if (err) {
                console.error('Error creating table ' + err.message);
            }
        });
    }
});

// Function to sync data between SQLite and payments.json
const syncPayments = () => {
    db.all('SELECT * FROM payments', [], (err, rows) => {
        if (err) {
            throw err;
        }
        fs.writeFileSync('./payments.json', JSON.stringify(rows, null, 2));
        // Emit real-time update to all connected clients
        io.emit('paymentsUpdated', rows);
    });
};

// Get all payments
app.get('/payments', (req, res) => {
    db.all('SELECT * FROM payments', [], (err, rows) => {
        if (err) {
            res.status(500).send({ error: 'Internal Server Error' });
        } else {
            res.status(200).send(rows);
        }
    });
});

// Get payment by ID
app.get('/payments/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM payments WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).send({ error: 'Internal Server Error' });
        } else if (row) {
            res.status(200).send(row);
        } else {
            res.status(404).send({ error: 'Payment not found' });
        }
    });
});

// Create a new payment
app.post('/payments', (req, res) => {
    const { amount, currency } = req.body;
    db.run('INSERT INTO payments (amount, currency) VALUES (?, ?)', [amount, currency], function(err) {
        if (err) {
            res.status(500).send({ error: 'Internal Server Error' });
        } else {
            const newPayment = { id: this.lastID, amount, currency };
            syncPayments();
            // Emit real-time event
            io.emit('paymentCreated', newPayment);
            res.status(201).send({ id: this.lastID, message: 'Payment created successfully' });
        }
    });
});

// Update a payment
app.put('/payments/:id', (req, res) => {
    const { id } = req.params;
    const { amount, currency } = req.body;
    db.run('UPDATE payments SET amount = ?, currency = ? WHERE id = ?', [amount, currency, id], function(err) {
        if (err) {
            res.status(500).send({ error: 'Internal Server Error' });
        } else if (this.changes === 0) {
            res.status(404).send({ error: 'Payment not found' });
        } else {
            const updatedPayment = { id: parseInt(id), amount, currency };
            syncPayments();
            // Emit real-time event
            io.emit('paymentUpdated', updatedPayment);
            res.status(200).send({ message: 'Payment updated successfully' });
        }
    });
});

// Delete a payment
app.delete('/payments/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM payments WHERE id = ?', id, function(err) {
        if (err) {
            res.status(500).send({ error: 'Internal Server Error' });
        } else if (this.changes === 0) {
            res.status(404).send({ error: 'Payment not found' });
        } else {
            syncPayments();
            // Emit real-time event
            io.emit('paymentDeleted', { id: parseInt(id) });
            res.status(200).send({ message: 'Payment deleted successfully' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send initial payments data to the connected client
    db.all('SELECT * FROM payments', [], (err, rows) => {
        if (!err) {
            socket.emit('paymentsUpdated', rows);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

// Start the HTTP server
server.listen(port, () => {
    console.log(`Socket.IO server is running at http://localhost:${port}`);
});

// Close the database connection when the app is terminated
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database ' + err.message);
        }
        process.exit(0);
    });
});
