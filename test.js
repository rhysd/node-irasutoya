var I = require('.');

// I.fetchCategories().then(result => console.log(result)).catch(err => console.error(err));

// I.fetchIrasutoOf({
//     title: 'リクエスト',
//     url: 'http://www.irasutoya.com/search/label/%E3%83%AA%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88'
// }).then(result => console.log(result)).catch(err => console.error(err));

// I.fetchAllIrasuto().then(is => {
//     var o = {};
//     is.forEach((v, k) => { o[k] = v; });
//     console.log(JSON.stringify(o));
// }).catch(err => console.error(err));

function show(p) {
    p.then(v => console.log(v)).catch(e => console.error(e));
}

// show(I.scrapeFirstPage());
// show(I.scrapePages({depth: 1}));
// I.scrapeAllIrasuto({retry: 3})
//     .then(i => console.log(JSON.stringify(i)))
//     .catch(e => console.error(e));

show(I.scrapeDetailPage('http://www.irasutoya.com/2015/11/blog-post_248.html'))
