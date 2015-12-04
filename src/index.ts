import request = require('request');
import cheerio = require('cheerio');
import Promise = require('bluebird');

export type CategoryName = string;

export interface Category {
    title: CategoryName;
    url: string;
}

export interface Irasuto {
    name: string;
    category?: Category;
    image_url: string;
    detail_url: string;
}

export type Irasutoya = Map<CategoryName, Irasuto[]>;

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

function fetchURL(url: string, retry: number): Promise<string> { 'use strict';
    return requestURL(url)
        .catch((e: Error) => {
            if ((retry || 0) > 0) {
                return fetchURL(url, retry - 1);
            } else {
                return Promise.reject(e);
            }
        });
}

export function fetchCategories({retry = 0} = {}): Promise<Category[]> { 'use strict';
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

export function fetchIrasutoOf(category: Category, {retry = 0} = {}): Promise<Irasuto[]> { 'use strict';
    return fetchURL(category.url, retry).then((html: string) => {
        const dom = cheerio.load(html);
        return dom('.widget.Blog .post-outer .box .boxim a')
                .toArray()
                .map(a => {
                    const detail_url = (a.attribs as {[k: string]: string})['href'];
                    const src: string = (cheerio(a).children('script')[0].children[0] as any).data;
                    const match = src.match(ScriptScrapingRegex);
                    if (match === null) {
                        throw new Error('Scraping script of irasuto failed: ' + src);
                    }
                    const image_url = match[1];
                    const name = match[2];

                    return {
                        name,
                        category,
                        image_url,
                        detail_url,
                    };
                });
    }).delay(1000);
}

// Access to each category of irasutoya *sequentially* not to be *evil*.
export function fetchAllIrasuto({retry = 0} = {}): Promise<Irasutoya> { 'use strict';
    return fetchCategories({retry}).reduce(
        (acc: Irasutoya, c: Category) => fetchIrasutoOf(c, {retry}).then((i: Irasuto[]) => acc.set(c.title, i)),
        new Map<CategoryName, Irasuto[]>()
    );
}

