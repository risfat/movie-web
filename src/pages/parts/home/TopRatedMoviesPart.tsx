// Import necessary dependencies
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useEffect, useState } from "react";

import {
  TMDBMediaToMediaItemType,
  getMediaPoster,
  getTopRatedMovies,
} from "@/backend/metadata/tmdb";
import { TMDBContentTypes } from "@/backend/metadata/types/tmdb";
import { Button } from "@/components/buttons/Button"; // Import your button component
import { Icons } from "@/components/Icon";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { MediaGrid } from "@/components/media/MediaGrid";
import { WatchedMediaCard } from "@/components/media/WatchedMediaCard";
import { MediaItem } from "@/utils/mediaTypes";

export function TopRatedMoviesPart() {
  const [latestMovies, setTopRatedMovies] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1); // Initialize page number
  const [gridRef] = useAutoAnimate<HTMLDivElement>();

  // Fetch latest movies based on the current page
  const fetchTopRatedMovies = async (pageNumber: number) => {
    try {
      const movies = await getTopRatedMovies(pageNumber);

      // Map TMDBMovieSearchResult to MediaItem by adding the 'type' property
      const mappedMovies = movies.results.map((movie) => ({
        type: TMDBMediaToMediaItemType(TMDBContentTypes.MOVIE),
        id: movie.id.toString(),
        title: movie.title,
        year: new Date(movie.release_date).getFullYear(),
        poster: getMediaPoster(movie.poster_path),
      }));

      // Append new movies to the existing list
      setTopRatedMovies((prevMovies) => [...prevMovies, ...mappedMovies]);
    } catch (error) {
      console.error("Error fetching latest movies:", error);
      // Handle the error
    }
  };

  // Fetch latest movies on component mount
  useEffect(() => {
    fetchTopRatedMovies(page);
  }, [page]); // Fetch movies whenever the page number changes

  const handleLoadMoreClick = () => {
    // Increment the page number when the "Load More" button is clicked
    setPage((prevPage) => prevPage + 1);
  };

  if (latestMovies.length === 0) return null;

  return (
    <div className="text-center">
      <SectionHeading title="Top Rated Movies" icon={Icons.FILM} />
      <MediaGrid ref={gridRef}>
        {latestMovies.map((movie) => (
          <WatchedMediaCard key={movie.id} media={movie} />
        ))}
      </MediaGrid>
      <div style={{ display: "inline-block" }}>
        <Button className="w-auto" theme="purple" onClick={handleLoadMoreClick}>
          Load More
        </Button>
      </div>
    </div>
  );
}
