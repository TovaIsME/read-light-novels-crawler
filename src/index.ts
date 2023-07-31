import { Hono } from "hono";
import { sluggify } from "./utils";

const app = new Hono();

const BASE_URL = "https://readlightnovels.net";

type SearchResult = {
	id: string;
	title: string;
	url: string;
	image: string;
};

app.get("/", (c) => c.text("Hello world"));

app.get("/search", async (c) => {
	const response = await fetch(`${BASE_URL}/?s=${"Mushoku"}`);
	if (!response.ok) throw Error("Error fetching from source");

	const results: SearchResult[] = [];

	function addToLast(attr: keyof SearchResult, text: string) {
		const lastIndex = results.length - 1;
		if (lastIndex < 0) {
			return;
		}
		// Need to add to the previous value in case where there are multiple text chunks
		results[lastIndex][attr] = (results[lastIndex][attr] || "") + text;
	}

	// TODO: get last chapter too, if there's no last chapter, filter it out
	await new HTMLRewriter()
		.on(".home-truyendecu", {
			element(_el) {
				results.push({ id: "", title: "", url: "", image: "" });
			},
		})
		.on(".home-truyendecu > a", {
			element(el) {
				const title = el.getAttribute("title")?.split("Novel").join("").replace(/\s+/g, " ").trim();
				const url = el.getAttribute("href");
				addToLast("id", title ? sluggify(title) : "");
				addToLast("url", url ?? "");
				addToLast("title", title ?? "");
			},
		})
		.on(".home-truyendecu > a > img", {
			element(el) {
				addToLast("image", el.getAttribute("src") ?? "");
			},
		})
		.transform(response)
		.arrayBuffer();

	return c.json({
		results,
	});
});

export default app;
