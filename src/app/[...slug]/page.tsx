// Catch-all: the app is a single-route client-side router, so every clean URL
// (e.g. /pricing, /app, /admin) must render the same root page instead of 404.
// Metadata comes from the root layout (OG + twitter cards apply site-wide).
export { default } from "../page";
