import { Hono } from "hono";
import { searchByLatest, searchByTitle } from "./scraper";

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

	return c.json({
		results: await searchByTitle(title, page),
	});
});

app.get("/search/latest", async (c) => {
	const page = c.req.query("page");
	if (!page) {
		return c.json({
			message: "Please provide page number.",
			example: ["/latest?page=1"],
		});
	}

	return c.json({
		results: await searchByLatest(Number(page)),
	});
});

export default app;
