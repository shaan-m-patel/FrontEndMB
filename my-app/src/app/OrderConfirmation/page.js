'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './page.css';

export default function OrderConfirmation() {
    const router = useRouter();
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const bookingId = new URL(window.location.href).searchParams.get('bookingId');
        if (!bookingId) {
            setError('This page only confirms an order after payment is completed.');
            return;
        }

        const loadBooking = async () => {
            const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
                credentials: 'include',
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.message || 'No paid order was found.');
                return;
            }
            setBooking(data);
        };

        loadBooking().catch(() => {
            setError('No paid order was found.');
        });
    }, []);

    if (error) {
        return <p className="text-center mt-8">{error}</p>;
    }

    if (!booking) {
        return <p>Loading...</p>;
    }

    return (
        <div className="order-confirmation-container">
            <div className="order-card">
                <h2 className="order-title">Order Confirmed!</h2>
                <p className="order-message">Thank you for your purchase. Your order has been successfully placed.</p>

                <div className="order-summary">
                    <h3 className="summary-title">Order Summary</h3>
                    <ul className="summary-list">
                        {(booking.lines || []).map(({ seat, age }) => (
                            <li key={seat} className="summary-item">
                                <span>Seat:</span> <span>{seat} (Age: {age})</span>
                            </li>
                        ))}
                    </ul>
                    <div className="order-number">
                        <span>Total Price:</span> <span>${Number(booking.orderTotal).toFixed(2)}</span>
                    </div>
                </div>

                <div className="user-info">
                    <h3 className="summary-title">User Information</h3>
                    <p>Email: {booking.userEmail}</p>
                    <p>Date of Movie: {booking.movieDate}</p>
                    <p>Time: {booking.movieTime}</p>
                    <p>Movie Name: {booking.movieName}</p>
                </div>

                <p className="confirmation-email">A confirmation email has been sent to your inbox.</p>

                <button className="home-button" onClick={() => router.push('/')}>
                    Back to Home
                </button>
            </div>
        </div>
    );
}
