/**
 * ==========================================================
 * BenchBridge Login
 * login.js
 * Vanilla JavaScript (ES6)
 * Ready for future backend integration.
 * ==========================================================
 */

document.addEventListener("DOMContentLoaded", () => {

    /* ======================================================
       DOM ELEMENTS
    ====================================================== */

    const roleTabs = document.querySelectorAll(".role-tab");
    const userIdLabel = document.getElementById("userIdLabel");
    const userIdInput = document.getElementById("userId");

    const passwordInput = document.getElementById("password");
    const passwordToggle = document.querySelector(".password-toggle");

    const rememberMe = document.getElementById("rememberMe");

    const loginForm = document.getElementById("loginForm");
    const signInButton = document.querySelector(".signin-btn");

    const forgotPassword = document.querySelector(".forgot-link");
    const registerLink = document.querySelector(".login-footer a");

    let currentRole = "employee";

    /* ======================================================
       ROLE CONFIGURATION
    ====================================================== */

    const roles = {

        employee: {
            label: "Employee ID / Email / Name",
            placeholder: "Enter Employee ID, Email, or Name",
            redirect: "employee-dashboard.html",
            defaultId: "",
            defaultPassword: ""
        },

        manager: {
            label: "Manager Email",
            placeholder: "Enter Manager Email",
            redirect: "manager-dashboard.html",
            defaultId: "admin@benchbridge.com",
            defaultPassword: "Password@123"
        }

    };

    /* ======================================================
       INITIALIZE
    ====================================================== */

    initialize();

    function initialize() {

        setupRoleTabs();
        setupPasswordToggle();
        setupForgotPassword();
        setupRegisterLink();
        setupFormSubmission();
        setupOAuthLogin();

    }

    /* ======================================================
       OAUTH 2.0 – GOOGLE IDENTITY SERVICES (REAL)
    ====================================================== */

    // ─── CONFIGURATION ────────────────────────────────────────────────
    // Replace with your real Google Cloud OAuth Client ID.
    // Get one at: https://console.cloud.google.com/apis/credentials
    // Add http://127.0.0.1:5500 (or your Live Server port) as an
    // "Authorized JavaScript origin" in the credential settings.
    const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

    // Replace with your real GitHub OAuth App Client ID.
    // Create one at: https://github.com/settings/developers
    // Set Homepage URL and Callback URL to http://127.0.0.1:5500
    const GITHUB_CLIENT_ID = "Ov23liNUXSK1qIvupRtI";
    // ──────────────────────────────────────────────────────────────────

    function setupOAuthLogin() {
        setupGoogleSignIn();
        setupGitHubSignIn();
    }

    // ── GOOGLE ──────────────────────────────────────────────────────────
    function setupGoogleSignIn() {
        const container = document.getElementById("googleBtnContainer");
        if (!container) return;

        // Wait for GIS SDK to load (it's loaded async)
        function tryInit() {
            if (typeof google === "undefined" || !google.accounts) {
                setTimeout(tryInit, 200);
                return;
            }

            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCredential,
                auto_select: false,
                cancel_on_tap_outside: true
            });

            google.accounts.id.renderButton(container, {
                type: "standard",
                theme: "outline",
                size: "large",
                text: "continue_with",
                shape: "rectangular",
                logo_alignment: "left",
                width: 320
            });
        }

        tryInit();
    }

    function handleGoogleCredential(response) {
        // response.credential is a JWT id_token from Google
        const idToken = response.credential;

        // Decode the JWT payload (base64url) to get user info
        let payload;
        try {
            payload = JSON.parse(atob(idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        } catch (e) {
            console.error("Failed to decode Google id_token", e);
            return;
        }

        finishOAuthSession("Google", {
            name:  payload.name  || payload.email.split("@")[0],
            email: payload.email || "",
            avatar: (payload.name || "G")[0].toUpperCase(),
            picture: payload.picture || null
        });
    }

    // ── GITHUB ──────────────────────────────────────────────────────────
    function setupGitHubSignIn() {
        const githubBtn = document.getElementById("githubOAuthBtn");
        if (!githubBtn) return;

        githubBtn.addEventListener("click", () => {
            // Build the real GitHub authorization URL
            const redirectUri = encodeURIComponent(window.location.href.replace(/[^/]*$/, "oauth-github-callback.html"));
            const scope       = encodeURIComponent("read:user user:email");
            const state       = btoa(currentRole + ":" + Date.now()); // encode role in state param

            const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

            // Open GitHub's real OAuth authorization page in a popup
            const w = 520, h = 700;
            const left = Math.round(window.screenX + (window.outerWidth  - w) / 2);
            const top  = Math.round(window.screenY + (window.outerHeight - h) / 2);

            const popup = window.open(authUrl, "GitHubOAuth",
                `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`);

            if (!popup) {
                showToast("⚠️ Popup blocked — please allow popups and try again.", "error");
                return;
            }

            githubBtn.disabled = true;
            githubBtn.innerHTML = `
                <span style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:bb-spin 0.7s linear infinite;"></span>
                <span>Waiting for GitHub…</span>`;

            // Listen for the callback page to post back the user data
            window.addEventListener("message", function onMsg(e) {
                if (!e.data || e.data.type !== "GITHUB_OAUTH_SUCCESS") return;
                window.removeEventListener("message", onMsg);
                if (!popup.closed) popup.close();
                finishOAuthSession("GitHub", e.data.user);
            });

            // Reset button if popup closed without auth
            const poll = setInterval(() => {
                if (popup.closed) {
                    clearInterval(poll);
                    githubBtn.disabled = false;
                    githubBtn.innerHTML = `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#f0f6fc"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                        <span>Continue with GitHub</span>`;
                }
            }, 500);
        });
    }

    // ── SHARED SESSION FINISH ────────────────────────────────────────────
    function finishOAuthSession(provider, user) {
        startLoading();

        const oauthUser = {
            empId:      `EMP-${provider.toUpperCase()}-${Date.now()}`,
            name:       user.name,
            email:      user.email,
            department: "Engineering",
            experience: "N/A",
            role:       currentRole,
            avatar:     user.avatar  || user.name[0].toUpperCase(),
            picture:    user.picture || null,
            provider:   provider
        };

        const session = {
            token: `oauth2-${provider.toLowerCase()}-${Date.now()}`,
            employee: {
                emplId:     Date.now(),
                name:       oauthUser.name,
                email:      oauthUser.email,
                department: "Engineering",
                role:       currentRole
            }
        };

        sessionStorage.setItem("bb_session",         JSON.stringify(session));
        localStorage.setItem("benchbridge_session",  JSON.stringify(oauthUser));

        const targetPage = currentRole === "manager" ? "manager-dashboard.html" : "employee-dashboard.html";
        setTimeout(() => window.location.replace(targetPage), 800);
    }

    function showToast(msg, type = "info") {
        const el = document.createElement("div");
        el.style.cssText = `
            position:fixed;top:20px;left:50%;transform:translateX(-50%);
            background:${type === "error" ? "#450a0a" : "#0f172a"};
            border:1px solid ${type === "error" ? "rgba(248,81,73,.4)" : "rgba(99,102,241,.4)"};
            color:${type === "error" ? "#f87171" : "#c7d2fe"};
            padding:12px 20px;border-radius:10px;
            font-size:0.85rem;z-index:9999;text-align:center;
            box-shadow:0 4px 20px rgba(0,0,0,.4);
        `;
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4500);
    }

    /* ======================================================
       ROLE SWITCHING
    ====================================================== */

    function setupRoleTabs() {

        roleTabs.forEach(tab => {

            tab.addEventListener("click", () => {

                roleTabs.forEach(btn => {

                    btn.classList.remove("active");
                    btn.setAttribute("aria-pressed", "false");

                });

                tab.classList.add("active");
                tab.setAttribute("aria-pressed", "true");

                currentRole = tab.dataset.role;

                updateRoleUI(currentRole);

                clearErrors();

            });

        });

    }

    function updateRoleUI(role) {

        const config = roles[role];

        userIdLabel.textContent = config.label;

        userIdInput.placeholder = config.placeholder;

        // Pre-fill manager demo credentials; clear for employee
        userIdInput.value = config.defaultId || "";
        passwordInput.value = config.defaultPassword || "";

        userIdInput.focus();

    }

    /* ======================================================
       PASSWORD TOGGLE
    ====================================================== */

    function setupPasswordToggle() {

        passwordToggle.addEventListener("click", () => {

            const icon = passwordToggle.querySelector("i");

            if (passwordInput.type === "password") {

                passwordInput.type = "text";

                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");

            } else {

                passwordInput.type = "password";

                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");

            }

        });

    }

    /* ======================================================
       FORM SUBMISSION
    ====================================================== */

    function setupFormSubmission() {

        loginForm.addEventListener("submit", handleLogin);

    }

    async function handleLogin(event) {

        event.preventDefault();

        clearErrors();

        const id = userIdInput.value.trim();
        const password = passwordInput.value.trim();

        if (!validateForm(id, password)) {
            return;
        }

        startLoading();

        try {
            const response = await fetch("http://localhost:8081/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: id, password: password, role: currentRole })
            });

            const data = await response.json();

            stopLoading();

            if (response.ok && data.employee) {
                const storedEmpId = data.employee.email ? localStorage.getItem(`bb_empid_${data.employee.email.toLowerCase()}`) : null;
                if (!data.employee.empId) {
                    if (id.toUpperCase().startsWith("EMP")) {
                        data.employee.empId = id.toUpperCase();
                    } else if (storedEmpId) {
                        data.employee.empId = storedEmpId;
                    } else {
                        data.employee.empId = "EMP" + String(data.employee.emplId).padStart(4, "0");
                    }
                }
                // Save authenticated session in sessionStorage
                sessionStorage.setItem("bb_session", JSON.stringify({
                    token: data.token,
                    employee: data.employee
                }));

                // Redirect to dashboard
                window.location.href = roles[currentRole].redirect;
            } else {
                showFieldError(userIdInput, data.error || "Invalid credentials. Please check your Employee ID and password.");
                showFieldError(passwordInput, "");
            }
        } catch (err) {
            stopLoading();
            showFieldError(userIdInput, "Could not connect to authentication server.");
            console.error("[BenchBridge] Login error:", err.message);
        }
    }

    /* ======================================================
       VALIDATION
    ====================================================== */

    function validateForm(id, password) {

        let valid = true;

        if (id === "") {

            showFieldError(
                userIdInput,
                `${roles[currentRole].label} is required.`
            );

            valid = false;

        }

        if (password === "") {

            showFieldError(
                passwordInput,
                "Password is required."
            );

            valid = false;

        }

        return valid;

    }

    /* ======================================================
       INLINE ERRORS
    ====================================================== */

    function showFieldError(input, message) {

        input.style.borderColor = "#ef4444";

        const error = document.createElement("small");

        error.className = "field-error";

        error.textContent = message;

        error.style.color = "#ef4444";
        error.style.marginTop = "6px";
        error.style.fontSize = "13px";

        input.parentElement.insertAdjacentElement(
            "afterend",
            error
        );

    }

    function clearErrors() {

        document.querySelectorAll(".field-error").forEach(error => {

            error.remove();

        });

        document
            .querySelectorAll(".input-field input")
            .forEach(input => {

                input.style.borderColor = "";

            });

    }

    /* ======================================================
       BUTTON LOADING
    ====================================================== */

    function startLoading() {

        signInButton.disabled = true;

        signInButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Signing In...</span>
        `;

    }

    function stopLoading() {

        signInButton.disabled = false;

        signInButton.innerHTML = `
            <span>Sign In</span>
            <i class="fa-solid fa-arrow-right"></i>
        `;

    }

    /* ======================================================
       REGISTER
    ====================================================== */

    function setupRegisterLink() {

        registerLink.addEventListener("click", (event) => {

            event.preventDefault();

            window.location.href = "register.html";

        });

    }

    /* ======================================================
       FORGOT PASSWORD
    ====================================================== */

    function setupForgotPassword() {

        forgotPassword.addEventListener("click", (event) => {

            event.preventDefault();

            alert(
                "Password recovery will be implemented in the next version."
            );

        });

    }

    /* ======================================================
       KEYBOARD SUPPORT
    ====================================================== */

    document.addEventListener("keydown", event => {

        if (
            event.key === "Enter" &&
            document.activeElement.tagName !== "TEXTAREA"
        ) {

            loginForm.requestSubmit();

        }

    });

});
