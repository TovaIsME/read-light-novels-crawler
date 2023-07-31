import { sluggify } from "./utils";

const BASE_URL = "https://readlightnovels.net";

type NovelCard = {
	id: string;
	title: string;
	url: string;
	image: string;
	lastChapter: string;
};

type SearchResult = {
	novels: NovelCard[];
	page: number;
	hasPrevPage: boolean;
	hasNextPage: boolean;
};

async function crawlSearchResultPage(response: Response, page: number): Promise<SearchResult> {
	const novels: NovelCard[] = [];
	let hasPrevPage = false;
	let hasNextPage = false;

	function addToLast(attr: keyof NovelCard, text: string) {
		const lastIndex = novels.length - 1;
		if (lastIndex < 0) {
			return;
		}
		// Need to add to the previous value in case where there are multiple text chunks
		novels[lastIndex][attr] = (novels[lastIndex][attr] || "") + text;
	}

	await new HTMLRewriter()
		.on(".home-truyendecu", {
			element(_el) {
				novels.push({ id: "", title: "", url: "", image: "", lastChapter: "" });
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
		.on(`a[data-page="${page - 1}"]`, {
			element(_el) {
				hasPrevPage = true;
			},
		})
		.on(`a[data-page="${page + 1}"]`, {
			element(_el) {
				hasNextPage = true;
			},
		})
		.transform(response)
		.arrayBuffer();

	return {
		novels: novels.filter((r) => r.lastChapter !== "No chapter"),
		page,
		hasPrevPage,
		hasNextPage,
	};
}

async function searchByTitle(title: string, page = 1): Promise<SearchResult> {
	const response = await fetch(`${BASE_URL}/?s=${title}`);
	if (!response.ok) throw Error("Error fetching from source");

	return await crawlSearchResultPage(response, page);
}

async function searchByLatest(page = 1): Promise<SearchResult> {
	const response = await fetch(`${BASE_URL}/latest/page/${page}`);
	if (!response.ok) throw Error("Error fetching from source");

	return await crawlSearchResultPage(response, page);
}

export { searchByTitle, searchByLatest };
