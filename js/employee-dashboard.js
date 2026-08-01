/* ==========================================================
   BenchBridge Employee Dashboard
   Vanilla JavaScript (ES6)

   Layout uses a mock API layer (`API`) that mirrors the
   existing Spring Boot REST endpoints in
   Backend/SkillTracker. Swap `USE_MOCK_DATA` to false and
   fill in `AUTH_TOKEN` once /api/auth is implemented to go
   live without touching any rendering code.
========================================================== */

"use strict";

/* ==========================================================
   CONFIG
========================================================== */

const API_BASE = "http://localhost:8081";
const USE_MOCK_DATA = false;
const AUTH_TOKEN = "";

function getAuthSession() {
    const raw = sessionStorage.getItem("bb_session");
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

const authSession = getAuthSession();
if (!authSession || !authSession.employee) {
    window.location.replace("login.html");
}

const DEFAULT_EMPLOYEE_ID = authSession ? authSession.employee.emplId : 1;
let CURRENT_EMPLOYEE = authSession ? authSession.employee : null;

/* ==========================================================
   MOCK DATA — mirrors the Spring Boot entities:
   Employee, Assessment, Skills, Project, ProjectMatch
========================================================== */

const MOCK_EMPLOYEE = {
    emplId: DEFAULT_EMPLOYEE_ID,
    name: "Pravin Kumar",
    email: "pravin.kumar@benchbridge.com",
    department: "AI & Data Science",
    experiences: 4,
    benchStatus: "On Bench"
};

/* Employee directory — resolves a signed-in EMP ID to a real
   name/details, mirroring the backend Employee table. Swap for
   GET /api/employees?empId=... once the API is live. */
const MOCK_EMPLOYEES = [
    { empId: "EMP0001", name: "Pravin Kumar", email: "pravin.kumar@benchbridge.com", department: "AI & Data Science" },
    { empId: "EMP0002", name: "Ananya Sharma", email: "ananya.sharma@benchbridge.com", department: "Full Stack Engineering" },
    { empId: "EMP0003", name: "Rahul Verma", email: "rahul.verma@benchbridge.com", department: "DevOps & Cloud" },
    { empId: "EMP0004", name: "Sneha Iyer", email: "sneha.iyer@benchbridge.com", department: "Data Engineering" }
];

const MOCK_SKILLS = [];

const MOCK_ASSESSMENTS = [];

const MOCK_PROJECTS = [
    {
        projectId: 1,
        projectName: "AI Banking Portal",
        requiredSkills: "Java, Spring Boot, SQL, React",
        domain: "FinTech",
        openPosition: 3,
        description: "Modernise core banking services with Java microservices and an AI-driven customer analytics layer.",
        matchScore: 96,
        matchStatus: "Recommended",
        icon: "fa-building-columns"
    },
    {
        projectId: 2,
        projectName: "Cloud Migration Suite",
        requiredSkills: "Java, Docker, Kubernetes, Spring Boot",
        domain: "Cloud Infrastructure",
        openPosition: 2,
        description: "Containerise and migrate enterprise workloads to a managed Kubernetes platform with zero downtime.",
        matchScore: 89,
        matchStatus: "Recommended",
        icon: "fa-cloud"
    },
    {
        projectId: 3,
        projectName: "Data Insights Hub",
        requiredSkills: "Python, SQL, Machine Learning, React",
        domain: "Data & Analytics",
        openPosition: 4,
        description: "Build real-time dashboards and ML models that surface operational insights for business leaders.",
        matchScore: 74,
        matchStatus: "Potential",
        icon: "fa-chart-pie"
    },
    {
        projectId: 4,
        projectName: "Healthcare Patient Portal",
        requiredSkills: "React, Java, SQL",
        domain: "HealthTech",
        openPosition: 2,
        description: "Deliver a secure patient-facing portal with appointment booking and electronic health records.",
        matchScore: 68,
        matchStatus: "Potential",
        icon: "fa-hospital"
    }
];

/* ==========================================================
   API LAYER
   One method per backend resource. Each method returns a
   Promise so the switch from mock to real data is seamless.
========================================================== */

const API = {

    async fetchWithFallback(url, options, mockFn) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
                const data = await response.json();
                if (data && (Array.isArray(data) ? data.length > 0 : true)) {
                    return data;
                }
            }
        } catch (e) {
            console.warn(`[BenchBridge API] Live request failed for ${url}, using local state fallback:`, e.message);
        }
        return mockFn();
    },

    async getEmployee(employeeId = DEFAULT_EMPLOYEE_ID) {
        return this.fetchWithFallback(
            `${API_BASE}/api/employees/${employeeId}`,
            { headers: authHeaders() },
            async () => {
                await delay(350);
                return MOCK_EMPLOYEE;
            }
        );
    },

    async getSkills(employeeId = DEFAULT_EMPLOYEE_ID) {
        return this.fetchWithFallback(
            `${API_BASE}/api/skills?employeeId=${employeeId}`,
            { headers: authHeaders() },
            async () => {
                await delay(350);
                return MOCK_SKILLS;
            }
        );
    },

    async getAssessments(employeeId = DEFAULT_EMPLOYEE_ID) {
        return this.fetchWithFallback(
            `${API_BASE}/api/assessments?employeeId=${employeeId}`,
            { headers: authHeaders() },
            async () => {
                await delay(350);
                const raw = JSON.parse(localStorage.getItem("bb_assessments") || "[]");
                // Deduplicate: keep only the latest entry per technology
                const seen = new Map();
                for (const item of raw) {
                    const key = item.technology;
                    if (!seen.has(key) || item.assessmentId > seen.get(key).assessmentId) {
                        seen.set(key, item);
                    }
                }
                const deduped = Array.from(seen.values());
                // Save the cleaned-up version back to localStorage
                if (deduped.length !== raw.length) {
                    localStorage.setItem("bb_assessments", JSON.stringify(deduped));
                }
                return deduped.length > 0 ? deduped : MOCK_ASSESSMENTS;
            }
        );
    },


    async getProjects() {
        return this.fetchWithFallback(
            `${API_BASE}/api/projects`,
            { headers: authHeaders() },
            async () => {
                await delay(450);
                return MOCK_PROJECTS;
            }
        );
    },

    async getProjectMatches(employeeId = DEFAULT_EMPLOYEE_ID) {
        return this.fetchWithFallback(
            `${API_BASE}/api/project-matches?employeeId=${employeeId}`,
            { headers: authHeaders() },
            async () => {
                await delay(450);
                return MOCK_PROJECTS.map(project => ({
                    matchId: project.projectId,
                    employeeId,
                    projectId: project.projectId,
                    matchScore: project.matchScore,
                    status: project.matchStatus
                }));
            }
        );
    },

    async applyToProject(employeeId, projectId) {
        try {
            const response = await fetch(`${API_BASE}/api/project-matches`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ employeeId, projectId, status: "Applied" })
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.warn("[BenchBridge API] Live applyToProject failed, using mock success:", e.message);
        }
        await delay(400);
        return { success: true };
    },

    async createAssessment(assessment) {
        try {
            const response = await fetch(`${API_BASE}/api/assessments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(assessment)
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.warn("[BenchBridge API] Live createAssessment failed, saving locally:", e.message);
        }
        await delay(400);
        return { ...assessment, assessmentId: Date.now() };
    }

};

/* ==========================================================
   HELPERS
========================================================== */

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function authHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (AUTH_TOKEN) {
        headers["Authorization"] = AUTH_TOKEN;
    }
    return headers;
}

/* ---------- Session-aware identity resolution ----------
   The dashboard ships with demo data (MOCK_EMPLOYEE). The
   registered profile (js/register.js) and signed-in EMP ID
   (js/login.js) are stored in localStorage, so these helpers
   swap the demo identity for the real user's name + employee
   number — the dashboard reads like a live app.
------------------------------------------------------- */

function getSessionProfile() {
    const session = JSON.parse(
        localStorage.getItem("benchbridge_session") || "null"
    );
    return session || JSON.parse(localStorage.getItem("benchbridge_user") || "null");
}

/* Priority:
   1. Registered profile whose EMP ID matches the login → use verbatim.
   2. Signed-in EMP ID → resolved against the employee directory.
   3. No session → demo default. */
function resolveCurrentEmployee(employee) {
    const profile = getSessionProfile();
    if (!profile) return employee;

    const profileEmpId = String(profile.empId || "").toUpperCase();

    if (profile.name && profileEmpId) {
        return {
            ...employee,
            name: profile.name,
            email: profile.email || employee.email,
            department: profile.department || employee.department,
            experiences: parseExperience(profile.experience) ?? employee.experiences,
            emplId: parseEmpId(profile.empId) ?? employee.emplId,
            empIdRaw: profileEmpId
        };
    }

    if (profileEmpId) {
        const match = MOCK_EMPLOYEES.find(
            emp => String(emp.empId).toUpperCase() === profileEmpId
        );
        if (match) {
            return {
                ...employee,
                ...match,
                emplId: parseEmpId(match.empId) ?? employee.emplId,
                empIdRaw: match.empId
            };
        }
        return {
            ...employee,
            emplId: parseEmpId(profile.empId) ?? employee.emplId,
            empIdRaw: profileEmpId
        };
    }

    return employee;
}

/* Exact registered EMP ID — use user-registered format or database ID. */
function formatEmpId(employee) {
    const session = getAuthSession();
    if (session && session.employee && session.employee.empId) {
        return session.employee.empId;
    }
    if (employee && employee.empId) return employee.empId;
    if (employee && employee.empIdRaw) return employee.empIdRaw;

    const savedProfile = getSessionProfile();
    if (savedProfile && savedProfile.empId) return savedProfile.empId;

    const id = (employee && employee.emplId) || DEFAULT_EMPLOYEE_ID;
    return `EMP${String(id).padStart(4, "0")}`;
}

function mergeSessionSkills(skills) {
    const profile = getSessionProfile();
    if (!profile || !profile.skills) return skills;

    const names = profile.skills
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    if (names.length === 0) return skills;

    return names.map((skillName, index) => ({
        skillId: index + 1,
        emplId: 1,
        skillName,
        skillLevels: "Intermediate"
    }));
}

function parseEmpId(empId) {
    const match = String(empId || "").match(/\d+/);
    return match ? Number(match[0]) : null;
}

function parseExperience(experience) {
    // "0-1 Years" → 1, "3-5 Years" → 4, "10+ Years" → 10
    const text = String(experience || "");
    const numbers = text.match(/\d+/g);
    if (!numbers) return null;
    if (text.includes("+")) return Number(numbers[0]);
    if (numbers.length >= 2) {
        return Math.round((Number(numbers[0]) + Number(numbers[1])) / 2);
    }
    return Number(numbers[0]);
}

function scoreClass(score) {
    if (score >= 80) return "high";
    if (score >= 65) return "mid";
    return "low";
}

function levelClass(level) {
    const normalized = String(level || "").toLowerCase();
    if (normalized.includes("expert")) return "expert";
    if (normalized.includes("intermediate")) return "intermediate";
    return "beginner";
}

function initials(name) {
    return String(name || "?")
        .split(" ")
        .map(part => part.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function formatDate(isoString) {
    const date = new Date(isoString + "T00:00:00");
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast";
        toast.innerHTML = '<i class="fa-solid fa-circle-check"></i><span></span>';
        document.body.appendChild(toast);
    }
    const label = toast.querySelector("span");
    label.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

/* ==========================================================
   DERIVED ANALYSIS — computed from Assessment data
   (mirrors a future /api/analysis endpoint)
========================================================== */

function buildAnalysis(assessments) {
    if (!assessments || assessments.length === 0) {
        return {
            averageScore: 0,
            bestSkill: null,
            weakestSkill: null,
            strengths: [],
            gaps: [],
            recommendations: []
        };
    }

    const sorted = [...assessments].sort((a, b) => b.score - a.score);
    const scores = assessments.map(item => item.score);
    const average = scores.reduce((sum, item) => sum + item, 0) / scores.length;

    const strengths = sorted
        .filter(item => item.score >= 75)
        .map(item => ({ technology: item.technology, score: item.score }));

    const gaps = sorted
        .filter(item => item.score < 60)
        .map(item => ({ technology: item.technology, score: item.score }));

    return {
        averageScore: Math.round(average * 10) / 10,
        bestSkill: sorted[0],
        weakestSkill: sorted[sorted.length - 1],
        strengths,
        gaps,
        recommendations: buildRecommendations(sorted)
    };
}

function getCourseraCourse(technology, score) {
    const tech = (technology || "").toLowerCase();
    
    if (tech.includes("java")) {
        return {
            title: score < 60 ? "Coursera: Java Programming & Software Engineering Fundamentals (Duke)" : "Coursera: Core Java & Spring Boot Microservices (IBM)",
            url: "https://www.coursera.org/specializations/java-programming"
        };
    }
    if (tech.includes("dsa") || tech.includes("algorithm") || tech.includes("data structure")) {
        return {
            title: score < 60 ? "Coursera: Data Structures & Algorithms Specialization (UC San Diego)" : "Coursera: Algorithms, Part I & II (Princeton University)",
            url: "https://www.coursera.org/specializations/data-structures-algorithms"
        };
    }
    if (tech.includes("python")) {
        return {
            title: score < 60 ? "Coursera: Python for Everybody Specialization (University of Michigan)" : "Coursera: Applied Data Science with Python (University of Michigan)",
            url: "https://www.coursera.org/specializations/python"
        };
    }
    return {
        title: "Coursera: Technical Upskilling & Software Development Professional Certificate",
        url: "https://www.coursera.org/browse/computer-science"
    };
}

function buildRecommendations(sorted) {
    const recommendations = [];

    sorted.forEach(item => {
        const course = getCourseraCourse(item.technology, item.score);
        if (item.score < 60) {
            recommendations.push({
                type: "gap",
                title: `Coursera Focus: ${item.technology} (${item.score}%)`,
                text: `Recommended Course: <a href="${course.url}" target="_blank" style="color:#06b6d4;font-weight:600;text-decoration:underline;">${course.title}</a> — Complete this course to strengthen core concepts.`
            });
        } else {
            recommendations.push({
                type: "strong",
                title: `Coursera Advanced: ${item.technology} (${item.score}%)`,
                text: `Recommended Course: <a href="${course.url}" target="_blank" style="color:#22c55e;font-weight:600;text-decoration:underline;">${course.title}</a> — Advanced mastery module.`
            });
        }
    });

    return recommendations;
}

/* ==========================================================
   NAVIGATION
========================================================== */

const SECTION_META = {
    profile:     { title: "My Profile",            subtitle: "Welcome back, let's see how you're doing." },
    assessments: { title: "Assessments",           subtitle: "Your recent technical assessment results." },
    analysis:    { title: "Assessment Analysis",   subtitle: "Insights derived from your assessment results." },
    projects:    { title: "Recommended Projects",  subtitle: "AI-matched projects based on your skills and scores." },
    myproject:   { title: "My Project",            subtitle: "You have been approved and allocated to a project." }
};

function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".dashboard-section");
    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const sectionName = item.dataset.section;

            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");

            sections.forEach(section => section.classList.remove("active"));
            const target = document.getElementById(`section-${sectionName}`);
            if (target) target.classList.add("active");

            const meta = SECTION_META[sectionName];
            if (meta) {
                pageTitle.textContent = meta.title;
                pageSubtitle.textContent = meta.subtitle;
            }

            closeMobileSidebar();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    // Mobile sidebar toggle
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    menuToggle.addEventListener("click", () => {
        sidebar.classList.add("open");
        overlay.classList.add("visible");
    });

    overlay.addEventListener("click", closeMobileSidebar);

    function closeMobileSidebar() {
        sidebar.classList.remove("open");
        overlay.classList.remove("visible");
    }
}

/* ==========================================================
   RENDERERS
========================================================== */

/* ---------- 1. My Profile ---------- */

function renderProfile(employee, skills, assessments = []) {
    const container = document.getElementById("profileContainer");

    const skillTags = (skills && skills.length > 0)
        ? skills.map(skill =>
            `<span class="skill-tag">
                <span class="level-dot ${levelClass(skill.skillLevels)}"></span>
                ${skill.skillName}
            </span>`
          ).join("")
        : `<p class="placeholder-text" style="padding:10px;">No skills populated yet. Complete an assessment to discover skills.</p>`;

    const readiness = (assessments && assessments.length > 0)
        ? Math.min(100, Math.round(assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length))
        : 0;

    container.innerHTML = `
        <div class="grid grid-4">
            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-location-arrow"></i></div>
                    <div>
                        <h3>Bench Status</h3>
                        <p>Current availability</p>
                    </div>
                </div>
                <div class="stat-value">${employee.benchStatus || 'On Bench'}</div>
                <span class="stat-delta warn"><i class="fa-solid fa-hourglass-half"></i> Ready for allocation</span>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-briefcase"></i></div>
                    <div>
                        <h3>Experience</h3>
                        <p>Years in industry</p>
                    </div>
                </div>
                <div class="stat-value">${employee.experiences || 1}<small> yrs</small></div>
                <span class="stat-delta up"><i class="fa-solid fa-arrow-trend-up"></i> Verified profile</span>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-code"></i></div>
                    <div>
                        <h3>Skills</h3>
                        <p>Across ${skills ? skills.length : 0} technologies</p>
                    </div>
                </div>
                <div class="stat-value">${skills ? skills.length : 0}<small> total</small></div>
                <span class="stat-delta up"><i class="fa-solid fa-medal"></i> ${skills ? skills.filter(s => levelClass(s.skillLevels) === "expert").length : 0} expert level</span>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-star"></i></div>
                    <div>
                        <h3>Readiness</h3>
                        <p>Assessment computed</p>
                    </div>
                </div>
                <div class="stat-value">${readiness > 0 ? readiness + '%' : '--'}</div>
                <div class="progress-track"><div class="progress-fill" style="width:${readiness}%"></div></div>
            </div>
        </div>

        <div class="grid grid-2" style="margin-top:20px;">
            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-id-badge"></i></div>
                    <div>
                        <h3>Personal Information</h3>
                        <p>Your registered details</p>
                    </div>
                </div>
                <div class="profile-avatar-row" style="display:flex;align-items:center;gap:16px;padding:12px 0 18px 0;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:12px;">
                    <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;border:2px solid var(--accent);flex-shrink:0;background:#1e293b;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;color:white;">
                        ${employee.email && localStorage.getItem(`bb_avatar_${employee.email.toLowerCase()}`) 
                            ? `<img src="${localStorage.getItem(`bb_avatar_${employee.email.toLowerCase()}`)}" alt="${employee.name}" style="width:100%;height:100%;object-fit:cover;" />` 
                            : initials(employee.name)}
                    </div>
                    <div>
                        <h4 style="margin:0;font-size:18px;color:white;font-weight:600;">${employee.name}</h4>
                        <span style="font-size:13px;color:#94a3b8;">${employee.department || 'Engineering'}</span>
                    </div>
                </div>
                <div class="profile-list">
                    <div class="profile-row">
                        <span class="label"><i class="fa-solid fa-user"></i> Full Name</span>
                        <span class="value">${employee.name}</span>
                    </div>
                    <div class="profile-row">
                        <span class="label"><i class="fa-solid fa-id-card"></i> Employee ID</span>
                        <span class="value">${formatEmpId(employee)}</span>
                    </div>
                    <div class="profile-row">
                        <span class="label"><i class="fa-solid fa-envelope"></i> Email</span>
                        <span class="value">${employee.email}</span>
                    </div>
                    <div class="profile-row">
                        <span class="label"><i class="fa-solid fa-building"></i> Department</span>
                        <span class="value">${employee.department || 'Engineering'}</span>
                    </div>
                    <div class="profile-row">
                        <span class="label"><i class="fa-solid fa-briefcase"></i> Experience</span>
                        <span class="value">${employee.experiences || 1} years</span>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div class="card-icon"><i class="fa-solid fa-layer-group"></i></div>
                        <div>
                            <h3>Skill Inventory</h3>
                            <p>Skills with proficiency levels</p>
                        </div>
                    </div>
                    <button class="ghost-btn" type="button" id="openSkillModalBtn" style="padding:6px 14px;font-size:13px;">
                        <i class="fa-solid fa-plus"></i> Add Skill
                    </button>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;">${skillTags}</div>
            </div>
        </div>
    `;
}

/* ---------- 2. Assessments ---------- */

function renderAssessments(assessments) {
    const container = document.getElementById("assessmentsContainer");

    if (!assessments || assessments.length === 0) {
        container.innerHTML = `
            <div class="card empty-card" style="text-align: center; padding: 48px 24px;">
                <i class="fa-solid fa-clipboard-question" style="font-size: 3rem; color: #3b82f6; margin-bottom: 16px;"></i>
                <h3 style="font-size: 1.3rem; color: #f8fafc; margin-bottom: 8px;">No assessments completed yet.</h3>
                <p style="color: #94a3b8; max-width: 440px; margin: 0 auto 24px auto;">Take your first technical assessment to discover your skill proficiencies and unlock project recommendations.</p>
                <button class="submit-btn open-assessment-btn" type="button" style="width: auto; padding: 12px 28px; display: inline-flex; align-items: center; gap: 8px; margin: 0 auto;">
                    <i class="fa-solid fa-play"></i> Start Assessment
                </button>
            </div>
        `;
        bindAssessmentTriggers();
        return;
    }

    const average = assessments.reduce((sum, item) => sum + item.score, 0) / assessments.length;
    const passed = assessments.filter(item => item.score >= 60).length;

    const rows = assessments
        .map(item => `
            <tr>
                <td><strong>${item.technology}</strong></td>
                <td>${formatDate(item.date)}</td>
                <td>
                    <span class="score-badge ${scoreClass(item.score)}">
                        <i class="fa-solid fa-bolt"></i> ${item.score}%
                    </span>
                </td>
                <td>
                    <span class="status-tag ${item.score >= 60 ? "passed" : "failed"}">
                        ${item.score >= 60 ? "Passed" : "Needs Improvement"}
                    </span>
                </td>
                <td>
                    <div class="progress-track" style="width:120px;margin-top:6px;">
                        <div class="progress-fill" style="width:${item.score}%"></div>
                    </div>
                </td>
            </tr>
        `)
        .join("");

    container.innerHTML = `
        <div class="grid grid-3" style="margin-bottom:20px;">
            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-list-check"></i></div>
                    <div>
                        <h3>Assessments Taken</h3>
                        <p>Total completed</p>
                    </div>
                </div>
                <div class="stat-value">${assessments.length}</div>
                <span class="stat-delta up"><i class="fa-solid fa-check"></i> All evaluated</span>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-gauge-high"></i></div>
                    <div>
                        <h3>Average Score</h3>
                        <p>Across all technologies</p>
                    </div>
                </div>
                <div class="stat-value">${Math.round(average * 10) / 10}<small>%</small></div>
                <span class="stat-delta up"><i class="fa-solid fa-arrow-trend-up"></i> Live calculation</span>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-circle-check"></i></div>
                    <div>
                        <h3>Passed</h3>
                        <p>Score ≥ 60%</p>
                    </div>
                </div>
                <div class="stat-value">${passed}<small> / ${assessments.length}</small></div>
                <span class="stat-delta ${passed === assessments.length ? "up" : "warn"}">
                    <i class="fa-solid fa-flag"></i>
                    ${passed === assessments.length ? "Perfect record" : "Room to grow"}
                </span>
            </div>
        </div>

        <div class="card table-card">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Technology</th>
                        <th>Date</th>
                        <th>Score</th>
                        <th>Result</th>
                        <th>Progress</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;

    bindAssessmentTriggers();
}

/* ---------- 3. Assessment Analysis ---------- */

function renderAnalysis(assessments) {
    const container = document.getElementById("analysisContainer");

    if (!assessments || assessments.length === 0) {
        container.innerHTML = `
            <div class="card empty-card" style="text-align: center; padding: 48px 24px;">
                <i class="fa-solid fa-chart-line" style="font-size: 3rem; color: #06b6d4; margin-bottom: 16px;"></i>
                <h3 style="font-size: 1.3rem; color: #f8fafc; margin-bottom: 8px;">No assessment analysis available yet.</h3>
                <p style="color: #94a3b8; max-width: 440px; margin: 0 auto 24px auto;">Complete a technical assessment to generate skill analytics, strength breakdowns, and learning paths.</p>
                <button class="submit-btn open-assessment-btn" type="button" style="width: auto; padding: 12px 28px; display: inline-flex; align-items: center; gap: 8px; margin: 0 auto;">
                    <i class="fa-solid fa-play"></i> Start Assessment
                </button>
            </div>
        `;
        bindAssessmentTriggers();
        return;
    }

    const analysis = buildAnalysis(assessments);

    const bars = [...assessments]
        .sort((a, b) => b.score - a.score)
        .map(item => `
            <div class="bar-row">
                <div class="bar-label">
                    <strong>${item.technology}</strong>
                    <span>${item.score}%</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill ${scoreClass(item.score)}"
                         style="width:0%;background:${barColor(item.score)};"
                         data-width="${item.score}%"></div>
                </div>
            </div>
        `)
        .join("");

    const strengthRows = analysis.strengths
        .map(item => `
            <div class="legend-item">
                <span class="dot" style="background:#22c55e;"></span>
                ${item.technology}
                <span>${item.score}%</span>
            </div>
        `)
        .join("");

    const gapRows = analysis.gaps
        .map(item => `
            <div class="legend-item">
                <span class="dot" style="background:#ef4444;"></span>
                ${item.technology}
                <span>${item.score}%</span>
            </div>
        `)
        .join("");

    const recRows = analysis.recommendations
        .map(rec => `
            <div class="recommendation-item">
                <div class="rec-icon ${rec.type}">
                    <i class="${recIcon(rec.type)}"></i>
                </div>
                <div class="rec-content">
                    <strong>${rec.title}</strong>
                    <p>${rec.text}</p>
                </div>
            </div>
        `)
        .join("");

    const bestName = analysis.bestSkill ? analysis.bestSkill.technology : "—";
    const bestScore = analysis.bestSkill ? analysis.bestSkill.score : 0;
    const weakestName = analysis.weakestSkill ? analysis.weakestSkill.technology : "—";
    const weakestScore = analysis.weakestSkill ? analysis.weakestSkill.score : 0;

    container.innerHTML = `
        <div class="grid grid-4">
            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-gauge-high"></i></div>
                    <div>
                        <h3>Overall Score</h3>
                        <p>Across all assessments</p>
                    </div>
                </div>
                <div class="stat-value">${analysis.averageScore}<small>%</small></div>
                <span class="stat-delta ${analysis.averageScore >= 75 ? "up" : "warn"}">
                    <i class="fa-solid fa-signal"></i>
                    ${analysis.averageScore >= 75 ? "Strong profile" : "Developing"}
                </span>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-medal"></i></div>
                    <div>
                        <h3>Best Skill</h3>
                        <p>Highest score</p>
                    </div>
                </div>
                <div class="stat-value high-skill">${bestName}</div>
                <span class="stat-delta up"><i class="fa-solid fa-bolt"></i> ${bestScore}%</span>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <div>
                        <h3>Needs Attention</h3>
                        <p>Lowest score</p>
                    </div>
                </div>
                <div class="stat-value mid-skill">${weakestName}</div>
                <span class="stat-delta warn"><i class="fa-solid fa-bullseye"></i> ${weakestScore}%</span>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-flag-checkered"></i></div>
                    <div>
                        <h3>Readiness</h3>
                        <p>Project ready</p>
                    </div>
                </div>
                <div class="stat-value">
                    ${analysis.averageScore >= 75 ? "Ready" : "Training"}
                </div>
                <span class="stat-delta ${analysis.averageScore >= 75 ? "up" : "warn"}">
                    <i class="fa-solid fa-circle-check"></i>
                    Confidence ${Math.min(95, Math.round(analysis.averageScore + 5))}%
                </span>
            </div>
        </div>

        <div class="grid grid-2" style="margin-top:20px;">
            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-chart-column"></i></div>
                    <div>
                        <h3>Skill Proficiency</h3>
                        <p>Score by technology</p>
                    </div>
                </div>
                <div class="bars-list">${bars}</div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-chart-pie"></i></div>
                    <div>
                        <h3>Performance Split</h3>
                        <p>Strong vs. gap areas</p>
                    </div>
                </div>
                <div class="donut-layout">
                    <div class="donut" style="--donut-value:${donutPercentage(analysis)}%">
                        <div class="donut-inner">
                            <span class="value">${donutPercentage(analysis)}%</span>
                            <span class="label">Strong</span>
                        </div>
                    </div>
                    <div class="donut-legend">
                        <div class="legend-item">
                            <span class="dot" style="background:#3b82f6;"></span>
                            Strong areas
                            <span>${donutPercentage(analysis)}%</span>
                        </div>
                        <div class="legend-item">
                            <span class="dot" style="background:rgba(255,255,255,0.14);"></span>
                            Needs work
                            <span>${100 - donutPercentage(analysis)}%</span>
                        </div>
                        <div class="legend-item" style="margin-top:4px;color:var(--muted);font-size:12.5px;">
                            Skills scoring 75%+ count as strong.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-2" style="margin-top:20px;">
            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
                    <div>
                        <h3>Strengths & Gaps</h3>
                        <p>Top performers and focus areas</p>
                    </div>
                </div>
                <div class="donut-legend" style="margin-bottom:18px;">
                    ${strengthRows || '<p class="placeholder-text" style="padding:10px;">No strong areas yet.</p>'}
                </div>
                <div class="donut-legend">
                    ${gapRows || '<p class="placeholder-text" style="padding:10px;">No critical gaps — great work!</p>'}
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-lightbulb"></i></div>
                    <div>
                        <h3>Recommendations</h3>
                        <p>Next actions based on your results</p>
                    </div>
                </div>
                ${recRows}
            </div>
        </div>
    `;

    requestAnimationFrame(() => {
        container.querySelectorAll(".bar-fill[data-width]").forEach(fill => {
            fill.style.width = fill.dataset.width;
        });
    });
}

function barColor(score) {
    if (score >= 80) return "linear-gradient(90deg,#22c55e,#16a34a)";
    if (score >= 60) return "linear-gradient(90deg,#3b82f6,#2563eb)";
    return "linear-gradient(90deg,#f59e0b,#d97706)";
}

function donutPercentage(analysis) {
    const total = analysis.strengths.length + analysis.gaps.length;
    if (total === 0) return 0;
    return Math.round((analysis.strengths.length / total) * 100);
}

function recIcon(type) {
    if (type === "gap") return "fa-solid fa-triangle-exclamation";
    if (type === "strong") return "fa-solid fa-medal";
    return "fa-solid fa-route";
}

/* ---------- 4. Recommended Projects ---------- */

function renderProjects(projects, assessments = []) {
    const container = document.getElementById("projectsContainer");

    if (!assessments || assessments.length === 0) {
        container.innerHTML = `
            <div class="card empty-card" style="text-align: center; padding: 48px 24px;">
                <i class="fa-solid fa-rocket" style="font-size: 3rem; color: #8b5cf6; margin-bottom: 16px;"></i>
                <h3 style="font-size: 1.3rem; color: #f8fafc; margin-bottom: 8px;">No recommended projects available yet.</h3>
                <p style="color: #94a3b8; max-width: 440px; margin: 0 auto 24px auto;">Complete an assessment to populate your skill matrix and receive AI-matched project recommendations.</p>
                <button class="submit-btn open-assessment-btn" type="button" style="width: auto; padding: 12px 28px; display: inline-flex; align-items: center; gap: 8px; margin: 0 auto;">
                    <i class="fa-solid fa-play"></i> Start Assessment
                </button>
            </div>
        `;
        bindAssessmentTriggers();
        return;
    }

    const cards = projects
        .map(project => `
            <div class="card hoverable project-card">
                <div class="project-top">
                    <div class="project-icon"><i class="fa-solid ${project.icon || 'fa-briefcase'}"></i></div>
                    <span class="match-pill"><i class="fa-solid fa-bolt"></i> ${project.matchScore || 90}% Match</span>
                </div>

                <h3>${project.projectName}</h3>
                <p class="project-domain">${project.domain || 'Enterprise'}</p>

                <p class="project-desc">${project.description || 'Enterprise project assignment.'}</p>

                <div class="project-meta">
                    <span><i class="fa-solid fa-layer-group"></i> ${project.requiredSkills}</span>
                    <span><i class="fa-solid fa-users"></i> ${project.openPosition || 1} open</span>
                    <span><i class="fa-solid fa-flag"></i> ${project.matchStatus || 'Recommended'}</span>
                </div>

                <div class="card-footer">
                    <button
                        class="apply-btn"
                        type="button"
                        data-project-id="${project.projectId}"
                        data-project-name="${project.projectName}">
                        Apply for Project
                    </button>
                </div>
            </div>
        `)
        .join("");

    container.innerHTML = `<div class="grid grid-2">${cards}</div>`;

    container.querySelectorAll(".apply-btn").forEach(button => {
        button.addEventListener("click", () => {
            handleApply(button);
        });
    });
}

async function handleApply(button) {
    const projectId = Number(button.dataset.projectId);
    const projectName = button.dataset.projectName;

    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Applying…';

    try {
        const employeeId = (CURRENT_EMPLOYEE && CURRENT_EMPLOYEE.emplId) || DEFAULT_EMPLOYEE_ID;
        await API.applyToProject(employeeId, projectId);

        button.classList.add("applied");
        button.innerHTML = '<i class="fa-solid fa-circle-check"></i> Applied';
        showToast(`Application sent for ${projectName}`);
    } catch (error) {
        button.disabled = false;
        button.innerHTML = "Apply for Project";
        showToast("Application failed. Please try again.");
    }
}

/* ==========================================================
   ASSESSMENT MODAL TRIGGER BINDING
========================================================== */

function bindAssessmentTriggers() {
    document.querySelectorAll(".open-assessment-btn, #newAssessmentBtn").forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll(".open-assessment-btn, #newAssessmentBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const modal = document.getElementById("assessmentModal");
            if (modal) modal.classList.add("active");
        });
    });
}

function initAssessmentModal() {
    const modal = document.getElementById("assessmentModal");
    const closeBtn = document.getElementById("closeAssessmentModal");
    const cancelBtn = document.getElementById("cancelAssessmentBtn");
    const form = document.getElementById("assessmentForm");

    if (closeBtn) closeBtn.addEventListener("click", () => modal.classList.remove("active"));
    if (cancelBtn) cancelBtn.addEventListener("click", () => modal.classList.remove("active"));

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const technology = document.getElementById("assessTechnology").value;
            // Map option value to track key used in assessment.html TRACKS object
            const trackMap = { "Java": "java", "DSA": "dsa", "Python": "python" };
            const trackKey = trackMap[technology] || "java";

            modal.classList.remove("active");

            // Redirect to the coding assessment — score will be auto-saved on completion
            window.location.href = `assessment.html?track=${trackKey}`;
        });
    }
}

/* ==========================================================
   TOPBAR — user chip
========================================================== */

function renderTopbar(employee) {
    const avatar = document.getElementById("topAvatar");
    const name = document.getElementById("topName");
    const empId = document.getElementById("topEmpId");

    const savedPic = employee.email ? localStorage.getItem(`bb_avatar_${employee.email.toLowerCase()}`) : null;

    if (avatar) {
        if (savedPic) {
            avatar.innerHTML = `<img src="${savedPic}" alt="${employee.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
            avatar.style.padding = "0";
            avatar.style.overflow = "hidden";
        } else {
            avatar.textContent = initials(employee.name);
        }
    }
    if (name) name.textContent = employee.name;
    if (empId) empId.textContent = formatEmpId(employee);
}

function initSkillModal() {
    const modal = document.getElementById("skillModal");
    const closeBtn = document.getElementById("closeSkillModal");
    const cancelBtn = document.getElementById("cancelSkillBtn");
    const form = document.getElementById("skillForm");

    if (closeBtn) closeBtn.addEventListener("click", () => modal.classList.remove("active"));
    if (cancelBtn) cancelBtn.addEventListener("click", () => modal.classList.remove("active"));

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const skillName = document.getElementById("skillSelect").value;
            const skillLevels = document.getElementById("skillLevelSelect").value;
            const employeeId = (CURRENT_EMPLOYEE && CURRENT_EMPLOYEE.emplId) || DEFAULT_EMPLOYEE_ID;

            try {
                await API.addSkill({ emplId: employeeId, skillName, skillLevels });
                modal.classList.remove("active");
                showToast(`Skill '${skillName}' added successfully!`);
                loadDashboard();
            } catch (err) {
                console.error("Failed to add skill:", err);
                showToast("Failed to add skill. Please try again.");
            }
        });
    }
}

function bindSkillTriggers() {
    const btn = document.getElementById("openSkillModalBtn");
    if (btn) {
        btn.addEventListener("click", () => {
            const modal = document.getElementById("skillModal");
            if (modal) modal.classList.add("active");
        });
    }
}

/* ==========================================================
   INIT
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initAssessmentModal();
    initSkillModal();
    bindAssessmentTriggers();

    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            sessionStorage.removeItem("bb_session");
        });
    }

    loadDashboard();
});

async function loadDashboard() {
    try {
        const session = getAuthSession();
        const employeeId = (session && session.employee && session.employee.emplId) || DEFAULT_EMPLOYEE_ID;

        const [employee, skills, assessments, projects] = await Promise.all([
            API.getEmployee(employeeId),
            API.getSkills(employeeId),
            API.getAssessments(employeeId),
            API.getProjects()
        ]);

        const currentEmployee = employee || (session ? session.employee : null);
        CURRENT_EMPLOYEE = currentEmployee;

        if (currentEmployee) {
            const firstName = String(currentEmployee.name || "").trim().split(" ")[0];
            if (firstName) {
                const subtitle = document.getElementById("pageSubtitle");
                if (subtitle) subtitle.textContent = `Welcome back, ${firstName}. Here's your latest snapshot.`;
            }
            renderTopbar(currentEmployee);
            renderProfile(currentEmployee, skills || [], assessments || []);
            bindSkillTriggers();
        }

        renderAssessments(assessments || []);
        renderAnalysis(assessments || []);
        renderProjects(projects || [], assessments || []);
        renderMyProject(currentEmployee);
    } catch (error) {
        console.error("Failed to load dashboard:", error);
        showToast("Failed to load dashboard data.");
    }
}

/* ==========================================================
   MY PROJECT — approval banner for the employee
========================================================== */

function renderMyProject(employee) {
    const container = document.getElementById("myProjectContainer");
    const navBtn    = document.getElementById("myProjectNavBtn");
    if (!container) return;

    const emplId = employee ? String(employee.emplId || employee.empId || "") : "";
    const approvals = JSON.parse(localStorage.getItem("bb_approvals") || "{}");

    // Try matching by emplId or by checking any stored approval
    const approval = approvals[emplId] || null;

    if (!approval) {
        // No approval yet — hide nav item and show pending message
        if (navBtn) navBtn.style.display = "none";
        container.innerHTML = `
            <div style="text-align:center;padding:64px 24px;">
                <i class="fa-solid fa-hourglass-half" style="font-size:3.5rem;color:#f59e0b;margin-bottom:20px;"></i>
                <h2 style="color:#f8fafc;font-size:1.5rem;margin-bottom:10px;">No Project Assigned Yet</h2>
                <p style="color:#94a3b8;max-width:420px;margin:0 auto;line-height:1.7;">
                    Your application is under review. Once a manager approves your request, your project details will appear here automatically.
                </p>
            </div>
        `;
        return;
    }

    // Approval exists — show the nav item with a pulsing dot
    if (navBtn) {
        navBtn.style.display = "flex";
        navBtn.innerHTML = `
            <i class="fa-solid fa-circle-check" style="color:#22c55e;"></i>
            <span>My Project</span>
            <span style="width:8px;height:8px;border-radius:50%;background:#22c55e;margin-left:auto;animation:pulse 1.5s infinite;"></span>
        `;
    }

    const approvedDate = new Date(approval.approvedAt).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const skills = (approval.requiredSkills || "").split(",").map(s => s.trim()).filter(Boolean);
    const skillPills = skills.length
        ? skills.map(s => `<span class="skill-tag" style="background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.35);color:#a5b4fc;">${s}</span>`).join("")
        : `<span style="color:#94a3b8;">Not specified</span>`;

    container.innerHTML = `
        <!-- Approval Banner -->
        <div style="background:linear-gradient(135deg,rgba(34,197,94,0.12),rgba(16,185,129,0.06));border:1px solid rgba(34,197,94,0.3);border-radius:20px;padding:32px 36px;margin-bottom:28px;position:relative;overflow:hidden;">
            <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;background:radial-gradient(circle,rgba(34,197,94,0.15),transparent 70%);pointer-events:none;"></div>
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
                <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#22c55e,#16a34a);display:flex;align-items:center;justify-content:center;font-size:1.6rem;">
                    <i class="fa-solid fa-circle-check" style="color:#fff;"></i>
                </div>
                <div>
                    <h2 style="color:#22c55e;font-size:1.4rem;margin:0 0 4px;">🎉 You've Been Approved!</h2>
                    <p style="color:#86efac;margin:0;font-size:0.9rem;">Approved on ${approvedDate}</p>
                </div>
            </div>
            <p style="color:#d1fae5;font-size:1rem;margin:0;line-height:1.7;">
                Congratulations! Your manager has reviewed your profile and approved your allocation to a new project. Welcome aboard!
            </p>
        </div>

        <!-- Project Details Card -->
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 32px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
                <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;">
                    <i class="fa-solid fa-briefcase" style="color:#fff;"></i>
                </div>
                <div>
                    <h3 style="color:#f8fafc;font-size:1.25rem;margin:0 0 2px;">${approval.projectName || 'Project Assignment'}</h3>
                    ${approval.domain ? `<span style="color:#94a3b8;font-size:0.85rem;">${approval.domain}</span>` : ""}
                </div>
                ${approval.matchScore ? `<span style="margin-left:auto;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.4);border-radius:20px;padding:6px 14px;color:#a5b4fc;font-size:0.85rem;font-weight:600;"><i class="fa-solid fa-bolt"></i> ${approval.matchScore}% Match</span>` : ""}
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
                <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:16px 20px;">
                    <p style="color:#64748b;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">Status</p>
                    <p style="color:#22c55e;font-weight:600;margin:0;font-size:0.95rem;"><i class="fa-solid fa-circle" style="font-size:0.6rem;vertical-align:middle;"></i> Allocated</p>
                </div>
                <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:16px 20px;">
                    <p style="color:#64748b;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">Open Positions</p>
                    <p style="color:#f8fafc;font-weight:600;margin:0;font-size:0.95rem;">${approval.openPosition || '—'}</p>
                </div>
            </div>

            <div>
                <p style="color:#64748b;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;">Required Skills</p>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">${skillPills}</div>
            </div>
        </div>
    `;
}
