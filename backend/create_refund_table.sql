-- Create Refund table manually
CREATE TABLE IF NOT EXISTS core_refund (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    refund_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    refund_method VARCHAR(50) NOT NULL DEFAULT '',
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    approved_by_id INTEGER NULL,
    processed_at DATETIME NULL,
    rejection_reason TEXT NOT NULL DEFAULT '',
    student_name VARCHAR(255) NOT NULL DEFAULT '',
    company_id VARCHAR(100) NOT NULL DEFAULT '',
    FOREIGN KEY (payment_id) REFERENCES core_payment(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by_id) REFERENCES users_user(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_refund_payment ON core_refund(payment_id);
CREATE INDEX IF NOT EXISTS idx_refund_status ON core_refund(status);
CREATE INDEX IF NOT  EXISTS idx_refund_student ON core_refund(student_name);
