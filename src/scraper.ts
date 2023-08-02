import { readonlyArrayIncludes } from "./utils";

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
	id: string;
	title: string;
};

type NovelChapterContent = {
	id: string;
	prev: string;
	next: string;
	content: string[];
};

type NovelAuthor = {
	id: string;
	name: string;
};

type NovelInfo = {
	id: string;
	novelKey: string;
	title: string;
	image: string;
	authors: NovelAuthor[];
	genre: Genre[];
	status: string;
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

	const res: NovelInfo = {
		id: slug,
		novelKey: "",
		title: "",
		image: "",
		authors: [],
		genre: [],
		status: "",
	};

	await new HTMLRewriter()
		.on("h3.title", {
			text({ text }) {
				res.title += cleanNovelTitle(text);
			},
		})
		.on(".info-holder img", {
			element(el) {
				res.image = el.getAttribute("src") ?? "";
			},
		})
		.on(".info-holder > .info > div > a", {
			element(el) {
				const url = el.getAttribute("href");
				if (!url) return;

				if (url.includes("novel-author")) {
					res.authors.push({
						id: url.split("/").at(-1)!,
						name: el.getAttribute("title") ?? "",
					});
				}
			},
		})
		.on(".info-holder > .info > div > a[rel*=category]", {
			element(el) {
				const url = el.getAttribute("href");
				if (!url) return;
				const genre = url.split("/").at(-1)!;

				if (readonlyArrayIncludes(genreList, genre)) {
					res.genre.push(genre);
				}
			},
		})
		.on(".info-holder > .info span.text-primary", {
			text({ text }) {
				const formattedText = text.toLowerCase().replace(" ", "");
				if (formattedText === "ongoing" || formattedText === "completed") {
					res.status = text;
				}
			},
		})
		.on("input#id_post", {
			element(el) {
				res.novelKey = el.getAttribute("value") ?? "";
			},
		})
		.transform(response)
		.arrayBuffer();

	return res;
}

async function fetchNovelChapters(novelKey: string, page: string) {
	const bodyFormData = new FormData();
	bodyFormData.append("action", "tw_ajax");
	bodyFormData.append("type", "pagination");
	bodyFormData.append("id", novelKey);
	bodyFormData.append("page", page);

	const response = await fetch(`${BASE_URL}/wp-admin/admin-ajax.php`, {
		method: "POST",
		body: bodyFormData,
	});
	if (!response.ok) throw Error("Error fetching from source");
	const json = (await response.json()) as { list_chap: string; pagination: string };
	if (!json.list_chap || !json.pagination) {
		throw Error("Invalid data shape");
	}

	const res: NovelChapter[] = [];

	await new HTMLRewriter()
		.on("ul.list-chapter > li > a", {
			element(el) {
				res.push({
					id: getSlugFromUrl(el.getAttribute("href") ?? ""),
					title: el.getAttribute("title") ?? "",
				});
			},
		})
		.transform(new Response(json.list_chap))
		.arrayBuffer();

	return res;
}

async function getNovelChapters(novelKey: string) {
	const bodyFormData = new FormData();
	bodyFormData.append("action", "tw_ajax");
	bodyFormData.append("type", "pagination");
	bodyFormData.append("id", novelKey);
	bodyFormData.append("page", "1");

	const response = await fetch(`${BASE_URL}/wp-admin/admin-ajax.php`, {
		method: "POST",
		body: bodyFormData,
	});
	if (!response.ok) throw Error("Error fetching from source");
	const json = (await response.json()) as { list_chap: string; pagination: string };
	if (!json.list_chap || !json.pagination) {
		throw Error("Invalid data shape");
	}

	let lastPage = 0;

	await new HTMLRewriter()
		.on("a[data-page]", {
			element(el) {
				const page = Number(el.getAttribute("data-page"));
				if (page) {
					lastPage = Math.max(page);
				}
			},
		})
		.transform(new Response(json.pagination))
		.arrayBuffer();

	const promises: Array<Promise<NovelChapter[]>> = [];

	for (let i = 0; i < lastPage; i++) {
		promises.push(fetchNovelChapters(novelKey, (i + 1).toString()));
	}

	return (await Promise.all(promises)).flat();
}

async function getNovelChapterContent(novelId: string, chapterId: string) {
	const response = await fetch(`${BASE_URL}/${novelId}/${chapterId}.html`);
	if (!response.ok) throw Error("Error fetching from source");

	const res: NovelChapterContent = { id: chapterId, next: "", prev: "", content: [] };

	await new HTMLRewriter()
		.on(".chapter-nav a", {
			element(el) {
				const id = el.getAttribute("id");
				if (!id) return;
				if (id === "prev_chap") {
					res.prev = getSlugFromUrl(el.getAttribute("href") ?? "");
				}
				if (id === "next_chap") {
					res.next = getSlugFromUrl(el.getAttribute("href") ?? "");
				}
			},
		})
		.on(".chapter-content p", {
			text({ text }) {
				if (text.length > 0) {
					res.content.push(text);
				}
			},
		})
		.transform(response)
		.arrayBuffer();

	return res;
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
	getNovelChapters,
	getNovelChapterContent,
};
