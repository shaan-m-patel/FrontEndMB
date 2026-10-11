"use client";
import './page.css';


import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchBookingsByEmail } from "../movieService.js"; // Import the service function

const OrderHistory = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchOrderHistory = async () => {
            try {
                const sessionResponse = await fetch('/api/auth/session', { credentials: 'include' });
                const session = await sessionResponse.json();
                if (!session?.role) {
                    router.push("/login");
                    return;
                }

                const bookingsData = await fetchBookingsByEmail();
                setBookings(bookingsData); // Update state with the fetched bookings
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderHistory();
    }, [router]);

    if (loading) {
        return <div className="text-center mt-8">Loading order history...</div>;
    }

    if (error) {
        return <div className="text-center mt-8 text-red-500">Error: {error}</div>;
    }

    if (bookings.length === 0) {
        return <div className="text-center mt-8">No bookings found.</div>;
    }

    return (
        <div className="container mx-auto mt-8">
            <h1 className="text-2xl font-bold mb-4">Order History</h1>
            <div className="space-y-6">
                {bookings.map((booking) => (
                    <div
                        key={booking._id}
                        className="flex items-center border p-4 rounded-md shadow-sm bg-white hover:shadow-lg transition-shadow duration-300"
                    >
                        {/* Textual Information */}
                        <div className="flex-grow">
                            <h2 className="text-xl font-semibold">{booking.movieName}</h2>
                            <p>
                                <strong>Date:</strong> {booking.selectedDate}
                            </p>
                            <p>
                                <strong>Time:</strong> {booking.selectedTime}
                            </p>
                            <p>
                                <strong>Seats:</strong> {booking.selectedSeats.join(", ")}
                            </p>
                            <p>
                                <strong>Age Categories:</strong>{" "}
                                {Array.from(new Set(Object.values(booking.ageCategories))).join(", ")}
                            </p>
                            <p className="text-gray-600 text-sm">
                                <strong>Booked on:</strong>{" "}
                                {new Date(booking.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Movie Poster */}
                        {booking.posterUrl && (
                            <div className="ml-4">
                                <img
                                    src={booking.posterUrl}
                                    alt={`${booking.movieName} Poster`}
                                    className="w-24 h-36 rounded-md shadow-sm"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrderHistory;

