async function submit() {
    const data = {
      company:          document.getElementById('company').value,
      job_url:          document.getElementById('job_url').value,
      applied_date:     document.getElementById('applied_date').value || null,
      interviewed_date: document.getElementById('interviewed_date').value || null,
      reached_out_date: document.getElementById('reached_out_date').value || null,
      job_status:       document.getElementById('job_status').value,
      match_percentage: document.getElementById('match_percentage').value || null,
      notes:            document.getElementById('notes').value,
    };
    await fetch('/appwebaddress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({body: data}),
    });
    load();
  }
  
async function load() {
const res = await fetch('/appwebaddress');
const rows = await res.json();
const list = document.getElementById('list');
list.innerHTML = '';
for (const r of rows) {
    const li = document.createElement('li');
    li.textContent = r.company + ' — ' + r.job_status;
    list.appendChild(li);
}
}

async function load_recent_job_tiles() {

    const res = await fetch('/appwebaddress');  // get all rows, organized in desc order or recency
    const rows = await res.json();
    for (const r of rows) {
        // create a new tile for each row
        const tile = document.createElement("div");
        tile.className = "tile";

        const company = document.createElement("div");
        company.className = "company";
        company.textContent = r.company;

        const status = document.createElement("div");
        status.className = "status";
        status.textContent = r.status;

        tile.append(company, status);

        document.getElementById("list-panel").appendChild(tile);
        tile.addEventListener("mousedown", function() {
            // remove empty panel text
            document.getElementById("detail-empty").style.display = "none"; 

            tile.style.backgroundColor = "lightblue";

            // in right display pane
            document.getElementById("detail-content").style.display = ""; 

            document.getElementById("detail-status").textContent = r.job_status;
            document.getElementById("detail-applied").textContent = r.applied_date;
            document.getElementById("detail-interviewed").textContent = r.interviewed_date;
            document.getElementById("detail-reached-out").textContent = r.reached_out_date;
            document.getElementById("detail-match").textContent = r.match_percentage;
            document.getElementById("detail-url").textContent = r.job_url;
            document.getElementById("detail-notes").textContent = r.notes;
        });
        tile.addEventListener("mouseup", function() {
            tile.style.backgroundColor = "white";
        });
    }
}

load_recent_job_tiles();
document.getElementById('submit').addEventListener('click', submit);
load();