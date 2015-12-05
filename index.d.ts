import Promise = require('bluebird');
export interface Category {
    title: string;
    url: string;
}
export declare function scrapeCategories({retry}?: {
    retry?: number;
}): Promise<Category[]>;
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
export declare function scrapeFirstPage({retry}?: {
    retry?: number;
}): Promise<Page>;
export declare function scrapeAllPages({retry, depth, delay_ms}?: {
    retry?: number;
    depth?: number;
    delay_ms?: number;
}): Promise<Page[]>;
export declare function scrapeAllIrasutoLinks({retry, depth, delay_ms}?: {
    retry?: number;
    depth?: number;
    delay_ms?: number;
}): Promise<IrasutoLink[]>;
export declare function scrapeDetailPage(url: string, {retry, verbose}?: {
    retry?: number;
    verbose?: boolean;
}): Promise<Irasuto>;
export declare function scrapeAllIrasuto({retry, depth, delay_ms, concurrency}?: {
    retry?: number;
    depth?: number;
    delay_ms?: number;
    concurrency?: number;
}): Promise<Irasuto[]>;
