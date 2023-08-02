import { Hono } from "hono";
import {
	genreList,
	getMostPopular,
	getNovelChapterContent,
	getNovelChapters,
	getNovelInfo,
	searchByAuthor,
	searchByCompleted,
	searchByGenre,
	searchByLatest,
	searchByTitle,
} from "./scraper";
import { readonlyArrayIncludes } from "./utils";

const app = new Hono();

app.get("/", (c) =>
	c.json({
		message: "Welcome! Available routes are listed below. Visit routes for more instruction.",
		routes: [
			"/search",
			"/search/latest",
			"/search/completed",
			"/search/genre",
			"/search/genre/:genre",
			"/search/author",
			"/popular",
		],
	})
);

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

app.get("/search/genre", async (c) => {
	return c.json({
		message:
			"To search with genre, go to /search/genre/:genre, and use the format from the examples below.",
		example: ["/search/<genre>", "/search/<genre>?page=2"],
		genreList,
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

app.get("/popular", async (c) => {
	return c.json({
		results: await getMostPopular(),
	});
});

app.get("/novel/:id", async (c) => {
	const id = c.req.param("id");
	if (!id) {
		return c.json({
			message: "Please pass a parameter containing id of the novel.",
			example: ["/novel/mushoku-tensei-wn"],
		});
	}

	return c.json({
		results: await getNovelInfo(id),
	});
});

app.get("/novel/:id/:chapter", async (c) => {
	const { id, chapter } = c.req.param();
	if (!id || !chapter) {
		return c.json({
			route: "/novel/:id/:chapter",
			message: "Please replace :id with novel's id and :chapter with chapter's id",
			example: ["/novel/mushoku-tensei-wn/volume-1"],
		});
	}

	return c.json({
		results: await getNovelChapterContent(id, chapter),
	});
});

app.get("/chapters", async (c) => {
	const key = c.req.query("key");
	if (!key) {
		return c.json({
			message: "Please pass a querystring containing a novel key for chapters fetching.",
			example: ["/chapters?key=420900"],
		});
	}

	return c.json({
		results: await getNovelChapters(key),
	});
});

export default app;
