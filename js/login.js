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
