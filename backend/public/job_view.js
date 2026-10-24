/******************************
HTTP protocol functions
POST: add new row to data table
PUT: modify row in data table
DELETE: remove row from data table
*******************************/

class State {
    constructor() {
        this.mode = null;
        this.currentJob = null;
        this.jobs = {};
        this.sortBy = localStorage.getItem("sortBy") || "company";
    }

    // data: dict of parameters to update
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
            state.currentJob.offer_date       = data.offer_date;
            state.currentJob.rejected_date    = data.rejected_date;
            state.currentJob.reached_out_date = data.reached_out_date;
            state.currentJob.job_status       = data.job_status;
            state.currentJob.interest         = data.interest;
            state.currentJob.lane             = data.lane;
            state.currentJob.match_percentage = data.match_percentage;
            state.currentJob.salary           = data.salary;
            state.currentJob.min_salary       = data.min_salary;
            state.currentJob.max_salary       = data.max_salary;
            state.currentJob.notes            = data.notes;
            state.currentJob.resume_ver       = data.resume_ver;
        }
        else if (mode === "add") {
            let new_job = data;
            state.jobs[data.id] = new_job;
        }
    }
}

const state = new State()

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
    const [min_salary, max_salary] = bandValue();
    const data = {
        job_id:           state.currentJob.id,
        company:          editCompany.value,
        role:             editRole.value,
        req_num:          editReqNum.value,
        job_url:          editUrl.value,
        applied_date:     editApplied.value || null,
        interviewed_date: editInterviewed.value || null,
        offer_date:       editOffer.value || null,
        rejected_date:    editRejected.value || null,
        reached_out_date: editReachedOut.value || null,
        job_status:       editStatus.value,
        interest:         editInterest.value || null,
        lane:             editLane.value || null,
        match_percentage: editMatch.value || null,
        resume_ver:       editResumeVer.value || null,
        salary:           editSalary.value || null,
        min_salary,
        max_salary,
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
    const [min_salary, max_salary] = bandValue();
    const data = {
      company:          editCompany.value,
      role:             editRole.value,
      req_num:          editReqNum.value,
      job_url:          editUrl.value,
      applied_date:     editApplied.value || null,
      interviewed_date: editInterviewed.value || null,
      offer_date:       editOffer.value || null,
      rejected_date:    editRejected.value || null,
      reached_out_date: editReachedOut.value || null,
      job_status:       editStatus.value,
      interest:         editInterest.value || null,
      lane:             editLane.value || null,
      match_percentage: editMatch.value || null,
      resume_ver:       editResumeVer.value || null,
      salary:           editSalary.value || null,
      min_salary,
      max_salary,
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
const addButton = document.getElementById("add_button");
const sortSelect = document.getElementById("sort_select")

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
const detailResumeVer = document.getElementById("detail-resume-ver");
const detailBand = document.getElementById("detail-band");
const detailSalary = document.getElementById("detail-salary");
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
const editResumeVer = document.getElementById("resume_ver_input");
const editBand = document.getElementById("band_slider");
const editSalary = document.getElementById("salary_input");
const editUrl = document.getElementById("url_textarea");
const editNotes = document.getElementById("notes_textarea");
const editOffer = document.getElementById("offer_date_select");
const editRejected = document.getElementById("rejected_date_select");

// interview rounds -- these read and write /interviews, not the job form
const interviewList = document.getElementById("interview-list");
const interviewAdd = document.getElementById("interview-add");
const roundDate = document.getElementById("round_date_input");
const roundType = document.getElementById("round_type_input");
const roundOutcome = document.getElementById("round_outcome_select");
const roundNotes = document.getElementById("round_notes_textarea");
const addRoundButton = document.getElementById("add_round_button");

// status trail
const statusGhosts = document.getElementById("status_ghosts");
const statusCurrent = document.getElementById("status_current");
const statusCurrentDate = document.getElementById("status_current_date");
const dateDialog = document.getElementById("date_dialog");
const dateDialogInput = document.getElementById("date_dialog_input");
const dateDialogLabel = document.getElementById("date_dialog_label");

// dual-handle salary band slider. 0-0 means no band recorded, same as NULL in the db
noUiSlider.create(editBand, {
    start: [0, 0],
    connect: true,
    step: 5000,
    range: { min: 0, max: 300000 },
    tooltips: true,
    format: { to: n => Math.round(n), from: n => Number(n) },   // whole dollars, not "120000.00"
});

// "130000" -> "$130,000"
function money(n) {
    return n == null || n === "" ? "" : "$" + Number(n).toLocaleString();
}

// 0-0 means i never set a band, so store NULL instead of a fake one
function bandValue() {
    const [min, max] = editBand.noUiSlider.get();
    return max === 0 ? [null, null] : [min, max];
}

// tick under the bar showing where the requested salary sits.
// density -1 kills the filler pips, otherwise you get a whole scale
function markRequested() {
    const ask = Number(editSalary.value);
    if (ask) {
        editBand.noUiSlider.updateOptions({
            pips: { mode: "values", values: [ask], density: -1, format: { to: money } },
        });
    } else {
        editBand.noUiSlider.removePips();
    }
}

/******************************
Status trail
each status has one date column, listed here in the order they happen.
A status "happened" if its date box has a value in it.
there's no separate history list to keep in step with job_status.
*******************************/
const TRAIL = [
    { status: "PENDING",   input: editApplied },
    { status: "INTERVIEW", input: editInterviewed },
    { status: "OFFER",     input: editOffer },
    { status: "REJECTED",  input: editRejected },
];

let statusBeforeChange = "";   // so Cancel in the date popup can put the dropdown back

// find the TRAIL entry for a status, or null if that status has no date (SAVED)
function stepFor(status) {
    for (const step of TRAIL) {
        if (step.status === status) {
            return step;
        }
    }
    return null;
}

// "2026-06-25" -> "6/25/2026"
function fmtDate(isoDate) {
    const parts = isoDate.split("-");
    const year = parts[0];
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    return month + "/" + day + "/" + year;
}

// draw one box per status that has a date, oldest first.
// while editing, the current status is the dropdown instead of a box.
function renderStatusTrail(editing) {
    statusGhosts.innerHTML = "";   // clear; we rebuild the whole trail every time
    let boxesDrawn = 0;

    for (const step of TRAIL) {
        // no date means it never happened
        if (!step.input.value) {
            continue;
        }
        // the current status is the dropdown, not a box
        if (editing && step.status === editStatus.value) {
            continue;
        }

        const box = document.createElement("div");
        box.className = "trail-chip";

        const name = document.createElement("div");
        name.textContent = step.status;

        // first box is the application itself, removing it would blank applied_date
        if (editing && boxesDrawn > 0) {
            const remove = document.createElement("span");
            remove.className = "trail-x";
            remove.dataset.status = step.status;
            remove.title = "remove this step";
            remove.textContent = "×";
            name.appendChild(remove);
        }

        const when = document.createElement("div");
        when.className = "trail-date";
        when.textContent = fmtDate(step.input.value);

        box.appendChild(name);
        box.appendChild(when);
        statusGhosts.appendChild(box);
        boxesDrawn++;
    }

    if (editing) {
        statusCurrent.style.display = "";
    } else {
        statusCurrent.style.display = "none";
    }

    const current = stepFor(editStatus.value);
    if (current && current.input.value) {
        statusCurrentDate.textContent = fmtDate(current.input.value);
    } else {
        statusCurrentDate.textContent = "no date";
    }

    statusBeforeChange = editStatus.value;
}

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
    editOffer.value        = "";
    editRejected.value     = "";
    editReachedOut.value   = "";
    editMatch.value        = "";
    editResumeVer.value    = "";
    editSalary.value       = "";
    editUrl.value          = "";
    editNotes.value        = "";
    editBand.noUiSlider.set([0, 0]);
    markRequested();
}

function showForm(mode) {

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
            detailResumeVer.textContent    = state.currentJob.resume_ver;
            detailBand.textContent         = state.currentJob.min_salary
                ? money(state.currentJob.min_salary) + " – " + money(state.currentJob.max_salary)
                : "";
            detailSalary.textContent       = money(state.currentJob.salary);
            detailUrl.textContent          = state.currentJob.job_url;
            detailNotes.textContent        = state.currentJob.notes;

            // the trail always reads its dates out of these boxes, so load them in view mode too
            editStatus.value      = state.currentJob.job_status;
            editApplied.value     = state.currentJob.applied_date?.slice(0, 10) ?? "";
            editInterviewed.value = state.currentJob.interviewed_date?.slice(0, 10) ?? "";
            editOffer.value       = state.currentJob.offer_date?.slice(0, 10) ?? "";
            editRejected.value    = state.currentJob.rejected_date?.slice(0, 10) ?? "";
        }

        /* SHOW ALL POPULATED BOXES WITH DATA PERTAINING TO THE SELECTED JOB TILE */
        editButton.style.display = "";
        submitButton.style.display = "none";
        cancelButton.style.display = "none";   // nothing to back out of in view mode

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

        // RESUME VERSION
        detailResumeVer.style.display = "";
        editResumeVer.style.display = "none";

        // SALARY BAND
        detailBand.style.display = "";
        editBand.style.display = "none";

        // REQUESTED SALARY
        detailSalary.style.display = "";
        editSalary.style.display = "none";

        // JOB URL
        detailUrl.style.display = "";
        editUrl.style.display = "none";

        // NOTES
        detailNotes.style.display = "";
        editNotes.style.display = "none";

        renderStatusTrail(false);
        return;
    }

    // if displaying elements for an edit, pre-populate each field with current vals
    if (mode === "edit") {
        editCompany.value = state.currentJob.company;
        editRole.value = state.currentJob.role ?? "";
        editReqNum.value = state.currentJob.req_num ?? "";
        editStatus.value = state.currentJob.job_status;
        editInterest.value = state.currentJob.interest ?? "";
        editLane.value = state.currentJob.lane ?? "";
        editApplied.value = state.currentJob.applied_date?.slice(0, 10); // fixes ISO format
        editInterviewed.value = state.currentJob.interviewed_date?.slice(0, 10);
        editOffer.value = state.currentJob.offer_date?.slice(0, 10) ?? "";
        editRejected.value = state.currentJob.rejected_date?.slice(0, 10) ?? "";
        editReachedOut.value = state.currentJob.reached_out_date?.slice(0, 10);
        editMatch.value = state.currentJob.match_percentage;
        editResumeVer.value = state.currentJob.resume_ver ?? "";
        editSalary.value = state.currentJob.salary ?? "";
        editBand.noUiSlider.set([Number(state.currentJob.min_salary) || 0, Number(state.currentJob.max_salary) || 0]);
        markRequested();
        editUrl.value = state.currentJob.job_url;
        editNotes.value = state.currentJob.notes;
    }

    // the following covers if "add" mode too

    editButton.style.display = "none";
    submitButton.style.display = "";
    cancelButton.style.display = "";   // edit and add both need a way back out

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

    // RESUME VERSION
    detailResumeVer.style.display = "none";
    editResumeVer.style.display = "";

    // SALARY BAND
    detailBand.style.display = "none";
    editBand.style.display = "";

    // REQUESTED SALARY
    detailSalary.style.display = "none";
    editSalary.style.display = "";

    // JOB URL
    detailUrl.style.display = "none";
    editUrl.style.display = "";

    // NOTES
    detailNotes.style.display = "none";
    editNotes.style.display = "";

    renderStatusTrail(true);
}

const Mode = ["view", "edit", "add"];
function setMode(mode) {
    if (!Mode.includes(mode)) {
        throw new Error(`Invalid mode: ${mode}`);
    }
    const prev_mode = state.mode;
    state.mode = mode;
}
setMode("view")

function sortJobs(jobs, sortBy) {
    // sort by priority which jobs need reach out:
    // 3 buckets:
    //      1 [REACH OUT]: NO reach-out + fresh app + high interest -> sorted ASC (old --> new)
    //      2 [ALREADY REACHED OUT]: YES reached out, not rejected -> TODO? sorted ASC
    //      3 [DO NOT REACH OUT]: rejected / stale / low interest -> TODO? sorted ASC
    if (sortBy == 'priority') {
        // collect buckets
        const bucket1 = []
        const bucket2 = []
        const bucket3 = []
        for (let i = 0; i < jobs.length; i++) {
            const row = jobs[i]

            // BUCKET 3 - DO NOT REACH OUT, rejected
            if (row["job_status"] == 'REJECTED') {row.bucket = 3; bucket3.push(row)}
            // BUCKET 2 - ALREADY REACHED OUT
            else if (row["reached_out_date"] != null) {row.bucket = 2; bucket2.push(row)}
            // BUCKET 3 - DO NOT REACH OUT, gone quiet too long
            else if (row["days_since_applied"] > 30) {row.bucket = 3; bucket3.push(row)}
            // BUCKET 3 - DO NOT REACH OUT, not worth the chase
            else if (row["interest"] != "Priority") {row.bucket = 3; bucket3.push(row)}
            // BUCKET 1 - REACH OUT
            else {row.bucket = 1; bucket1.push(row)}
        }

        // sort bucket 1
        for (let i = 0; i < bucket1.length; i++) {
            let oldest = i;
            for (let j = i + 1; j < bucket1.length; j++) {
                let valueHere = bucket1[j]["days_since_applied"];
                let valueOldest = bucket1[oldest]["days_since_applied"];

                // edge cases
                if (valueHere === null || valueHere === undefined) {valueHere = "";}
                if (valueOldest === null || valueOldest === undefined) {valueOldest = "";}
                
                if (valueHere > valueOldest) {oldest = j;}                       
            }
            const temp = bucket1[i];
            bucket1[i] = bucket1[oldest];
            bucket1[oldest] = temp;
        }

        // tag each bucket with its gradient of priority in bucket1 (e.g. highest priority = darkest color)
        for (let i = 0; i < bucket1.length; i++) {bucket1[i].shade = 0.9 - (i / bucket1.length) * 0.7;}        

        // combine sorted buckets
        return bucket1.concat(bucket2, bucket3)
    }
    
    // sort by company, applied date
    else {
        for (let i = 0; i < jobs.length; i++) {
            let smallest = i;

            for (let j = i + 1; j < jobs.length; j++) {
                let valueHere = jobs[j][sortBy];  // e.g. jobs[0]["company"]
                let valueSmallest = jobs[smallest][sortBy];

                // edge cases
                if (valueHere === null || valueHere === undefined) {valueHere = "";}
                if (valueSmallest === null || valueSmallest === undefined) {valueSmallest = "";}
                
                if (valueHere < valueSmallest) {
                    smallest = j;
                }
            }
            const temp = jobs[i];
            jobs[i] = jobs[smallest];
            jobs[smallest] = temp;
        }
    }

    return jobs
}

// render the job tiles LEFT HAND panel
function renderTiles(){
    const panel = document.getElementById("tiles");
    panel.innerHTML = "";                 // clear what's there

    let jobs = Object.values(state.jobs);

    /*---- SORT BY ----*/
    jobs = sortJobs(jobs, state.sortBy)
          
    for (const r of jobs) {
        // create a new tile for each row
        const tile = document.createElement("div");
        tile.className = "tile";
        if (r.bucket) {tile.className = "tile bucket-" + r.bucket;}
        if (r.shade) {tile.style.setProperty("--shade", r.shade);}

        tile.dataset.id = r.id;   // instead of closing over r.id in a per-tile listener

        const company = document.createElement("div");
        company.className = "company";
        company.textContent = r.company;

        // what goes under the company name in the tile
        const status = document.createElement("div");
        status.className = "status";
        status.textContent = [r.job_status, " " + r.lane];

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

// one editable field on a round. changing it saves that round on its own, so there's
// no submit button to remember. every field of a row shares the same round object, so
// edits pile up on it instead of each save clobbering the last one.
function roundField(round, key, el) {
    const value = round[key] ?? "";
    el.value = (key === "round_date") ? String(value).slice(0, 10) : value;

    el.addEventListener("change", async function () {
        round[key] = el.value || null;
        await fetch('/interviews', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({body: round}),
        });
    });

    return el;
}

// the edit-mode version of one round: every column as a live input, plus an x to drop it
function roundInputs(round) {
    const date = document.createElement("input");
    date.type = "date";

    const type = document.createElement("input");
    type.type = "text";
    type.placeholder = "phone screen, technical...";

    const outcome = document.createElement("select");
    for (const choice of ["", "PASSED", "REJECTED", "WAITING"]) {
        const option = document.createElement("option");
        option.value = choice;
        option.textContent = choice || "—";
        outcome.appendChild(option);
    }

    const notes = document.createElement("textarea");
    notes.placeholder = "notes for this round";

    // same x as the status trail, and the same confirm the tile trash uses
    const remove = document.createElement("span");
    remove.className = "trail-x";
    remove.title = "delete this round";
    remove.textContent = "×";
    remove.addEventListener("click", async function () {
        if (!confirm("Delete this round?")) return;
        await fetch('/interviews', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({body: {id: round.id}}),
        });
        renderInterviews();
    });

    return [
        roundField(round, "round_date", date),
        roundField(round, "round_type", type),
        roundField(round, "outcome", outcome),
        roundField(round, "notes", notes),
        remove,
    ];
}

// interview rounds for the selected job. these live in their own table, so they're
// fetched on their own rather than riding along in state.jobs. "add" mode has no job
// id to hang a round off yet, so the whole block sits out until the job exists.
async function renderInterviews() {
    const job = state.currentJob;
    const showRounds = !!job && state.mode !== "add";

    // the list is read-only so it shows whenever a job is selected, but the add form
    // follows the same rule as every other field: nothing is editable until Edit.
    interviewAdd.style.display = (!!job && state.mode === "edit") ? "" : "none";
    if (!showRounds) {
        interviewList.replaceChildren();
        return;
    }

    const jobId = job.id;
    const rounds = await (await fetch('/interviews?job_id=' + jobId)).json();

    // a click leaves two of these running at once, because refreshStateData renders
    // again when its own fetch lands. the list is untouched until the rounds are in
    // hand and then swapped in one go -- clearing before the await let both copies
    // append into the same list and every round showed up twice.
    const list = document.createDocumentFragment();
    for (const round of rounds) {
        const line = document.createElement("div");
        line.className = "round";

        if (state.mode === "edit") {
            line.append(...roundInputs(round));
        }
        else {
            // skip the blanks so a round with only a date doesn't render as "8/3/2026 | | |"
            line.textContent = [
                round.round_date ? fmtDate(round.round_date.slice(0, 10)) : null,
                round.round_type,
                round.outcome,
                round.notes,
            ].filter(Boolean).join(" | ");
        }

        list.appendChild(line);
    }

    // clicking another tile mid-fetch would otherwise paint this job's rounds onto that one
    if (state.currentJob?.id !== jobId) return;
    interviewList.replaceChildren(list);
}

// to render (RIGHT SIDE) the detail-view of current job
function renderDetail() {

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
        showForm(state.mode);
    } 
    else if (state.mode === "view") {

        /////// TOGGLE DISPLAY ITEMS ///////
        showForm(state.mode);
    }
    else if (state.mode === "add") {

        // clear the DOM
        scrubDom()
        showForm(state.mode);
    }

    renderInterviews();   // rounds come from their own table, so they paint separately
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

// redraw the requested-salary mark as the number is typed
editSalary.addEventListener("input", markRequested);

// picking a new status asks what date it happened on
editStatus.addEventListener("change", function () {
    const step = stepFor(editStatus.value);
    if (!step) {
        renderStatusTrail(true);   // SAVED has no date of its own, so nothing to ask
        return;
    }
    dateDialogLabel.textContent = "Date this became " + editStatus.value;
    // "en-CA" formats as YYYY-MM-DD, and it reads the local clock instead of UTC
    dateDialogInput.value = step.input.value || new Date().toLocaleDateString("en-CA");
    dateDialog.showModal();
});

// cancel or escape puts the dropdown back where it was
dateDialog.addEventListener("close", function () {
    const step = stepFor(editStatus.value);
    if (dateDialog.returnValue === "ok" && step && dateDialogInput.value) {
        step.input.value = dateDialogInput.value;
    } else {
        editStatus.value = statusBeforeChange;
    }
    renderStatusTrail(true);
});

// the × on a box drops that step out of the trail
statusGhosts.addEventListener("click", function (e) {
    const remove = e.target.closest(".trail-x");
    if (!remove) return;

    const step = stepFor(remove.dataset.status);
    if (step) {
        step.input.value = "";
        renderStatusTrail(true);
    }
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
    loadAnalytics();
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

// add interview round listener. posts straight to /interviews and repaints just that
// list -- the job row itself didn't change, so there's nothing to refresh in state.
addRoundButton.addEventListener("click", async function () {
    if (!state.currentJob) return;

    const data = {
        job_id:     state.currentJob.id,
        round_date: roundDate.value || null,
        round_type: roundType.value || null,
        outcome:    roundOutcome.value || null,
        notes:      roundNotes.value || null,
    };
    await fetch('/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({body: data}),
    });

    roundDate.value = "";
    roundType.value = "";
    roundOutcome.value = "";
    roundNotes.value = "";
    renderInterviews();
});

// sort by listener
sortSelect.addEventListener("change", function () {
    state.sortBy = sortSelect.value
    localStorage.setItem("sortBy", sortSelect.value)
    renderTiles()
    
});

refreshStateData();