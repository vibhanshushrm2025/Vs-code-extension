<script lang="ts">
//   import fetch from "./../../node_modules/node-fetch";
//   import cheerio from "./../../node_modules/cheerio";
//   import Bluebird from "bluebird";//bluebird
//   const getRawData = (URL:string) => {
//     return fetch(URL)
//       .then((response) => response.text())
//       .then((data) => {
//         return data;
//       });
//   };

//   const URL = "https://codeforces.com/contest/1725";
//   const baseURL = "https://codeforces.com";


//   const scrape = async () => {
//     const rawData = await getRawData(URL);
//     const $ = cheerio.load(rawData);
//     var list_of_q = $(
//       "#body #pageContent.content-with-sidebar .datatable .problems tbody tr td div div a"
//     );
//     Bluebird.each(list_of_q, async function (q:string) {
//       var relLink = $(q).attr("href");
//       var link = baseURL + relLink;
//       let url_ = link;
//       console.log(url_);
//       var a = await q_scrape(url_);
//     });
//   };
//   interface sample {
// title: string;
// }
//   var questions: sample[];
//   const q_scrape = async (url: string) => {
//     const rawData = await getRawData(url);
//     const $ = cheerio.load(rawData);
//     const q = $(
//       "#pageContent.content-with-sidebar .problemindexholder .ttypography .problem-statement"
//     );
//     questions.push({
//       title: $(q).find(".title").text(),
//     });
//     console.log(questions[questions.length - 1]);
//   };
//   scrape();


</script>

<style>
</style>
<h1>hello</h1>