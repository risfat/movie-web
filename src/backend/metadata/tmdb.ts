import slugify from "slugify";

import { conf } from "@/setup/config";
import { MediaItem } from "@/utils/mediaTypes";

import { MWMediaMeta, MWMediaType, MWSeasonMeta } from "./types/mw";
import {
  ExternalIdMovieSearchResult,
  TMDBContentTypes,
  TMDBEpisodeShort,
  TMDBMediaResult,
  TMDBMovieData,
  TMDBMovieListResponse,
  TMDBMovieSearchResult,
  TMDBSearchResult,
  TMDBSeason,
  TMDBSeasonMetaResult,
  TMDBShowData,
  TMDBShowSearchResult,
  TMDBTVSeriesListResponse,
} from "./types/tmdb";
import { mwFetch } from "../helpers/fetch";

export function mediaTypeToTMDB(type: MWMediaType): TMDBContentTypes {
  if (type === MWMediaType.MOVIE) return TMDBContentTypes.MOVIE;
  if (type === MWMediaType.SERIES) return TMDBContentTypes.TV;
  throw new Error("unsupported type");
}

export function mediaItemTypeToMediaType(type: MediaItem["type"]): MWMediaType {
  if (type === "movie") return MWMediaType.MOVIE;
  if (type === "show") return MWMediaType.SERIES;
  throw new Error("unsupported type");
}

export function TMDBMediaToMediaType(type: TMDBContentTypes): MWMediaType {
  if (type === TMDBContentTypes.MOVIE) return MWMediaType.MOVIE;
  if (type === TMDBContentTypes.TV) return MWMediaType.SERIES;
  throw new Error("unsupported type");
}

export function TMDBMediaToMediaItemType(
  type: TMDBContentTypes,
): MediaItem["type"] {
  if (type === TMDBContentTypes.MOVIE) return "movie";
  if (type === TMDBContentTypes.TV) return "show";
  throw new Error("unsupported type");
}

export function formatTMDBMeta(
  media: TMDBMediaResult,
  season?: TMDBSeasonMetaResult,
): MWMediaMeta {
  const type = TMDBMediaToMediaType(media.object_type);
  let seasons: undefined | MWSeasonMeta[];
  if (type === MWMediaType.SERIES) {
    seasons = media.seasons
      ?.sort((a, b) => a.season_number - b.season_number)
      .map(
        (v): MWSeasonMeta => ({
          title: v.title,
          id: v.id.toString(),
          number: v.season_number,
        }),
      );
  }

  return {
    title: media.title,
    id: media.id.toString(),
    year: media.original_release_date?.getFullYear()?.toString(),
    poster: media.poster,
    type,
    seasons: seasons as any,
    seasonData: season
      ? {
          id: season.id.toString(),
          number: season.season_number,
          title: season.title,
          episodes: season.episodes
            .sort((a, b) => a.episode_number - b.episode_number)
            .map((v) => ({
              id: v.id.toString(),
              number: v.episode_number,
              title: v.title,
              air_date: v.air_date,
            })),
        }
      : (undefined as any),
  };
}

export function formatTMDBMetaToMediaItem(media: TMDBMediaResult): MediaItem {
  const type = TMDBMediaToMediaItemType(media.object_type);

  return {
    title: media.title,
    id: media.id.toString(),
    year: media.original_release_date?.getFullYear() ?? 0,
    release_date: media.original_release_date,
    poster: media.poster,
    type,
  };
}

export function TMDBIdToUrlId(
  type: MWMediaType,
  tmdbId: string,
  title: string,
) {
  return [
    "tmdb",
    mediaTypeToTMDB(type),
    tmdbId,
    slugify(title, { lower: true, strict: true }),
  ].join("-");
}

export function TMDBMediaToId(media: MWMediaMeta): string {
  return TMDBIdToUrlId(media.type, media.id, media.title);
}

export function mediaItemToId(media: MediaItem): string {
  return TMDBIdToUrlId(
    mediaItemTypeToMediaType(media.type),
    media.id,
    media.title,
  );
}

export function decodeTMDBId(
  paramId: string,
): { id: string; type: MWMediaType } | null {
  const [prefix, type, id] = paramId.split("-", 3);
  if (prefix !== "tmdb") return null;
  let mediaType;
  try {
    mediaType = TMDBMediaToMediaType(type as TMDBContentTypes);
  } catch {
    return null;
  }
  return {
    type: mediaType,
    id,
  };
}

const tmdbBaseUrl1 = "https://api.themoviedb.org/3";
const tmdbBaseUrl2 = "https://api.tmdb.org/3";

const apiKey = conf().TMDB_READ_API_KEY;

const tmdbHeaders = {
  accept: "application/json",
  Authorization: `Bearer ${apiKey}`,
};

async function get<T>(url: string, params?: object): Promise<T> {
  if (!apiKey) throw new Error("TMDB API key not set");
  try {
    return await mwFetch<T>(encodeURI(url), {
      headers: tmdbHeaders,
      baseURL: tmdbBaseUrl1,
      params: {
        ...params,
      },
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    return mwFetch<T>(encodeURI(url), {
      headers: tmdbHeaders,
      baseURL: tmdbBaseUrl2,
      params: {
        ...params,
      },
      signal: AbortSignal.timeout(30000),
    });
  }
}

export async function multiSearch(
  query: string,
): Promise<(TMDBMovieSearchResult | TMDBShowSearchResult)[]> {
  const data = await get<TMDBSearchResult>("search/multi", {
    query,
    include_adult: false,
    language: "en-US",
    page: 1,
  });
  // filter out results that aren't movies or shows
  const results = data.results.filter(
    (r) =>
      r.media_type === TMDBContentTypes.MOVIE ||
      r.media_type === TMDBContentTypes.TV,
  );
  return results;
}

// The function to fetch the latest movies
export async function getTopRatedMovies(
  page = 1,
): Promise<TMDBMovieListResponse> {
  try {
    // Call the TMDB API endpoint for fetching the latest movies
    const data = await get<TMDBMovieListResponse>("/movie/top_rated", {
      language: "en-US",
      page, // Adjust the page as needed
    });

    // Return the array of latest movies
    return data;
  } catch (error) {
    console.error("Error fetching latest movies from TMDB:", error);
    throw error; // You can handle the error according to your needs
  }
}

// Function to fetch popular movies
export async function getPopularMovies(
  page = 1,
): Promise<TMDBMovieListResponse> {
  try {
    // Call the TMDB API endpoint for fetching popular movies
    const data = await get<TMDBMovieListResponse>("/movie/popular", {
      language: "en-US",
      page, // Use the provided page number
    });

    // Return the response containing popular movies
    return data;
  } catch (error) {
    console.error(
      `Error fetching popular movies from TMDB (/movie/popular):`,
      error,
    );
    throw error; // You can handle the error according to your needs
  }
}

// The function to fetch the latest Series
export async function getOnAirSeries(
  page = 1,
): Promise<TMDBTVSeriesListResponse> {
  try {
    // Call the TMDB API endpoint for fetching the latest TV series
    const data = await get<TMDBTVSeriesListResponse>("/tv/on_the_air", {
      language: "en-US",
      page, // Adjust the page as needed
    });

    // Return the array of latest TV series
    return data;
  } catch (error) {
    console.error("Error fetching latest series from TMDB:", error);
    throw error; // You can handle the error according to your needs
  }
}

// Function to fetch popular TV series
export async function getPopularTVSeries(
  page = 1,
): Promise<TMDBTVSeriesListResponse> {
  try {
    // Call the TMDB API endpoint for fetching popular TV series
    const data = await get<TMDBTVSeriesListResponse>("/tv/popular", {
      language: "en-US",
      page, // Adjust the page as needed
    });

    // Return the response containing popular TV series
    return data;
  } catch (error) {
    console.error("Error fetching popular TV series from TMDB:", error);
    throw error; // You can handle the error according to your needs
  }
}

// Function to fetch Top Rated TV series
export async function getTopRatedTVSeries(
  page = 1,
): Promise<TMDBTVSeriesListResponse> {
  try {
    // Call the TMDB API endpoint for fetching popular TV series
    const data = await get<TMDBTVSeriesListResponse>("/tv/top_rated", {
      language: "en-US",
      page, // Adjust the page as needed
    });

    // Return the response containing popular TV series
    return data;
  } catch (error) {
    console.error("Error fetching popular TV series from TMDB:", error);
    throw error; // You can handle the error according to your needs
  }
}

export async function generateQuickSearchMediaUrl(
  query: string,
): Promise<string | undefined> {
  const data = await multiSearch(query);
  if (data.length === 0) return undefined;
  const result = data[0];
  const title =
    result.media_type === TMDBContentTypes.MOVIE ? result.title : result.name;

  return `/media/${TMDBIdToUrlId(
    TMDBMediaToMediaType(result.media_type),
    result.id.toString(),
    title,
  )}`;
}

// Conditional type which for inferring the return type based on the content type
type MediaDetailReturn<T extends TMDBContentTypes> =
  T extends TMDBContentTypes.MOVIE
    ? TMDBMovieData
    : T extends TMDBContentTypes.TV
      ? TMDBShowData
      : never;

export function getMediaDetails<
  T extends TMDBContentTypes,
  TReturn = MediaDetailReturn<T>,
>(id: string, type: T): Promise<TReturn> {
  if (type === TMDBContentTypes.MOVIE) {
    return get<TReturn>(`/movie/${id}`, { append_to_response: "external_ids" });
  }
  if (type === TMDBContentTypes.TV) {
    return get<TReturn>(`/tv/${id}`, { append_to_response: "external_ids" });
  }
  throw new Error("Invalid media type");
}

export function getMediaPoster(posterPath: string | null): string | undefined {
  if (posterPath) return `https://image.tmdb.org/t/p/w342/${posterPath}`;
}

export async function getEpisodes(
  id: string,
  season: number,
): Promise<TMDBEpisodeShort[]> {
  const data = await get<TMDBSeason>(`/tv/${id}/season/${season}`);
  return data.episodes.map((e) => ({
    id: e.id,
    episode_number: e.episode_number,
    title: e.name,
    air_date: e.air_date,
  }));
}

export async function getMovieFromExternalId(
  imdbId: string,
): Promise<string | undefined> {
  const data = await get<ExternalIdMovieSearchResult>(`/find/${imdbId}`, {
    external_source: "imdb_id",
  });

  const movie = data.movie_results[0];
  if (!movie) return undefined;

  return movie.id.toString();
}

export function formatTMDBSearchResult(
  result: TMDBMovieSearchResult | TMDBShowSearchResult,
  mediatype: TMDBContentTypes,
): TMDBMediaResult {
  const type = TMDBMediaToMediaType(mediatype);
  if (type === MWMediaType.SERIES) {
    const show = result as TMDBShowSearchResult;
    return {
      title: show.name,
      poster: getMediaPoster(show.poster_path),
      id: show.id,
      original_release_date: new Date(show.first_air_date),
      object_type: mediatype,
    };
  }

  const movie = result as TMDBMovieSearchResult;

  return {
    title: movie.title,
    poster: getMediaPoster(movie.poster_path),
    id: movie.id,
    original_release_date: new Date(movie.release_date),
    object_type: mediatype,
  };
}
