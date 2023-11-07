const puppeteer = require("puppeteer");
const path = require('path');
const fs = require('fs');

let browser;
let page;

beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    await page.goto('file://' + path.resolve('./index.html'));
}, 30000);

afterAll((done) => {
    try {
        this.puppeteer.close();
    } catch (e) { }
    done();
});

describe("HTML structure", () => {
    it("`index.html` should contain appropriate meta tags", async () => {
        const metaTags = await page.$$('meta');
        expect(metaTags.length).toBeGreaterThan(1);
    });
    it("`index.html` should contain a title tag that is not empty", async () => {
        const title = await page.$eval('title', el => el.innerHTML);
        expect(title).not.toBe('');
    });
});

describe("Font size", () => {
    it("`:root` pseduo-class should be used to set the font-size", async () => {
        const stylesheet = fs
            .readFileSync(path.resolve('./style.css'), 'utf8')
            .replace(/\s/g, '');
        expect(stylesheet).toMatch(/:root{[^}]*font-size:/);
    });
});

describe("Favicon", () => {
    it("'lollipop.ico' image should be used as the favicon", async () => {
        const favicon = await page.$eval('link[rel="icon"]', el => el.href);
        expect(favicon).toContain('lollipop.ico');
    });
});

describe("Google fonts", () => {
    it("'Quicksand' and 'Monoton' Google fonts should be used", async () => {
        const fontFamily = await page.$eval('body', el => getComputedStyle(el).fontFamily);
        expect(fontFamily).toMatch(/Quicksand|Monoton/);
    });
});

describe("Header styling", () => {
    it("H1 tag in the Header should have text-shadow", async () => {
        const textShadow = await page.$$eval('*', el => Array.from(el).map(e => getComputedStyle(e).getPropertyValue('text-shadow')));
        expect(textShadow.some(e => e !== 'none')).toBeTruthy();
    });
});

describe("Font awesome Icons", () => {
    it("Font awesome icons should be used on the page", async () => {
        const iconClasses = ['fas', 'fa', 'fab', 'fa-solid'];
        const selector = iconClasses.map(cls => `i[class*="${cls}"]`).join(', ');

        const fontAwesomeIcons = await page.$$(selector);
        expect(fontAwesomeIcons.length).toBeGreaterThan(0);
    });
});

describe("Contact Page", () => {
    it("The 'Drop me a line' link Should redirect to `contact.html` page", async () => {
        const targetBlank = await page.$eval('a[href="contact.html"]', el => el.hasAttribute('target'));
        if (targetBlank === true) {
            const [newPage] = await Promise.all([
                new Promise(x => browser.once('targetcreated', target => x(target.page()))),
                page.click('a[href="contact.html"]'),
            ]);
            const url = await newPage.url();
            expect(url).toMatch(/contact.html/);
        } else {
            const [samePage] = await Promise.all([
                page.waitForNavigation(),
                page.click('a[href="contact.html"]'),
            ]);
            const url = await samePage.url();
            expect(url).toMatch(/contact.html/);
        }
    });
    it("Contact Page Should contain a 'go back' link to index.html", async () => {
        await page.goto('file://' + path.resolve('./contact.html'));
        const targetBlank = await page.$eval('a[href="index.html"]', el => el.hasAttribute('target'));
        if (targetBlank === true) {
            const [newPage] = await Promise.all([
                new Promise(x => browser.once('targetcreated', target => x(target.page()))),
                page.click('a[href="index.html"]'),
            ]);
            const url = await newPage.url();
            expect(url).toMatch(/index.html/);
        } else {
            const [samePage] = await Promise.all([
                page.waitForNavigation(),
                page.click('a[href="index.html"]'),
            ]);
            const url = await samePage.url();
            expect(url).toMatch(/index.html/);
        }
    });
    it("Contact page exists", async () => {
        await page.goto('file://' + path.resolve('./contact.html'));
        expect(page.url()).toBe('file://' + path.resolve('./contact.html'));
        const body = await page.$eval('body', el => el.innerHTML);
        expect(body).toBeTruthy();
    });
});
