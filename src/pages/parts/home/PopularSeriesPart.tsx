import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useEffect, useState } from "react";

import {
  TMDBMediaToMediaItemType,
  getMediaPoster,
  getPopularTVSeries,
} from "@/backend/metadata/tmdb";
import { TMDBContentTypes } from "@/backend/metadata/types/tmdb";
import { Button } from "@/components/buttons/Button"; // Import your button component
import { Icons } from "@/components/Icon";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { MediaGrid } from "@/components/media/MediaGrid";
import { WatchedMediaCard } from "@/components/media/WatchedMediaCard";
import { MediaItem } from "@/utils/mediaTypes";

export function PopularSeriesPart() {
  const [popularSeries, setPopularSeries] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1); // Initialize page number
  const [gridRef] = useAutoAnimate<HTMLDivElement>();

  // Fetch popular series based on the current page
  const fetchPopularSeries = async (pageNumber: number) => {
    try {
      const series = await getPopularTVSeries(pageNumber);

      // Map TMDBMovieSearchResult to MediaItem by adding the 'type' property
      const mappedSeries = series.results.map((tv) => ({
        type: TMDBMediaToMediaItemType(TMDBContentTypes.TV),
        id: tv.id.toString(),
        title: tv.name,
        year: new Date(tv.first_air_date).getFullYear(),
        poster: getMediaPoster(tv.poster_path),
      }));

      // Append new series to the existing list
      setPopularSeries((prevSeries) => [...prevSeries, ...mappedSeries]);
    } catch (error) {
      console.error("Error fetching popular series:", error);
      // Handle the error
    }
  };

  // Fetch popular series on component mount
  useEffect(() => {
    fetchPopularSeries(page);
  }, [page]); // Fetch series whenever the page number changes

  const handleLoadMoreClick = () => {
    // Increment the page number when the "Load More" button is clicked
    setPage((prevPage) => prevPage + 1);
  };

  if (popularSeries.length === 0) return null;

  return (
    <div className="text-center">
      <SectionHeading title="Popular Series" icon={Icons.FILM}>
        {/* Add edit button or any other actions if needed */}
      </SectionHeading>
      <MediaGrid ref={gridRef}>
        {popularSeries.map((tv) => (
          <WatchedMediaCard key={tv.id} media={tv} />
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
