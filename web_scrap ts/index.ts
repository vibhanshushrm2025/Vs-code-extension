import axios from 'axios';
import cheerio from 'cheerio';
import Bluebird from 'bluebird'
var url = 'https://www.premierleague.com/stats/top/players/goals?se=-1&cl=-1&iso=-1&po=-1?se=-1'; // URL we're scraping
const AxiosInstance = axios.create(); // Create a new Axios Instance

interface Questions {
    //q_no: number;
    rel_link: string;
}
interface Quesdata {
    title: string;
    question: string;
}
const questions: Quesdata[] = [];
//
const _url = "https://codeforces.com/contest/1720";
const baseURL = "https://codeforces.com";
url = _url;
//

// Send an async HTTP Get request to the url
AxiosInstance.get(url)
    .then( // Once we have data returned ...
        response => {
            const html = response.data; // Get the HTML from the HTTP request
            const $ = cheerio.load(html); // Load the HTML string into cheerio
            const list_questions = $("#body #pageContent.content-with-sidebar .datatable .problems tbody tr td div div a"); // Parse the HTML and extract just whatever code contains .statsTableContainer and has tr inside
            const questions: Questions[] = [];
            Bluebird.each(list_questions, async (elem) => {
                const rel_link: string = baseURL + $(elem).attr('href'); // Parse the name
                //const q_no: number = i;
                questions.push({
                   // q_no,
                    rel_link,
                })
                var a = await get_question(rel_link);
            })
            console.log(questions);
        }
    )
    .catch(console.error); // Error handling

const get_question = async (link: string) => {
    await AxiosInstance.get(link)
        .then( // Once we have data returned ...
            response => {
                const html = response.data; // Get the HTML from the HTTP request
                const $ = cheerio.load(html); // Load the HTML string into cheerio
                const q = $("#pageContent.content-with-sidebar .problemindexholder .ttypography .problem-statement");
                const title: string = $(q).find('.title').text();
                const question: string = $(q).find('.header').next().text();
                questions.push({
                    title,
                    question
                });
                console.log(questions[questions.length-1]);
            }
        )
        .catch(console.error); // Error handling˝
}