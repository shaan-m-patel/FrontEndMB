'use client';

import React, { useEffect, useState } from 'react';
import './page.css';
import { fetchUserProfile, updateUserProfile } from '../movieService';
import { paymentProcessorConfigured, tokenizeCard } from '../../lib/stripeClient';

export default function EditProfile() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        currentPassword: '',
        password: '',
        confirmPassword: '',
        billingAddress: '',
        city: '',
        postalCode: '',
        state: '',
        creditCards: [],
        promotions: false,
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [cardEntry, setCardEntry] = useState({ number: '', expiry: '', cvc: '' });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await fetchUserProfile();
                setFormData({
                    name: userData.name || '',
                    email: userData.email || '',
                    currentPassword: '',
                    password: '',
                    confirmPassword: '',
                    billingAddress: userData.billingAddress || '',
                    city: userData.city || '',
                    postalCode: userData.postalCode || '',
                    state: userData.state || '',
                    creditCards: (userData.creditCards || []).map((card) => ({
                        cardLast4: card.cardLast4,
                        expiryDate: card.expiryDate,
                        paymentMethodId: card.paymentMethodId,
                    })),
                    promotions: userData.promotionOptIn || false,
                });
            } catch (fetchError) {
                console.error('Error fetching user data:', fetchError);
                setError('Failed to fetch user data.');
            }
        };

        fetchUserData();
    }, []);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleCreditCardChange = (event) => {
        const { name, value } = event.target;
        setCardEntry((current) => ({ ...current, [name]: value }));
    };

    const addCreditCard = async () => {
        if (!paymentProcessorConfigured()) {
            setError('Card entry is unavailable until the payment processor is configured.');
            return;
        }
        if (formData.creditCards.length >= 3) {
            setError('You cannot add more than 3 credit cards.');
            return;
        }

        try {
            const token = await tokenizeCard(cardEntry);
            setFormData((current) => ({
                ...current,
                creditCards: [
                    ...current.creditCards,
                    {
                        cardLast4: token.cardLast4,
                        expiryDate: token.expiryDate,
                        paymentMethodId: token.paymentMethodId,
                    },
                ],
            }));
            setCardEntry({ number: '', expiry: '', cvc: '' });
            setError('');
        } catch (cardError) {
            setError(cardError.message || 'The payment processor rejected the card.');
        }
    };

    const removeCreditCard = (index) => {
        setFormData((current) => ({
            ...current,
            creditCards: current.creditCards.filter((_, cardIndex) => cardIndex !== index),
        }));
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const { password, confirmPassword, currentPassword } = formData;

        if (password && confirmPassword && password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password && currentPassword === '') {
            setError('Please provide your current password to change your password.');
            return;
        }

        try {
            await updateUserProfile({
                name: formData.name,
                billingAddress: formData.billingAddress,
                city: formData.city,
                postalCode: formData.postalCode,
                state: formData.state,
                promotions: formData.promotions,
                currentPassword: formData.currentPassword,
                password: formData.password,
                creditCards: formData.creditCards.map((card) => ({
                    cardLast4: card.cardLast4,
                    expiryDate: card.expiryDate,
                    paymentMethodId: card.paymentMethodId,
                })),
            });
            setSuccess('Profile updated successfully!');
            setError('');
        } catch (updateError) {
            setError(`Failed to update profile: ${updateError.response?.data?.message || updateError.message}`);
        }
    };

    return (
        <div className="edit-profile-container">
            <div className="edit-profile-card">
                <h2 className="edit-profile-title">Edit Profile</h2>
                <form onSubmit={handleSubmit}>
                    <div className="section">
                        <h3 className="section-title">User Information</h3>
                        <div className="form-group">
                            <label htmlFor="name">Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input type="email" id="email" name="email" value={formData.email} readOnly />
                        </div>
                        <div className="form-group">
                            <label htmlFor="currentPassword">Current Password</label>
                            <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">New Password</label>
                            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="section">
                        <h3 className="section-title">Billing Information</h3>
                        <div className="form-group">
                            <label htmlFor="billingAddress">Billing Address</label>
                            <input
                                type="text"
                                id="billingAddress"
                                name="billingAddress"
                                value={formData.billingAddress}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="city">City</label>
                            <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="postalCode">Postal Code</label>
                            <input
                                type="text"
                                id="postalCode"
                                name="postalCode"
                                value={formData.postalCode}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="state">State</label>
                            <input type="text" id="state" name="state" value={formData.state} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="section">
                        <h3 className="section-title">Payment Methods</h3>
                        <p>Cards are tokenized by the payment processor. The security code is not stored.</p>
                        {formData.creditCards.map((card, index) => (
                            <div key={`${card.paymentMethodId || card.cardLast4}-${index}`} className="credit-card-display">
                                <p>Card {index + 1}: **** **** **** {card.cardLast4 || '****'}</p>
                                <p>Expiry Date: {card.expiryDate || 'saved'}</p>
                                <button type="button" className="remove-card-button" onClick={() => removeCreditCard(index)}>
                                    Remove
                                </button>
                            </div>
                        ))}

                        {formData.creditCards.length < 3 && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="cardNumber">Credit Card Number</label>
                                    <input
                                        type="text"
                                        id="cardNumber"
                                        name="number"
                                        value={cardEntry.number}
                                        onChange={handleCreditCardChange}
                                        autoComplete="cc-number"
                                        maxLength={19}
                                    />
                                </div>
                                <div className="flex-row">
                                    <div className="form-group half-width">
                                        <label htmlFor="expiryDate">Expiry Date</label>
                                        <input
                                            type="text"
                                            id="expiryDate"
                                            name="expiry"
                                            value={cardEntry.expiry}
                                            onChange={handleCreditCardChange}
                                            placeholder="MM/YY"
                                            autoComplete="cc-exp"
                                        />
                                    </div>
                                    <div className="form-group half-width">
                                        <label htmlFor="cvc">Security Code</label>
                                        <input
                                            type="password"
                                            id="cvc"
                                            name="cvc"
                                            value={cardEntry.cvc}
                                            onChange={handleCreditCardChange}
                                            autoComplete="cc-csc"
                                        />
                                    </div>
                                </div>
                                <button type="button" className="add-card-button" onClick={addCreditCard}>
                                    Add Payment Method
                                </button>
                            </>
                        )}
                        {formData.creditCards.length >= 3 && <p>You can only add up to 3 credit cards.</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="promotions">Opt-in for Promotions</label>
                        <input
                            type="checkbox"
                            id="promotions"
                            name="promotions"
                            checked={formData.promotions}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        {error && <p className="error-message">{error}</p>}
                        {success && <p className="success-message">{success}</p>}
                    </div>
                    <div className="form-group">
                        <button type="submit" className="submit-button">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
