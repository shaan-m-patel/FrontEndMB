'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '../lib/useSession';

const Header = () => {
    const router = useRouter();
    const session = useSession();
    const userRole = session?.role || null;
    const isLoggedIn = Boolean(userRole);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        localStorage.removeItem('password');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('email');
        localStorage.removeItem('rememberMe');
        window.dispatchEvent(new Event('login'));
        router.push('/login');
    };

    return (
        <header className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <div>
                    {userRole === 'admin' ? (
                        <span className="text-gray-400 text-2xl font-bold cursor-not-allowed">
                            Cinema E-Booking
                        </span>
                    ) : (
                        <Link href="/" className="text-white text-2xl font-bold">
                            Cinema E-Booking
                        </Link>
                    )}
                </div>

                <nav>
                    <ul className="flex space-x-4">
                        <li>
                            <Link
                                href={userRole === 'admin' ? '/admin' : '/'}
                                className="text-white hover:text-gray-300"
                            >
                                Home
                            </Link>
                        </li>
                        {!isLoggedIn ? (
                            <>
                                <li>
                                    <Link href="/login" className="text-white hover:text-gray-300">
                                        Login
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/register" className="text-white hover:text-gray-300">
                                        Register
                                    </Link>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link href="/profile" className="text-white hover:text-gray-300">
                                        Edit Profile
                                    </Link>
                                </li>
                                {userRole !== 'admin' && (
                                    <li>
                                        <Link href="/orderHistory" className="text-white hover:text-gray-300">
                                            Order History
                                        </Link>
                                    </li>
                                )}
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="text-white hover:text-gray-300"
                                    >
                                        Logout
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;
