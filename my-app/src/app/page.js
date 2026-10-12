"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from './search/page'; // Adjust the import as necessary
import { fetchMovies, searchMovies } from './movieService';
import { toAllowedEmbedUrl, TRAILER_IFRAME_ALLOW } from '../lib/trailerUrl.mjs';

export default function Home() {
    const router = useRouter(); // Initialize useRouter
    const [currentlyRunning, setCurrentlyRunning] = useState([]);
    const [comingSoon, setComingSoon] = useState([]);
    const [activeSection, setActiveSection] = useState('currentlyRunning');
    const [loading, setLoading] = useState(true);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [error, setError] = useState(''); // Declare the error state

    useEffect(() => {
        const loadMovies = async () => {
            setLoading(true);
            try {
                const movies = await fetchMovies();
                setCurrentlyRunning(movies.currentlyRunning || []);
                setComingSoon(movies.comingSoon || []);
            } catch (error) {
                console.error('Failed to load movies:', error);
            } finally {
                setLoading(false);
            }
        };
        loadMovies();
    }, []);

    const handleSectionChange = (section) => setActiveSection(section);

    const handleSearch = async (query) => {
        if (!query) {
            const allMovies = await fetchMovies();
            setCurrentlyRunning(allMovies.currentlyRunning || []);
            setComingSoon(allMovies.comingSoon || []);
            return;
        }
        try {
            const results = await searchMovies(query);
            setCurrentlyRunning(results.filter(movie => movie.status === 'currentlyRunning'));
            setComingSoon(results.filter(movie => movie.status === 'comingSoon'));
        } catch (error) {
            console.error('Failed to search movies:', error);
        }
    };

    const handleMovieClick = (movie) => setSelectedMovie(movie);
    const closeModal = () => setSelectedMovie(null);

    const handleBookTicket = async (movie) => {
        try {
            // Check if movie ID is valid
            if (!movie || !movie._id) {
                throw new Error('Invalid movie details'); // Throw error if movie details are invalid
            }
            // Navigate to the tickets page with movie details
            await router.push(`/tickets/${movie._id}`); // Use movie ID or any identifier for tickets page
        } catch (error) {
            console.error('Failed to book ticket:', error);
            setError('Failed to book ticket. Please try again.'); // Set error message
        }
    };

    const renderMovies = (movies) => (
        <div className="flex flex-wrap justify-center gap-6">
            {movies.map(movie => (
                <div key={movie._id} className="relative border border-gray-800 rounded-lg shadow-lg p-4 w-64 bg-gray-900 text-center hover:scale-105 transition-transform">
                    <img
                        src={movie.moviePoster}
                        alt={movie.movieName}
                        className="w-full h-64 object-cover rounded-lg mb-4 cursor-pointer"
                        onClick={() => handleMovieClick(movie)}
                    />
                    <h3 className="text-lg font-bold mb-2 text-white">{movie.movieName}</h3>
                    <p className="text-gray-400">{movie.movieRating} ★</p>
                    <button
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        onClick={() => handleBookTicket(movie)} // Handle button click
                    >
                        Book Ticket
                    </button>
                </div>
            ))}
        </div>
    );

    const trailerEmbedUrl = selectedMovie ? toAllowedEmbedUrl(selectedMovie.trailerUrl) : null;

    return (
        <div className="bg-gray-900 text-white min-h-screen">
            <header className="py-8 bg-dark-blue text-center text-4xl font-bold">
                Welcome to the Movie Booking System
            </header>
            <div className="hero-section py-16 text-center">
                <h2 className="text-5xl font-bold">Experience the Best Movies Here</h2>
                <p className="mt-4 text-lg">Book your tickets for the latest blockbusters now!</p>
            </div>
            <div className="container mx-auto p-8">
                <SearchBar onSearch={handleSearch} />
                <div className="my-6 flex justify-center">
                    <button
                        onClick={() => handleSectionChange('currentlyRunning')}
                        className={`mx-2 px-4 py-2 rounded ${activeSection === 'currentlyRunning' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                        Currently Running
                    </button>
                    <button
                        onClick={() => handleSectionChange('comingSoon')}
                        className={`mx-2 px-4 py-2 rounded ${activeSection === 'comingSoon' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                        Coming Soon
                    </button>
                </div>
                <h2 className="text-3xl font-semibold mb-4 text-center">
                    {activeSection === 'currentlyRunning' ? 'Currently Running Movies' : 'Coming Soon Movies'}
                </h2>
                {loading ? (
                    <p className="text-center text-gray-400">Loading movies...</p>
                ) : (
                    currentlyRunning.length === 0 && comingSoon.length === 0 ? (
                        <p className="text-center text-red-500 font-semibold">No Movies Found</p>
                    ) : (
                        renderMovies(activeSection === 'currentlyRunning' ? currentlyRunning : comingSoon)
                    )
                )}
                {selectedMovie && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                        <div className="relative bg-gray-900 p-8 rounded-lg shadow-lg w-full h-full md:w-[70%] md:h-[80%] overflow-auto">
                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 text-2xl font-bold text-gray-500 hover:text-gray-700 bg-gray-700 p-2 rounded-full shadow-md z-10"
                                aria-label="Close"
                            >
                                ✖
                            </button>
                            <div className="relative pt-[56.25%] mb-6">
                                {trailerEmbedUrl ? (
                                    <iframe
                                        src={trailerEmbedUrl}
                                        title={selectedMovie.movieName}
                                        frameBorder="0"
                                        allow={TRAILER_IFRAME_ALLOW}
                                        allowFullScreen
                                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                                    />
                                ) : (
                                    <p className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                        Trailer unavailable.
                                    </p>
                                )}
                            </div>
                            <h2 className="text-3xl font-bold mb-4 text-center">{selectedMovie.movieName}</h2>
                            <div className="text-lg mb-4">
                                <p><strong>Director:</strong> {selectedMovie.directorName}</p>
                                <p><strong>Year Released:</strong> {selectedMovie.yearReleased}</p>
                                <p><strong>Rating:</strong> {selectedMovie.movieRating}</p>
                                <p><strong>Length:</strong> {selectedMovie.movieLength}</p>
                                <p><strong>Description:</strong> {selectedMovie.shortDescription}</p>
                                <p><strong>Genre:</strong> {selectedMovie.genre}</p>
                                <p><strong>Show Room:</strong> {selectedMovie.showRoom}</p>
                                <p><strong>Show Dates:</strong> {selectedMovie.showDates ? selectedMovie.showDates.join(', ') : 'N/A'}</p>
                                <p><strong>Show Times:</strong> {selectedMovie.showTimes ? selectedMovie.showTimes.join(', ') : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
