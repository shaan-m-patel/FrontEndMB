import axios from 'axios';
import { sanitizeProfileUpdate } from '../lib/cards.mjs';

axios.defaults.withCredentials = true;

const GET_MOVIES_URL = 'http://localhost:9090/get-movies';
const SEARCH_MOVIES_URL = 'http://localhost:9090/api/movies';
const VERIFY_EMAIL_URL = 'http://localhost:9090/Success';

export const fetchBookingsByEmail = async () => {
    const response = await axios.get('/api/bookings');
    return response.data;
};

export const fetchBookings = async (movieName, selectedDate, selectedTime) => {
    try {
        const response = await axios.get('http://localhost:9090/fetchBooking', {
            params: {
                movieName,
                selectedDate,
                selectedTime,
            },
        });

        if (response.data.success) {
            const bookedSeats = response.data.bookedSeats;
            return Array.isArray(bookedSeats) ? bookedSeats : [];
        }
        throw new Error('Failed to fetch booked seats');
    } catch (error) {
        console.error('Error fetching booked seats:', error);
        throw error;
    }
};

export const updatePromotionOptIn = async (optIn) => {
    try {
        const response = await axios.post('/api/profile', sanitizeProfileUpdate({ promotions: optIn }));
        return response.data;
    } catch (error) {
        console.error('Failed to update promotion opt-in status:', error);
        throw error;
    }
};

export const addPromotion = async (promotionData) => {
    try {
        const response = await axios.post('/api/admin/promotions', promotionData);
        return response.data;
    } catch (error) {
        console.error('Failed to add promotion:', error);
        throw error;
    }
};

export const addMovie = async (movieData) => {
    try {
        const response = await axios.post('/api/admin/movies', movieData);
        return response.data;
    } catch (error) {
        console.error('Failed to add movie:', error);
        throw error;
    }
};

export const fetchMovies = async () => {
    const response = await axios.get(GET_MOVIES_URL);
    return response.data;
};

export const searchMovies = async (query) => {
    const response = await axios.get(`${SEARCH_MOVIES_URL}?search=${encodeURIComponent(query)}`);
    return response.data;
};

export const registerUser = async (userData) => {
    try {
        const response = await axios.post('/api/register', {
            name: userData.name,
            email: userData.email,
            password: userData.password,
            billingAddress: userData.billingAddress,
            city: userData.city,
            postalCode: userData.postalCode,
            state: userData.state,
            promotionOptIn: userData.promotionOptIn,
        });
        return response.data;
    } catch (error) {
        console.error('Registration failed:', error);
        throw error;
    }
};

export const verifyEmail = async (token) => {
    try {
        const response = await axios.get(`${VERIFY_EMAIL_URL}?token=${encodeURIComponent(token)}`);
        return response;
    } catch (error) {
        console.error('Email verification failed:', error);
        throw error;
    }
};

export const loginUser = async (email, password, rememberMe) => {
    try {
        const response = await axios.post('/api/auth/login', { email, password, rememberMe });
        return response.data;
    } catch (error) {
        console.error('Login failed');
        throw error;
    }
};

export const fetchUserProfile = async () => {
    try {
        const response = await axios.get('/api/profile');
        return response.data;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

export const sendResetPasswordEmail = async (email) => {
    try {
        const response = await axios.post('/api/auth/forgot-password', { email });
        return response.data;
    } catch (error) {
        console.error('Failed to send reset password email');
        throw error;
    }
};

export const updateUserProfile = async (userData) => {
    try {
        const response = await axios.post('/api/profile', sanitizeProfileUpdate(userData));
        return response.data;
    } catch (error) {
        console.error('Update profile failed:', error);
        throw error;
    }
};

export const resetPassword = async (token, newPassword) => {
    if (!token) {
        throw new Error('A reset token is required.');
    }
    try {
        const response = await axios.post('/api/auth/reset-password', {
            token,
            password: newPassword,
        });
        return response.data;
    } catch (error) {
        console.error('Failed to reset password');
        throw error;
    }
};

export const fetchMovieById = async (id) => {
    try {
        const response = await axios.get(`http://localhost:9090/api/movies/${encodeURIComponent(id)}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch movie by ID:', error);
        throw error;
    }
};
