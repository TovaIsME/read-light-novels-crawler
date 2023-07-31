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

async function collectNovelCards(response: Response) {
	const res: NovelCard[] = [];

	function addToLast(attr: keyof NovelCard, text: string) {
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

async function checkForNextPage(response: Response, currentPage: number) {
	let res = false;

	await new HTMLRewriter()
		.on(`a[data-page="${currentPage + 1}"]`, {
			element(_el) {
				res = true;
			},
		})
		.transform(response)
		.arrayBuffer();

	return res;
}

async function checkForPrevPage(response: Response, currentPage: number) {
	let res = false;

	await new HTMLRewriter()
		.on(`a[data-page="${currentPage - 1}"]`, {
			element(_el) {
				res = true;
			},
		})
		.transform(response)
		.arrayBuffer();

	return res;
}

async function searchByTitle(query: string, page = 1): Promise<SearchResult> {
	const response = await fetch(`${BASE_URL}/?s=${query}`);
	if (!response.ok) throw Error("Error fetching from source");

	const [novels, hasPrevPage, hasNextPage] = await Promise.all([
		collectNovelCards(response),
		checkForPrevPage(response, page),
		checkForNextPage(response, page),
	]);

	return {
		novels,
		page,
		hasPrevPage,
		hasNextPage,
	};
}

export { searchByTitle };
