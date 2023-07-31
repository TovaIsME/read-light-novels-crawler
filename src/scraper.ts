import { sluggify } from "./utils";

const BASE_URL = "https://readlightnovels.net";

type SearchResult = {
	id: string;
	title: string;
	url: string;
	image: string;
	lastChapter: string;
};

async function search(query: string) {
	const response = await fetch(`${BASE_URL}/?s=${query}`);
	if (!response.ok) throw Error("Error fetching from source");

	const res: SearchResult[] = [];

	function addToLast(attr: keyof SearchResult, text: string) {
		const lastIndex = res.length - 1;
		if (lastIndex < 0) {
			return;
		}
		// Need to add to the previous value in case where there are multiple text chunks
		res[lastIndex][attr] = (res[lastIndex][attr] || "") + text;
	}

	await new HTMLRewriter()
		.on(".home-truyendecu", {
			element(_el) {
				res.push({ id: "", title: "", url: "", image: "", lastChapter: "" });
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
		.on(".home-truyendecu > a > div > small", {
			text({ text }) {
				if (Boolean(text)) {
					addToLast("lastChapter", text.trim());
				}
			},
		})
		.transform(response)
		.arrayBuffer();

	return res.filter((r) => r.lastChapter !== "No chapter");
}

export { search };
