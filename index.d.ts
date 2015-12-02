import Promise = require('bluebird');
export declare type CategoryName = string;
export interface Category {
    title: CategoryName;
    url: string;
}
export interface Irasuto {
    name: string;
    category: Category;
    image_url: string;
    detail_url: string;
}
export declare type Irasutoya = Map<CategoryName, Irasuto[]>;
export declare function fetchCategories(): Promise<Category[]>;
export declare function fetchIrasutoOf(category: Category): Promise<Irasuto[]>;
export declare function fetchAllIrasuto(): Promise<Irasutoya>;
