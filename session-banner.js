

(function () {
    "use strict";

const path = window.location.pathname.toLowerCase();
    const EXCLUDED = ["login", "portal-guru", "student-hub", "results"];
    if (EXCLUDED.some(p => path.includes(p))) return;

function readJSON(key) {
        try {
            const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }

    const teacher = readJSON("loggedTeacher");
    const student = readJSON("loggedUser");

    const user     = teacher || student;
    const userType = teacher ? "teacher" : (student ? "student" : null);
    if (!user) return;

function initials(name) {
        if (!name) return "?";
        const p = name.trim().split(" ").filter(Boolean);
        return p.length === 1
            ? p[0][0].toUpperCase()
            : (p[0][0] + p[p.length - 1][0]).toUpperCase();
    }

    function roleLabel() {
        if (userType === "teacher") return user.jabatan || "Guru";
        const map = { tk: "TK & Nursery", sd: "Sekolah Dasar", smp: "SMP" };
        return map[(user.level || "").toLowerCase()] || "Siswa";
    }

    const portalUrl   = userType === "teacher" ? "portal-guru.html" : "student-hub.html";
    const portalLabel = userType === "teacher" ? "Buka Portal Guru" : "Buka Student Hub";
    const typeLabel   = userType === "teacher" ? "Akun Guru" : "Akun Siswa";
    const typeIcon    = userType === "teacher" ? "fa-chalkboard-teacher" : "fa-user-graduate";

const css = document.createElement("style");
    css.textContent = `
    #sb-popup {
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 99999;
        background: #0d1b2a;
        border: 1px solid rgba(74,144,217,0.35);
        border-radius: 18px;
        padding: 20px 22px 16px;
        width: 280px;
        box-shadow: 0 16px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04);
        font-family: 'DM Sans','Plus Jakarta Sans','Segoe UI',sans-serif;
        transform: translateY(110px) scale(0.96);
        opacity: 0;
        transition: transform 0.42s cubic-bezier(0.34,1.56,0.64,1),
                    opacity 0.3s ease;
        pointer-events: none;
    }
    #sb-popup.sb-show {
        transform: translateY(0) scale(1);
        opacity: 1;
        pointer-events: auto;
    }
    #sb-popup.sb-hide {
        transform: translateY(110px) scale(0.95);
        opacity: 0;
        pointer-events: none;
    }
    .sb-close {
        position: absolute;
        top: 11px; right: 13px;
        background: none;
        border: none;
        color: rgba(107,143,173,0.65);
        font-size: 13px;
        cursor: pointer;
        padding: 3px 6px;
        border-radius: 6px;
        line-height: 1;
        transition: color 0.2s, background 0.2s;
        font-family: inherit;
    }
    .sb-close:hover { color: #c8d9ea; background: rgba(255,255,255,0.06); }
    .sb-tag {
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: #4a90d9;
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 12px;
    }
    .sb-tag i { font-size: 11px; }
    .sb-user {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
    }
    .sb-av {
        width: 42px; height: 42px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4a90d9 0%, #2d6ab0 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        color: #fff;
        flex-shrink: 0;
        box-shadow: 0 3px 12px rgba(74,144,217,0.3);
        letter-spacing: 0;
    }
    .sb-name {
        font-size: 14.5px;
        font-weight: 700;
        color: #ffffff;
        line-height: 1.25;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 175px;
    }
    .sb-role {
        font-size: 12px;
        color: #6b8fad;
        margin-top: 2px;
    }
    .sb-divider {
        height: 1px;
        background: rgba(255,255,255,0.07);
        margin: 0 -22px 14px;
    }
    .sb-go {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 11px 16px;
        background: linear-gradient(120deg, #4a90d9 0%, #2d6ab0 100%);
        color: #fff;
        border: none;
        border-radius: 11px;
        font-size: 13.5px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        transition: opacity 0.18s, transform 0.18s;
        font-family: inherit;
        letter-spacing: 0;
    }
    .sb-go:hover { opacity: 0.88; transform: translateY(-1px); }
    .sb-go i { font-size: 12px; }
    .sb-logout {
        display: block;
        width: 100%;
        text-align: center;
        margin-top: 10px;
        font-size: 12px;
        color: #6b8fad;
        cursor: pointer;
        transition: color 0.2s;
        background: none;
        border: none;
        font-family: inherit;
        padding: 2px 0;
    }
    .sb-logout:hover { color: #ef4444; }
    .sb-logout i { margin-right: 5px; font-size: 11px; }
    `;
    document.head.appendChild(css);

const popup = document.createElement("div");
    popup.id = "sb-popup";
    popup.innerHTML = `
        <button class="sb-close" onclick="sbDismiss()" aria-label="Tutup">✕</button>
        <div class="sb-tag">
            <i class="fas ${typeIcon}"></i> ${typeLabel}
        </div>
        <div class="sb-user">
            <div class="sb-av">${initials(user.name)}</div>
            <div>
                <div class="sb-name">${user.name}</div>
                <div class="sb-role">${roleLabel()}</div>
            </div>
        </div>
        <div class="sb-divider"></div>
        <a class="sb-go" href="${portalUrl}">
            ${portalLabel} <i class="fas fa-arrow-right"></i>
        </a>
        <button class="sb-logout" onclick="sbLogout()">
            <i class="fas fa-right-from-bracket"></i> Keluar dari akun
        </button>
    `;
    document.body.appendChild(popup);

setTimeout(() => popup.classList.add("sb-show"), 700);

window.sbDismiss = function () {
        popup.classList.add("sb-hide");
        setTimeout(() => popup.remove(), 450);
    };

    window.sbLogout = function () {
        ["loggedTeacher", "loggedUser"].forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
        popup.classList.add("sb-hide");
        setTimeout(() => { popup.remove(); }, 450);
    };

})();
