

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addPromotion } from '../movieService';
import './page.css';

export default function ManagePromotions() {
    const router = useRouter();
    const [newPromotion, setNewPromotion] = useState({ title: '', discount: '', code: '', validUntil: '' });
    const [error, setError] = useState('');
    const [confirmationMessage, setConfirmationMessage] = useState('');

    useEffect(() => {
        const checkAdmin = async () => {
            const response = await fetch('/api/auth/session', { credentials: 'include' });
            const session = await response.json().catch(() => ({}));
            if (session?.role !== 'admin') {
                router.push('/login');
            }
        };
        checkAdmin();
    }, [router]);

    const handleAddPromotion = async () => {
        if (!newPromotion.title || !newPromotion.discount || !newPromotion.code || !newPromotion.validUntil) {
            alert("Please fill in all fields.");
            return;
        }

        // Ensure the discount is an integer
        const discountValue = parseInt(newPromotion.discount, 10);

        if (isNaN(discountValue) || discountValue <= 0 || discountValue > 100) {
            setError("Please enter a valid discount percentage (1-100).");
            return;
        }

        const promotionData = {
            title: newPromotion.title,
            discount: discountValue, // Store the discount as an integer
            code: newPromotion.code,
            validUntil: newPromotion.validUntil,
        };

        try {
            // Call the addPromotion function to send data to the backend
            await addPromotion(promotionData);

            // Show success message and reset input fields
            setConfirmationMessage("Promotion added successfully!");
            setNewPromotion({ title: '', discount: '', code: '', validUntil: '' }); // Clear inputs

            // Hide the confirmation message after a few seconds
            setTimeout(() => setConfirmationMessage(''), 3000);

        } catch (error) {
            console.error("Error adding promotion:", error);
            setError("Failed to add promotion. Please try again.");
        }
    };

    return (
        <div className="promotions-container">
            <h2 className="promotions-title">Manage Promotions</h2>

            {error && <p className="error-message">{error}</p>} {/* Display error message */}

            <div className="add-promotion-section">
                <h3 className="section-subtitle">Add New Promotion</h3>
                <input
                    type="text"
                    placeholder="Promotion Title"
                    value={newPromotion.title}
                    onChange={(e) => setNewPromotion({...newPromotion, title: e.target.value})}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Discount (e.g., 20)"
                    value={newPromotion.discount}
                    onChange={(e) => setNewPromotion({...newPromotion, discount: e.target.value})}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Code"
                    value={newPromotion.code}
                    onChange={(e) => setNewPromotion({...newPromotion, code: e.target.value})}
                    className="input-field"
                />
                <input
                    type="date"
                    value={newPromotion.validUntil}
                    onChange={(e) => setNewPromotion({...newPromotion, validUntil: e.target.value})}
                    className="input-field"
                />
                <button
                    onClick={handleAddPromotion}
                    className="add-button"
                >
                    Add Promotion
                </button>

                {confirmationMessage && (
                    <p className="confirmation-text">{confirmationMessage}</p>
                )}
            </div>
        </div>
    );
}

