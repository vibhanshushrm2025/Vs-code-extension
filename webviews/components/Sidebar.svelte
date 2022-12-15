<script>
  let gh;
  let i = 0;
  async function pre() {
    if (i != 0) {
      i--;
      let c=i+1;
      let fi=document.getElementById(String(c));
      fi.style.display="none";
      let se = document.getElementById(String(i));
      se.style.removeProperty('display');
    }
  }
  async function ne() {
    if (i != gh.length - 1) {
      i++;
      let c= i-1;
      let fi=document.getElementById(String(c));
      fi.style.display="none";
      let se = document.getElementById(String(i));
      se.style.removeProperty('display');
    }
    
  }
  async function re(e) {
    e.preventDefault();
    i = 0;
    let x = document.getElementById("hh");
    x.innerHTML = "";
    x.innerHTML = "Loading....";
    let element = document.getElementById("hn");
    element.setAttribute("disabled", "true");
    let n = document.getElementById("ii").value;
    console.log(n);
    var s = `https://webscrape-cf-qs.onrender.com/contests/${n}`;
    var response = await fetch(s);
    console.log("hy");
    const data = await response.text();
    gh = JSON.parse(data);
    element.removeAttribute("disabled");
    console.log(gh.length);
    console.log(gh);

    x.innerHTML="";

    for(let j=0;j<gh.length;j++)
    {
      let y = document.createElement("div");
      x.appendChild(y);
      y.setAttribute("id",String(j));
      if(j!=0)
      {
        y.style.display="none";
      }
      y.innerHTML = "";
      let arri = gh[j]["example"]["input"]
      let arro = gh[j]["example"]["output"]
      let si = arro.length
      let t = "sq" + j
    y.innerHTML = `<span>Total no. of questions : ${
      gh.length
    }</span><br><button disabled>Question Number : ${j + 1}</button><br><h1>${
      gh[j].title
    }</h1><br><span>INPUT : ${gh[j]["input-file"]}</span><br><span>OUTPUT : ${
      gh[j]["output-file"]
    }</span><br><span>TIME - LIMIT : ${gh[j]["time-limit"]}</span><br><span>MEMORY - LIMIT : ${
      gh[j]["memory-limit"]
    }</span><br><br><h2>Q.</h2><h3>${
      gh[j].question
    }</h3><br><h2 id=${t}>Sample I/O</h2></h3><br><h2>Input:</h2><h3>${
      gh[j]["input-specification"]
    }</h3><br><h2>Output:</h2><h3>${
      gh[j]["output-specification"]
    }</h3><br><h2>Note:</h2><h3>${gh[j].note}</h3>`;
    let r = document.getElementById(t)
    for(let jk=0;jk<si;jk++){
      let nd = document.createElement('div')
      r.appendChild(nd)
      nd.innerHTML=`<h5>${jk+1}.</h5>          <h5>Input :${arri[jk]}</h5><h5>Output : ${arri[jk]}</h5>`
    }
    }
    MathJax.Hub.Config({
			tex2jax: {
				inlineMath: [["$$$", "$$$"]],
				displayMath: [["$$$$$$", "$$$$$$"]],
			},
		});
		MathJax.Hub.Configured();
    MathJax.Hub.Typeset();
  }

</script>

<form>
  <div id="hj">
    <input type="text" placeholder="Contest ID" id="ii" />
    <br />
    <button type="submit" on:click={re} id="hn">Get Questions</button>
  </div>
</form>

<div id="hh">No questions to display ......Enter contest id</div>
<button id="next" on:click={ne} >Next &rarr</button>
<button id="prev
ious" on:click={pre}> &larr Previous</button>

<style>
  
</style>
