import request = require('request');
import cheerio = require('cheerio');
import Promise = require('bluebird');

function push<T>(arr: T[], ...val: T[]): T[] {
    arr.push.apply(arr, val);
    return arr;
}

function requestURL(url: string): Promise<string> { 'use strict';
    return new Promise((resolve: (b: string) => void, reject: (e: Error) => void) => {
        request(url, (err, res, body) => {
            if (err) {
                return reject(err);
            }

            if (res.statusCode !== 200) {
                return reject(new Error('Invalid status: ' + res.statusCode));
            }

            resolve(body);
        });
    });
}

function fetchURL(url: string, retry: number, verbose: boolean = false): Promise<string> { 'use strict';
    return requestURL(url)
        .catch((e: Error) => {
            if ((retry || 0) > 0) {
                if (verbose) {
                    console.error(`Fetching ${url} failed. Retry.`);
                }
                return fetchURL(url, retry - 1);
            } else {
                return Promise.reject(e);
            }
        });
}

export interface Category {
    title: string;
    url: string;
}

export function scrapeCategories({retry = 0} = {}): Promise<Category[]> { 'use strict';
    return fetchURL('http://www.irasutoya.com/', retry).then(html => {
        const dom = cheerio.load(html);
        return dom('div#sidebar-wrapper div.widget.Label div.widget-content ul li a')
            .toArray()
            .map(a => ({
                title: (a.children[0] as any).data as string,
                url: cheerio(a).attr('href'),
            }));
    });
}

const ScriptScrapingRegex = /"(http:\/\/.+\.(?:png|jpg))","(.+)"/;

export interface IrasutoLink {
    name: string;
    image_url: string;
    detail_url: string;
}

export interface Page {
    url: string;
    next_url: string;
    contents: IrasutoLink[];
}

export interface Irasuto {
    name: string;
    detail_url: string;
    image_url: string;
    mini_image_url: string;
    categories: string[];
    description: string;
}

function scrapePage(url: string, retry: number, next_url_selector: string): Promise<Page> { 'use strict';
    return fetchURL(url, retry).then(html => {
        const dom = cheerio.load(html);
        const scripts = dom('.widget.Blog .post-outer .box .boxim a script').toArray();
        const contents = [] as IrasutoLink[];
        for (const script of scripts) {
            const detail_url: string = (script.parent.attribs as {[a:string]:string})['href'];
            if (script.children.length === 0) {
                console.error('Detail URL is not found for ' + url);
                continue;
            }
            const src = (script.children[0] as any).data as string;
            const match = src.match(ScriptScrapingRegex);
            if (match === null) {
                console.error('Scraping script of irasuto failed: ' + src);
                continue;
            }
            const image_url = match[1]; // Should replace 's72-c' to 's800'?
            const name = match[2];
            console.error('scrapePage(): ' + name);
            contents.push({
                detail_url,
                image_url,
                name,
            });
        }

        const nodes = dom(next_url_selector);
        const next_url = nodes.length === 0 ? null : (nodes[0].attribs as {href: string}).href;

        return {
            url,
            contents,
            next_url,
        };
    });
}

export function scrapeFirstPage({retry = 0} = {}): Promise<Page> { 'use strict';
    return scrapePage('http://www.irasutoya.com/', retry, '.widget.Blog div#postbottom a#Blog1_blog-pager-older-link')
        .then((page: Page) => {
            page.next_url = page.next_url.replace('max-results=24', 'max-results=31');
            return page;
        });
}

function scrapePagesImpl(page: Page, retry: number, depth: number, delay_ms: number): Promise<Page[]> {
    if (page.next_url === null || depth < 0) {
        return Promise.resolve([] as Page[]);
    }
    return scrapePage(page.next_url, retry, 'a#Blog1_blog-pager-older-link.blog-pager-older-link')
        .delay(delay_ms)
        .then(head => scrapePagesImpl(head, retry, depth - 1, delay_ms)
                .then(tail => push(tail, head))
            );
}

export function scrapeAllPages({retry = 0, depth = Infinity, delay_ms = 1000} = {}): Promise<Page[]> { 'use strict';
    return scrapeFirstPage({retry})
        .then(first => {
            return scrapePagesImpl(first, retry, depth, delay_ms)
                .then(pages => push(pages, first));
        });
}

export function scrapeAllIrasutoLinks({retry = 0, depth = Infinity, delay_ms = 1000} = {}): Promise<IrasutoLink[]> { 'use strict';
    return scrapeAllPages({retry, depth, delay_ms}).reduce(
            (acc: IrasutoLink[], page: Page) => push(acc, ...page.contents), []
        );
}

export function scrapeDetailPage(url: string, {retry = 0, verbose = false} = {}): Promise<Irasuto> { 'use strict';
    return fetchURL(url, retry, verbose).then(html => {
        const dom = cheerio.load(html);

        const name_nodes = dom('div#post div.title h2');
        if (name_nodes.length === 0 || name_nodes[0].children.length === 0) {
            console.error('Title is not found for detail page ' + url);
            return null;
        }
        const name = (name_nodes[0].children[0] as any).data.trim();

        const image_nodes = dom('div#post div.entry div.separator a');
        if (image_nodes.length === 0) {
            console.error('Image is not found for detail page ' + url);
            return null;
        }
        const image_url = (image_nodes[0].attribs as {href: string}).href;

        let description: string = null;
        const desc_nodes = dom('div#post div.entry div.separator');
        if (desc_nodes.length > 1 && desc_nodes[1].children && desc_nodes[1].children.length > 0) {
            description = desc_nodes[1].children[0].data;
        } else {
            const desc_nodes = dom('div#post div.entry div.separator');
            if (desc_nodes.length > 0 && desc_nodes[0].next && desc_nodes[0].next.data) {
                description = desc_nodes[0].next.data;
            }
        }
        if (description === null) {
            console.error('Description is not found for detail page ' + url);
            return null;
        }



        const category_nodes = dom('span.category a');
        if (category_nodes.length === 0) {
            console.error('No category is found for detail page ' + url);
            return null;
        }
        const categories = [] as string[];
        for (let i = 0; i < category_nodes.length; ++i) {
            if (category_nodes[i].children.length > 0) {
                categories.push((category_nodes[i].children[0] as any).data);
            }
        }

        if (verbose) {
            console.error('Scraping detail of ' + name);
        }

        return {
            name,
            detail_url: url,
            image_url,
            mini_image_url: image_url.replace('/s800/', '/s72-c/'),
            description,
            categories,
        };
    });
}

export function scrapeAllIrasuto({retry = 0, depth = Infinity, delay_ms = 500, concurrency = 4, verbose = false} = {}): Promise<Irasuto[]> { 'use strict';
    return scrapeAllIrasutoLinks({retry, depth, delay_ms})
        .map((i: IrasutoLink) => scrapeDetailPage(i.detail_url, {retry, verbose}).delay(delay_ms), {concurrency})
        .filter((i: Irasuto) => i !== null);
}

