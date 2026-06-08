

const TEACHER_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTl8QkyRG2MjnxoQ9bQn25voeCYoIfVy_Gb17xbOeZYI7HrBTv73SwE8UhjHWzYvTjk6BK568wg2MW0/pub?output=csv";

function togglePassword() {
    const pw = document.getElementById("password");
    const icon = document.getElementById("eyeIcon");
    if (!pw || !icon) return;
    if (pw.type === "password") {
        pw.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        pw.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

async function fetchTeachers() {
    const response = await fetch(TEACHER_SHEET_CSV_URL);
    const text = await response.text();
    const rows = text.trim().split("\n").slice(1);

    return rows.map(row => {

        const cols = [];
        let cur = "", inQ = false;
        for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            if (ch === '"') {
                if (inQ && row[i + 1] === '"') { cur += '"'; i++; }
                else inQ = !inQ;
            } else if (ch === ',' && !inQ) {
                cols.push(cur.trim()); cur = "";
            } else { cur += ch; }
        }
        cols.push(cur.trim());
        return {
            id:       cols[0] || "",
            name:     cols[1] || "",
            status:   cols[2] || "",
            password: cols[3] || "",
            jenjang:  cols[4] || "",
            jabatan:  cols[5] || ""
        };
    });
}

async function handleTeacherLogin() {
    const inputId = document.getElementById("username").value.trim();
    const inputPw = document.getElementById("password").value.trim();

    if (!inputId || !inputPw) {
        showError("Harap isi Teacher ID dan Password.");
        return;
    }

    const btn = document.querySelector(".login-btn");
    btn.innerHTML = 'Memverifikasi... <i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const teachers = await fetchTeachers();
        const match = teachers.find(
            t => t.id === inputId && t.password === inputPw
        );

        if (match) {
            if (match.status === "inactive") {
                showError("Akun Anda tidak aktif. Hubungi administrator.");
                resetBtn(btn);
                return;
            }

            const rememberMe = document.querySelector(".remember input[type='checkbox']")?.checked;
            const store = rememberMe ? localStorage : sessionStorage;
            store.setItem("loggedTeacher", JSON.stringify({
                id:      match.id,
                name:    match.name,
                jabatan: match.jabatan,
                jenjang: match.jenjang,
                status:  match.status
            }));
            window.location.href = "portal-guru.html";
        } else {
            showError("Teacher ID atau Password salah. Silakan coba lagi.");
            resetBtn(btn);
        }

    } catch (err) {
        console.error(err);
        showError("Gagal mengambil data. Periksa koneksi internet Anda.");
        resetBtn(btn);
    }
}

function resetBtn(btn) {
    btn.innerHTML = 'Masuk <i class="fas fa-arrow-right"></i>';
    btn.disabled = false;
}

function showError(msg) {

    const existing = document.getElementById("login-error");
    if (existing) existing.remove();

    const el = document.createElement("p");
    el.id = "login-error";
    el.textContent = msg;
    el.style.cssText = [
        "color:#ff8a8a",
        "font-size:13px",
        "text-align:center",
        "margin-top:4px",
        "animation:fade-up 0.3s ease both"
    ].join(";");

    const form = document.querySelector(".login-form");
    if (form) form.appendChild(el);
}

document.addEventListener("DOMContentLoaded", function () {
    if (window.innerWidth <= 768) {
        var sel = [
            '.teacher-chip-name', '.teacher-chip-role',
            '.teacher-chip-info', '.chip-name', '.chip-role'
        ].join(',');
        document.querySelectorAll(sel).forEach(function (el) {
            el.style.setProperty('display', 'none', 'important');
        });
    }
});

function requireTeacherAuth() {
    const raw = localStorage.getItem("loggedTeacher") || sessionStorage.getItem("loggedTeacher");
    if (!raw) {
        window.location.href = "login-teacher.html";
        return null;
    }
    try {
        return JSON.parse(raw);
    } catch {
        window.location.href = "login-teacher.html";
        return null;
    }
}

function teacherLogout() {
    localStorage.removeItem("loggedTeacher");
    sessionStorage.removeItem("loggedTeacher");
    window.location.href = "login-teacher.html";
}
