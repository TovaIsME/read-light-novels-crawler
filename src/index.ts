import { eventTargetToAsyncIter } from "event-target-to-async-iter";
import { Hono } from "hono";
import { sluggify } from "./utils";

const app = new Hono();

async function consume(stream: ReadableStream) {
	const reader = stream.getReader();
	while (!(await reader.read()).done) {
		/* NOOP */
	}
}

type SearchResult = {
	id: string;
	title: string;
	url: string;
	image: string;
};

app.get("/", (c) => c.text("Hello world"));

app.get("/ln", async (c) => {
	const response = await fetch(`https://readlightnovels.net/?s=${"Mushoku"}`);
	if (!response.ok) throw Error("Error fetching from source");

	const results: SearchResult[] = [];

	function addToLast(attr: keyof SearchResult, text: string) {
		const lastIndex = results.length - 1;
		if (lastIndex < 0) {
			return;
		}

		results[lastIndex][attr] = (results[lastIndex][attr] || "") + text;
	}

	// TODO: get last chapter, if there's no last chapter, filter it out
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

app.get("/hnews", async (c) => {
	const response = await fetch("https://news.ycombinator.com");
	if (!response.ok) throw Error("Scrape shield encountered!");

	const ids: string[] = [];

	const rewriter = new HTMLRewriter().on(".athing[id]", {
		element(el) {
			const elId = el.getAttribute("id");
			if (elId) {
				ids.push(elId);
			}
		},
	});

	// const _text = await rewriter.transform(response).text();
	await consume(rewriter.transform(response).body!);

	return c.json({ ids });
});

app.get("/hnews/comment", async (c) => {
	let commText = "";

	const response = await fetch("https://news.ycombinator.com/item?id=26631078");
	if (!response.ok) throw Error("Scrape shield encountered!");

	const rewriter = new HTMLRewriter()
		.on(".fatitem .commtext", {
			text({ text }) {
				commText += text;
			},
		})
		.on(".fatitem .commtext *", {
			element(el) {
				const maybeAttrs = [...el.attributes].map(([k, v]) => ` ${k}="${v}"`).join("");
				commText += `<${el.tagName}${maybeAttrs}>`;
				el.onEndTag((endTag) => {
					commText += `</${endTag.name}>`;
				});
			},
		});

	await consume(rewriter.transform(response).body!);

	return c.text(commText);
});

export default app;
