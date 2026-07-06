/******************************
HTTP protocol functions
POST: add new row to data table
PUT: modify row in data table
DELETE: remove row from data table
*******************************/

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
        interest:         editInterest.value || null,
        match_percentage: editMatch.value || null,
        notes:            editNotes.value,
    };
    const res = await fetch('/appwebaddress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({body: data}),
    });
    const saved = await res.json();   // parse the saved row out of the response
    return saved;
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

////// POST //////
async function submit() {
    const data = {
      company:          editCompany.value,
      job_url:          editUrl.value,
      applied_date:     editApplied.value || null,
      interviewed_date: editInterviewed.value || null,
      reached_out_date: editReachedOut.value || null,
      job_status:       editStatus.value,
      interest:         editInterest.value || null,
      match_percentage: editMatch.value || null,
      notes:            editNotes.value,
    };
    const res = await fetch('/appwebaddress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({body: data}),
    });
    const saved = await res.json();   // parse the saved row out of the response
    return saved;
}

/******************************
DOM element handles
*******************************/
// buttons
const editButton = document.getElementById("edit_button");
const submitButton = document.getElementById("submit_button");
const cancelButton = document.getElementById("cancel_button");
const deleteButton = document.getElementById("delete_button");
const addButton = document.getElementById("add_button");

// right panel when showing job details -- VIEW mode
const detailEmpty = document.getElementById("detail-empty");
const detailContent = document.getElementById("detail-content");

const detailCompany = document.getElementById("detail-company");
const detailStatus = document.getElementById("detail-status");
const detailInterest = document.getElementById("detail-interest");
const detailApplied = document.getElementById("detail-applied");
const detailInterviewed = document.getElementById("detail-interviewed");
const detailReachedOut = document.getElementById("detail-reached-out");
const detailMatch = document.getElementById("detail-match");
const detailUrl = document.getElementById("detail-url");
const detailNotes = document.getElementById("detail-notes");

// right panel when editing details -- EDIT mode
const editCompany = document.getElementById("company_textarea");
const editStatus = document.getElementById("status_dropdown");
const editInterest = document.getElementById("interest_dropdown");
const editApplied = document.getElementById("applied_date_select");
const editInterviewed = document.getElementById("interviewed_date_select");
const editReachedOut = document.getElementById("reached_out_date_select");
const editMatch = document.getElementById("match_textarea");
const editUrl = document.getElementById("url_textarea");
const editNotes = document.getElementById("notes_textarea");

// function to wipe reused elements' values
function scrubDom(){
    editCompany.value      = "";
    editStatus.value       = "";
    editInterest.value     = "";
    editApplied.value      = "";
    editInterviewed.value  = "";
    editReachedOut.value   = "";
    editMatch.value        = "";
    editUrl.value          = "";
    editNotes.value        = "";
}

function showForm(mode) {
    // if displaying elements for an edit, pre-populate each field with current vals
    if (mode === "edit") {
        cancelButton.style.display = "";
        editCompany.value = state.currentJob.company;
        editStatus.value = state.currentJob.job_status;
        editInterest.value = state.currentJob.interest ?? "";
        editApplied.value = state.currentJob.applied_date?.slice(0, 10); // fixes ISO format
        editInterviewed.value = state.currentJob.interviewed_date?.slice(0, 10); 
        editReachedOut.value = state.currentJob.reached_out_date?.slice(0, 10); 
        editMatch.value = state.currentJob.match_percentage;
        editUrl.value = state.currentJob.job_url;
        editNotes.value = state.currentJob.notes;
    }
    editButton.style.display = "none";
    submitButton.style.display = "";

    // COMPANY
    detailCompany.style.display = "none";
    editCompany.style.display = "";

    // STATUS
    detailStatus.style.display = "none";    // stop display current value
    editStatus.style.display = "";           // start display editable element

    // INTEREST
    detailInterest.style.display = "none";
    editInterest.style.display = "";

    // APPLIED DATE
    detailApplied.style.display = "none";
    editApplied.style.display = "";           

    // INTERVIEWED DATE
    detailInterviewed.style.display = "none";    
    editInterviewed.style.display = "";          

    // REACHED OUT TO RECRUITER DATE
    detailReachedOut.style.display = "none";    
    editReachedOut.style.display = "";          

    // MATCH PERCENTAGE
    detailMatch.style.display = "none";
    editMatch.style.display = "";

    // JOB URL
    detailUrl.style.display = "none";
    editUrl.style.display = "";

    // NOTES
    detailNotes.style.display = "none";
    editNotes.style.display = "";
}

class State {
    constructor() {
        this.mode = null;
        this.currentJob = null;
        this.jobs  =[];
    }

    // data: dict of parameters to update
    // e.g. 
    update(mode, data) {
        if (mode === "edit") {
            // change the current job's values to updates ones
            state.currentJob.company          = data.company;
            state.currentJob.job_url          = data.job_url;
            state.currentJob.applied_date     = data.applied_date;
            state.currentJob.interviewed_date = data.interviewed_date;
            state.currentJob.reached_out_date = data.reached_out_date;
            state.currentJob.job_status       = data.job_status;
            state.currentJob.interest         = data.interest;
            state.currentJob.match_percentage = data.match_percentage;
            state.currentJob.notes            = data.notes;
        }
        else if (mode === "add") {
            let new_job = data;
            state.jobs.push(new_job);
        }
    }
}

const state = new State()

const Mode = ["view", "edit", "add"];
function setMode(mode) {
    if (!Mode.includes(mode)) {
        throw new Error(`Invalid mode: ${mode}`);
    }
    const prev_mode = state.mode;
    state.mode = mode;
    console.log(`Successfully changed from ${prev_mode} ==> ${state.mode}`) // use backtick ` or str format won't work
}
setMode("view")

function renderTiles(){
    // const panel = document.getElementById("list-panel");
    const panel = document.getElementById("tiles");   // was "list-panel"

    panel.innerHTML = "";                 // clear what's there
    for (const r of state.jobs) {
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
     
        panel.appendChild(tile);
    }
  }

function render() {
    console.log("In render function.")
    console.log(`Current state: ${state.mode}`)

    if (state.mode === "edit") {
        console.log("In state.mode: edit")
        showForm(state.mode);
    } 
    else if (state.mode === "view") {
        console.log(`In render().view`)
        /////// TOGGLE DISPLAY ITEMS ///////
        showForm(state.mode);

        /////// PAINT DISPLAY VALUES FROM STATE ///////
        if (state.currentJob) {
            // right panel view
            detailCompany.textContent      = state.currentJob.company;
            detailStatus.textContent       = state.currentJob.job_status;
            detailInterest.textContent     = state.currentJob.interest;
            detailApplied.textContent      = state.currentJob.applied_date;
            detailInterviewed.textContent  = state.currentJob.interviewed_date;
            detailReachedOut.textContent   = state.currentJob.reached_out_date;
            detailMatch.textContent        = state.currentJob.match_percentage;
            detailUrl.textContent          = state.currentJob.job_url;
            detailNotes.textContent        = state.currentJob.notes;
        }
    }
    else if (state.mode === "add") {
        console.log("In state.mode: add")

        // clear the DOM
        scrubDom()
        showForm();
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
            console.log(`Clicked a tile.`)

            // set state
            state.currentJob = r;
            state.jobs.push(r)
            setMode("view");   // a fresh tile click always starts in view mode

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
    // toggle true false edit / view
    if (state.mode === "edit") {
        setMode("view");
    }
    else {
        setMode("edit");
    }

    console.log("setting mode to edit")
    render();
});

cancelButton.addEventListener("click", function () {
    setMode("view");
    render();
});

submitButton.addEventListener("click", async () => {
    let data = null;
    if (state.mode === "edit") {
        data = await update_row(); // send newly entered data to update database
    }
    else if (state.mode === "add") {
        data = await submit();
    }
    state.update(state.mode, data)   // pass mode; must run while mode is still "add"/"edit"
    setMode("view");
    renderTiles()
    render();
});

addButton.addEventListener("click", function() {
    setMode("add");
    detailContent.style.display = "";
    console.log("Clicked add button, now transitioning to add page view.")
    render();
});

load_recent_job_tiles();
renderTiles();