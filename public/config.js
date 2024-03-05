window.__CONFIG__ = {
  // The URL for the CORS proxy, the URL must NOT end with a slash!
  // If not specified, the onboarding will not allow a "default setup". The user will have to use the extension or set up a proxy themselves
  VITE_CORS_PROXY_URL: "https://cinexplore-proxy.netlify.app",

  // The READ API key to access TMDB
  VITE_TMDB_READ_API_KEY: "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5N2Q2ZmUxOGJjY2FjZGUyNTRhZGY4MDQxM2Q5NDhmOCIsInN1YiI6IjVlZTI1ODk3NGMxYmIwMDAyMGE0ZTgyZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.H8EaNeQjaGiOXR_KHc4SWNvBGuG51AJUZO6qDlqQF90",

  // The DMCA email displayed in the footer, null to hide the DMCA link
  VITE_DMCA_EMAIL: "support@cinexplore.net",

  // Whether to disable hash-based routing, leave this as false if you don't know what this is
  VITE_NORMAL_ROUTER: false,

  // The backend URL to communicate with
  VITE_BACKEND_URL: "https://mw-backend.lonelil.com",

  // A comma separated list of disallowed IDs in the case of a DMCA claim - in the format "series-<id>" and "movie-<id>"
  VITE_DISALLOWED_IDS: "",
};
