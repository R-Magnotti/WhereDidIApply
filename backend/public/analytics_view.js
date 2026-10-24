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

// nodes in the interview funnel. these names come back capitalised from the query,
// so they don't collide with the SHOUTY job_status keys in STATUS_COLORS above.
const FUNNEL_COLORS = {
    Applications:  "#1baf7a",
    "1st round":   "#eb6834",
    "2nd round":   "#eda100",
    "3rd round":   "#4a3aa7",
    "4th round":   "#2a78d6",
    "5th round":   "#008300",
    "6th round":   "#e34948",
    Waiting:       "#eb6834",
    Ghosted:       "#e87ba4",
    Rejected:      "#4a3aa7",
    "In progress": "#1baf7a",
    Offer:         "#eda100",
    Saved:         "#2a78d6",
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

// whatever a node is called, find its color. the lane sankey draws lanes on the left
// and statuses on the right, the funnel draws its own names, so one lookup serves both.
function nodeColor(name) {
    return LANE_COLORS[name] ?? STATUS_COLORS[name] ?? FUNNEL_COLORS[name] ?? "#898781";
}

// the funnel rows each say "this many applications got N rounds deep, then ended here".
// that becomes two kinds of link: one step for every round the job cleared, and one
// final link into wherever it stopped. a job that did 3 rounds and is still going draws
// 1st -> 2nd -> 3rd, then 3rd round -> In progress.
//
// rows with no rounds are skipped on purpose. they are the overwhelming majority, and
// including them made every interview branch about 5px wide -- a sankey splits the height
// by flow, so 1 application against 116 is 1/116th of the chart no matter how it is sized.
// scoped to the handful that interviewed, the same branch draws ~90px. the dropped-out
// count is stated as text above the chart instead, by renderFunnelStat.
function buildFunnel(rows) {
    if (!rows) return [];   // server not restarted yet, don't take the other charts down with us

    const label = (depth) => {
        if (depth === 0) return "Applications";
        if (depth === 1) return "1st round";
        if (depth === 2) return "2nd round";
        if (depth === 3) return "3rd round";
        return depth + "th round";
    };

    const cleared = {};   // depth -> how many applications got past that round
    const links = [];

    for (const row of rows) {
        if (row.rounds < 1) continue;   // never interviewed, not part of this chart
        for (let depth = 1; depth < row.rounds; depth++) {
            cleared[depth] = (cleared[depth] ?? 0) + row.applications;
        }
        links.push({ from: label(row.rounds), to: row.outcome, flow: row.applications });
    }

    for (const depth of Object.keys(cleared)) {
        links.push({ from: label(Number(depth)), to: label(Number(depth) + 1), flow: cleared[depth] });
    }

    return links;
}

// one line of context above the funnel, because the chart itself now only covers the
// applications that got an interview.
function renderFunnelStat(rows) {
    const line = document.createElement("div");
    line.style.fontSize = "13px";
    line.style.color = "#666";
    line.style.margin = "6px 0 0";
    if (!rows || !rows.length) return line;

    let total = 0;
    let interviewed = 0;
    for (const row of rows) {
        total += row.applications;
        if (row.rounds >= 1) interviewed += row.applications;
    }
    const pct = total ? (interviewed / total * 100).toFixed(1) : "0";
    line.textContent = interviewed + " of " + total + " applications reached an interview (" + pct + "%)";

    return line;
}

// sankey graph. takes either query rows (lane/outcome/applications) or links that
// already say from/to/flow, which is what buildFunnel hands back.
function renderSankey(rows, opts = {}) {

    const holder = document.createElement("div");
    holder.style.height = opts.height ?? "250px";
    holder.style.width = opts.width ?? "500px";
    holder.style.flexShrink = "0";

    const canvas = document.createElement("canvas");
    holder.appendChild(canvas);

    const sankey_row_list = [];
    for (let i=0; i<rows.length; i++) {
        const row = rows[i];

        sankey_row_list.push({
            "from": row["from"] ?? row["lane"],
            "to": row["to"] ?? row["outcome"],
            "flow": row["flow"] ?? row["applications"]
        })
    }

    // ONLY worth it on a two column chart. there, the library's default layout picks the
    // biggest node, walks its links to place the rest, skips past whole nodes on the way,
    // and never reclaims the skipped space, so the column ends up full of holes. a priority
    // map switches to a layout that stacks each column top to bottom instead.
    // it is WRONG on anything deeper. that layout starts each column at an offset taken from
    // the previous column's first node, counting only its flows that skip past the next
    // column. in the funnel that is Applications sending 112 straight to the end, so the
    // round nodes get flung to the bottom and then back to the top. hence opts.priority.
    let priority;
    if (opts.priority !== false) {
        const flowByNode = {};
        for (const row of sankey_row_list) {
            flowByNode[row.from] = (flowByNode[row.from] ?? 0) + row.flow;
            flowByNode[row.to]   = (flowByNode[row.to]   ?? 0) + row.flow;
        }
        priority = {};
        Object.keys(flowByNode)
            .sort((a, b) => flowByNode[b] - flowByNode[a])
            .forEach((key, i) => { priority[key] = i; });
    }

    const data = {
        datasets: [
          {
            label: 'Basic sankey',
            nodePadding: opts.nodePadding ?? 10,
            modeX: opts.modeX ?? "edge",
            priority,
            colorFrom: (context) => nodeColor(context.dataset.data[context.dataIndex].from),
            colorTo: (context) => nodeColor(context.dataset.data[context.dataIndex].to),
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
    // interview funnel. every application starts in one node and either advances a round
    // or drops out. tall with a big nodePadding on purpose: the interview branches carry
    // 1-4 applications against 116 total, so the ribbons are a few px no matter what. the
    // padding can't thicken them, it just keeps them from being swallowed by the fat ones.
    // lane -> outcome. this is the chart that tells the drop-off story, and it reads fine
    // because its smallest node still carries a couple of applications.
    extraPanel.appendChild(renderSankey(stats.laneOutcomes))

    // interview progression, scoped to applications that got at least one round. the count
    // it leaves out is stated in the line above it.
    // modeX "left" rather than the library's "edge" default: "edge" parks every terminal in
    // the last column, and once a terminal is hauled past the round chain it picks up more
    // padding than the chain does, so the two ribbons swap order and cut through each other.
    // "left" leaves nodes where their links put them, so leave order is arrive order.
    extraPanel.appendChild(renderFunnelStat(stats.interviewFunnel))
    extraPanel.appendChild(renderSankey(buildFunnel(stats.interviewFunnel),
        { width: "540px", height: "320px", nodePadding: 16, priority: false, modeX: "left" }))

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


