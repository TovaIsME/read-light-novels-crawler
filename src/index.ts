import { Hono } from "hono";
import {
	genreList,
	searchByAuthor,
	searchByCompleted,
	searchByGenre,
	searchByLatest,
	searchByTitle,
} from "./scraper";
import { readonlyArrayIncludes } from "./utils";

const app = new Hono();

app.get("/", (c) => c.text("Hello world"));

app.get("/search", async (c) => {
	const page = Number(c.req.query("page")) ? Number(c.req.query("page")) : 1;

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
	if (!page || !Number(page)) {
		return c.json({
			message: "Please provide a page number.",
			example: ["/latest?page=1"],
		});
	}

	return c.json({
		results: await searchByLatest(Number(page)),
	});
});

app.get("/search/completed", async (c) => {
	const page = c.req.query("page");
	if (!page || !Number(page)) {
		return c.json({
			message: "Please provide a page number.",
			example: ["/completed?page=1"],
		});
	}

	return c.json({
		results: await searchByCompleted(Number(page)),
	});
});

app.get("/search/genre/:genre", async (c) => {
	const page = Number(c.req.query("page")) ? Number(c.req.query("page")) : 1;

	const genre = c.req.param("genre");
	if (readonlyArrayIncludes(genreList, genre)) {
		return c.json({
			results: await searchByGenre(genre, page),
		});
	}

	return c.json({
		message: "Please provide novel genre to filter. Optionally, you can also pass page number.",
		example: ["/search/<genre>", "/search/<genre>?page=2"],
		genreList,
	});
});

app.get("/search/author", async (c) => {
	const name = c.req.query("name");
	if (!name) {
		return c.json({
			message: "Please provide author's name to search.",
			example: ["/search?name=fuse"],
		});
	}

	return c.json({
		results: await searchByAuthor(name),
	});
});

export default app;
