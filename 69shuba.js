// ==BookSource==
// @name         六九书吧
// @version      1.3
// @author       Qwen
// @baseUrl      https://www.69shuba.com
// @icon         https://www.69shuba.com/favicon.ico
// @searchUrl    /modules/article/search.php?searchkey={{key}}
// @ruleSearch   .grid tr:gt(0) -> {
//     name: td:nth-child(1) a@text,
//     author: td:nth-child(3)@text,
//     detailUrl: td:nth-child(1) a@href,
//     bookId: td:nth-child(1) a@href#https?://[^/]+/book/(\d+)/#
// }
// @ruleToc      #catalog-list li a -> {
//     name: text,
//     chapterUrl: href
// }
// @ruleContent  #chapter-content@html
// @charset      utf-8
// @manualUrl    https://www.69shuba.com
// ==/BookSource==

function init() {
    setUserAgent("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36");
}

function getToc(book) {
    let toc = [];
    let page = 1;
    const maxPages = 20; // 防止无限循环
    while (page <= maxPages) {
        let url = book.detailUrl;
        if (page > 1) {
            url = url.replace(/\/$/, "") + `/index_${page}.htm`;
        }
        let html = fetch(url).text();
        if (!html || html.includes("未找到章节")) break;

        let doc = HtmlDocument(html);
        let items = doc.select("#catalog-list li a");
        if (items.length === 0) break;

        for (let i = 0; i < items.length; i++) {
            let a = items[i];
            let name = a.text().trim();
            let href = a.attr("href");
            if (!href || !name) continue;
            toc.push({
                name: name,
                chapterUrl: resolveUrl(href, book.detailUrl)
            });
        }

        // 检查是否有下一页
        if (doc.select('.pages a:contains("下一页")').length === 0) {
            break;
        }
        page++;
    }
    return toc;
}

function getContent(chapter) {
    let html = fetch(chapter.chapterUrl).text();
    if (!html) return "";

    let match = html.match(/<div id="chapter-content" class="read-content">([\s\S]*?)<\/div>/);
    if (!match) return "正文提取失败";

    let content = match[1]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<div class="ads?[^>]*>[\s\S]*?<\/div>/gi, "")
        .replace(/<p align="center">[\s\S]*?<\/p>/gi, "")
        .replace(/&nbsp;/g, " ")
        .replace(/<br\s*\/?>/g, "\n")
        .replace(/<[^>]+>/g, ""); // 转为纯文本（保留换行）

    return content.trim();
}
