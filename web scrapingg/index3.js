import fetch from 'node-fetch'
import cheerio from 'cheerio'
import Bluebird from 'bluebird'//bluebird
const getRawData = (URL) => {
    return fetch(URL)
        .then((response) => response.text())
        .then((data) => {
            return data;
        });
};

const URL = "https://codeforces.com/contest/1725";
const baseURL = "https://codeforces.com";

const scrape = async () => {
    const rawData = await getRawData(URL);
    const $ = cheerio.load(rawData);
    const list_of_q = $("#body #pageContent.content-with-sidebar .datatable .problems tbody tr td div div a");
    Bluebird.each(list_of_q, async function (q) {
        var relLink = $(q).attr('href');
        var link = baseURL + relLink
        let url_ = link;
        console.log(url_);
        var a = await q_scrape(url_);
    })
}
const questions = [];
const q_scrape = async (url) => {
    const rawData = await getRawData(url);
    const $ = cheerio.load(rawData);
    const q = $("#pageContent.content-with-sidebar .problemindexholder .ttypography .problem-statement")
    questions.push({
        title: $(q).find('.title').text(),
        'time-limit': $(q).find('.time-limit').text(),
        'memory-limit': $(q).find('.memory-limit').text(),
        'input-file': $(q).find('.input-file').text(),
        'output-file': $(q).find('.output-file').text(),
        question: $(q).find('.header').next().text(),
        'input-specification': $(q).find('.input-specification').text(),
        'output-specification':$(q).find('.output-specification').text(),
        'note':$(q).find('.note').text(),
    });
    console.log(questions[questions.length-1]);
}
scrape();