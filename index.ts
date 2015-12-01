import request = require('request');
import cheerio = require('cheerio');

export interface Category {
    title: string;
    url: string;
}

export interface Irasuto {
    name: string;
    category: string;
    image_url: string;
    detail_url: string;
}

function fetchURL(url: string) {
    'use strict';

    return new Promise((resolve, reject) => {
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

export function fetchCategories() {
    'use strict';

    return fetchURL('http://www.irasutoya.com/').then((html: string) => {
        const dom = cheerio.load(html);
        return dom('div#sidebar-wrapper div.widget.Label div.widget-content ul li a')
            .toArray()
            .map(a => ({
                title: (a.children[0] as any).data as string,
                url: cheerio(a).attr('href'),
            }));
    });
}

const ScriptScrapingRegex = /"(http:\/\/.+\.(:?png|jpg))","(.+)"/;

export function fetchIrasutoOf(category: Category) {
    'use strict';

    return fetchURL(category.url).then((html: string) => {
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
    });
}

// Access to each category of irasutoya *sequentially* not to be *evil*.
export function fetchAllIrasuto() {
    'use strict';

    // FIXME: Use reduce()
    return fetchCategories()
        .then(categories => {
            let result = [] as Irasuto[];
            let p = Promise.resolve() as Promise<Irasuto[]>;
            for (const c of categories) {
                p = p.then(fetchIrasutoOf(c)).then((i: Irasuto) => {
                    result.push(i);
                    console.log(i);
                    return result;
                });
            }
            return p;
        });
}
