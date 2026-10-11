// app/movies/[id]/page.js

"use client";

import { useRouter } from 'next/navigation';
import './page.css';
import { toAllowedEmbedUrl, TRAILER_IFRAME_ALLOW } from '../../../lib/trailerUrl.mjs';

export default function MovieDetails() {
  const router = useRouter();
  const { id } = router.query; // Fetch the movie ID from the URL

  // Temporary movie data, replace this with actual API call
  const movieDetails = {
    1: {
      title: 'Inception',
      description: 'A skilled thief, the absolute best in the dangerous art of extraction...',
      trailerUrl: 'https://www.youtube.com/embed/YoHD9XEInc0',
      poster: '/images/inception.jpg',
    },
    2: {
      title: 'Interstellar',
      description: 'A team of explorers travel through a wormhole in space in an attempt to...',
      trailerUrl: 'https://www.youtube.com/embed/zSWdZVtXT7E',
      poster: '/images/interstellar.jpg',
    },
  };

  // Fetch the movie data based on the ID (for now, using local data)
  const movie = movieDetails[id];
  const trailerEmbedUrl = movie ? toAllowedEmbedUrl(movie.trailerUrl) : null;

  if (!movie) return <p>Movie not found!</p>;

  return (
    <div className="movie-details-container">
      <h1 className="movie-title">{movie.title}</h1>
      <img className="movie-poster" src={movie.poster} alt={`${movie.title} Poster`} />
      <p className="movie-description">{movie.description}</p>

      {/* Movie Trailer */}
      <div className="trailer-container">
        {trailerEmbedUrl && (
          <iframe
            src={trailerEmbedUrl}
            title="Movie Trailer"
            frameBorder="0"
            allow={TRAILER_IFRAME_ALLOW}
            allowFullScreen
          ></iframe>
        )}
      </div>

      <button className="book-button">
        Book Now
      </button>
    </div>
  );
}
