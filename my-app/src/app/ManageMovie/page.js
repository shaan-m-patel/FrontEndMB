
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./page.css";
import { addMovie } from "../movieService";
import { toAllowedEmbedUrl } from "../../lib/trailerUrl.mjs";

export default function ManageMovies() {
    const router = useRouter();
    const [movies, setMovies] = useState([]);
    const [newMovie, setNewMovie] = useState({
        movieName: "",
        directorName: "",
        yearReleased: "",
        movieRating: "",
        showRoom: "",
        moviePoster: "",
        trailerUrl: "",
        movieLength: "",
        shortDescription: "",
        status: "",
        showDates: "",
        showTimes: "",
        genre: "",
    });
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const checkAdmin = async () => {
            const response = await fetch('/api/auth/session', { credentials: 'include' });
            const session = await response.json().catch(() => ({}));
            if (session?.role !== 'admin') {
                router.push('/login');
            }
        };
        checkAdmin();
    }, [router]);

    const handleAddMovie = async () => {
        // Validate input fields
        if (Object.values(newMovie).some((field) => !field)) {
            setErrorMessage("Please fill in all fields.");
            return;
        }

        if (!toAllowedEmbedUrl(newMovie.trailerUrl)) {
            setErrorMessage("Trailer URL must be a YouTube or Vimeo link.");
            return;
        }

        try {
            const formattedMovie = {
                ...newMovie,
                showDates: newMovie.showDates.split(",").map((date) => new Date(date.trim())),
                showTimes: newMovie.showTimes.split(",").map((time) => time.trim()),
            };

            // Attempt to add the movie
            await addMovie(formattedMovie);

            // Update movies list and UI messages
            setMovies([...movies, { id: movies.length + 1, ...formattedMovie }]);
            setConfirmationMessage("Movie added successfully!");
            setErrorMessage(""); // Clear any error messages

            // Clear the form
            setNewMovie({
                movieName: "",
                directorName: "",
                yearReleased: "",
                movieRating: "",
                showRoom: "",
                moviePoster: "",
                trailerUrl: "",
                movieLength: "",
                shortDescription: "",
                status: "",
                showDates: "",
                showTimes: "",
                genre: "",
            });

            // Clear confirmation message after a delay
            setTimeout(() => setConfirmationMessage(""), 3000);
        } catch (error) {
            // Set a user-friendly error message
            setErrorMessage("Failed to add movie. Ensure no scheduling conflicts and try again.");
        }
    };

    return (
        <div className="manage-movies-container">
            <h2 className="manage-movies-title">Manage Movies</h2>

            <div className="add-movie-section">
                <h3 className="section-subtitle">Add New Movie</h3>

                <input
                    type="text"
                    placeholder="Movie Name"
                    value={newMovie.movieName}
                    onChange={(e) => setNewMovie({ ...newMovie, movieName: e.target.value })}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Director Name"
                    value={newMovie.directorName}
                    onChange={(e) => setNewMovie({ ...newMovie, directorName: e.target.value })}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Year Released"
                    value={newMovie.yearReleased}
                    onChange={(e) => setNewMovie({ ...newMovie, yearReleased: e.target.value })}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Rating"
                    value={newMovie.movieRating}
                    onChange={(e) => setNewMovie({ ...newMovie, movieRating: e.target.value })}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Showroom"
                    value={newMovie.showRoom}
                    onChange={(e) => setNewMovie({ ...newMovie, showRoom: e.target.value })}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Poster URL"
                    value={newMovie.moviePoster}
                    onChange={(e) => setNewMovie({ ...newMovie, moviePoster: e.target.value })}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Trailer URL"
                    value={newMovie.trailerUrl}
                    onChange={(e) => setNewMovie({ ...newMovie, trailerUrl: e.target.value })}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Movie Length"
                    value={newMovie.movieLength}
                    onChange={(e) => setNewMovie({ ...newMovie, movieLength: e.target.value })}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Short Description"
                    value={newMovie.shortDescription}
                    onChange={(e) => setNewMovie({ ...newMovie, shortDescription: e.target.value })}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Movie Status"
                    value={newMovie.status}
                    onChange={(e) => setNewMovie({ ...newMovie, status: e.target.value })}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Show Dates (comma separated)"
                    value={newMovie.showDates}
                    onChange={(e) => setNewMovie({ ...newMovie, showDates: e.target.value })}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Show Times (comma separated)"
                    value={newMovie.showTimes}
                    onChange={(e) => setNewMovie({ ...newMovie, showTimes: e.target.value })}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Genre"
                    value={newMovie.genre}
                    onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
                    className="input-field"
                />
                <button onClick={handleAddMovie} className="add-button">
                    Add Movie
                </button>

                {/* Display confirmation or error messages */}
                {confirmationMessage && (
                    <p className="confirmation-text">{confirmationMessage}</p>
                )}
                {errorMessage && <p className="error-text">{errorMessage}</p>}
            </div>
        </div>
    );
}



