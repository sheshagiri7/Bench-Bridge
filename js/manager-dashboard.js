/* ==========================================================
   BenchBridge Manager Dashboard JS
   Vanilla JavaScript (ES6)
========================================================== */

"use strict";

const API_BASE = "http://localhost:8081";

/* State Store */
let STATE = {
    employees: [],
    projects: [],
    matches: [],
    assessments: []
};

/* Mock Fallbacks for local testing */
const MOCK_EMPLOYEES = [];

const MOCK_PROJECTS = [
    { projectId: 1, projectName: "AI Banking Portal", requiredSkills: "Java, Spring Boot, SQL, React", domain: "FinTech", openPosition: 3 },
    { projectId: 2, projectName: "Cloud Migration Suite", requiredSkills: "Java, Docker, Kubernetes, Spring Boot", domain: "Cloud Infrastructure", openPosition: 2 },
    { projectId: 3, projectName: "Data Insights Hub", requiredSkills: "Python, SQL, Machine Learning, React", domain: "Data & Analytics", openPosition: 4 },
    { projectId: 4, projectName: "Healthcare Patient Portal", requiredSkills: "React, Java, SQL", domain: "HealthTech", openPosition: 2 }
];

const MOCK_MATCHES = [];

/* ==========================================================
   INITIALIZATION
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // ── Session guard ──────────────────────────────────
    const rawSession = sessionStorage.getItem("bb_session");
    const session = rawSession ? JSON.parse(rawSession) : null;

    if (!session || !session.employee) {
        window.location.href = "login.html";
        return;
    }

    // Only allow manager role on this page
    if (session.employee.role !== "manager") {
        window.location.href = "employee-dashboard.html";
        return;
    }

    // Populate topbar with session data
    const mgr = session.employee;
    const avatarEl = document.getElementById("topAvatar");
    const nameEl   = document.getElementById("topName");
    const idEl     = document.getElementById("topEmpId");
    if (avatarEl) avatarEl.textContent = mgr && mgr.name ? initials(mgr.name) : "TM";
    if (nameEl)   nameEl.textContent   = (mgr && mgr.name) || "Team Manager";
    if (idEl)     idEl.textContent     = "MGR0001";

    // Sign-out clears session
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("bb_session");
        });
    }

    initNavigation();
    initProjectModal();
    initFilters();
    loadDashboardData();
});

/* ==========================================================
   API FETCH LAYER
========================================================== */

async function fetchWithFallback(url, options, fallbackData) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
            const data = await response.json();
            if (data !== undefined && data !== null) {
                return data;
            }
        }
    } catch (e) {
        console.warn(`[Manager API] Fallback used for ${url}:`, e.message);
    }
    return fallbackData;
}

async function loadDashboardData() {
    // Fetch all employees from backend
    STATE.employees = await fetchWithFallback(`${API_BASE}/api/employees`, {}, MOCK_EMPLOYEES);
    // Fetch all projects
    STATE.projects  = await fetchWithFallback(`${API_BASE}/api/projects`, {}, MOCK_PROJECTS);
    // Fetch all project matches (no employee filter — manager sees all)
    STATE.matches   = await fetchWithFallback(`${API_BASE}/api/project-matches`, {}, MOCK_MATCHES);

    renderKPIs();
    renderOverviewMatches();
    renderOverviewSkills();
    renderResourceTable();
    renderProjects();
    renderAllocations();
    renderTeam();
}

/* ==========================================================
   KPI COMPUTATION & OVERVIEW RENDER
========================================================== */

function renderKPIs() {
    const total = STATE.employees.length;
    const bench = STATE.employees.filter(e => e.benchStatus === "On Bench").length;
    const allocated = total - bench;
    const utilization = total > 0 ? Math.round((allocated / total) * 100) : 0;
    const openProjects = STATE.projects.length;

    document.getElementById("statTotalEmployees").textContent = total;
    document.getElementById("statBenchCount").textContent = bench;
    document.getElementById("statUtilization").textContent = `${utilization}%`;
    document.getElementById("statOpenProjects").textContent = openProjects;
}

function renderOverviewMatches() {
    const container = document.getElementById("overviewMatchesContainer");
    const validMatches = (STATE.matches || []).filter(m => STATE.employees.some(e => e.emplId === m.employeeId));

    if (validMatches.length === 0) {
        container.innerHTML = `<div class="placeholder-text">No active project recommendations.</div>`;
        return;
    }

    container.innerHTML = validMatches.map(m => {
        const emp = STATE.employees.find(e => e.emplId === m.employeeId);
        const prj = STATE.projects.find(p => p.projectId === m.projectId) || { projectName: "Project" };
        if (!emp) return "";
        return `
            <div class="allocation-item">
                <div class="user-cell">
                    <div class="user-avatar-sm">${initials(emp.name)}</div>
                    <div>
                        <strong class="user-name">${emp.name}</strong>
                        <span class="user-sub">Matched to: <strong>${prj.projectName}</strong> (${m.matchScore}% Match)</span>
                    </div>
                </div>
                <span class="badge-bench">${m.status}</span>
            </div>
        `;
    }).join("");
}

function renderOverviewSkills() {
    const container = document.getElementById("overviewSkillsContainer");
    
    if (!STATE.employees || STATE.employees.length === 0) {
        container.innerHTML = `<div class="placeholder-text">No registered employee skills recorded yet.</div>`;
        return;
    }

    const total = STATE.employees.length;
    const skills = [
        { name: "Java & Spring Boot", count: STATE.employees.length, percentage: 100 }
    ];

    container.innerHTML = skills.map(s => `
        <div style="margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 6px;">
                <span>${s.name}</span>
                <span><strong>${s.count}</strong> Engineers</span>
            </div>
            <div class="progress" style="background: rgba(255,255,255,0.06); height: 8px; border-radius: 4px; overflow: hidden;">
                <div class="progress-fill" style="width: ${s.percentage}%; background: linear-gradient(90deg, #3b82f6, #06b6d4); height: 100%;"></div>
            </div>
        </div>
    `).join("");
}

/* ==========================================================
   BENCH RESOURCES DIRECTORY
========================================================== */

function renderResourceTable() {
    const container = document.getElementById("resourcesTableContainer");
    const dept = (document.getElementById("departmentFilter") || {}).value || "ALL";
    const status = (document.getElementById("statusFilter") || {}).value || "ALL";
    const resourceSearchEl = document.getElementById("resourceSearch");
    const search = resourceSearchEl ? resourceSearchEl.value.toLowerCase() : "";

    let filtered = STATE.employees.filter(emp => {
        const matchesDept = (dept === "ALL" || emp.department === dept);
        const matchesStatus = (status === "ALL" || emp.benchStatus === status);
        const matchesSearch = !search || (
            emp.name.toLowerCase().includes(search) ||
            (emp.email && emp.email.toLowerCase().includes(search)) ||
            (emp.department && emp.department.toLowerCase().includes(search))
        );
        return matchesDept && matchesStatus && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="placeholder-text">No matching resources found.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="resource-table">
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Experience</th>
                    <th>Bench Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(emp => `
                    <tr>
                        <td>
                            <div class="user-cell">
                                <div class="user-avatar-sm">${initials(emp.name)}</div>
                                <div>
                                    <strong class="user-name">${emp.name}</strong>
                                    <span class="user-sub">${emp.email}</span>
                                </div>
                            </div>
                        </td>
                        <td>${emp.department || "General"}</td>
                        <td>${emp.experiences || 1} Years</td>
                        <td>
                            <span class="${emp.benchStatus === 'Allocated' ? 'badge-allocated' : 'badge-bench'}">
                                ${emp.benchStatus || 'On Bench'}
                            </span>
                        </td>
                        <td>
                            <button class="action-btn-sm" onclick="toggleEmployeeStatus(${emp.emplId})">
                                ${emp.benchStatus === 'Allocated' ? 'Move to Bench' : 'Allocate'}
                            </button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

async function toggleEmployeeStatus(id) {
    const emp = STATE.employees.find(e => e.emplId === id);
    if (!emp) return;

    const newStatus = emp.benchStatus === "Allocated" ? "On Bench" : "Allocated";
    emp.benchStatus = newStatus;

    try {
        await fetch(`${API_BASE}/api/employees/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ benchStatus: newStatus })
        });
    } catch (e) {
        console.warn("[Manager API] Failed status update to live backend:", e.message);
    }

    renderKPIs();
    renderResourceTable();
    showToast(`Updated ${emp.name} status to '${newStatus}'`);
}

/* ==========================================================
   PROJECT MANAGEMENT & POSTING
========================================================== */

function renderProjects() {
    const container = document.getElementById("managerProjectsContainer");
    if (!STATE.projects || STATE.projects.length === 0) {
        container.innerHTML = `<div class="placeholder-text">No active project postings.</div>`;
        return;
    }

    container.innerHTML = STATE.projects.map(p => `
        <div class="glass-card" style="margin-bottom: 16px;">
            <div class="card-header" style="border: none; padding-bottom: 0;">
                <div>
                    <h3 style="font-size: 1.1rem; color: #ffffff;">${p.projectName}</h3>
                    <span style="color: #06b6d4; font-size: 0.82rem;"><i class="fa-solid fa-layer-group"></i> ${p.domain || 'Enterprise'}</span>
                </div>
                <span class="badge-allocated" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa;">
                    ${p.openPosition || 1} Open Positions
                </span>
            </div>
            <div style="margin-top: 12px; font-size: 0.85rem; color: #94a3b8;">
                <strong>Required Skills:</strong> ${p.requiredSkills}
            </div>
        </div>
    `).join("");
}

function initProjectModal() {
    const modal = document.getElementById("projectModal");
    const openBtn = document.getElementById("newProjectBtn");
    const closeBtn = document.getElementById("closeProjectModal");
    const cancelBtn = document.getElementById("cancelProjectBtn");
    const form = document.getElementById("projectForm");

    openBtn.addEventListener("click", () => modal.classList.add("active"));
    closeBtn.addEventListener("click", () => modal.classList.remove("active"));
    cancelBtn.addEventListener("click", () => modal.classList.remove("active"));

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const newProject = {
            projectName: document.getElementById("projectName").value.trim(),
            domain: document.getElementById("projectDomain").value.trim(),
            openPosition: 1,
            requiredSkills: document.getElementById("requiredSkills").value.trim()
        };

        try {
            const response = await fetch(`${API_BASE}/api/projects`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newProject)
            });
            if (response.ok) {
                const saved = await response.json();
                STATE.projects.push(saved);
            } else {
                STATE.projects.push({ ...newProject, projectId: Date.now() });
            }
        } catch (e) {
            STATE.projects.push({ ...newProject, projectId: Date.now() });
        }

        renderKPIs();
        renderProjects();
        modal.classList.remove("active");
        form.reset();
        showToast("New project posted successfully!");
    });
}

/* ==========================================================
   ALLOCATION REQUESTS (APPROVE / REJECT)
========================================================== */

function renderAllocations() {
    const container = document.getElementById("allocationsContainer");
    if (!STATE.matches || STATE.matches.length === 0) {
        container.innerHTML = `<div class="placeholder-text">No pending allocation requests.</div>`;
        return;
    }

    container.innerHTML = STATE.matches.map(m => {
        const emp = STATE.employees.find(e => e.emplId === m.employeeId) || { name: "Pravin Kumar", department: "AI & Data Science" };
        const prj = STATE.projects.find(p => p.projectId === m.projectId) || { projectName: "AI Banking Portal" };

        return `
            <div class="allocation-item">
                <div class="user-cell">
                    <div class="user-avatar-sm">${initials(emp.name)}</div>
                    <div>
                        <strong class="user-name">${emp.name}</strong>
                        <span class="user-sub">Applied for <strong>${prj.projectName}</strong> (${m.matchScore || 95}% Match)</span>
                    </div>
                </div>
                <div class="allocation-actions">
                    <button class="approve-btn" onclick="handleAllocation(${m.matchId}, 'Approved', ${emp.emplId})">
                        <i class="fa-solid fa-check"></i> Approve
                    </button>
                    <button class="reject-btn" onclick="handleAllocation(${m.matchId}, 'Rejected', ${emp.emplId})">
                        <i class="fa-solid fa-xmark"></i> Reject
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

async function handleAllocation(matchId, newStatus, emplId) {
    const matchIndex = STATE.matches.findIndex(m => m.matchId === matchId);
    const match = matchIndex !== -1 ? STATE.matches[matchIndex] : null;
    if (matchIndex !== -1) {
        STATE.matches.splice(matchIndex, 1);
    }

    if (newStatus === "Approved") {
        const emp = STATE.employees.find(e => e.emplId === emplId);
        if (emp) emp.benchStatus = "Allocated";

        // Remove any rejection entry if present
        const rejections = JSON.parse(localStorage.getItem("bb_rejections") || "{}");
        delete rejections[String(emplId)];
        localStorage.setItem("bb_rejections", JSON.stringify(rejections));

        // Persist approval so the employee dashboard can read it
        const projectId = match ? match.projectId : null;
        const project = projectId ? STATE.projects.find(p => p.projectId === projectId) : null;
        const approvals = JSON.parse(localStorage.getItem("bb_approvals") || "{}");
        approvals[String(emplId)] = {
            approvedAt: new Date().toISOString(),
            projectId: projectId,
            projectName: project ? project.projectName : (match ? match.projectName : "a project"),
            domain: project ? project.domain : "",
            requiredSkills: project ? project.requiredSkills : "",
            openPosition: project ? project.openPosition : "",
            matchScore: match ? match.matchScore : null
        };
        localStorage.setItem("bb_approvals", JSON.stringify(approvals));
    } else if (newStatus === "Rejected") {
        // Remove approval entry if present
        const approvals = JSON.parse(localStorage.getItem("bb_approvals") || "{}");
        delete approvals[String(emplId)];
        localStorage.setItem("bb_approvals", JSON.stringify(approvals));

        // Persist rejection so the employee dashboard can read it
        const projectId = match ? match.projectId : null;
        const project = projectId ? STATE.projects.find(p => p.projectId === projectId) : null;
        const rejections = JSON.parse(localStorage.getItem("bb_rejections") || "{}");
        rejections[String(emplId)] = {
            rejectedAt: new Date().toISOString(),
            projectId: projectId,
            projectName: project ? project.projectName : (match ? match.projectName : "a project"),
            domain: project ? project.domain : "",
            requiredSkills: project ? project.requiredSkills : "",
            openPosition: project ? project.openPosition : "",
            matchScore: match ? match.matchScore : null,
            reason: "Application was not selected by the manager."
        };
        localStorage.setItem("bb_rejections", JSON.stringify(rejections));
    }

    renderKPIs();
    renderOverviewMatches();
    renderResourceTable();
    renderAllocations();
    renderTeam();
    showToast(`Application ${newStatus.toLowerCase()} successfully.`);
}

/* ==========================================================
   HELPERS & FILTERS
========================================================== */

function initFilters() {
    const deptEl = document.getElementById("departmentFilter");
    const statusEl = document.getElementById("statusFilter");
    const searchEl = document.getElementById("resourceSearch");
    if (deptEl)   deptEl.addEventListener("change", renderResourceTable);
    if (statusEl) statusEl.addEventListener("change", renderResourceTable);
    if (searchEl) searchEl.addEventListener("input", renderResourceTable);
}

function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".dashboard-section");
    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");

    const SECTION_META = {
        overview:    { title: "Workforce Overview", subtitle: "Real-time resource utilization and bench metrics." },
        resources:   { title: "Bench Resources",   subtitle: "Search, filter, and manage employee allocations." },
        projects:    { title: "Project Openings",  subtitle: "Manage required skills and open staffing roles." },
        allocations: { title: "Allocation Requests", subtitle: "Review project applications submitted by bench employees." },
        team:        { title: "My Team", subtitle: "Employees you have approved and allocated to projects." }
    };

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const sectionName = item.dataset.section;

            navItems.forEach(i => i.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active"));

            item.classList.add("active");
            const targetSection = document.getElementById(`section-${sectionName}`);
            if (targetSection) targetSection.classList.add("active");

            if (SECTION_META[sectionName]) {
                pageTitle.textContent = SECTION_META[sectionName].title;
                pageSubtitle.textContent = SECTION_META[sectionName].subtitle;
            }
        });
    });

    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("open");
            overlay.classList.toggle("active");
        });
        overlay.addEventListener("click", () => {
            sidebar.classList.remove("open");
            overlay.classList.remove("active");
        });
    }
}

function initials(name) {
    return String(name || "?")
        .split(" ")
        .map(part => part.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast";
        toast.innerHTML = '<i class="fa-solid fa-circle-check"></i><span></span>';
        document.body.appendChild(toast);
    }
    toast.querySelector("span").textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2800);
}

/* ==========================================================
   MY TEAM — render all allocated employees
========================================================== */

function renderTeam() {
    const container = document.getElementById("teamContainer");
    if (!container) return;

    // Pull approvals stored when manager approved each employee
    const approvals = JSON.parse(localStorage.getItem("bb_approvals") || "{}");

    // Build team list from STATE employees who are Allocated
    const teamMembers = STATE.employees.filter(e => e.benchStatus === "Allocated");

    // Also include any approvals stored in localStorage not yet in STATE
    Object.entries(approvals).forEach(([empIdStr, appr]) => {
        const alreadyIn = teamMembers.some(m => String(m.emplId) === empIdStr);
        if (!alreadyIn) {
            // Try to find in STATE
            const emp = STATE.employees.find(e => String(e.emplId) === empIdStr);
            if (emp) teamMembers.push(emp);
        }
    });

    if (teamMembers.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:48px 24px;">
                <i class="fa-solid fa-people-group" style="font-size:3rem;color:#8b5cf6;margin-bottom:16px;"></i>
                <h3 style="color:#f8fafc;margin-bottom:8px;">No team members yet</h3>
                <p style="color:#94a3b8;">Approved employees will appear here. Go to <strong>Allocation Requests</strong> to review applications.</p>
            </div>
        `;
        return;
    }

    const rows = teamMembers.map(emp => {
        const appr = approvals[String(emp.emplId)];
        const projectName = appr ? appr.projectName : (emp.currentProject || "Allocated");
        const domain      = appr ? appr.domain      : (emp.domain || "");
        const skills      = appr ? appr.requiredSkills : (emp.skills || "");
        const approvedAt  = appr ? new Date(appr.approvedAt).toLocaleDateString("en-US", { day:"numeric", month:"short", year:"numeric" }) : "—";
        const matchScore  = appr && appr.matchScore ? `${appr.matchScore}%` : "—";

        return `
            <div class="team-member-row">
                <div class="user-cell">
                    <div class="user-avatar-sm" style="background:linear-gradient(135deg,#8b5cf6,#6366f1);">${initials(emp.name)}</div>
                    <div>
                        <strong class="user-name">${emp.name || "—"}</strong>
                        <span class="user-sub">${emp.department || "—"} · ${emp.experiences || 0} yrs exp.</span>
                    </div>
                </div>
                <div class="team-project-info">
                    <span class="team-badge project"><i class="fa-solid fa-briefcase"></i> ${projectName}</span>
                    ${domain ? `<span class="team-badge domain"><i class="fa-solid fa-tag"></i> ${domain}</span>` : ""}
                </div>
                <div class="team-meta">
                    <span class="team-badge match"><i class="fa-solid fa-bolt"></i> ${matchScore} match</span>
                    <span class="team-badge date"><i class="fa-solid fa-calendar-check"></i> ${approvedAt}</span>
                </div>
                <span class="status-badge allocated">Allocated</span>
            </div>
        `;
    }).join("");

    container.innerHTML = `
        <div style="padding:8px 0;">
            <div class="team-header-row">
                <span>Employee</span>
                <span>Project</span>
                <span>Details</span>
                <span>Status</span>
            </div>
            ${rows}
        </div>
    `;
}
