const detailEmpty = document.getElementById("detail-empty"); 
const detailContent = document.getElementById("detail-content"); 
const detailStatus = document.getElementById("detail-status");
const detailApplied = document.getElementById("detail-applied");
const detailInterviewed = document.getElementById("detail-interviewed");
const detailReachedOut = document.getElementById("detail-reached-out");
const detailMatch = document.getElementById("detail-match");
const detailUrl = document.getElementById("detail-url");
const detailNotes = document.getElementById("detail-notes");

const editButton = document.getElementById("edit_button");

const statusSelect = document.getElementById("status_dropdown");
const appliedBox = document.getElementById("applied_textarea");
const interviewedBox = document.getElementById("interviewed_textarea");
const reachedOutBox = document.getElementById("reached_out_textarea");
const matchBox = document.getElementById("match_textarea");
const urlBox = document.getElementById("url_textarea");
const notesBox = document.getElementById("notes_textarea");

const state = {
    currentJob: null,
    isEditing: false,
  };  

function render() {
    if (state.isEditing) {
        editButton.style.backgroundColor = "lightblue";

        detailStatus.style.display = "none";    // stop display current value
        statusSelect.style.display = "";           // start display editable element
        statusSelect.value = state.currentJob.job_status;


        appliedBox.style.display = "";
        interviewedBox.style.display = "";
        reachedOutBox.style.display = "";
        matchBox.style.display = "";
        urlBox.style.display = "";
        notesBox.style.display = "";

        // appliedBox.style.display = "";
        // interviewedBox.style.display = "";
        // reachedOutBox.style.display = "";
        // matchBox.style.display = "";
        // urlBox.style.display = "";
        // notesBox.style.display = "";
    } else {
        editButton.style.backgroundColor = "";   // reset to default

        detailStatus.style.display = "";    // stop display current value
        statusSelect.style.display = "none";           // start display editable element
        // state.currentJob.job_status = statusSelect.value;


        statusSelect.style.display = "none";
        appliedBox.style.display = "none";
        interviewedBox.style.display = "none";
        reachedOutBox.style.display = "none";
        matchBox.style.display = "none";
        urlBox.style.display = "none";
        notesBox.style.display = "none";

        submit()
    }
} 

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
            // set state
            state.currentJob = r;

            // make edit button visible
            editButton.style.display = "";

            // remove empty panel boilerplate text, to make way to detailed display of selected job info
            detailEmpty.style.display = "none";

            tile.style.backgroundColor = "lightblue";

            // in right display pane
            detailContent.style.display = "";

            detailStatus.textContent = r.job_status;
            detailApplied.textContent = r.applied_date;
            detailInterviewed.textContent = r.interviewed_date;
            detailReachedOut.textContent = r.reached_out_date;
            detailMatch.textContent = r.match_percentage;
            detailUrl.textContent = r.job_url;
            detailNotes.textContent = r.notes;
        });
        tile.addEventListener("mouseup", function() {
            tile.style.backgroundColor = "white";
        });

        editButton.addEventListener("mousedown", function() {
            state.isEditing = true;
            render();
        });

        document.getElementById("edit_button").addEventListener("mouseup", function() {
            state.isEditing = false;
            render();
        });
    }
}

load_recent_job_tiles();
document.getElementById('submit').addEventListener('click', submit);
load();