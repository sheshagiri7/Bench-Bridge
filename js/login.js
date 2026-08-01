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
       OAUTH 2.0 SOCIAL LOGIN HANDLERS
    ====================================================== */

    let oauthPopup = null;
    let oauthMessageHandler = null;

    function setupOAuthLogin() {
        const googleBtn = document.getElementById("googleOAuthBtn");
        const githubBtn = document.getElementById("githubOAuthBtn");

        if (googleBtn) {
            googleBtn.addEventListener("click", () => handleOAuth("Google"));
            googleBtn.addEventListener("mouseenter", () => {
                googleBtn.style.background = "rgba(255,255,255,0.09)";
                googleBtn.style.borderColor = "rgba(234,67,53,0.5)";
            });
            googleBtn.addEventListener("mouseleave", () => {
                googleBtn.style.background = "rgba(255,255,255,0.04)";
                googleBtn.style.borderColor = "rgba(255,255,255,0.12)";
            });
        }
        if (githubBtn) {
            githubBtn.addEventListener("click", () => handleOAuth("GitHub"));
            githubBtn.addEventListener("mouseenter", () => {
                githubBtn.style.background = "rgba(255,255,255,0.09)";
                githubBtn.style.borderColor = "rgba(255,255,255,0.4)";
            });
            githubBtn.addEventListener("mouseleave", () => {
                githubBtn.style.background = "rgba(255,255,255,0.04)";
                githubBtn.style.borderColor = "rgba(255,255,255,0.12)";
            });
        }

        // Listen for OAuth popup success message
        window.addEventListener("message", (event) => {
            if (!event.data || event.data.type !== "OAUTH_SUCCESS") return;
            handleOAuthSuccess(event.data.provider, event.data.user);
        });
    }

    function handleOAuth(provider) {
        // Close any existing popup
        if (oauthPopup && !oauthPopup.closed) {
            oauthPopup.close();
        }

        // Popup dimensions
        const w = 480, h = provider === "Google" ? 620 : 680;
        const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
        const top  = Math.round(window.screenY + (window.outerHeight - h) / 2);

        const popupFile = provider === "Google" ? "oauth-google.html" : "oauth-github.html";
        const popupUrl  = `${popupFile}?role=${encodeURIComponent(currentRole)}`;

        oauthPopup = window.open(
            popupUrl,
            `${provider}OAuth`,
            `width=${w},height=${h},left=${left},top=${top},resizable=no,scrollbars=no,status=no,toolbar=no,menubar=no,location=no`
        );

        if (!oauthPopup) {
            // Popup was blocked — fallback to loading indicator with message
            showOAuthBlockedNotice(provider);
            return;
        }

        // Set button to "pending" state
        const btnId = provider === "Google" ? "googleOAuthBtn" : "githubOAuthBtn";
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `
                <span style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:bb-spin 0.7s linear infinite;"></span>
                <span>Waiting for ${provider}…</span>`;
        }

        // Monitor if popup gets closed without completing auth
        const pollClosed = setInterval(() => {
            if (oauthPopup && oauthPopup.closed) {
                clearInterval(pollClosed);
                resetOAuthButton(provider);
            }
        }, 500);
    }

    function handleOAuthSuccess(provider, user) {
        // Close popup if still open
        if (oauthPopup && !oauthPopup.closed) oauthPopup.close();

        startLoading();

        const role = user.role || currentRole;

        const oauthUser = {
            empId: `EMP-${provider.toUpperCase()}-${Date.now()}`,
            name:  user.name,
            email: user.email,
            department: "Engineering",
            experience: "N/A",
            role:  role,
            avatar: user.avatar,
            avatarColor: user.color,
            provider: provider
        };

        const session = {
            token: `oauth2-${provider.toLowerCase()}-jwt-${Date.now()}`,
            employee: {
                emplId: Date.now(),
                name:   oauthUser.name,
                email:  oauthUser.email,
                department: "Engineering",
                role: role
            }
        };

        sessionStorage.setItem("bb_session", JSON.stringify(session));
        localStorage.setItem("benchbridge_session", JSON.stringify(oauthUser));

        const targetPage = role === "manager" ? "manager-dashboard.html" : "employee-dashboard.html";

        // Small delay so the loading animation shows
        setTimeout(() => {
            window.location.replace(targetPage);
        }, 800);
    }

    function resetOAuthButton(provider) {
        const btnId = provider === "Google" ? "googleOAuthBtn" : "githubOAuthBtn";
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.disabled = false;
        if (provider === "Google") {
            btn.innerHTML = `<i class="fa-brands fa-google" style="color:#ea4335;"></i><span>Google</span>`;
        } else {
            btn.innerHTML = `<i class="fa-brands fa-github" style="color:#ffffff;"></i><span>GitHub</span>`;
        }
    }

    function showOAuthBlockedNotice(provider) {
        const notice = document.createElement("div");
        notice.style.cssText = `
            position:fixed;top:20px;left:50%;transform:translateX(-50%);
            background:#1e293b;border:1px solid rgba(248,81,73,0.4);
            color:#f87171;padding:12px 20px;border-radius:10px;
            font-size:0.85rem;z-index:9999;text-align:center;
            box-shadow:0 4px 20px rgba(0,0,0,0.4);
        `;
        notice.textContent = `⚠️ Popup blocked. Please allow popups for ${provider} sign-in.`;
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 4000);
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
