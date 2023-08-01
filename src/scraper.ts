const BASE_URL = "https://readlightnovels.net";

const genreList = [
	"action",
	"adult",
	"adventure",
	"bender",
	"chinese",
	"comedy",
	"drama",
	"ecchi",
	"fantasy",
	"game",
	"gender-bender",
	"harem",
	"historical",
	"horror",
	"isekai",
	"josei",
	"martial-arts",
	"mature",
	"mecha",
	"misc",
	"mystery",
	"psychological",
	"reincarnation",
	"romance",
	"school-life",
	"sci-fi",
	"seinen",
	"shoujo",
	"shoujo-ai",
	"shounen",
	"shounen-ai",
	"slice-of-life",
	"smut",
	"sports",
	"supernatural",
	"tragedy",
	"urban",
	"wuxia",
	"xianxia",
	"xuanhuan",
	"yaoi",
	"yuri",
] as const;

type Genre = (typeof genreList)[number];

type NovelCard = {
	id: string;
	title: string;
	image: string;
	lastChapter: string;
};

type NovelChapter = {
	title: string;
	slug: string;
};

type NovelInfo = {
	id: string;
	title: string;
	authors: string[];
	genre: Genre[];
	status: string;
	chapters: NovelChapter[];
};

type SearchResult = {
	novels: NovelCard[];
	page: number;
	hasPrevPage: boolean;
	hasNextPage: boolean;
};

function cleanNovelTitle(title: string) {
	return title.split("Novel").join("").replace(/\s+/g, " ").trim();
}

function getSlugFromUrl(url: string) {
	const slugMatches = url.match(/\/([^/]+)\.html/);
	return slugMatches ? slugMatches[1] : "";
}

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
				novels.push({ id: "", title: "", image: "", lastChapter: "" });
			},
		})
		.on(".home-truyendecu > a", {
			element(el) {
				const title = cleanNovelTitle(el.getAttribute("title") ?? "");
				const slug = getSlugFromUrl(el.getAttribute("href") ?? "");
				addToLast("id", slug);
				addToLast("title", title);
			},
		})
		.on(".home-truyendecu > a img", {
			element(el) {
				// Only add the first image
				// The second image if available (like in searchByCompleted) is irrelevant
				if (!novels.at(-1)?.image) {
					addToLast("image", el.getAttribute("src") ?? "");
				}
			},
		})
		.on(".home-truyendecu > a div small", {
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
	const response = await fetch(`${BASE_URL}/page/${page}?s=${title}`);
	if (!response.ok) throw Error("Error fetching from source");

	return await crawlSearchResultPage(response, page);
}

async function searchByLatest(page = 1): Promise<SearchResult> {
	const response = await fetch(`${BASE_URL}/latest/page/${page}`);
	if (!response.ok) throw Error("Error fetching from source");

	return await crawlSearchResultPage(response, page);
}

async function searchByCompleted(page = 1): Promise<SearchResult> {
	const response = await fetch(`${BASE_URL}/completed/page/${page}`);
	if (!response.ok) throw Error("Error fetching from source");

	return await crawlSearchResultPage(response, page);
}

async function searchByGenre(genre: Genre, page = 1): Promise<SearchResult> {
	const response = await fetch(`${BASE_URL}/${genre}/page/${page}`);
	if (!response.ok) throw Error("Error fetching from source");

	return await crawlSearchResultPage(response, page);
}

async function searchByAuthor(author: string): Promise<SearchResult> {
	const response = await fetch(`${BASE_URL}/novel-author/${author})`);
	if (!response.ok) throw Error("Error fetching from source");

	return await crawlSearchResultPage(response, 1);
}

async function getMostPopular() {
	const response = await fetch(`${BASE_URL}/latest`);
	if (!response.ok) throw Error("Error fetching from source");

	const res: { title: string; url: string }[] = [];

	await new HTMLRewriter()
		.on(".col-truyen-side a", {
			element(el) {
				const title = el.getAttribute("title");
				const url = el.getAttribute("href");
				if (title && url) {
					res.push({ title, url });
				}
			},
		})
		.transform(response)
		.arrayBuffer();

	return res;
}

async function getNovelInfo(slug: string) {
	const response = await fetch(`${BASE_URL}/${slug}.html`);
	if (!response.ok) throw Error("Error fetching from source");

	const results = await new HTMLRewriter().on();
}

export {
	searchByTitle,
	searchByLatest,
	searchByCompleted,
	searchByGenre,
	genreList,
	searchByAuthor,
	getMostPopular,
	getNovelInfo,
};
