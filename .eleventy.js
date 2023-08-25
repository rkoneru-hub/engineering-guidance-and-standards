const govukEleventyPlugin  = require('@x-govuk/govuk-eleventy-plugin')
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
    // Set custom variable to decide the path prefix as it is used in a couple of places.
    const _customPathPrefix = process.env.PATH_PREFIX ?? '';
    // Pass assets through to final build directory
    eleventyConfig.addPassthroughCopy({ "docs/assets/logos": "assets/logos"});
    // Register the plugins
    let govukPluginOptions = {
        brandColour: '#8f23b3',
        fontFamily: 'roboto, system-ui, sans-serif',
        icons: {
            mask: '/assets/logos/ho-mask-icon.svg',
            shortcut: '/assets/logos/ho-favicon.ico',
            touch: '/assets/logos/ho-apple-touch-icon.png'
        },
        opengraphImageUrl: '/assets/logos/ho-opengraph-image.png',
        homeKey: 'Home',
        header: {
            organisationLogo: '<img src="' + _customPathPrefix + '/assets/logos/ho_logo.svg" height="34px" alt="Home Office Logo">',
            organisationName: 'Home Office',
            productName: 'Engineering Guidance and Standards',
            search: {
                label: 'Search site',
                indexPath: '/search.json',
                sitemapPath: '/sitemap'
            }
        },
        footer: {
            copyright: {
                html: '© <a class="govuk-footer__link" href="https://github.com/HO-CTO/engineering-guidance-and-standards/blob/main/LICENCE">Crown Copyright (Home Office)</a>'
            },
            meta: {
                items: [
                    {
                        href: _customPathPrefix + '/about/',
                        text: 'About'
                    },
                    {
                        href: _customPathPrefix + '/cookies/',
                        text: 'Cookies'
                    },
                    {
                        href: 'https://github.com/HO-CTO/engineering-guidance-and-standards',
                        text: 'GitHub repository'
                    }
                ]
            }
        },
        stylesheets: ['/styles/base.css'],
    };
    eleventyConfig.addPlugin(govukEleventyPlugin, govukPluginOptions)

    // Customise markdown-it renderer provided by x-gov 11ty plugin. Plugin execution is
    // deferred, so this needs to be a plugin, and added after the x-gov plugin is.
    eleventyConfig.addPlugin((eleventyConfig) => {
        const md = require('@x-govuk/govuk-eleventy-plugin/lib/markdown-it.js')(govukPluginOptions)

        md.use(require('./lib/markdown/dl-as-govuk-summary-list'));

        eleventyConfig.setLibrary('md', md);
    })

    eleventyConfig.addFilter("itemsFromPaginationWithPathPrefix", (pagination) => {
      const items = []
      pagination.pages.forEach((item, index) => {
        items.push({
          current: index === pagination.pageNumber,
          number: index + 1,
          href: _customPathPrefix + pagination.hrefs[index]
        })
      })
      return items;
    });

    eleventyConfig.addFilter("postDate", (dateObj) => {
        return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_FULL);
    });

    // Used for tag page generation
    eleventyConfig.addFilter("getAllTags", collection => {
        let tagSet = new Set();
        for(let item of collection) {
            (item.data.tags || []).forEach(tag => tagSet.add(tag));
        }
        return Array.from(tagSet);
    });

    eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
        // Tags in array are ignored, no tag list page is generated for these
        return (tags || []).filter(tag => ["homepage"].indexOf(tag) === -1);
    });

    eleventyConfig.addCollection("homepageLinks", function(collectionApi) {
      return collectionApi.getFilteredByGlob([
        "**/patterns.md",
        "**/principles.md",
        "**/standards.md"]);
    });

    eleventyConfig.addCollection("getAllStandardsOrderedByID", function(collectionApi) {
      return collectionApi.getFilteredByGlob("**/standards/*.md").sort(function(a, b) {
          return a.data.id.localeCompare(b.data.id); // sort by ID ascending
        });
    });

    eleventyConfig.addCollection("getAllStandardsOrderedByTitle", function(collectionApi) {
      return collectionApi.getFilteredByGlob("**/standards/*.md").sort(function(a, b) {
          return a.data.id.localeCompare(b.data.title); // sort by title ascending
        });
    });

    eleventyConfig.addCollection("getAllPrinciplesOrderedByTitle", function(collectionApi) {
      return collectionApi.getFilteredByGlob("**/principles/*.md").sort(function(a, b) {
        return a.data.title.localeCompare(b.data.title); // sort by title ascending
      });
    });

    eleventyConfig.addCollection("getAllPatternsOrderedByTitle", function(collectionApi) {
      return collectionApi.getFilteredByGlob("**/patterns/*.md").sort(function(a, b) {
        return a.data.title.localeCompare(b.data.title); // sort by title ascending
      });
    });

    eleventyConfig.addGlobalData("phaseBannerConfiguration", () => {
      return {
        tag: {
          text: "Alpha"
        },
        html: 'This is a new service – your <a class="govuk-link" target="_blank" href="https://www.homeofficesurveys.homeoffice.gov.uk/s/8PDDG2/">feedback (opens in a new tab)</a> will help us to improve it.'
      }
    });

    eleventyConfig.addGlobalData('pathPrefix', _customPathPrefix);

    return {
        dataTemplateEngine: 'njk',
        htmlTemplateEngine: 'njk',
        markdownTemplateEngine: 'njk',
        dir: {
            data: '../_data',
            layouts: '../_includes/layouts',
            includes: '../_includes',
            input: 'docs'
        },
        pathPrefix: _customPathPrefix
    }
};
