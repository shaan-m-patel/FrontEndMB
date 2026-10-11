'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '../movieService';

export default function ResetForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(token ? '' : 'Open the reset link from your email. A reset token is required.');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!token) {
            setError('A reset token is required.');
            return;
        }
        if (!newPassword || !confirmPassword) {
            setError('Please fill out all fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setError('');
        try {
            await resetPassword(token, newPassword);
            setSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                router.push('/login');
            }, 1500);
        } catch (resetError) {
            const message = resetError.response?.data?.message || 'Failed to change password. Please request a new reset link.';
            setError(message);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="w-full max-w-xs">
                <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <h2 className="text-center text-xl font-bold mb-4 text-black">Reset Password</h2>
                    {error && <p className="text-red-500 text-xs italic">{error}</p>}
                    {success && <p className="text-green-500 text-xs italic">Password changed successfully!</p>}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-password">
                            New Password
                        </label>
                        <input
                            id="new-password"
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                            disabled={!token}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password">
                            Confirm Password
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            required
                            disabled={!token}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={!token}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                        >
                            Change Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
