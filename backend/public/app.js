async function submit() {
    const data = {
      company:          document.getElementById('company').value,
      job_url:          document.getElementById('job_url').value,
      applied_date:     document.getElementById('applied_date').value || null,
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
    }
}

load_recent_job_tiles();
document.getElementById('submit').addEventListener('click', submit);
load();