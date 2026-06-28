const editButton = document.getElementById("edit_button");
const submitButton = document.getElementById("submit_button");
const cancelButton = document.getElementById("cancel_button");
const deleteButton = document.getElementById("delete_button");

const detailEmpty = document.getElementById("detail-empty");
const detailContent = document.getElementById("detail-content");
const detailCompany = document.getElementById("detail-company");
const detailStatus = document.getElementById("detail-status");
const detailApplied = document.getElementById("detail-applied");
const detailInterviewed = document.getElementById("detail-interviewed");
const detailReachedOut = document.getElementById("detail-reached-out");
const detailMatch = document.getElementById("detail-match");
const detailUrl = document.getElementById("detail-url");
const detailNotes = document.getElementById("detail-notes");

const editCompany = document.getElementById("company_textarea");
const editStatus = document.getElementById("status_dropdown");
const editApplied = document.getElementById("applied_date_select");
const editInterviewed = document.getElementById("interviewed_date_select");
const editReachedOut = document.getElementById("reached_out_date_select");
const editMatch = document.getElementById("match_textarea");
const editUrl = document.getElementById("url_textarea");
const editNotes = document.getElementById("notes_textarea");

const state = {
    currentJob: null,
    isEditing: false,
  };  

function render() {
    if (state.isEditing) {
        editButton.style.display = "none";
        submitButton.style.display = "";
        cancelButton.style.display = "";

        // COMPANY
        detailCompany.style.display = "none";
        editCompany.style.display = "";
        editCompany.value = state.currentJob.company;

        // STATUS
        detailStatus.style.display = "none";    // stop display current value
        editStatus.style.display = "";           // start display editable element
        editStatus.value = state.currentJob.job_status;

        // APPLIED DATE
        detailApplied.style.display = "none";    
        editApplied.style.display = "";           
        editApplied.value = state.currentJob.applied_date?.slice(0, 10); // fixes ISO format

        // INTERVIEWED DATE
        detailInterviewed.style.display = "none";    
        editInterviewed.style.display = "";          
        editInterviewed.value = state.currentJob.interviewed_date?.slice(0, 10); 

        // REACHED OUT TO RECRUITER DATE
        detailReachedOut.style.display = "none";    
        editReachedOut.style.display = "";          
        editReachedOut.value = state.currentJob.reached_out_date?.slice(0, 10); 

        // MATCH PERCENTAGE
        detailMatch.style.display = "none";
        editMatch.style.display = "";
        editMatch.value = state.currentJob.match_percentage;

        // JOB URL
        detailUrl.style.display = "none";
        editUrl.style.display = "";
        editUrl.value = state.currentJob.job_url;

        // NOTES
        detailNotes.style.display = "none";
        editNotes.style.display = "";
        editNotes.value = state.currentJob.notes;
    } else {
        /////// TOGGLE DISPLAY ITEMS ///////
        editButton.style.display = "";   // reset to default
        submitButton.style.display = "none";
        cancelButton.style.display = "none";

        // COMPANY
        detailCompany.style.display = "";
        editCompany.style.display = "none";

        // STATUS
        detailStatus.style.display = "";
        editStatus.style.display = "none";

        // APPLIED DATE
        detailApplied.style.display = "";
        editApplied.style.display = "none";

        // INTERVIEWED DATE
        detailInterviewed.style.display = "";
        editInterviewed.style.display = "none";

        // REACHED OUT TO RECRUITER DATE
        detailReachedOut.style.display = "";
        editReachedOut.style.display = "none";

        // MATCH PERCENTAGE
        detailMatch.style.display = "";
        editMatch.style.display = "none";

        // JOB URL
        detailUrl.style.display = "";
        editUrl.style.display = "none";

        // NOTES
        detailNotes.style.display = "";
        editNotes.style.display = "none";

        /////// PAINT DISPLAY VALUES FROM STATE ///////
        if (state.currentJob) {
            detailCompany.textContent      = state.currentJob.company;
            detailStatus.textContent       = state.currentJob.job_status;
            detailApplied.textContent      = state.currentJob.applied_date;
            detailInterviewed.textContent  = state.currentJob.interviewed_date;
            detailReachedOut.textContent   = state.currentJob.reached_out_date;
            detailMatch.textContent        = state.currentJob.match_percentage;
            detailUrl.textContent          = state.currentJob.job_url;
            detailNotes.textContent        = state.currentJob.notes;
        }
    }
} 

////// POST //////
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

////// PUT / UPDATE //////
async function update_row() {
    const data = {
        job_id:           state.currentJob.id,
        company:          editCompany.value,
        job_url:          editUrl.value,
        applied_date:     editApplied.value || null,
        interviewed_date: editInterviewed.value || null,
        reached_out_date: editReachedOut.value || null,
        job_status:       editStatus.value,
        match_percentage: editMatch.value || null,
        notes:            editNotes.value,
    };
    const res = await fetch('/appwebaddress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({body: data}),
    });
    const saved = await res.json();   // parse the saved row out of the response

    // change the current job's values to updates ones
    state.currentJob.company          = saved.company;
    state.currentJob.job_url          = saved.job_url;
    state.currentJob.applied_date     = saved.applied_date;
    state.currentJob.interviewed_date = saved.interviewed_date;
    state.currentJob.reached_out_date = saved.reached_out_date;
    state.currentJob.job_status       = saved.job_status;
    state.currentJob.match_percentage = saved.match_percentage;
    state.currentJob.notes            = saved.notes;
}

////// DELETE ROW //////
async function del_row(jobId){
    const res = await fetch('/appwebaddress', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({body: {job_id: jobId}}),
    });
    return res;   // so the caller can check if it worked
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

        // left side: company + status stacked together
        const info = document.createElement("div");
        info.append(company, status);

        // right side: trash can
        const trash = document.createElement("span");
        trash.className = "trash";
        trash.textContent = "🗑️";
        trash.addEventListener("mousedown", function(e) {
            e.stopPropagation();   // stop the tile's mousedown from firing when clicking on trash specifically
        });
        
        trash.addEventListener("click", async function(e) {
            e.stopPropagation();    // defensive: keep this click from bubbling to the tile
            const res = await del_row(r.id);
            if (res.ok) {
                tile.remove();   // only remove the tile if the server actually deleted it
            }
        });
        

        tile.append(info, trash);

        document.getElementById("list-panel").appendChild(tile);
        tile.addEventListener("mousedown", function() {
            // set state
            state.currentJob = r;
            state.isEditing = false;   // a fresh tile click always starts in view mode

            // remove empty panel boilerplate text, reveal the detail pane
            detailEmpty.style.display = "none";
            detailContent.style.display = "";

            tile.style.backgroundColor = "lightblue";

            render();   // paint the detail panel from state
        });
        tile.addEventListener("mouseup", function() {
            tile.style.backgroundColor = "white";
        });
    }
}

editButton.addEventListener("click", function() {
    state.isEditing = !state.isEditing;   // toggle: true→false, false→true
    render();
});

cancelButton.addEventListener("click", function () {
    state.isEditing = false;
    render();
});

submitButton.addEventListener("click", async () => {
    await update_row();
    state.isEditing = false;
    render();
});


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

load_recent_job_tiles();
// document.getElementById('submit').addEventListener('click', submit);
// load();