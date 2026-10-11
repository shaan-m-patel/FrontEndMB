
"use client";

import React, { useState, useEffect } from 'react';
import { fetchMovieById, fetchBookings } from '../../movieService';
import './page.css';
import { useRouter } from 'next/navigation';
import '../../globals.css';

export default function TicketPurchase({ params }) {
    const { id } = params;
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [bookedSeats, setBookedSeats] = useState([]); // Track booked seats
    const [ageCategories, setAgeCategories] = useState({});
    const router = useRouter();

    const seatLayout = [
        ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"],
        ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"],
        ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"],
        ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"],
        ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8"]
    ];

    useEffect(() => {
        const checkSession = async () => {
            const response = await fetch('/api/auth/session', { credentials: 'include' });
            const session = await response.json().catch(() => ({}));
            if (!session?.role) {
                router.push('/login');
            }
        };
        checkSession();
    }, [router]);


    useEffect(() => {
        const fetchMovie = async () => {
            if (!id) return;
            try {
                const movie = await fetchMovieById(id);
                setSelectedMovie(movie);
            } catch (error) {
                console.error("Error fetching movie:", error);
            }
        };

        fetchMovie();
    }, [id]);

    useEffect(() => {
        if (selectedMovie && selectedDate && selectedTime) {
            const fetchBookedSeats = async () => {
                try {
                    const bookings = await fetchBookings(selectedMovie.movieName, selectedDate, selectedTime);
                    setBookedSeats(bookings); // Update booked seats
                } catch (error) {
                    console.error("Error fetching bookings:", error);
                }
            };

            fetchBookedSeats();
        }
    }, [selectedMovie, selectedDate, selectedTime]);

    const handleDateChange = (event) => setSelectedDate(event.target.value);
    const handleTimeChange = (event) => setSelectedTime(event.target.value);

    const toggleSeatSelection = (seat) => {
        if (bookedSeats.includes(seat)) return; // Prevent selecting booked seats
        if (selectedSeats.includes(seat)) {
            setSelectedSeats(prevSelectedSeats => prevSelectedSeats.filter(s => s !== seat));
            setAgeCategories(prev => {
                const updated = { ...prev };
                delete updated[seat];
                return updated;
            });
        } else {
            setSelectedSeats([...selectedSeats, seat]);
        }
    };

    const handleAgeChange = (seat, age) => {
        setAgeCategories(prev => ({ ...prev, [seat]: age }));
    };


    const handleConfirmBooking = async () => {
        const response = await fetch('/api/auth/session', { credentials: 'include' });
        const session = await response.json().catch(() => ({}));
        if (!session?.role) {
            alert('Please log in again.');
            router.push('/login');
            return;
        }

        if (!selectedDate || !selectedTime || selectedSeats.length === 0 || Object.keys(ageCategories).length !== selectedSeats.length) {
            alert('Please complete all selections before proceeding.');
            return;
        }

        try {
            const orderData = new URLSearchParams({
                movieName: selectedMovie.movieName,
                selectedDate,
                selectedTime,
                selectedSeats: JSON.stringify(selectedSeats),
                ageCategories: JSON.stringify(ageCategories),
            }).toString();

            router.push(`/OrderSummary?${orderData}`);
        } catch (error) {
            console.error("Error navigating to OrderSummary:", error);
            alert('An error occurred while navigating to the order summary.');
        }
    };


    return (
        <div className="ticket-purchase-container">
            {selectedMovie ? (
                <div className="ticket-purchase-content">
                    <h1 className="movie-title">{selectedMovie.movieName}</h1>

                    <label htmlFor="showDate">Select a Date:</label>
                    <select id="showDate" value={selectedDate} onChange={handleDateChange}>
                        <option value="">--Select Date--</option>
                        {selectedMovie.showDates.map((date, index) => (
                            <option key={index} value={date}>{date}</option>
                        ))}
                    </select>

                    <label htmlFor="showTime">Select a Time:</label>
                    <select id="showTime" value={selectedTime} onChange={handleTimeChange} disabled={!selectedDate}>
                        <option value="">--Select Time--</option>
                        {selectedMovie.showTimes.map((time, index) => (
                            <option key={index} value={time}>{time}</option>
                        ))}
                    </select>

                    <h2 className="label">Select Seats:</h2>
                    <div className="seats-grid">
                        {seatLayout.map((row, rowIndex) => (
                            <div key={rowIndex} className="seat-row">
                                {row.map(seat => (
                                    <button
                                        key={seat}
                                        className={`seat ${selectedSeats.includes(seat) ? 'selected' : ''} ${bookedSeats.includes(seat) ? 'booked' : ''}`}
                                        onClick={() => toggleSeatSelection(seat)}
                                        disabled={bookedSeats.includes(seat)} // Disable button if booked
                                    >
                                        {seat}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>

                    {selectedSeats.length > 0 && (
                        <div className="age-inputs">
                            <h3>Age Categories for Selected Seats</h3>
                            {selectedSeats.map(seat => (
                                <div key={seat} className="age-category">
                                    <label htmlFor={`age-${seat}`}>Seat {seat}: </label>
                                    <select
                                        id={`age-${seat}`}
                                        value={ageCategories[seat] || ""}
                                        onChange={(e) => handleAgeChange(seat, e.target.value)}
                                    >
                                        <option value="">--Select Age--</option>
                                        <option value="Adult">Adult</option>
                                        <option value="Child">Child</option>
                                        <option value="Senior">Senior</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        className="confirm-button"
                        onClick={handleConfirmBooking}
                        disabled={!selectedDate || !selectedTime || selectedSeats.length === 0 || Object.keys(ageCategories).length !== selectedSeats.length}
                    >
                        Confirm Booking
                    </button>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

