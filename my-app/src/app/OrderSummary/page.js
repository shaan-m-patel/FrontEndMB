'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readSelection, selectionQuery } from '../../lib/selection';

export default function OrderSummary() {
    const router = useRouter();
    const [selection, setSelection] = useState(null);
    const [quote, setQuote] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const params = new URL(window.location.href).searchParams;
        setSelection(readSelection(params));
    }, []);

    useEffect(() => {
        if (!selection || selection.selectedSeats.length === 0) {
            return undefined;
        }
        let cancelled = false;
        const loadQuote = async () => {
            const response = await fetch('/api/checkout/quote', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedSeats: selection.selectedSeats,
                    ageCategories: selection.ageCategories,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || 'Unable to price these tickets');
            }
            if (!cancelled) {
                setQuote(data);
                setError('');
            }
        };
        loadQuote().catch((quoteError) => {
            if (!cancelled) {
                setError(quoteError.message);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [selection]);

    const handleDeleteTicket = (seat) => {
        setQuote(null);
        setSelection((current) => {
            const ageCategories = { ...current.ageCategories };
            delete ageCategories[seat];
            return {
                ...current,
                selectedSeats: current.selectedSeats.filter((selected) => selected !== seat),
                ageCategories,
            };
        });
    };

    const handleConfirmOrder = () => {
        if (!selection || !quote) {
            return;
        }
        router.push(`/CheckoutPage?${selectionQuery(selection)}`);
    };

    if (!selection) {
        return <div className="flex justify-center items-center min-h-screen bg-gray-100 text-black">Loading...</div>;
    }

    const lines = quote?.lines || [];

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 text-black">
            <div className="w-full max-w-4xl bg-white shadow-lg rounded p-6">
                <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <table className="w-full border-collapse mb-4">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border px-4 py-2 text-left">Seat</th>
                            <th className="border px-4 py-2 text-left">Age Category</th>
                            <th className="border px-4 py-2 text-left">Price</th>
                            <th className="border px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map(({ seat, age, price }) => (
                            <tr key={seat} className="border-b">
                                <td className="border px-4 py-2">{seat}</td>
                                <td className="border px-4 py-2">{age}</td>
                                <td className="border px-4 py-2">${price.toFixed(2)}</td>
                                <td className="border px-4 py-2">
                                    <button
                                        onClick={() => handleDeleteTicket(seat)}
                                        className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Order Total:</span>
                    <span className="text-lg font-semibold">
                        {quote ? `$${quote.total.toFixed(2)}` : 'Pricing...'}
                    </span>
                </div>
                <div className="flex space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
                    >
                        Edit Purchase
                    </button>
                    <button
                        onClick={handleConfirmOrder}
                        disabled={!quote}
                        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        Confirm and Checkout
                    </button>
                </div>
            </div>
        </div>
    );
}
