'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '../movieService';
import Link from 'next/link';
import './page.css';

function safeNextPath(value) {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
        return null;
    }
    return value;
}

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        localStorage.removeItem('password');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('email');
        localStorage.removeItem('rememberMe');
    }, []);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleLogin();
        }
    };

    const handleLogin = async () => {
        try {
            const response = await loginUser(email, password, rememberMe);
            if (!response.role) {
                setError('Login Failed ');
                return;
            }
            window.dispatchEvent(new Event('login'));
            const requested = safeNextPath(new URLSearchParams(window.location.search).get('next'));
            if (response.role === 'admin') {
                router.push('/admin');
                return;
            }
            router.push(requested || '/');
        } catch {
            setError('Login Failed ');
        }
    };

    return (
        <div className="main-content">
            <div className="login-card">
                <h1 className="title">Login</h1>
                {error && <p className="error">{error}</p>}
                <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Email"
                    className="input"
                />
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Password"
                    className="input"
                />
                <label className="remember-me">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                    />
                    Remember Me
                </label>
                <button className="login-button" onClick={handleLogin}>Login</button>
                <Link className="link" href="/ForgotPassword">Forgot Password?</Link>
                <div className="signup-option">
                    <p><strong>Don&apos;t have an account?</strong> <Link href="/register" className="link">Sign up</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
