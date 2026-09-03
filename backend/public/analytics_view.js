/******************************
Analytics panel
pulls pre-counted stats from GET /analytics and paints them into #top-panel
and #extra-viz-panel. never sees a job row, the counting happens in SQL.
*******************************/

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

const LANE_COLORS = {
    SWE:      "#2a78d6",
    "SE/FDE": "#eda100",
    AI:       "#008300",
    DE:       "#4a3aa7",
    DS:       "#e34948",
    DA:       "#eb6834",
}

// draw a pie from any query rows. say which column is the label and which is the
// number; pass a {label: color} map to pin colors or leave it out to walk the
// palette. title shows above the pie so two charts don't blur together.
function renderPieChart(rows, labelField, valueField, colorMap, title) {
    // if no jobs yet (or the server didn't send this stat), bail with a placeholder
    if (!rows || !rows.length) return document.createTextNode("No data");

    // chart.js paints onto a canvas. wrap it in a fixed-height box so the
    // responsive chart doesn't grow forever inside the panel
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

// sankey graph
function renderSankey(rows, title) {

    const holder = document.createElement("div");
    holder.style.height = "250px"; 
    holder.style.width = "500px";    
    holder.style.flexShrink = "0";   

    const canvas = document.createElement("canvas");
    holder.appendChild(canvas);

    const sankey_row_list = [];
    for (let i=0; i<rows.length; i++) {
        const row = rows[i];

        sankey_row_list.push({
            "from": row["lane"],
            "to": row["outcome"],
            "flow": row["applications"]
        })
    }
    
    const data = {
        datasets: [
          {
            label: 'Basic sankey',
            colorFrom: (context) => LANE_COLORS[context.dataset.data[context.dataIndex].from],
            colorTo: (context) => STATUS_COLORS[context.dataset.data[context.dataIndex].to] ?? "#898781",
            colorMode: 'gradient',
            data: sankey_row_list,
          },
        ],
      }

    const config = {
        type: 'sankey',
        data,
    }

    const chart = new Chart(canvas, config)
    charts.push(chart)

    return holder
}

// contribution graph, drawn by Heat.js
function renderCalendar(element, rows) {
    if (!rows || !rows.length) return;

    $heat.render(element, {
        title: { text: "Applications per day", showConfigurationButton: false, showTitleDropDownButton: false },
        sideMenu: { enabled: false },
        views: {
            map:         { showMonthDayGaps: false },
            line:        { enabled: false },
            chart:       { enabled: false },
            days:        { enabled: false },
            months:      { enabled: false },
            colorRanges: { enabled: false },
        },
        // heat.js defaults these to 10/15/20/25, which suit github commit counts. our busiest day is 7,
        // so every day would fall under the lowest band and the whole map would draw blank
        colorRanges: [
            { minimum: 1, cssClassName: "day-color-1" },
            { minimum: 2, cssClassName: "day-color-2" },
            { minimum: 3, cssClassName: "day-color-3" },
            { minimum: 5, cssClassName: "day-color-4" },
        ],
    });

    // Heat.js counts occurrences, so a day with 3 applications needs that date three times
    const dates = [];
    for (const row of rows) {
        for (let i = 0; i < row.applications; i++) {
            dates.push(new Date(row.day + "T00:00:00"));   // no "Z" means local time, not UTC
        }
    }
    $heat.addDates(element.id, dates);
}

const analyticsPanel = document.getElementById("top-panel");
const extraPanel = document.getElementById("extra-viz-panel");


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
    extraPanel.innerHTML = "";       // clear

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

    analyticsPanel.appendChild(summary);

    // sankey graph
    extraPanel.appendChild(renderSankey(stats.laneOutcomes))

    // heat.js renders into the element, so it has to be in the dom before we hand it over
    const calendar = document.createElement("div");
    calendar.id = "calendar";
    extraPanel.appendChild(calendar);
    renderCalendar(calendar, stats.contributionGraph);

    // pie charts
    analyticsPanel.appendChild(renderPieChart(stats.appsPerStatus, "job_status", "applications", STATUS_COLORS, "Applications per Job Status"));
    analyticsPanel.appendChild(renderPieChart(stats.appsPerLane, "lane", "applications", null, "Applications per Job Lane"));
    analyticsPanel.appendChild(renderPieChart(stats.pendingAppsPerLane, "lane", "applications", null, "Pending applications per Job Lane"));
    analyticsPanel.appendChild(renderPieChart(stats.avgSalaryPerLane, "lane", "avg_salaries", null, "Avg salary per Job Lane"));
}

loadAnalytics();


