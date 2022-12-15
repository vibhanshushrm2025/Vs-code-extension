import cors from 'cors';
import express from 'express';
import fetch from 'node-fetch';
import cheerio from 'cheerio'
import Bluebird from 'bluebird'
const app = express();

app.use(cors({
    origin: "*",
}));

app.get('/contests/:contestId', async (req, res) => {
    const { contestId } = req.params;
    const questions = await scrape(contestId);
    res.send(questions);
})
app.use((req, res) => {
    res.send("<h1>1235</h1>");
    console.log("we got a new code");
})
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
})

var line_ch = ($, ele) => {
    let to_iter = $(ele).find('p');
    var ret = "";
    for (let i of to_iter) {
        ret += $(i).text();
        ret += "\n" + "\n";
    }
    return ret;
}
async function scrape(id) {
    const getRawData = (URL) => {
        return fetch(URL)
            .then((response) => response.text())
            .then((data) => {
                return data;
            });
    };

    const URL = "https://codeforces.com/contest/" + id;
    const baseURL = "https://codeforces.com";

    const scrape = async () => {
        const rawData = await getRawData(URL);
        const $ = cheerio.load(rawData);

        const list_of_q = $("#body #pageContent.content-with-sidebar .datatable .problems tbody tr td div div a");
        await Bluebird.each(list_of_q, async function (q) {
            var relLink = $(q).attr('href');
            console.log(relLink);
            var link = baseURL + relLink
            let url_ = link;
            console.log(url_);
            var a = await q_scrape(url_);
        })
        return questions;
    }
    const questions = [];
    const q_scrape = async (url) => {
        const rawData = await getRawData(url);
        const $ = cheerio.load(rawData);
        const q = $("#pageContent.content-with-sidebar .problemindexholder .ttypography .problem-statement")
        var prop_tit = $('.property-title');
        $(prop_tit).remove();
        var section_tit = $('.section-title');
        $(section_tit).remove();
        function input_output(what) {
            var inputs = $(q).find(what);
            const input = [];
            for (let i of inputs) {
                var cases = $(i).find('pre div');
                var values = "";
                if (cases.length != 0) {
                    for (let c of cases) {
                        values += $(c).text();
                        values += "\n";
                    }
                    input.push(values);
                }
                else {
                    $(inputs).find('.title').remove();
                    for (let i of inputs) {
                        input.push($(i).text());
                    }
                }
            }
            return input;
        }
        const input = input_output('.input');
        var outputs = $(q).find('.output');
        $(outputs).find('.title').remove();
        const output = [];
        for (let i of outputs) {
            output.push($(i).text());
        }
        questions.push({
            title: $($(q).find('.title')[0]).text(),
            'time-limit': $(q).find('.time-limit').text(),
            'memory-limit': $(q).find('.memory-limit').text(),
            'input-file': $(q).find('.input-file').text(),
            'output-file': $(q).find('.output-file').text(),
            question: line_ch($, $(q).find('.header').next()),
            'input-specification': $(q).find('.input-specification').text(),
            'output-specification': $(q).find('.output-specification').text(),
            'note': $(q).find('.note').text(),
            'example': {
                'input': input,
                'output': output
            }
        });
        console.log(questions[questions.length - 1]);
    }
    const ret = scrape();
    return ret;
}
