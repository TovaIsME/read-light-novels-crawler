import { Hono } from "hono";
import { searchByTitle } from "./scraper";

const app = new Hono();

app.get("/", (c) => c.text("Hello world"));

app.get("/search", async (c) => {
	const page = c.req.query("page") ? Number(c.req.query("page")) : 1;
	const title = c.req.query("title");
	if (!title) {
		return c.json({
			message: "Please provide novel title to search. Optionally, you can also pass page number.",
			example: ["/search?title=overlord", "/search?title=overlord&page=2"],
		});
	}

	const searchResults = await searchByTitle(title, page);

	return c.json({
		results: searchResults,
	});
});

export default app;
