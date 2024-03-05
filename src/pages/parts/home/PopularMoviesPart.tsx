import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useEffect, useState } from "react";

import {
  TMDBMediaToMediaItemType,
  getMediaPoster,
  getPopularMovies,
} from "@/backend/metadata/tmdb";
import { Button } from "@/components/buttons/Button";
import { Icons } from "@/components/Icon";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { MediaGrid } from "@/components/media/MediaGrid";
import { WatchedMediaCard } from "@/components/media/WatchedMediaCard";
import { MediaItem } from "@/utils/mediaTypes";

import { TMDBContentTypes } from "../../../backend/metadata/types/tmdb";

export function PopularMoviesPart() {
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1); // Initialize page number
  const [gridRef] = useAutoAnimate<HTMLDivElement>();

  // Fetch popular movies based on the current page
  const fetchPopularMovies = async (pageNumber: number) => {
    try {
      const popularMoviesResponse = await getPopularMovies(pageNumber);

      const mappedMovies = popularMoviesResponse.results.map((movie) => ({
        type: TMDBMediaToMediaItemType(TMDBContentTypes.MOVIE),
        id: movie.id.toString(),
        title: movie.title,
        year: new Date(movie.release_date).getFullYear(),
        poster: getMediaPoster(movie.poster_path),
      }));

      // Append new movies to the existing list
      setPopularMovies((prevMovies) => [...prevMovies, ...mappedMovies]);
    } catch (error) {
      console.error("Error fetching popular movies:", error);
      // Handle the error
    }
  };

  // Fetch popular movies on component mount
  useEffect(() => {
    fetchPopularMovies(page);
  }, [page]); // Fetch movies whenever the page number changes

  const handleLoadMoreClick = () => {
    // Increment the page number when the "Load More" button is clicked
    setPage((prevPage) => prevPage + 1);
  };

  if (popularMovies.length === 0) return null;

  return (
    <div className="text-center">
      <SectionHeading title="Popular Movies" icon={Icons.FILM} />
      <MediaGrid ref={gridRef}>
        {popularMovies.map((movie) => (
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
