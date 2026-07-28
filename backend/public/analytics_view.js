/******************************
Analytics panel (top of job tracker app)
Fetches all jobs from the DB and paints summary stats into #top-panel.
Same source of truth as the tiles: GET /appwebaddress
*******************************/

// build a raw table out of whatever rows a query handed back...
// generic on purpose. it reads the column names off the first row,
// so it works for appsPerStatus or other
function renderTable(rows) {
    // if no jobs, bail with a placeholder so the rows[0] lookup below doesn't blow up
    if (!rows.length) return document.createTextNode("No data");

    const table = document.createElement("table");

    // header: one cell per column pulled from the keys of the first row
    const headerRow = document.createElement("tr");
    for (const columnName of Object.keys(rows[0])) {
        const headerCell = document.createElement("th");
        headerCell.textContent = columnName;
        headerRow.appendChild(headerCell);
    }
    table.appendChild(headerRow);

    // body: walk each row, drop one cell per value
    for (const row of rows) {
        const bodyRow = document.createElement("tr");
        for (const value of Object.values(row)) {
            const dataCell = document.createElement("td");
            dataCell.textContent = value;
            bodyRow.appendChild(dataCell);
        }
        table.appendChild(bodyRow);
    }

    return table;
}


// chart.js comes from a script tag in the html, so Chart is global.
// hang onto every chart we draw so we can kill them all before a redraw.
let charts = [];

// validated colorblind-safe categorical hues, walked in order when no map is given
const PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

// status keeps its color no matter the row order; other dimensions take the palette.
const STATUS_COLORS = {
    SAVED:     "#2a78d6",
    PENDING:   "#eb6834",
    INTERVIEW: "#1baf7a",
    OFFER:     "#eda100",
    REJECTED:  "#e87ba4",
};

// draw a pie from any query rows. say which column is the label and which is the
// number; pass a {label: color} map to pin colors or leave it out to walk the
// palette. title shows above the pie so two charts don't blur together.
function renderPieChart(rows, labelField, valueField, colorMap, title) {
    // if no jobs yet (or the server didn't send this stat), bail with a placeholder
    if (!rows || !rows.length) return document.createTextNode("No data");

    // chart.js paints onto a canvas. wrap it in a fixed-height box so the
    // responsive chart doesn't grow forever inside the panel.
    const holder = document.createElement("div");
    holder.style.height = "155px";   // leaves room for the panel's horizontal scrollbar
    holder.style.width = "280px";    // each chart keeps its width so they scroll, not squash
    holder.style.flexShrink = "0";   // don't let the flex row squash it

    const canvas = document.createElement("canvas");
    holder.appendChild(canvas);

    // chart.js just wants two matching lists: the labels and their numbers,
    // pulled by whatever column names the caller passed in
    const labels = rows.map(row => row[labelField]);
    const counts = rows.map(row => Number(row[valueField]));

    // color by the map if we got one, otherwise walk the palette in order
    const colors = colorMap
        ? labels.map(label => colorMap[label] ?? "#898781")
        : labels.map((label, i) => PALETTE[i] ?? "#898781");

    const chart = new Chart(canvas, {
        type: "pie",
        data: {
            labels,
            datasets: [{
                data: counts,
                backgroundColor: colors,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "right" },
                title: { display: !!title, text: title },
            },
        },
    });
    charts.push(chart);   // track it so the next render can tear it down

    return holder;
}

const analyticsPanel = document.getElementById("top-panel");

// pull every job row from the db
async function loadAnalytics() {
    const stats = await (await fetch('/analytics')).json();
    renderAnalytics(stats);
}

// compute + paint the summary stats
function renderAnalytics(stats) {
    // tear down last render's charts before we wipe their canvases out of the dom
    charts.forEach(chart => chart.destroy());
    charts = [];

    analyticsPanel.innerHTML = "";   // clear

    // left side: the text summary, stacked together in its own box
    const summary = document.createElement("div");

    const totalJobs = document.createElement("div");
    totalJobs.textContent = `Total: ${stats.total}`;
    summary.appendChild(totalJobs);

    for (const row of stats.byStatus) {
        const statusRow = document.createElement("div");
        statusRow.textContent = `${row.job_status}: ${row.count}`;
        summary.appendChild(statusRow);
    }

    const avgMatch = document.createElement("div");
    avgMatch.textContent = `Avg match: ${stats.avgMatch}`;
    summary.appendChild(avgMatch);

    analyticsPanel.appendChild(summary);

    // pie charts
    analyticsPanel.appendChild(renderPieChart(stats.appsPerStatus, "job_status", "applications", STATUS_COLORS, "Applications per Job Status"));
    analyticsPanel.appendChild(renderPieChart(stats.appsPerLane, "lane", "applications", null, "Applications per Job Lane"));
    analyticsPanel.appendChild(renderPieChart(stats.pendingAppsPerLane, "lane", "applications", null, "Pending applications per Job Lane"));
    analyticsPanel.appendChild(renderPieChart(stats.avgSalaryPerLane, "lane", "avg_salaries", null, "Avg salary per Job Lane"));
    analyticsPanel.appendChild(renderPieChart(stats.companiesMultipleApps, "company", "num_companies", null, "Companies with 2+ apps"));

}

loadAnalytics();

