/******************************
HTTP protocol functions
POST: add new row to data table
PUT: modify row in data table
DELETE: remove row from data table
*******************************/

// re-fetch and rebuild the state every time data is passed to or from the DB
// i made the SQL table the authority
async function refreshStateData() {
    const rows = await (await fetch('/appwebaddress')).json();
    state.jobs = {};
    for (const r of rows) state.jobs[r.id] = r; // server rows = source of truth
    render();
  }

////// PUT / UPDATE //////
async function update_row() {
    const data = {
        job_id:           state.currentJob.id,
        company:          editCompany.value,
        role:             editRole.value,
        req_num:          editReqNum.value,
        job_url:          editUrl.value,
        applied_date:     editApplied.value || null,
        interviewed_date: editInterviewed.value || null,
        reached_out_date: editReachedOut.value || null,
        job_status:       editStatus.value,
        interest:         editInterest.value || null,
        lane:             editLane.value || null,
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
      role:             editRole.value,
      req_num:          editReqNum.value,
      job_url:          editUrl.value,
      applied_date:     editApplied.value || null,
      interviewed_date: editInterviewed.value || null,
      reached_out_date: editReachedOut.value || null,
      job_status:       editStatus.value,
      interest:         editInterest.value || null,
      lane:             editLane.value || null,
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
const detailRole = document.getElementById("detail-role");
const detailReqNum = document.getElementById("detail-req-num");
const detailStatus = document.getElementById("detail-status");
const detailInterest = document.getElementById("detail-interest");
const detailLane = document.getElementById("detail-lane");
const detailApplied = document.getElementById("detail-applied");
const detailInterviewed = document.getElementById("detail-interviewed");
const detailReachedOut = document.getElementById("detail-reached-out");
const detailMatch = document.getElementById("detail-match");
const detailUrl = document.getElementById("detail-url");
const detailNotes = document.getElementById("detail-notes");

// right panel when editing details -- EDIT mode
const editCompany = document.getElementById("company_textarea");
const editRole = document.getElementById("role_textarea");
const editReqNum = document.getElementById("req_num_textarea");
const editStatus = document.getElementById("status_dropdown");
const editInterest = document.getElementById("interest_dropdown");
const editLane = document.getElementById("lane_dropdown");
const editApplied = document.getElementById("applied_date_select");
const editInterviewed = document.getElementById("interviewed_date_select");
const editReachedOut = document.getElementById("reached_out_date_select");
const editMatch = document.getElementById("match_textarea");
const editUrl = document.getElementById("url_textarea");
const editNotes = document.getElementById("notes_textarea");

// function to wipe reused elements' values
function scrubDom(){
    editCompany.value      = "";
    editRole.value         = "";
    editReqNum.value       = "";
    editStatus.value       = "";
    editInterest.value     = "";
    editLane.value         = "";
    editApplied.value      = "";
    editInterviewed.value  = "";
    editReachedOut.value   = "";
    editMatch.value        = "";
    editUrl.value          = "";
    editNotes.value        = "";
}

function showForm(mode) {
    console.log(`in showForm: passed -- ${mode}`)

    if (mode === "view") {
        /////// PAINT DISPLAY VALUES FROM STATE ///////
        if (state.currentJob) {
            // right panel view
            detailCompany.textContent      = state.currentJob.company;
            detailRole.textContent         = state.currentJob.role;
            detailReqNum.textContent       = state.currentJob.req_num;
            detailStatus.textContent       = state.currentJob.job_status;
            detailInterest.textContent     = state.currentJob.interest;
            detailLane.textContent         = state.currentJob.lane;
            detailApplied.textContent      = state.currentJob.applied_date;
            detailInterviewed.textContent  = state.currentJob.interviewed_date;
            detailReachedOut.textContent   = state.currentJob.reached_out_date;
            detailMatch.textContent        = state.currentJob.match_percentage;
            detailUrl.textContent          = state.currentJob.job_url;
            detailNotes.textContent        = state.currentJob.notes;
        }

        /* SHOW ALL POPULATED BOXES WITH DATA PERTAINING TO THE SELECTED JOB TILE */
        editButton.style.display = "";
        submitButton.style.display = "none";

        // COMPANY
        detailCompany.style.display = "";
        editCompany.style.display = "none";

        // ROLE
        detailRole.style.display = "";
        editRole.style.display = "none";

        // REQ #
        detailReqNum.style.display = "";
        editReqNum.style.display = "none";

        // STATUS
        detailStatus.style.display = "";    // start display current value
        editStatus.style.display = "none";           // stop display editable element

        // INTEREST
        detailInterest.style.display = "";
        editInterest.style.display = "none";

        // LANE
        detailLane.style.display = "";
        editLane.style.display = "none";

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

        return;
    }

    // if displaying elements for an edit, pre-populate each field with current vals
    if (mode === "edit") {
        cancelButton.style.display = "";
        editCompany.value = state.currentJob.company;
        editRole.value = state.currentJob.role ?? "";
        editReqNum.value = state.currentJob.req_num ?? "";
        editStatus.value = state.currentJob.job_status;
        editInterest.value = state.currentJob.interest ?? "";
        editLane.value = state.currentJob.lane ?? "";
        editApplied.value = state.currentJob.applied_date?.slice(0, 10); // fixes ISO format
        editInterviewed.value = state.currentJob.interviewed_date?.slice(0, 10); 
        editReachedOut.value = state.currentJob.reached_out_date?.slice(0, 10); 
        editMatch.value = state.currentJob.match_percentage;
        editUrl.value = state.currentJob.job_url;
        editNotes.value = state.currentJob.notes;
    }

    // the following covers if "add" mode too

    editButton.style.display = "none";
    submitButton.style.display = "";

    // COMPANY
    detailCompany.style.display = "none";
    editCompany.style.display = "";

    // ROLE
    detailRole.style.display = "none";
    editRole.style.display = "";

    // REQ #
    detailReqNum.style.display = "none";
    editReqNum.style.display = "";

    // STATUS
    detailStatus.style.display = "none";    // stop display current value
    editStatus.style.display = "";           // start display editable element

    // INTEREST
    detailInterest.style.display = "none";
    editInterest.style.display = "";

    // LANE
    detailLane.style.display = "none";
    editLane.style.display = "";

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
        this.jobs = {};
    }

    // data: dict of parameters to update
    // e.g. 
    update(mode, data) {
        if (mode === "edit") {
            // change the current job's values to updates ones
            state.id                          = data.id;
            state.currentJob.company          = data.company;
            state.currentJob.role             = data.role;
            state.currentJob.req_num          = data.req_num;
            state.currentJob.job_url          = data.job_url;
            state.currentJob.applied_date     = data.applied_date;
            state.currentJob.interviewed_date = data.interviewed_date;
            state.currentJob.reached_out_date = data.reached_out_date;
            state.currentJob.job_status       = data.job_status;
            state.currentJob.interest         = data.interest;
            state.currentJob.lane             = data.lane;
            state.currentJob.match_percentage = data.match_percentage;
            state.currentJob.notes            = data.notes;
        }
        else if (mode === "add") {
            let new_job = data;
            state.jobs[data.id] = new_job;
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

// render the job tiles LEFT HAND panel
function renderTiles(){
    // const panel = document.getElementById("list-panel");
    const panel = document.getElementById("tiles");   // was "list-panel"

    panel.innerHTML = "";                 // clear what's there

    // sort chronologically: oldest applied_date first; missing dates sink to the bottom
    // const jobs = Object.values(state.jobs).sort((a, b) => {
    //     const da = a.applied_date ? new Date(a.applied_date).getTime() : Infinity;
    //     const db = b.applied_date ? new Date(b.applied_date).getTime() : Infinity;
    //     return da - db;
    // });

    const jobs = Object.values(state.jobs).sort((a, b) =>
        (a.company || "").localeCompare(b.company || "")
    );    

    for (const r of jobs) {
        // create a new tile for each row
        const tile = document.createElement("div");
        tile.className = "tile";

        tile.dataset.id = r.id;   // instead of closing over r.id in a per-tile listener

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
            if (!confirm("Delete this entry?")) return;
            const res = await del_row(r.id);
            if (res.ok) {
                tile.remove();   // only remove the tile if the server actually deleted it
            }
        });
        tile.append(info, trash);
     
        panel.appendChild(tile);
    }
  }

// to render (RIGHT SIDE) the detail-view of current job
function renderDetail() {
    console.log("In render function.")
    console.log(`Current state: ${state.mode}`)

    // container visibility is a function of state — decided in one place
    const hasContent = state.mode === "add" || state.mode === "edit" || !!state.currentJob;
    if (hasContent) {
        // we have something to show (a selected job, or we're adding/editing one)
        detailContent.style.display = "";      // show the detail/form box
        detailEmpty.style.display   = "none";  // hide the "Select a job" placeholder
    } else {
        // nothing selected and not adding — show the placeholder instead
        detailContent.style.display = "none";  // hide the detail/form box
        detailEmpty.style.display   = "";      // show the "Select a job" placeholder
    }

    if (state.mode === "edit") {
        console.log("In state.mode: edit")
        showForm(state.mode);
    } 
    else if (state.mode === "view") {
        console.log(`In render().view`)

        /////// TOGGLE DISPLAY ITEMS ///////
        showForm(state.mode);
    }
    else if (state.mode === "add") {
        console.log("In state.mode: add")

        // clear the DOM
        scrubDom()
        showForm(state.mode);
    }
} 

function render() {
    renderDetail();
    renderTiles();
}

// edit button listener
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

addButton.addEventListener("click", function() {
    setMode("add");
    render();
});

// cancel button listener
cancelButton.addEventListener("click", function () {
    setMode("view");
    render();
});

// submit button listener
submitButton.addEventListener("click", async () => {
    let data = null;
    if (state.mode === "edit") {
        data = await update_row(); // send newly entered data to update database
    }
    else if (state.mode === "add") {
        data = await submit();
    }
    refreshStateData(); // update state
    state.update(state.mode, data)   // pass mode; must run while mode is still "add"/"edit"
    setMode("view");
    render();
});

// tile click listener
document.getElementById("tiles").addEventListener("click", (e) => {
    if (e.target.closest(".trash")) return;              // trash has its own handler
    const tile = e.target.closest(".tile");              // .tile — class (NOT a tag)
    if (!tile) return;
  
    // rehydrate the full record from the one source of truth
    state.currentJob = state.jobs[Number(tile.dataset.id)];
    setMode("view");
  
    detailEmpty.style.display = "none";
    detailContent.style.display = "";

    refreshStateData(); // update state
    render();                                             // highlight lives in renderTiles now
  });
  
refreshStateData();