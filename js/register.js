/* ===========================
      BenchBridge Register
=========================== */

const form = document.getElementById("registerForm");

const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const progressFill = document.getElementById("progressFill");

const successModal = document.getElementById("successModal");
const loadingOverlay = document.getElementById("loadingOverlay");

const termsModal = document.getElementById("termsModal");

const toast = document.getElementById("toast");

const uploadArea = document.getElementById("uploadArea");
const profileImage = document.getElementById("profileImage");

const selectedRole = "employee";

/* ===========================
     SHOW PASSWORD
=========================== */

document.querySelector(".toggle-password")
.onclick=()=>{

    if(password.type==="password"){

        password.type="text";

        document.querySelector(".toggle-password i")
        .className="fa-solid fa-eye-slash";

    }

    else{

        password.type="password";

        document.querySelector(".toggle-password i")
        .className="fa-solid fa-eye";

    }

};

/* ===========================
    PASSWORD STRENGTH
=========================== */

const fill=document.querySelector(".strength-fill");

const rules={

length:document.getElementById("rule-length"),

upper:document.getElementById("rule-upper"),

number:document.getElementById("rule-number"),

special:document.getElementById("rule-special")

};

password.addEventListener("input",()=>{

let score=0;

if(password.value.length>=8){

rules.length.classList.add("valid");

score++;

}

else{

rules.length.classList.remove("valid");

}

if(/[A-Z]/.test(password.value)){

rules.upper.classList.add("valid");

score++;

}

else{

rules.upper.classList.remove("valid");

}

if(/[0-9]/.test(password.value)){

rules.number.classList.add("valid");

score++;

}

else{

rules.number.classList.remove("valid");

}

if(/[!@#$%^&*(),.?":{}|<>]/.test(password.value)){

rules.special.classList.add("valid");

score++;

}

else{

rules.special.classList.remove("valid");

}

fill.style.width=(score*25)+"%";

if(score==1) fill.style.background="#ef4444";

if(score==2) fill.style.background="#f59e0b";

if(score==3) fill.style.background="#3b82f6";

if(score==4) fill.style.background="#16a34a";

updateProgress();

});

/* ===========================
     FORM PROGRESS
=========================== */

const inputs=form.querySelectorAll("input,select");

inputs.forEach(input=>{

input.addEventListener("input",updateProgress);

});

function updateProgress(){

let completed=0;

inputs.forEach(i=>{

if(i.type==="checkbox"){

if(i.checked) completed++;

}

else if(i.value.trim()!=""){

completed++;

}

});

const percent=(completed/inputs.length)*100;

progressFill.style.width=percent+"%";

}

/* ===========================
     EMAIL CHECK
=========================== */

const email=document.getElementById("email");

email.addEventListener("blur",()=>{

const value=email.value.toLowerCase();

if(value==="test@test.com"){

showToast("Email already exists");

email.focus();

}

});

/* ===========================
      EMPLOYEE ID
=========================== */

const emp=document.getElementById("empId");

emp.addEventListener("blur",()=>{

const pattern=/^EMP[0-9]{4}$/;

if(emp.value!="" && !pattern.test(emp.value)){

showToast("Employee ID should look like EMP1024");

}

});
/* ===========================
      DRAG & DROP UPLOAD
=========================== */

uploadArea.addEventListener("click",()=>{

    profileImage.click();

});

let selectedProfilePicData = "";

profileImage.addEventListener("change", () => {
    if (profileImage.files.length) {
        const file = profileImage.files[0];
        uploadArea.innerHTML = `
            <i class="fa-solid fa-image"></i>
            <h4>${file.name}</h4>
            <p>Profile image selected</p>
        `;
        const reader = new FileReader();
        reader.onload = function(e) {
            selectedProfilePicData = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

uploadArea.addEventListener("dragover",(e)=>{

    e.preventDefault();

    uploadArea.classList.add("dragover");

});

uploadArea.addEventListener("dragleave",()=>{

    uploadArea.classList.remove("dragover");

});

uploadArea.addEventListener("drop",(e)=>{

    e.preventDefault();

    uploadArea.classList.remove("dragover");

    profileImage.files=e.dataTransfer.files;

    uploadArea.innerHTML=`

    <i class="fa-solid fa-image"></i>

    <h4>${e.dataTransfer.files[0].name}</h4>

    <p>Profile image selected</p>

    `;

});

/* ===========================
        TERMS MODAL
=========================== */

const termsBtn=document.getElementById("termsBtn");
const closeTerms=document.getElementById("closeTerms");
const acceptTerms=document.getElementById("acceptTerms");

termsBtn.onclick=(e)=>{

    e.preventDefault();

    termsModal.classList.add("active");

};

closeTerms.onclick=()=>{

    termsModal.classList.remove("active");

};

acceptTerms.onclick=()=>{

    document.getElementById("terms").checked=true;

    updateProgress();

    termsModal.classList.remove("active");

};

/* ===========================
      TOAST MESSAGE
=========================== */

function showToast(message, isError = true){

    const icon = toast.querySelector("i");
    if (icon) {
        icon.className = isError ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-check";
        icon.style.color = isError ? "#ef4444" : "#16a34a";
    }

    toast.querySelector("span").textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);

}

/* ===========================
      FORM VALIDATION & SUBMISSION
=========================== */

const submitBtn = form.querySelector(".register-btn");

function setButtonLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (loading) {
        submitBtn.setAttribute("data-original-html", submitBtn.innerHTML);
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';
    } else {
        const orig = submitBtn.getAttribute("data-original-html");
        if (orig) submitBtn.innerHTML = orig;
        else submitBtn.innerHTML = 'Create Account <i class="fa-solid fa-arrow-right"></i>';
    }
}

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const emailVal = document.getElementById("email").value.trim();
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailPattern.test(emailVal)) {
        showToast("Please enter a valid, active email address.");
        return;
    }

    if(password.value!==confirmPassword.value){

        showToast("Passwords do not match");

        return;

    }

    if(password.value.length<8){

        showToast("Password is too weak");

        return;

    }

    if(!document.getElementById("terms").checked){

        showToast("Accept Terms & Conditions");

        return;

    }

    const payload = {
        name: document.getElementById("name").value.trim(),
        email: emailVal,
        password: password.value,
        department: document.getElementById("department").value,
        experiences: parseInt(document.getElementById("experience").value) || 1
    };

    loadingOverlay.classList.add("active");
    setButtonLoading(true);

    try {
        const response = await fetch("http://localhost:8081/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const contentType = response.headers.get("content-type") || "";
        let data = {};

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const rawText = await response.text();
            console.error("[BenchBridge Registration Fetch Response]", response.status, rawText);
        }

        loadingOverlay.classList.remove("active");
        setButtonLoading(false);

        if (response.status === 201) {
            const customEmpId = document.getElementById("empId").value.trim();
            if (data.employee) {
                data.employee.empId = customEmpId || ("EMP" + String(data.employee.emplId).padStart(4, "0"));
            }
            // Save profile picture in localStorage for this email
            if (selectedProfilePicData && payload.email) {
                localStorage.setItem(`bb_avatar_${payload.email.toLowerCase()}`, selectedProfilePicData);
            }
            if (customEmpId) {
                localStorage.setItem(`bb_empid_${payload.email.toLowerCase()}`, customEmpId);
            }
            // Registration successful — show success modal
            const empId = data.employee && data.employee.emplId
                ? "EMP" + String(data.employee.emplId).padStart(4, "0")
                : "";
            const modalBody = document.querySelector("#successModal .modal-body");
            if (modalBody && empId) {
                const idNotice = document.createElement("p");
                idNotice.style.cssText = "margin-top:12px;font-size:15px;color:#7eb4ff;font-weight:600;";
                idNotice.textContent = "Your Employee ID: " + empId;
                const existing = modalBody.querySelector(".emp-id-notice");
                if (!existing) {
                    idNotice.className = "emp-id-notice";
                    modalBody.appendChild(idNotice);
                } else {
                    existing.textContent = "Your Employee ID: " + empId;
                }
            }
            successModal.classList.add("active");
        } else if (response.status === 409) {
            showToast(data.error || "Duplicate Email: An employee with this email already exists.");
        } else if (response.status === 400) {
            showToast(data.error || "Validation Error: Please fill in all required fields accurately.");
        } else if (response.status === 404) {
            showToast("API Endpoint Not Found (404). Please verify backend server routes.");
            console.error("[BenchBridge Registration Error] API Endpoint Not Found (404)");
        } else if (response.status >= 500) {
            showToast("Internal Server Error (" + response.status + "). Please check server logs.");
            console.error("[BenchBridge Registration Error] Server Error:", response.status, data);
        } else {
            showToast(data.error || ("Registration failed (" + response.status + "). Please try again."));
        }

    } catch (err) {
        loadingOverlay.classList.remove("active");
        setButtonLoading(false);

        console.error("[BenchBridge Registration Fetch Exception]", err);

        if (err.name === "TypeError" && err.message.toLowerCase().includes("failed to fetch")) {
            showToast("Unable to connect to BenchBridge server. Please ensure the backend is running.");
        } else {
            showToast("Network Error: " + (err.message || "Failed to submit registration."));
        }
    }
});

/* ===========================
      CONTINUE BUTTON
=========================== */

document
.getElementById("continueBtn")
.onclick=()=>{

    window.location.href="login.html";

};

/* ===========================
      RIPPLE EFFECT
=========================== */

document.querySelectorAll("button").forEach(btn=>{

    btn.addEventListener("click",function(e){

        const ripple=document.createElement("span");

        ripple.className="ripple";

        const rect=this.getBoundingClientRect();

        ripple.style.left=(e.clientX-rect.left)+"px";

        ripple.style.top=(e.clientY-rect.top)+"px";

        this.appendChild(ripple);

        setTimeout(()=>{

            ripple.remove();

        },600);

    });

});

/* ===========================
      DEMO REGISTRATION
=========================== */

console.log("BenchBridge Register Loaded");

console.log("Ready for Backend Integration");

/*
==========================================
Backend API Example

fetch("/api/register",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

name:...,

email:...,

password:...,

role:selectedRole

})

})

==========================================
*/
