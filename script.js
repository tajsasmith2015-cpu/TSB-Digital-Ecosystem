
"use strict";

/* =========================================================
   TSB DIGITAL ECOSYSTEM V5
   The Super Boys Studio
   Local browser workspace - no external backend required
========================================================= */

const STORAGE_KEY = "tsb_digital_ecosystem_v5";

const DEFAULT_DATA = {
    projects: [],
    tasks: [],
    journal: [],
    ideas: [],
    snippets: [],
    notes: [],
    achievements: [],
    challenges: [],
    versions: [],
    bugs: [],
    knowledge: [],
    team: [],
    assets: [],
    roadmap: [],
    reports: [],
    photoProjects: [],
    cameraLogs: [],
    editingTasks: [],
    equipment: [],
    photoNotes: [],
    sessions: [],
    workflows: [],
    notifications: [],
    prompts: [],
    archivedProjects: [],
    settings: {
        theme: "green",
        developer: "Taj Sasmith",
        studio: "The Super Boys Studio"
    },
    stats: {
        focusMinutes: 0,
        completedTasks: 0,
        commands: 0
    }
};

function loadData() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!saved || typeof saved !== "object") return structuredClone(DEFAULT_DATA);

        const result = structuredClone(DEFAULT_DATA);

        Object.keys(result).forEach(key => {
            if (key === "settings" || key === "stats") {
                result[key] = { ...result[key], ...(saved[key] || {}) };
            } else if (Array.isArray(result[key])) {
                result[key] = Array.isArray(saved[key]) ? saved[key] : [];
            }
        });

        return result;
    } catch (error) {
        console.error("Data loading failed:", error);
        return structuredClone(DEFAULT_DATA);
    }
}

let data = loadData();
let currentPage = "dashboard";
let focusInterval = null;
let focusSeconds = 25 * 60;
let focusRunning = false;

const $ = id => document.getElementById(id);

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        alert("Could not save data. Your browser storage may be full.");
        console.error(error);
        return false;
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function dateToday() {
    return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? escapeHTML(value) :
        date.toLocaleDateString();
}

function safeText(value) {
    return escapeHTML(value).replace(/\n/g, "<br>");
}

function addNotification(message) {
    data.notifications.unshift({
        id: uid(),
        message,
        date: new Date().toISOString(),
        read: false
    });
    data.notifications = data.notifications.slice(0, 100);
    saveData();
}

const NAVIGATION = [
    {
        group: "MAIN SYSTEM",
        items: [
            ["dashboard", "⌂", "Command Center"],
            ["projects", "▣", "Project Control"],
            ["planner", "▦", "Smart Planner"],
            ["workflows", "⚙", "Workflow Automation"],
            ["code", "</>", "Code Studio"],
            ["ai", "✦", "AI Workspace"],
            ["analytics", "◈", "Advanced Analytics"],
            ["system", "◉", "System Health"]
        ]
    },
    {
        group: "TEAM & CREATIVE",
        items: [
            ["team", "♟", "Team Workspace"],
            ["photography", "▧", "Photography Pro"],
            ["creative", "✎", "Creative Desk"],
            ["assets", "▤", "Asset Manager"]
        ]
    },
    {
        group: "DEVELOPER TOOLS",
        items: [
            ["terminal", ">_", "TSB Terminal"],
            ["tools", "⌘", "Developer Tools"],
            ["snippets", "{ }", "Code Snippets"],
            ["calendar", "▦", "Developer Calendar"],
            ["calculator", "∑", "Calculator"],
            ["markdown", "M", "Markdown Editor"]
        ]
    },
    {
        group: "PRODUCTIVITY",
        items: [
            ["notes", "✉", "Quick Notes Dock"],
            ["ideas", "◇", "Idea Vault"],
            ["focus", "◷", "Focus Timer"],
            ["challenges", "★", "Daily Challenge"],
            ["achievements", "🏆", "Achievements"],
            ["search", "⌕", "Global Search"]
        ]
    },
    {
        group: "MANAGEMENT",
        items: [
            ["versions", "⟳", "Version History"],
            ["archive", "▣", "Project Archive"],
            ["bugs", "⚠", "Bug Tracker"],
            ["knowledge", "▤", "Knowledge Base"],
            ["roadmap", "➜", "Roadmap"],
            ["reports", "▥", "Reports"],
            ["notifications", "●", "Notifications"],
            ["settings", "⚙", "Customization"],
            ["about", "ⓘ", "About TSB"]
        ]
    }
];

function renderNavigation() {
    const nav = $("nav");
    if (!nav) return;

    nav.innerHTML = NAVIGATION.map(group => `
        <div class="nav-group">${escapeHTML(group.group)}</div>
        ${group.items.map(item => `
            <button class="nav-item ${currentPage === item[0] ? "active" : ""}"
                data-page="${item[0]}">
                <span>${escapeHTML(item[1])}</span>
                ${escapeHTML(item[2])}
            </button>
        `).join("")}
    `).join("");

    nav.querySelectorAll("[data-page]").forEach(button => {
        button.addEventListener("click", () => navigate(button.dataset.page));
    });
}

function navigate(page) {
    currentPage = page;
    renderNavigation();

    const item = NAVIGATION.flatMap(group => group.items)
        .find(entry => entry[0] === page);

    $("title").textContent = item ? item[2] : "Dashboard";

    $("sidebar")?.classList.remove("open");
    renderPage();
}

function pageIntro(title, description) {
    return `
        <div class="page-intro">
            <h1>${escapeHTML(title)}</h1>
            <p>${escapeHTML(description)}</p>
        </div>
    `;
}

function card(title, content) {
    return `<section class="card"><h3>${escapeHTML(title)}</h3>${content}</section>`;
}

function statCard(title, value, note) {
    return `
        <section class="card stat-card">
            <div class="stat-label">${escapeHTML(title)}</div>
            <div class="stat-value">${escapeHTML(value)}</div>
            <div class="stat-note">${escapeHTML(note)}</div>
        </section>
    `;
}

function emptyState(message) {
    return `<div class="empty">${escapeHTML(message)}</div>`;
}

function table(headers, rows) {
    if (!rows.length) return emptyState("No records yet. Add your first record.");

    return `
        <div class="table-wrap">
            <table>
                <thead><tr>${headers.map(h => `<th>${escapeHTML(h)}</th>`).join("")}</tr></thead>
                <tbody>${rows.join("")}</tbody>
            </table>
        </div>
    `;
}

function renderPage() {
    const content = $("content");
    if (!content) return;

    const pages = {
        dashboard: renderDashboard,
        projects: renderProjects,
        planner: renderPlanner,
        workflows: renderWorkflows,
        code: renderCodeStudio,
        ai: renderAI,
        analytics: renderAnalytics,
        system: renderSystem,
        team: renderTeam,
        photography: renderPhotography,
        creative: renderCreative,
        assets: renderAssets,
        terminal: renderTerminal,
        tools: renderTools,
        snippets: renderSnippets,
        calendar: renderCalendar,
        calculator: renderCalculator,
        markdown: renderMarkdown,
        notes: renderNotes,
        ideas: renderIdeas,
        focus: renderFocus,
        challenges: renderChallenges,
        achievements: renderAchievements,
        search: renderSearch,
        versions: renderVersions,
        archive: renderArchive,
        bugs: renderBugs,
        knowledge: renderKnowledge,
        roadmap: renderRoadmap,
        reports: renderReports,
        notifications: renderNotifications,
        settings: renderSettings,
        about: renderAbout
    };

    content.innerHTML = (pages[currentPage] || renderDashboard)();
    attachPageEvents();
}

/* =========================================================
   COMMAND CENTER
========================================================= */

function renderDashboard() {
    const completed = data.tasks.filter(t => t.status === "Completed").length;
    const active = data.projects.filter(p => p.status !== "Completed").length;
    const unread = data.notifications.filter(n => !n.read).length;

    return `
        ${pageIntro("Welcome to TSB Ecosystem", "Your personal development command center.")}

        <div class="grid">
            ${statCard("TOTAL PROJECTS", data.projects.length, "Projects in workspace")}
            ${statCard("ACTIVE PROJECTS", active, "Currently in progress")}
            ${statCard("COMPLETED TASKS", completed, "Tasks completed")}
            ${statCard("NOTIFICATIONS", unread, "Unread notifications")}
        </div>

        <div class="grid two">
            ${card("Quick Actions", `
                <div class="actions">
                    <button data-go="projects">+ New Project</button>
                    <button data-go="planner">+ Add Task</button>
                    <button data-go="notes">Quick Note</button>
                    <button data-go="photography">Photography</button>
                    <button data-go="code">Open Code Studio</button>
                </div>
            `)}
            ${card("System Overview", `
                <p>Studio: <b>The Super Boys Studio</b></p>
                <p>Developer: <b>${escapeHTML(data.settings.developer)}</b></p>
                <p>Storage: <b>Browser Local Storage</b></p>
                <p>System: <span class="badge">ONLINE</span></p>
            `)}
        </div>

        <div class="grid two">
            ${card("Recent Projects", renderProjectList(5))}
            ${card("Upcoming Tasks", renderTaskList(5))}
        </div>
    `;
}

function renderProjectList(limit = 20) {
    if (!data.projects.length) return emptyState("No projects created yet.");

    return `<div class="list">${data.projects.slice(0, limit).map(p => `
        <div class="list-item">
            <div>
                <b>${escapeHTML(p.name)}</b>
                <p>${escapeHTML(p.category || "General")} · ${escapeHTML(p.status)}</p>
            </div>
            <span class="badge">${escapeHTML(p.progress || 0)}%</span>
        </div>
    `).join("")}</div>`;
}

function renderTaskList(limit = 20) {
    const tasks = data.tasks.filter(t => t.status !== "Completed").slice(0, limit);
    if (!tasks.length) return emptyState("No pending tasks.");

    return `<div class="list">${tasks.map(t => `
        <div class="list-item">
            <div>
                <b>${escapeHTML(t.title)}</b>
                <p>${escapeHTML(t.due || "No deadline")} · ${escapeHTML(t.priority || "Normal")}</p>
            </div>
            <button class="small" data-complete-task="${escapeHTML(t.id)}">Done</button>
        </div>
    `).join("")}</div>`;
}

/* =========================================================
   PROJECT CONTROL
========================================================= */

function renderProjects() {
    const rows = data.projects.map(p => `
        <tr>
            <td>${escapeHTML(p.name)}</td>
            <td>${escapeHTML(p.category)}</td>
            <td>${escapeHTML(p.status)}</td>
            <td>${escapeHTML(p.progress)}%</td>
            <td><button class="small danger" data-delete="projects" data-id="${escapeHTML(p.id)}">Delete</button></td>
        </tr>
    `);

    return `
        ${pageIntro("Project Control Center", "Create and manage your development projects.")}

        ${card("Create Project", `
            <form id="projectForm">
                <div class="form-grid">
                    <label>Project Name<input name="name" required placeholder="Example: TSB Last Defender"></label>
                    <label>Category<input name="category" placeholder="Game / Website / Software"></label>
                    <label>Status
                        <select name="status">
                            <option>Planning</option>
                            <option>In Progress</option>
                            <option>Testing</option>
                            <option>Completed</option>
                        </select>
                    </label>
                    <label>Progress (%)<input name="progress" type="number" min="0" max="100" value="0"></label>
                </div>
                <label>Description<textarea name="description"></textarea></label>
                <button type="submit">Create Project</button>
            </form>
        `)}

        <div class="section-title"><h3>Project List</h3></div>
        ${table(["Project", "Category", "Status", "Progress", "Action"], rows)}
    `;
}

/* =========================================================
   SMART PLANNER
========================================================= */

function renderPlanner() {
    const rows = data.tasks.map(t => `
        <tr>
            <td>${escapeHTML(t.title)}</td>
            <td>${escapeHTML(t.due || "—")}</td>
            <td>${escapeHTML(t.priority)}</td>
            <td>${escapeHTML(t.status)}</td>
            <td>
                <button class="small" data-complete-task="${escapeHTML(t.id)}">Done</button>
                <button class="small danger" data-delete="tasks" data-id="${escapeHTML(t.id)}">Delete</button>
            </td>
        </tr>
    `);

    return `
        ${pageIntro("Smart Planner", "Organize daily work and development tasks.")}

        ${card("Add New Task", `
            <form id="taskForm">
                <label>Task Name<input name="title" required placeholder="What needs to be done?"></label>
                <div class="form-grid">
                    <label>Due Date<input name="due" type="date"></label>
                    <label>Priority
                        <select name="priority">
                            <option>Normal</option>
                            <option>High</option>
                            <option>Low</option>
                        </select>
                    </label>
                </div>
                <button type="submit">Add Task</button>
            </form>
        `)}

        <div class="section-title"><h3>Task List</h3></div>
        ${table(["Task", "Due Date", "Priority", "Status", "Actions"], rows)}
    `;
}

/* =========================================================
   WORKFLOW AUTOMATION
========================================================= */

function renderWorkflows() {
    return `
        ${pageIntro("Workflow Automation", "Create simple rules and track repeatable workflows.")}

        ${card("Create Workflow", `
            <form id="workflowForm">
                <label>Workflow Name<input name="name" required></label>
                <label>Description<textarea name="description"></textarea></label>
                <label>Frequency
                    <select name="frequency">
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Monthly</option>
                        <option>One-time</option>
                    </select>
                </label>
                <button type="submit">Save Workflow</button>
            </form>
        `)}

        ${card("Saved Workflows", data.workflows.length ?
            `<div class="list">${data.workflows.map(w => `
                <div class="list-item">
                    <div><b>${escapeHTML(w.name)}</b><p>${escapeHTML(w.frequency)} · ${escapeHTML(w.description)}</p></div>
                    <button class="small danger" data-delete="workflows" data-id="${escapeHTML(w.id)}">Delete</button>
                </div>
            `).join("")}</div>` : emptyState("No workflows created yet."))}
        <p>Note: Workflows are stored as plans. They do not run automatically in the background.</p>
    `;
}

/* =========================================================
   CODE STUDIO
========================================================= */

function renderCodeStudio() {
    return `
        ${pageIntro("TSB Code Studio", "Write, preview and manage small code experiments.")}

        ${card("HTML Preview Lab", `
            <label>HTML Code<textarea id="htmlInput" class="code-editor" placeholder="<h1>Hello TSB!</h1>"></textarea></label>
            <div class="actions">
                <button id="previewHTML">Preview HTML</button>
                <button class="secondary" id="clearHTML">Clear</button>
            </div>
            <iframe id="htmlPreview" title="HTML preview"
                sandbox="" style="width:100%;height:250px;background:white;border:1px solid #253247;border-radius:10px"></iframe>
        `)}

        ${card("JavaScript Notes", `
            <p>Use the Snippet Library to save reusable code. This workspace does not execute arbitrary code.</p>
            <button data-go="snippets">Open Snippet Library</button>
        `)}
    `;
}

/* =========================================================
   AI WORKSPACE
========================================================= */

function renderAI() {
    return `
        ${pageIntro("TSB AI Workspace", "Organize prompts and plan AI-assisted development.")}

        ${card("Prompt Library", `
            <form id="promptForm">
                <label>Prompt Title<input name="title" required></label>
                <label>Prompt<textarea name="prompt" required placeholder="Write your prompt here..."></textarea></label>
                <button type="submit">Save Prompt</button>
            </form>
        `)}

        ${card("Saved Prompts", data.prompts.length ?
            `<div class="list">${data.prompts.map(p => `
                <div class="list-item">
                    <div><b>${escapeHTML(p.title)}</b><p>${escapeHTML(p.prompt)}</p></div>
                    <button class="small" data-copy="${escapeHTML(p.prompt)}">Copy</button>
                </div>
            `).join("")}</div>` : emptyState("No prompts saved."))}
        <p>AI responses require an external AI service. This local workspace stores prompts only.</p>
    `;
}

/* =========================================================
   ANALYTICS
========================================================= */

function renderAnalytics() {
    const total = data.tasks.length;
    const completed = data.tasks.filter(t => t.status === "Completed").length;
    const percent = total ? Math.round(completed / total * 100) : 0;

    return `
        ${pageIntro("Advanced Analytics", "A simple overview of your recorded workspace activity.")}

        <div class="grid">
            ${statCard("PROJECTS", data.projects.length, "Total saved")}
            ${statCard("TASKS", total, "Total tasks")}
            ${statCard("COMPLETED", completed, "Finished tasks")}
            ${statCard("FOCUS TIME", data.stats.focusMinutes + " min", "Recorded focus time")}
        </div>

        ${card("Task Completion", `
            <h2>${percent}%</h2>
            <div class="progress"><span style="width:${percent}%"></span></div>
            <p>${completed} completed out of ${total} tasks.</p>
        `)}

        ${card("Activity Summary", `
            <p>Ideas: ${data.ideas.length}</p>
            <p>Code snippets: ${data.snippets.length}</p>
            <p>Photography projects: ${data.photoProjects.length}</p>
            <p>Team records: ${data.team.length}</p>
        `)}
    `;
}

/* =========================================================
   SYSTEM HEALTH AND BACKUP
========================================================= */

function renderSystem() {
    let storageUsed = "Unavailable";
    try {
        storageUsed = new Blob([localStorage.getItem(STORAGE_KEY) || ""]).size + " bytes";
    } catch (_) {}

    return `
        ${pageIntro("System Health & Backup", "Check local workspace information and protect your data.")}

        <div class="grid">
            ${statCard("SYSTEM", "ONLINE", "Browser workspace")}
            ${statCard("STORAGE", storageUsed, "Approximate saved data")}
            ${statCard("PROJECTS", data.projects.length, "Saved projects")}
        </div>

        ${card("Backup Management", `
            <p>Export a JSON backup before clearing browser data or changing devices.</p>
            <div class="actions">
                <button onclick="backup()">Export Backup</button>
                <button class="secondary" data-go="settings">Data Settings</button>
            </div>
            <label>Import Backup<input type="file" id="importFile" accept=".json,application/json"></label>
        `)}

        ${card("System Information", `
            <p>Application: TSB Digital Ecosystem V5</p>
            <p>Storage: Browser Local Storage</p>
            <p>Network: Not required for core functions</p>
            <p>Online synchronization: Not configured</p>
        `)}
    `;
}

/* =========================================================
   TEAM WORKSPACE
========================================================= */

function renderTeam() {
    const rows = data.team.map(member => `
        <tr>
            <td>${escapeHTML(member.name)}</td>
            <td>${escapeHTML(member.role)}</td>
            <td>${escapeHTML(member.contact || "—")}</td>
            <td><button class="small danger" data-delete="team" data-id="${escapeHTML(member.id)}">Delete</button></td>
        </tr>
    `);

    return `
        ${pageIntro("TSB Team Workspace", "Keep a local directory of project collaborators.")}

        ${card("Add Team Member", `
            <form id="teamForm">
                <div class="form-grid">
                    <label>Name<input name="name" required></label>
                    <label>Role<input name="role" placeholder="Developer / Designer"></label>
                </div>
                <label>Contact or Note<input name="contact"></label>
                <button type="submit">Add Member</button>
            </form>
        `)}

        ${table(["Name", "Role", "Contact", "Action"], rows)}
        <p>Team records are stored only in this browser. There is no online team login or shared database.</p>
    `;
}

/* =========================================================
   PHOTOGRAPHY PRO
========================================================= */

function renderPhotography() {
    return `
        ${pageIntro("Photography Pro", "Plan shoots, record camera settings and manage editing work.")}

        <div class="grid">
            ${statCard("SHOOT PROJECTS", data.photoProjects.length, "Photography projects")}
            ${statCard("CAMERA LOGS", data.cameraLogs.length, "Saved settings")}
            ${statCard("EDITING TASKS", data.editingTasks.length, "Editing records")}
            ${statCard("EQUIPMENT", data.equipment.length, "Equipment records")}
        </div>

        ${card("Shooting Project Planner", `
            <form id="photoProjectForm">
                <label>Project Name<input name="name" required placeholder="Example: School Volleyball Match"></label>
                <div class="form-grid">
                    <label>Shooting Date<input name="date" type="date"></label>
                    <label>Location<input name="location"></label>
                </div>
                <label>Shot Plan<textarea name="plan"></textarea></label>
                <button type="submit">Save Shoot Project</button>
            </form>
            ${renderPhotoList(data.photoProjects)}
        `)}

        ${card("Camera Settings Log", `
            <form id="cameraForm">
                <div class="form-grid">
                    <label>Camera<input name="camera" placeholder="Camera model"></label>
                    <label>Lens<input name="lens" placeholder="Lens"></label>
                    <label>ISO<input name="iso" placeholder="100"></label>
                    <label>Shutter Speed<input name="shutter" placeholder="1/500"></label>
                    <label>Aperture<input name="aperture" placeholder="f/2.8"></label>
                    <label>Focal Length<input name="focal" placeholder="50mm"></label>
                </div>
                <label>Notes<textarea name="notes"></textarea></label>
                <button type="submit">Save Camera Log</button>
            </form>
            ${renderPhotoList(data.cameraLogs)}
        `)}

        ${card("Photo Editing Tracker", `
            <form id="editingForm">
                <label>Editing Task<input name="title" required></label>
                <label>Software<input name="software" placeholder="Photoshop / Lightroom / Other"></label>
                <label>Status<select name="status"><option>Pending</option><option>In Progress</option><option>Completed</option></select></label>
                <button type="submit">Add Editing Task</button>
            </form>
            ${renderPhotoList(data.editingTasks)}
        `)}

        ${card("Equipment Manager", `
            <form id="equipmentForm">
                <label>Equipment Name<input name="name" required></label>
                <div class="form-grid">
                    <label>Category<input name="category" placeholder="Camera / Lens / Tripod"></label>
                    <label>Condition<select name="condition"><option>Good</option><option>Needs Repair</option><option>Unavailable</option></select></label>
                </div>
                <button type="submit">Add Equipment</button>
            </form>
            ${renderPhotoList(data.equipment)}
        `)}

        ${card("Photography Notes & Learning", `
            <form id="photoNoteForm">
                <label>Note Title<input name="title" required></label>
                <label>Learning Notes<textarea name="content" required></textarea></label>
                <button type="submit">Save Note</button>
            </form>
            ${renderPhotoList(data.photoNotes)}
        `)}

        ${card("Photo Session Planner", `
            <form id="sessionForm">
                <label>Session Name<input name="name" required></label>
                <div class="form-grid">
                    <label>Date<input name="date" type="date"></label>
                    <label>Time<input name="time" type="time"></label>
                </div>
                <label>Details<textarea name="details"></textarea></label>
                <button type="submit">Save Session</button>
            </form>
            ${renderPhotoList(data.sessions)}
        `)}
    `;
}

function renderPhotoList(items) {
    if (!items.length) return emptyState("No records yet.");

    return `<div class="list">${items.slice(-10).reverse().map(item => `
        <div class="list-item">
            <div>
                <b>${escapeHTML(item.name || item.title || item.camera || "Record")}</b>
                <p>${escapeHTML(item.date || item.status || item.category || item.condition || item.notes || item.content || "")}</p>
            </div>
            <button class="small danger" data-delete-record="${escapeHTML(item.id)}">Delete</button>
        </div>
    `).join("")}</div>`;
}

/* =========================================================
   CREATIVE DESK
========================================================= */

function renderCreative() {
    return `
        ${pageIntro("TSB Creative Desk", "A workspace for creative ideas, writing and design planning.")}

        ${card("Creative Journal", `
            <form id="journalForm">
                <label>Title<input name="title" required></label>
                <label>Entry<textarea name="content" required></textarea></label>
                <button type="submit">Save Entry</button>
            </form>
        `)}

        ${card("Journal Entries", data.journal.length ?
            `<div class="list">${data.journal.slice().reverse().map(j => `
                <div class="list-item"><div><b>${escapeHTML(j.title)}</b><p>${escapeHTML(j.content)}</p></div>
                <button class="small danger" data-delete="journal" data-id="${escapeHTML(j.id)}">Delete</button></div>
            `).join("")}</div>` : emptyState("No journal entries yet."))}
    `;
}

/* =========================================================
   ASSET MANAGER
========================================================= */

function renderAssets() {
    const rows = data.assets.map(a => `
        <tr><td>${escapeHTML(a.name)}</td><td>${escapeHTML(a.type)}</td><td>${escapeHTML(a.description)}</td>
        <td><button class="small danger" data-delete="assets" data-id="${escapeHTML(a.id)}">Delete</button></td></tr>
    `);

    return `
        ${pageIntro("Asset Manager", "Track project files, graphics, models and other resources.")}

        ${card("Add Asset Record", `
            <form id="assetForm">
                <label>Asset Name<input name="name" required></label>
                <div class="form-grid">
                    <label>Type<input name="type" placeholder="Image / Audio / Model"></label>
                    <label>Description<input name="description"></label>
                </div>
                <button type="submit">Save Asset</button>
            </form>
        `)}

        ${table(["Asset", "Type", "Description", "Action"], rows)}
        <p>This module stores asset details, not the actual files.</p>
    `;
}

/* =========================================================
   TERMINAL
========================================================= */

function renderTerminal() {
    return `
        ${pageIntro("Advanced TSB Terminal", "Run built-in workspace commands.")}

        ${card("TSB Terminal", `
            <div class="terminal" id="terminalOutput">TSB DIGITAL ECOSYSTEM V5
Local workspace terminal.
Type help to view available commands.</div>
            <form id="terminalForm">
                <label>Command<input id="terminalInput" autocomplete="off" placeholder="help"></label>
                <button type="submit">Execute Command</button>
            </form>
        `)}
        <p>This is an internal command simulator. It cannot run Windows commands or access your operating system.</p>
    `;
}

function runTerminal(command) {
    const output = $("terminalOutput");
    if (!output) return;

    const parts = command.trim().toLowerCase().split(/\s+/);
    const cmd = parts[0];

    const commands = {
        help: "Available commands:\nhelp\ninfo\nprojects\ntasks\nnotes\nclear\nversion",
        info: "TSB Digital Ecosystem V5\nDeveloper: " + data.settings.developer,
        projects: "Projects: " + data.projects.length,
        tasks: "Tasks: " + data.tasks.length,
        notes: "Notes: " + data.notes.length,
        version: "TSB Ecosystem Version 5.0",
        clear: ""
    };

    const result = Object.prototype.hasOwnProperty.call(commands, cmd)
        ? commands[cmd]
        : "Unknown command. Type help.";

    if (cmd === "clear") {
        output.textContent = "";
    } else {
        output.textContent += "\n\n> " + command + "\n" + result;
    }

    data.stats.commands++;
    saveData();
}

/* =========================================================
   DEVELOPER TOOLS
========================================================= */

function renderTools() {
    return `
        ${pageIntro("Developer Tools", "Useful tools for everyday development work.")}

        ${card("Text Counter", `
            <textarea id="counterInput" placeholder="Type or paste text here..."></textarea>
            <p id="counterResult">Characters: 0 | Words: 0 | Lines: 0</p>
        `)}

        ${card("JSON Formatter", `
            <textarea id="jsonInput" class="code-editor" placeholder='{"name":"TSB"}'></textarea>
            <button id="formatJSON">Format JSON</button>
            <button class="secondary" id="minifyJSON">Minify JSON</button>
            <div class="tool-output" id="jsonOutput">Output appears here.</div>
        `)}

        ${card("Base64 Converter", `
            <textarea id="base64Input" placeholder="Enter text..."></textarea>
            <div class="actions">
                <button id="encodeBase64">Encode</button>
                <button class="secondary" id="decodeBase64">Decode</button>
            </div>
            <div class="tool-output" id="base64Output"></div>
        `)}

        ${card("Color Tool", `
            <label>Choose Color<input type="color" id="colorPicker" value="#35d6a0"></label>
            <div class="tool-output" id="colorOutput">#35D6A0</div>
        `)}
    `;
}

/* =========================================================
   CODE SNIPPETS
========================================================= */

function renderSnippets() {
    return `
        ${pageIntro("Code Snippet Library", "Save useful code for future projects.")}

        ${card("Add Snippet", `
            <form id="snippetForm">
                <label>Snippet Name<input name="name" required></label>
                <label>Language<input name="language" placeholder="JavaScript / Python / HTML"></label>
                <label>Code<textarea name="code" class="code-editor" required></textarea></label>
                <button type="submit">Save Snippet</button>
            </form>
        `)}

        ${data.snippets.length ? data.snippets.map(s => card(s.name, `
            <p>${escapeHTML(s.language)}</p>
            <pre class="tool-output">${escapeHTML(s.code)}</pre>
            <div class="actions">
                <button class="small" data-copy="${escapeHTML(s.code)}">Copy Code</button>
                <button class="small danger" data-delete="snippets" data-id="${escapeHTML(s.id)}">Delete</button>
            </div>
        `)).join("") : emptyState("No snippets saved.")}
    `;
}

/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();

    let cells = "";
    for (let i = 0; i < first; i++) cells += `<div></div>`;

    for (let day = 1; day <= days; day++) {
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const tasks = data.tasks.filter(t => t.due === date).length;
        cells += `<div class="calendar-day"><strong>${day}</strong>${tasks ? `<p>${tasks} task(s)</p>` : ""}</div>`;
    }

    return `
        ${pageIntro("Developer Calendar", "View this month's calendar and task deadlines.")}
        ${card(now.toLocaleString("default", { month: "long", year: "numeric" }), `
            <div class="calendar-grid">
                ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => `<div class="calendar-day"><b>${d}</b></div>`).join("")}
                ${cells}
            </div>
        `)}
    `;
}

/* =========================================================
   CALCULATOR
========================================================= */

function renderCalculator() {
    return `
        ${pageIntro("Developer Calculator", "A simple calculator for everyday calculations.")}

        ${card("Calculator", `
            <input id="calcInput" placeholder="Example: (25 + 5) * 2">
            <button id="calculate">Calculate</button>
            <div class="tool-output" id="calcOutput">Result appears here.</div>
        `)}
    `;
}

function safeCalculate(expression) {
    const input = String(expression).trim();

    if (!input || input.length > 100) throw new Error("Invalid expression.");
    if (!/^[0-9+\-*/().%\s]+$/.test(input)) {
        throw new Error("Only numbers and basic arithmetic operators are allowed.");
    }

    const tokens = input.match(/\d*\.?\d+|[()+\-*/%]/g);
    if (!tokens || tokens.join("") !== input.replace(/\s/g, "")) {
        throw new Error("Invalid expression.");
    }

    let position = 0;

    function parseExpression() {
        let value = parseTerm();
        while (tokens[position] === "+" || tokens[position] === "-") {
            const op = tokens[position++];
            const right = parseTerm();
            value = op === "+" ? value + right : value - right;
        }
        return value;
    }

    function parseTerm() {
        let value = parseFactor();
        while (["*", "/", "%"].includes(tokens[position])) {
            const op = tokens[position++];
            const right = parseFactor();
            if ((op === "/" || op === "%") && right === 0) {
                throw new Error("Cannot divide by zero.");
            }
            if (op === "*") value *= right;
            if (op === "/") value /= right;
            if (op === "%") value %= right;
        }
        return value;
    }

    function parseFactor() {
        if (tokens[position] === "+") {
            position++;
            return parseFactor();
        }
        if (tokens[position] === "-") {
            position++;
            return -parseFactor();
        }
        if (tokens[position] === "(") {
            position++;
            const value = parseExpression();
            if (tokens[position++] !== ")") throw new Error("Missing closing bracket.");
            return value;
        }

        const token = tokens[position++];
        if (!token || !/^\d*\.?\d+$/.test(token)) throw new Error("Invalid number.");
        return Number(token);
    }

    const result = parseExpression();
    if (position !== tokens.length || !Number.isFinite(result)) {
        throw new Error("Invalid expression.");
    }

    return result;
}

/* =========================================================
   MARKDOWN EDITOR
========================================================= */

function renderMarkdown() {
    return `
        ${pageIntro("Markdown Editor", "Write simple Markdown notes and preview your text.")}

        ${card("Editor", `
            <textarea id="markdownInput" class="code-editor" placeholder="# Hello TSB\n\nWrite your notes here..."></textarea>
            <button id="previewMarkdown">Preview</button>
            <div class="tool-output" id="markdownOutput"></div>
        `)}
    `;
}

function basicMarkdown(text) {
    return escapeHTML(text)
        .replace(/^### (.*)$/gm, "<h3>$1</h3>")
        .replace(/^## (.*)$/gm, "<h2>$1</h2>")
        .replace(/^# (.*)$/gm, "<h1>$1</h1>")
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/\*(.*?)\*/g, "<i>$1</i>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\n/g, "<br>");
}

/* =========================================================
   NOTES AND IDEAS
========================================================= */

function renderNotes() {
    return `
        ${pageIntro("Quick Notes Dock", "Save important reminders and ideas.")}

        ${card("New Note", `
            <form id="noteForm">
                <label>Title<input name="title" required></label>
                <label>Note<textarea name="content" required></textarea></label>
                <button type="submit">Save Note</button>
            </form>
        `)}

        ${data.notes.length ? data.notes.slice().reverse().map(n => card(n.title, `
            <p>${safeText(n.content)}</p>
            <p>${escapeHTML(formatDate(n.date))}</p>
            <button class="small danger" data-delete="notes" data-id="${escapeHTML(n.id)}">Delete</button>
        `)).join("") : emptyState("No notes saved.")}
    `;
}

function renderIdeas() {
    return `
        ${pageIntro("Idea Vault", "Collect and organize ideas for future projects.")}

        ${card("Add Idea", `
            <form id="ideaForm">
                <label>Idea Title<input name="title" required></label>
                <label>Details<textarea name="details"></textarea></label>
                <label>Category<input name="category" placeholder="Game / App / Business"></label>
                <button type="submit">Save Idea</button>
            </form>
        `)}

        ${data.ideas.length ? data.ideas.map(i => card(i.title, `
            <p>${safeText(i.details)}</p>
            <p><span class="badge">${escapeHTML(i.category)}</span></p>
            <button class="small danger" data-delete="ideas" data-id="${escapeHTML(i.id)}">Delete</button>
        `)).join("") : emptyState("Your idea vault is empty.")}
    `;
}

/* =========================================================
   FOCUS TIMER
========================================================= */

function renderFocus() {
    return `
        ${pageIntro("Focus Timer", "Use a simple focus session to organize work time.")}

        ${card("Focus Session", `
            <div class="stat-value" id="focusDisplay">${formatTimer(focusSeconds)}</div>
            <div class="actions">
                <button id="startFocus">${focusRunning ? "Running" : "Start"}</button>
                <button class="secondary" id="pauseFocus">Pause</button>
                <button class="secondary" id="resetFocus">Reset</button>
            </div>
            <p>Recorded focus time: ${data.stats.focusMinutes} minutes</p>
            <p>Timer runs while this page remains open.</p>
        `)}
    `;
}

function formatTimer(seconds) {
    const min = Math.floor(seconds / 60).toString().padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return min + ":" + sec;
}

function updateFocusDisplay() {
    const display = $("focusDisplay");
    if (display) display.textContent = formatTimer(focusSeconds);
}

function startFocus() {
    if (focusRunning) return;
    focusRunning = true;

    focusInterval = setInterval(() => {
        focusSeconds--;
        updateFocusDisplay();

        if (focusSeconds <= 0) {
            clearInterval(focusInterval);
            focusRunning = false;
            data.stats.focusMinutes += 25;
            saveData();
            addNotification("Focus session completed!");
            alert("Focus session completed!");
            focusSeconds = 25 * 60;
            updateFocusDisplay();
        }
    }, 1000);

    renderPage();
}

function pauseFocus() {
    clearInterval(focusInterval);
    focusRunning = false;
    renderPage();
}

function resetFocus() {
    clearInterval(focusInterval);
    focusRunning = false;
    focusSeconds = 25 * 60;
    renderPage();
}

/* =========================================================
   CHALLENGES AND ACHIEVEMENTS
========================================================= */

function renderChallenges() {
    const today = dateToday();
    const existing = data.challenges.find(c => c.date === today);

    const challenge = existing || {
        title: "Complete one small development task",
        date: today
    };

    return `
        ${pageIntro("Daily Developer Challenge", "Build a consistent learning and development habit.")}

        ${card("Today's Challenge", `
            <h2>${escapeHTML(challenge.title)}</h2>
            <p>Date: ${today}</p>
            ${existing?.completed ?
                `<span class="badge">COMPLETED</span>` :
                `<button id="completeChallenge">Mark as Completed</button>`}
        `)}

        ${card("Challenge History", data.challenges.length ?
            `<div class="list">${data.challenges.map(c => `
                <div class="list-item"><b>${escapeHTML(c.title)}</b><span class="badge">${c.completed ? "Completed" : "Pending"}</span></div>
            `).join("")}</div>` : emptyState("No challenge history yet."))}
    `;
}

function renderAchievements() {
    const earned = [
        ["First Project", data.projects.length >= 1],
        ["Task Starter", data.tasks.length >= 1],
        ["Task Finisher", data.tasks.some(t => t.status === "Completed")],
        ["Idea Creator", data.ideas.length >= 1],
        ["Photography Planner", data.photoProjects.length >= 1],
        ["Code Collector", data.snippets.length >= 1]
    ];

    return `
        ${pageIntro("Achievement System", "Milestones earned through your workspace activity.")}

        <div class="grid">
            ${earned.map(([name, unlocked]) => `
                <section class="card">
                    <h2>${unlocked ? "🏆" : "🔒"}</h2>
                    <h3>${escapeHTML(name)}</h3>
                    <span class="badge ${unlocked ? "" : "orange"}">${unlocked ? "UNLOCKED" : "LOCKED"}</span>
                </section>
            `).join("")}
        </div>
    `;
}

/* =========================================================
   GLOBAL SEARCH
========================================================= */

function renderSearch() {
    return `
        ${pageIntro("Global Search", "Search through projects, tasks, notes and ideas.")}

        ${card("Search Workspace", `
            <input id="globalSearchInput" class="search-box" placeholder="Search anything...">
            <div id="searchResults">${emptyState("Start typing to search.")}</div>
        `)}
    `;
}

function performSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) return emptyState("Start typing to search.");

    const collections = [
        ["Project", data.projects, ["name", "category", "description"]],
        ["Task", data.tasks, ["title", "priority", "status"]],
        ["Note", data.notes, ["title", "content"]],
        ["Idea", data.ideas, ["title", "details", "category"]],
        ["Snippet", data.snippets, ["name", "language", "code"]]
    ];

    const results = [];

    collections.forEach(([type, items, fields]) => {
        items.forEach(item => {
            if (fields.some(field => String(item[field] || "").toLowerCase().includes(q))) {
                results.push({ type, title: item.name || item.title || "Record" });
            }
        });
    });

    return results.length ? `<div class="list">${results.map(r => `
        <div class="list-item"><b>${escapeHTML(r.title)}</b><span class="badge">${escapeHTML(r.type)}</span></div>
    `).join("")}</div>` : emptyState("No matching records found.");
}

/* =========================================================
   VERSION HISTORY
========================================================= */

function renderVersions() {
    return `
        ${pageIntro("Version History Manager", "Record important project milestones and changes.")}

        ${card("Create Version Record", `
            <form id="versionForm">
                <label>Version<input name="version" required placeholder="v1.0.0"></label>
                <label>Changes<textarea name="changes" required></textarea></label>
                <button type="submit">Save Version</button>
            </form>
        `)}

        ${data.versions.length ? data.versions.slice().reverse().map(v => card(v.version, `
            <p>${safeText(v.changes)}</p>
            <p>${escapeHTML(formatDate(v.date))}</p>
            <button class="small danger" data-delete="versions" data-id="${escapeHTML(v.id)}">Delete</button>
        `)).join("") : emptyState("No version records yet.")}
    `;
}

/* =========================================================
   PROJECT ARCHIVE
========================================================= */

function renderArchive() {
    return `
        ${pageIntro("Project Archive", "Keep completed projects in a separate archive.")}

        ${card("Archived Projects", data.archivedProjects.length ?
            `<div class="list">${data.archivedProjects.map(p => `
                <div class="list-item"><div><b>${escapeHTML(p.name)}</b><p>${escapeHTML(p.category)}</p></div>
                <button class="small" data-restore-project="${escapeHTML(p.id)}">Restore</button></div>
            `).join("")}</div>` : emptyState("No archived projects."))}

        ${card("Archive a Project", data.projects.length ?
            `<div class="list">${data.projects.map(p => `
                <div class="list-item"><b>${escapeHTML(p.name)}</b><button class="small" data-archive-project="${escapeHTML(p.id)}">Archive</button></div>
            `).join("")}</div>` : emptyState("No projects available."))}
    `;
}

/* =========================================================
   BUG TRACKER
========================================================= */

function renderBugs() {
    return `
        ${pageIntro("Bug Tracker", "Record software issues and track their progress.")}

        ${card("Report a Bug", `
            <form id="bugForm">
                <label>Bug Title<input name="title" required></label>
                <label>Description<textarea name="description" required></textarea></label>
                <label>Priority<select name="priority"><option>Normal</option><option>High</option><option>Critical</option><option>Low</option></select></label>
                <button type="submit">Save Bug</button>
            </form>
        `)}

        ${data.bugs.length ? data.bugs.map(b => card(b.title, `
            <p>${safeText(b.description)}</p>
            <p><span class="badge orange">${escapeHTML(b.priority)}</span> ${escapeHTML(b.status)}</p>
            <button class="small" data-resolve-bug="${escapeHTML(b.id)}">Resolve</button>
            <button class="small danger" data-delete="bugs" data-id="${escapeHTML(b.id)}">Delete</button>
        `)).join("") : emptyState("No bugs recorded.")}
    `;
}

/* =========================================================
   KNOWLEDGE BASE
========================================================= */

function renderKnowledge() {
    return `
        ${pageIntro("Knowledge Base", "Store useful learning notes and technical references.")}

        ${card("Add Knowledge Article", `
            <form id="knowledgeForm">
                <label>Title<input name="title" required></label>
                <label>Category<input name="category"></label>
                <label>Content<textarea name="content" required></textarea></label>
                <button type="submit">Save Article</button>
            </form>
        `)}

        ${data.knowledge.length ? data.knowledge.map(k => card(k.title, `
            <p><span class="badge">${escapeHTML(k.category)}</span></p>
            <p>${safeText(k.content)}</p>
            <button class="small danger" data-delete="knowledge" data-id="${escapeHTML(k.id)}">Delete</button>
        `)).join("") : emptyState("Knowledge base is empty.")}
    `;
}

/* =========================================================
   ROADMAP AND REPORTS
========================================================= */

function renderRoadmap() {
    return `
        ${pageIntro("TSB Roadmap", "Plan upcoming milestones for your studio.")}

        ${card("Add Roadmap Item", `
            <form id="roadmapForm">
                <label>Milestone<input name="title" required></label>
                <label>Target Date<input name="date" type="date"></label>
                <label>Status<select name="status"><option>Planned</option><option>In Progress</option><option>Completed</option></select></label>
                <button type="submit">Add Milestone</button>
            </form>
        `)}

        ${data.roadmap.length ? data.roadmap.map(r => card(r.title, `
            <p>${escapeHTML(r.date || "No date")} · ${escapeHTML(r.status)}</p>
            <button class="small danger" data-delete="roadmap" data-id="${escapeHTML(r.id)}">Delete</button>
        `)).join("") : emptyState("No milestones added.")}
    `;
}

function renderReports() {
    return `
        ${pageIntro("Reports Center", "Review workspace records and export a simple report.")}

        <div class="grid">
            ${statCard("Projects", data.projects.length, "Records")}
            ${statCard("Tasks", data.tasks.length, "Records")}
            ${statCard("Ideas", data.ideas.length, "Records")}
            ${statCard("Photography", data.photoProjects.length, "Records")}
        </div>

        ${card("Export Report", `
            <p>Generate a text report of your current workspace totals.</p>
            <button id="downloadReport">Download Text Report</button>
        `)}
    `;
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function renderNotifications() {
    return `
        ${pageIntro("Notification Center", "View messages generated by your workspace.")}

        ${data.notifications.length ? data.notifications.map(n => card(n.message, `
            <p>${escapeHTML(new Date(n.date).toLocaleString())}</p>
            <span class="badge">${n.read ? "Read" : "Unread"}</span>
            <button class="small" data-read-notification="${escapeHTML(n.id)}">Mark Read</button>
        `)).join("") : emptyState("No notifications.")}
    `;
}

/* =========================================================
   SETTINGS AND ABOUT
========================================================= */

function renderSettings() {
    return `
        ${pageIntro("Customization Center", "Adjust your local workspace preferences.")}

        ${card("Profile Settings", `
            <form id="settingsForm">
                <label>Developer Name<input name="developer" value="${escapeHTML(data.settings.developer)}"></label>
                <label>Studio Name<input name="studio" value="${escapeHTML(data.settings.studio)}"></label>
                <button type="submit">Save Settings</button>
            </form>
        `)}

        ${card("Data Management", `
            <p>Export a backup before importing or resetting data.</p>
            <div class="actions">
                <button onclick="backup()">Export Backup</button>
                <button class="secondary" id="importButton">Import Backup</button>
                <button class="danger" id="resetData">Reset All Data</button>
            </div>
            <input type="file" id="settingsImport" accept=".json,application/json" hidden>
        `)}

        ${card("Appearance", `
            <p>Current theme: Dark Developer</p>
            <p>Accent: ${escapeHTML(data.settings.theme)}</p>
            <p>More theme options can be added in a future update.</p>
        `)}
    `;
}

function renderAbout() {
    return `
        ${pageIntro("About TSB Digital Ecosystem", "A personal development workspace built for The Super Boys Studio.")}

        ${card("Application Information", `
            <h2>TSB DIGITAL ECOSYSTEM V5</h2>
            <p>Designed for project planning, development, photography, productivity and creative work.</p>
            <p><b>Developer:</b> ${escapeHTML(data.settings.developer)}</p>
            <p><b>Studio:</b> ${escapeHTML(data.settings.studio)}</p>
            <p><b>Version:</b> 5.0</p>
            <p><b>Storage:</b> Local browser storage</p>
        `)}

        ${card("Important Information", `
            <p>This is a local browser application. It does not currently provide online accounts, server storage, cloud synchronization or shared team access.</p>
            <p>Back up your data regularly using the Backup feature.</p>
        `)}
    `;
}

/* =========================================================
   FORMS AND PAGE INTERACTIONS
========================================================= */

function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function addRecord(collection, record) {
    data[collection].push({ id: uid(), date: dateToday(), ...record });
    saveData();
    addNotification("New record added to " + collection + ".");
    renderPage();
}

function deleteRecord(collection, id) {
    if (!Array.isArray(data[collection])) return;
    if (!confirm("Delete this record?")) return;

    data[collection] = data[collection].filter(item => item.id !== id);
    saveData();
    renderPage();
}

function attachPageEvents() {
    $("content")?.querySelectorAll("[data-go]").forEach(button => {
        button.addEventListener("click", () => navigate(button.dataset.go));
    });

    $("content")?.querySelectorAll("[data-delete]").forEach(button => {
        button.addEventListener("click", () => deleteRecord(button.dataset.delete, button.dataset.id));
    });

    $("content")?.querySelectorAll("[data-complete-task]").forEach(button => {
        button.addEventListener("click", () => {
            const task = data.tasks.find(t => t.id === button.dataset.completeTask);
            if (!task) return;
            if (task.status !== "Completed") data.stats.completedTasks++;
            task.status = "Completed";
            saveData();
            addNotification("Task completed: " + task.title);
            renderPage();
        });
    });

    $("content")?.querySelectorAll("[data-copy]").forEach(button => {
        button.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(button.dataset.copy);
                alert("Copied!");
            } catch (_) {
                alert("Clipboard access is unavailable in this browser.");
            }
        });
    });

    bindForm("projectForm", values => addRecord("projects", {
        name: values.name,
        category: values.category,
        status: values.status,
        progress: Math.max(0, Math.min(100, Number(values.progress) || 0)),
        description: values.description
    }));

    bindForm("taskForm", values => addRecord("tasks", {
        title: values.title,
        due: values.due,
        priority: values.priority,
        status: "Pending"
    }));

    bindForm("workflowForm", values => addRecord("workflows", values));
    bindForm("promptForm", values => addRecord("prompts", values));
    bindForm("teamForm", values => addRecord("team", values));
    bindForm("assetForm", values => addRecord("assets", values));
    bindForm("snippetForm", values => addRecord("snippets", values));
    bindForm("noteForm", values => addRecord("notes", values));
    bindForm("ideaForm", values => addRecord("ideas", values));
    bindForm("journalForm", values => addRecord("journal", values));
    bindForm("versionForm", values => addRecord("versions", values));
    bindForm("bugForm", values => addRecord("bugs", { ...values, status: "Open" }));
    bindForm("knowledgeForm", values => addRecord("knowledge", values));
    bindForm("roadmapForm", values => addRecord("roadmap", values));

    bindForm("photoProjectForm", values => addRecord("photoProjects", values));
    bindForm("cameraForm", values => addRecord("cameraLogs", values));
    bindForm("editingForm", values => addRecord("editingTasks", values));
    bindForm("equipmentForm", values => addRecord("equipment", values));
    bindForm("photoNoteForm", values => addRecord("photoNotes", values));
    bindForm("sessionForm", values => addRecord("sessions", values));

    bindForm("settingsForm", values => {
        data.settings.developer = values.developer;
        data.settings.studio = values.studio;
        saveData();
        alert("Settings saved!");
        renderPage();
    });

    bindForm("terminalForm", values => {
        runTerminal(values.command || $("terminalInput")?.value || "");
        $("terminalInput").value = "";
    });

    $("terminalForm")?.addEventListener("submit", event => {
        event.preventDefault();
    });

    $("previewHTML")?.addEventListener("click", () => {
        const frame = $("htmlPreview");
        const source = $("htmlInput").value;
        frame.srcdoc = source;
    });

    $("clearHTML")?.addEventListener("click", () => {
        $("htmlInput").value = "";
        $("htmlPreview").srcdoc = "";
    });

    $("counterInput")?.addEventListener("input", event => {
        const text = event.target.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        $("counterResult").textContent =
            `Characters: ${text.length} | Words: ${words} | Lines: ${text ? text.split("\n").length : 0}`;
    });

    $("formatJSON")?.addEventListener("click", () => formatJSON(false));
    $("minifyJSON")?.addEventListener("click", () => formatJSON(true));

    $("encodeBase64")?.addEventListener("click", () => {
        try {
            $("base64Output").textContent = btoa(unescape(encodeURIComponent($("base64Input").value)));
        } catch (_) {
            $("base64Output").textContent = "Could not encode text.";
        }
    });

    $("decodeBase64")?.addEventListener("click", () => {
        try {
            $("base64Output").textContent = decodeURIComponent(escape(atob($("base64Input").value.trim())));
        } catch (_) {
            $("base64Output").textContent = "Invalid Base64 input.";
        }
    });

    $("colorPicker")?.addEventListener("input", event => {
        $("colorOutput").textContent = event.target.value.toUpperCase();
    });

    $("calculate")?.addEventListener("click", () => {
        try {
            $("calcOutput").textContent = String(safeCalculate($("calcInput").value));
        } catch (error) {
            $("calcOutput").textContent = error.message;
        }
    });

    $("previewMarkdown")?.addEventListener("click", () => {
        $("markdownOutput").innerHTML = basicMarkdown($("markdownInput").value);
    });

    $("startFocus")?.addEventListener("click", startFocus);
    $("pauseFocus")?.addEventListener("click", pauseFocus);
    $("resetFocus")?.addEventListener("click", resetFocus);

    $("globalSearchInput")?.addEventListener("input", event => {
        $("searchResults").innerHTML = performSearch(event.target.value);
    });

    $("completeChallenge")?.addEventListener("click", () => {
        const today = dateToday();
        let challenge = data.challenges.find(c => c.date === today);

        if (!challenge) {
            challenge = {
                id: uid(),
                date: today,
                title: "Complete one small development task",
                completed: true
            };
            data.challenges.push(challenge);
        } else {
            challenge.completed = true;
        }

        saveData();
        addNotification("Daily developer challenge completed!");
        renderPage();
    });

    $("downloadReport")?.addEventListener("click", downloadReport);

    $("importButton")?.addEventListener("click", () => $("settingsImport").click());
    $("settingsImport")?.addEventListener("change", importFile);
    $("importFile")?.addEventListener("change", importFile);

    $("resetData")?.addEventListener("click", resetAllData);

    $("content")?.querySelectorAll("[data-archive-project]").forEach(button => {
        button.addEventListener("click", () => {
            const index = data.projects.findIndex(p => p.id === button.dataset.archiveProject);
            if (index < 0) return;
            data.archivedProjects.push(data.projects.splice(index, 1)[0]);
            saveData();
            renderPage();
        });
    });

    $("content")?.querySelectorAll("[data-restore-project]").forEach(button => {
        button.addEventListener("click", () => {
            const index = data.archivedProjects.findIndex(p => p.id === button.dataset.restoreProject);
            if (index < 0) return;
            data.projects.push(data.archivedProjects.splice(index, 1)[0]);
            saveData();
            renderPage();
        });
    });

    $("content")?.querySelectorAll("[data-resolve-bug]").forEach(button => {
        button.addEventListener("click", () => {
            const bug = data.bugs.find(b => b.id === button.dataset.resolveBug);
            if (!bug) return;
            bug.status = "Resolved";
            saveData();
            renderPage();
        });
    });

    $("content")?.querySelectorAll("[data-read-notification]").forEach(button => {
        button.addEventListener("click", () => {
            const notification = data.notifications.find(n => n.id === button.dataset.readNotification);
            if (!notification) return;
            notification.read = true;
            saveData();
            renderPage();
        });
    });

    $("content")?.querySelectorAll("[data-delete-record]").forEach(button => {
        button.addEventListener("click", () => {
            const collections = [
                "photoProjects", "cameraLogs", "editingTasks",
                "equipment", "photoNotes", "sessions"
            ];
            for (const collection of collections) {
                if (data[collection].some(item => item.id === button.dataset.deleteRecord)) {
                    deleteRecord(collection, button.dataset.deleteRecord);
                    return;
                }
            }
        });
    });
}

function bindForm(id, callback) {
    const form = $(id);
    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();
        const values = formData(form);
        callback(values);
    });
}

function formatJSON(minify) {
    const output = $("jsonOutput");
    try {
        const parsed = JSON.parse($("jsonInput").value);
        output.textContent = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 4);
    } catch (error) {
        output.textContent = "Invalid JSON: " + error.message;
    }
}

/* =========================================================
   BACKUP AND IMPORT
========================================================= */

function backup() {
    const payload = {
        application: "TSB Digital Ecosystem",
        version: 5,
        exportedAt: new Date().toISOString(),
        data
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "TSB_Ecosystem_Backup_" + dateToday() + ".json";
    link.click();
    URL.revokeObjectURL(url);
}

function importFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const imported = JSON.parse(reader.result);
            const incoming = imported.data || imported;

            if (!incoming || typeof incoming !== "object") {
                throw new Error("Invalid backup file.");
            }

            const merged = structuredClone(DEFAULT_DATA);

            Object.keys(merged).forEach(key => {
                if (key === "settings" || key === "stats") {
                    merged[key] = { ...merged[key], ...(incoming[key] || {}) };
                } else if (Array.isArray(merged[key])) {
                    merged[key] = Array.isArray(incoming[key]) ? incoming[key] : [];
                }
            });

            if (!confirm("Import this backup? Current workspace data will be replaced.")) return;

            data = merged;
            saveData();
            alert("Backup imported successfully.");
            renderPage();
        } catch (error) {
            alert("Import failed: " + error.message);
        } finally {
            event.target.value = "";
        }
    };

    reader.readAsText(file);
}

function resetAllData() {
    const answer = prompt('Type RESET to confirm deleting all TSB Ecosystem data.');

    if (answer !== "RESET") {
        alert("Reset cancelled.");
        return;
    }

    if (!confirm("This action cannot be undone unless you have a backup. Continue?")) return;

    localStorage.removeItem(STORAGE_KEY);
    data = structuredClone(DEFAULT_DATA);
    saveData();
    alert("Workspace reset.");
    navigate("dashboard");
}

function downloadReport() {
    const report = [
        "TSB DIGITAL ECOSYSTEM V5 REPORT",
        "Generated: " + new Date().toLocaleString(),
        "",
        "Projects: " + data.projects.length,
        "Tasks: " + data.tasks.length,
        "Completed Tasks: " + data.tasks.filter(t => t.status === "Completed").length,
        "Ideas: " + data.ideas.length,
        "Code Snippets: " + data.snippets.length,
        "Photography Projects: " + data.photoProjects.length,
        "Team Members: " + data.team.length,
        "Focus Minutes: " + data.stats.focusMinutes
    ].join("\n");

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "TSB_Workspace_Report.txt";
    link.click();
    URL.revokeObjectURL(url);
}

/* =========================================================
   GLOBAL APP INITIALIZATION
========================================================= */

function updateClock() {
    const clock = $("clock");
    if (clock) {
        clock.textContent = new Date().toLocaleString();
    }
}

function initializeApp() {
    renderNavigation();
    renderPage();

    updateClock();
    setInterval(updateClock, 1000);

    $("menu")?.addEventListener("click", () => {
        $("sidebar")?.classList.toggle("open");
    });

    const modal = $("modal");
    modal?.addEventListener("click", event => {
        if (event.target === modal) closeModal();
    });

    console.log("TSB Digital Ecosystem V5 initialized.");
}

function closeModal() {
    $("modal")?.classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", initializeApp);
