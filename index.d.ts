import Promise = require('bluebird');
export declare type CategoryName = string;
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
export declare type Irasutoya = Map<CategoryName, Irasuto[]>;
export declare function fetchCategories({retry}?: {
    retry?: number;
}): Promise<Category[]>;
export declare function fetchIrasutoOf(category: Category, {retry}?: {
    retry?: number;
}): Promise<Irasuto[]>;
export declare function fetchAllIrasuto({retry}?: {
    retry?: number;
}): Promise<Irasutoya>;
