import { Hono } from "hono";
import { searchByTitle } from "./scraper";

const app = new Hono();

app.get("/", (c) => c.text("Hello world"));

app.get("/search", async (c) => {
	const query = c.req.query("q");
	if (!query) {
		return c.json({
			message: "Please provide a search query",
			example: "/search?q=overlord",
		});
	}

	const searchResults = await searchByTitle(query);

	return c.json({
		results: searchResults,
	});
});

export default app;
