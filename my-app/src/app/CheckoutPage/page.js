'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserProfile, updateUserProfile } from '../movieService';
import { readSelection } from '../../lib/selection';
import { paymentProcessorConfigured, tokenizeCard } from '../../lib/stripeClient';
import './page.css';

export default function CheckoutPage() {
    const router = useRouter();
    const [selection, setSelection] = useState(null);
    const [quote, setQuote] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCardIndex, setSelectedCardIndex] = useState(null);
    const [cardEntry, setCardEntry] = useState({ number: '', expiry: '', cvc: '' });
    const [creditCardMessage, setCreditCardMessage] = useState('');
    const [cardMessageType, setCardMessageType] = useState('');
    const [promotionCode, setPromotionCode] = useState('');
    const [appliedCode, setAppliedCode] = useState('');
    const [promotionMessage, setPromotionMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        setSelection(readSelection(new URL(window.location.href).searchParams));
    }, []);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profile = await fetchUserProfile();
                setUserProfile(profile);
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
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
                    promotionCode: appliedCode || undefined,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || 'Unable to price this order');
            }
            if (!cancelled) {
                setQuote(data);
            }
        };
        loadQuote().catch((error) => {
            if (!cancelled) {
                setPromotionMessage(error.message);
                setMessageType('error');
            }
        });
        return () => {
            cancelled = true;
        };
    }, [selection, appliedCode]);

    const savedCards = (userProfile?.creditCards || []).filter((card) => card.paymentMethodId);

    const handleCreditCardChange = (event) => {
        const { name, value } = event.target;
        setCardEntry((current) => ({ ...current, [name]: value }));
    };

    const addCreditCard = async () => {
        if (!paymentProcessorConfigured()) {
            setCreditCardMessage('Card entry is unavailable until the payment processor is configured.');
            setCardMessageType('error');
            return;
        }
        if (!userProfile) {
            setCreditCardMessage('Sign in again before saving a card.');
            setCardMessageType('error');
            return;
        }
        if (userProfile.creditCards.length >= 3) {
            setCreditCardMessage('You cannot add more than 3 credit cards.');
            setCardMessageType('error');
            return;
        }

        try {
            const token = await tokenizeCard(cardEntry);
            const updatedCards = [
                ...(userProfile.creditCards || []),
                {
                    cardLast4: token.cardLast4,
                    expiryDate: token.expiryDate,
                    paymentMethodId: token.paymentMethodId,
                },
            ];
            await updateUserProfile({
                ...userProfile,
                creditCards: updatedCards,
            });
            setUserProfile((current) => ({ ...current, creditCards: updatedCards }));
            setCardEntry({ number: '', expiry: '', cvc: '' });
            setCreditCardMessage('Card saved with the payment processor.');
            setCardMessageType('success');
        } catch (error) {
            setCreditCardMessage(error.message || 'Failed to add credit card.');
            setCardMessageType('error');
        }
    };

    const handleApplyPromotion = async () => {
        if (appliedCode) {
            return;
        }
        const response = await fetch('/api/promotions/validate', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: promotionCode }),
        });
        const data = await response.json().catch(() => ({ applicable: false }));
        if (!data.applicable) {
            setPromotionMessage('Invalid promotion code.');
            setMessageType('error');
            return;
        }
        setAppliedCode(promotionCode.trim());
        setPromotionMessage('Promotion applied.');
        setMessageType('success');
    };

    const handleCheckout = async () => {
        if (!selection || !quote || paying) {
            return;
        }
        setPaying(true);
        try {
            let paymentMethodId = selectedCardIndex !== null
                ? savedCards[selectedCardIndex]?.paymentMethodId
                : '';
            if (!paymentMethodId) {
                const token = await tokenizeCard(cardEntry);
                paymentMethodId = token.paymentMethodId;
                setCardEntry({ number: '', expiry: '', cvc: '' });
            }

            const response = await fetch('/api/checkout/pay', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    movieName: selection.movieName,
                    selectedDate: selection.selectedDate,
                    selectedTime: selection.selectedTime,
                    selectedSeats: selection.selectedSeats,
                    ageCategories: selection.ageCategories,
                    promotionCode: appliedCode || undefined,
                    paymentMethodId,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.bookingId) {
                throw new Error(data.message || 'Payment was not completed');
            }
            router.push(`/OrderConfirmation?bookingId=${encodeURIComponent(data.bookingId)}`);
        } catch (error) {
            alert(error.message || 'Please complete payment before continuing.');
        } finally {
            setPaying(false);
        }
    };

    return (
        <div className="checkout-container">
            <h2 className="checkout-title">Checkout</h2>
            <p className="checkout-subtitle">Confirm your payment details below.</p>

            {quote && (
                <div className="movie-details">
                    <h3>Movie: {selection?.movieName}</h3>
                    <p><strong>Date:</strong> {selection?.selectedDate}</p>
                    <p><strong>Time:</strong> {selection?.selectedTime}</p>
                    <h4>Seats Selected:</h4>
                    <ul className="seats-list">
                        {quote.lines.map((ticket) => (
                            <li key={ticket.seat}>{ticket.seat} ({ticket.age}): ${ticket.price.toFixed(2)}</li>
                        ))}
                    </ul>
                </div>
            )}

            {loading ? (
                <p>Loading payment information...</p>
            ) : userProfile ? (
                <div className="credit-card-info">
                    <h3>Select a Credit Card</h3>
                    {savedCards.length > 0 ? (
                        savedCards.map((card, index) => (
                            <div key={card.paymentMethodId} className="credit-card">
                                <input
                                    type="radio"
                                    name="selectedCard"
                                    id={`card-${index}`}
                                    checked={selectedCardIndex === index}
                                    onChange={() => setSelectedCardIndex(index)}
                                />
                                <label htmlFor={`card-${index}`}>
                                    <strong>Card Ending:</strong> **** **** **** {card.cardLast4}{' '}
                                    <strong>Expiry:</strong> {card.expiryDate}
                                </label>
                            </div>
                        ))
                    ) : (
                        <p>No saved payment method. Enter a card below to pay through the payment processor.</p>
                    )}
                </div>
            ) : (
                <p>No user profile found.</p>
            )}

            {userProfile && userProfile.creditCards.length < 3 && (
                <div className="credit-card-form">
                    <h3>Pay with a Card</h3>
                    <p>Card details are sent only to the payment processor. We keep a token and the last four digits.</p>
                    <div className="input-field">
                        <label htmlFor="cardNumber">Card Number</label>
                        <input
                            type="text"
                            name="number"
                            id="cardNumber"
                            value={cardEntry.number}
                            onChange={handleCreditCardChange}
                            autoComplete="cc-number"
                        />
                    </div>
                    <div className="input-field">
                        <label htmlFor="expiryDate">Expiry Date (MM/YY)</label>
                        <input
                            type="text"
                            name="expiry"
                            id="expiryDate"
                            value={cardEntry.expiry}
                            onChange={handleCreditCardChange}
                            autoComplete="cc-exp"
                        />
                    </div>
                    <div className="input-field">
                        <label htmlFor="cvc">Security Code</label>
                        <input
                            type="password"
                            name="cvc"
                            id="cvc"
                            value={cardEntry.cvc}
                            onChange={handleCreditCardChange}
                            autoComplete="cc-csc"
                        />
                    </div>
                    <button type="button" onClick={addCreditCard}>Save Card</button>
                    {creditCardMessage && (
                        <p className={`credit-card-message ${cardMessageType === 'success' ? 'success' : 'error'}`}>
                            {creditCardMessage}
                        </p>
                    )}
                </div>
            )}

            <div className="promotion-section">
                <h3>Enter Promotion Code</h3>
                <input
                    type="text"
                    value={promotionCode}
                    onChange={(event) => setPromotionCode(event.target.value)}
                    placeholder="Enter promotion code"
                    disabled={Boolean(appliedCode)}
                />
                <button type="button" onClick={handleApplyPromotion} disabled={Boolean(appliedCode)}>
                    Apply Promotion
                </button>
                {promotionMessage && (
                    <p className={`promotion-message ${messageType === 'success' ? 'success' : 'error'}`}>
                        {promotionMessage}
                    </p>
                )}
            </div>

            <div className="checkout-buttons">
                <button onClick={handleCheckout} className="checkout-button" disabled={paying || !quote}>
                    {paying ? 'Processing Payment...' : 'Proceed to Payment'}
                </button>
            </div>

            {quote && (
                <div className="order-total">
                    <p><strong>Total: </strong>${quote.total.toFixed(2)}</p>
                </div>
            )}
        </div>
    );
}
