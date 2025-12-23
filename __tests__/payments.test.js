const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

let db;

beforeAll((done) => {
  const testDbPath = path.join(__dirname, '../test-payments.db');
  
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  db = new sqlite3.Database(testDbPath, (err) => {
    if (err) {
      done(err);
    } else {
      db.run(`CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, amount REAL, currency TEXT)`, (err) => {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    }
  });
});

afterAll((done) => {
  if (db) {
    db.close((err) => {
      if (err) {
        done(err);
      } else {
        const testDbPath = path.join(__dirname, '../test-payments.db');
        if (fs.existsSync(testDbPath)) {
          fs.unlinkSync(testDbPath);
        }
        done();
      }
    });
  } else {
    done();
  }
});

describe('Payments Database Operations', () => {
  test('should insert a payment into database', (done) => {
    const payment = { amount: 100.50, currency: 'USD' };
    
    db.run(
      'INSERT INTO payments (amount, currency) VALUES (?, ?)',
      [payment.amount, payment.currency],
      function(err) {
        expect(err).toBeNull();
        expect(this.lastID).toBeDefined();
        done();
      }
    );
  });

  test('should retrieve all payments from database', (done) => {
    db.all('SELECT * FROM payments', [], (err, rows) => {
      expect(err).toBeNull();
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBeGreaterThan(0);
      done();
    });
  });

  test('should retrieve payment by ID', (done) => {
    db.get('SELECT * FROM payments WHERE id = ?', [1], (err, row) => {
      expect(err).toBeNull();
      expect(row).toBeDefined();
      expect(row.amount).toBe(100.50);
      expect(row.currency).toBe('USD');
      done();
    });
  });

  test('should update a payment', (done) => {
    db.run(
      'UPDATE payments SET amount = ?, currency = ? WHERE id = ?',
      [250.75, 'EUR', 1],
      function(err) {
        expect(err).toBeNull();
        expect(this.changes).toBe(1);
        done();
      }
    );
  });

  test('should verify payment was updated', (done) => {
    db.get('SELECT * FROM payments WHERE id = ?', [1], (err, row) => {
      expect(err).toBeNull();
      expect(row.amount).toBe(250.75);
      expect(row.currency).toBe('EUR');
      done();
    });
  });

  test('should delete a payment', (done) => {
    db.run('DELETE FROM payments WHERE id = ?', [1], function(err) {
      expect(err).toBeNull();
      expect(this.changes).toBe(1);
      done();
    });
  });

  test('should return not found for deleted payment', (done) => {
    db.get('SELECT * FROM payments WHERE id = ?', [1], (err, row) => {
      expect(err).toBeNull();
      expect(row).toBeUndefined();
      done();
    });
  });

  test('should handle invalid currency field', (done) => {
    const payment = { amount: 500, currency: 'XYZ' };
    
    db.run(
      'INSERT INTO payments (amount, currency) VALUES (?, ?)',
      [payment.amount, payment.currency],
      function(err) {
        expect(err).toBeNull();
        expect(this.lastID).toBeDefined();
        done();
      }
    );
  });

  test('should handle negative amount insertion', (done) => {
    const payment = { amount: -50, currency: 'USD' };
    
    db.run(
      'INSERT INTO payments (amount, currency) VALUES (?, ?)',
      [payment.amount, payment.currency],
      function(err) {
        expect(err).toBeNull();
        done();
      }
    );
  });
});
