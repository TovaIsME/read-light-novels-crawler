import { Hono } from "hono";
import { search } from "./scraper";

const app = new Hono();

app.get("/", (c) => c.text("Hello world"));

app.get("/search", async (c) => {
	const searchResults = await search("Tensei");

	return c.json({
		results: searchResults,
	});
});

export default app;
