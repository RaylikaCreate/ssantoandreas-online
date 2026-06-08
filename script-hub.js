

const HUB_ASSIGNMENTS_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTO84irndEZywKOkUIVg8Otlnre25fYCxjkNS-79j35kzvYzLk4UkhFQQzOkS7FsXX0M5Tj7rTd1fUZ/pub?output=csv";
const HUB_RESOURCES_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0KXUMUhh0dhn5XdV8ITy31kOoOrDtfUydozAYjDz3LJNCKxloTV1aze4xalSg0TGIdXrvpbLSuTK4/pub?output=csv";
const HUB_EXAMS_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNB16UFY4CUzi2-kBAGGXZp2nbQ7EdqkywJCp_bmfLw-IYUinx0Oq-FxkMqXwFzpRmHAewhzw7GbLs/pub?output=csv";
const HUB_ACHIEVEMENTS_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSbMWFKY0moQE8EDnVotrFop_NqoCzxWToYwV5VHFCIIPQb6eXS_HROjzeEynzcz9NcUOf3HEt7Aqic/pub?output=csv";

const HUB_SUGGESTION_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc3z_Djj1xjOvy8Ri0T736gBDteXhNsnadmwvRU3yEiqo0cHg/formResponse";
const HUB_SUGGESTION_ENTRY_CAT = "entry.1568722599";
const HUB_SUGGESTION_ENTRY_MSG = "entry.2138532754";

function requireStudentAuth() {
    const raw = localStorage.getItem("loggedUser") || sessionStorage.getItem("loggedUser");
    if (!raw) { window.location.href = "login.html"; return null; }
    try { return JSON.parse(raw); }
    catch { window.location.href = "login.html"; return null; }
}

function studentLogout() {
    localStorage.removeItem("loggedUser");
    sessionStorage.removeItem("loggedUser");
    window.location.href = "login.html";
}

function parseCSV(text) {

    const rows = text.trim().split(/\r?\n/).slice(1);
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
            } else {
                cur += ch;
            }
        }
        cols.push(cur.trim());
        return cols;
    }).filter(r => r.some(c => c));
}

function parseDate(str) {

    const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return new Date(str);
    return new Date(str);
}

const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function formatDateID(date) {
    if (!(date instanceof Date) || isNaN(date)) return "—";
    return `${DAYS_ID[date.getDay()]}, ${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

function shortDate(date) {
    if (!(date instanceof Date) || isNaN(date)) return "—";
    return `${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

function daysUntil(date) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return Math.round((d - now) / 86400000);
}

function urgencyFromDays(days) {
    if (days < 0) return "overdue";
    if (days <= 2) return "high";
    if (days <= 5) return "medium";
    return "low";
}

function dueBadgeClass(days) {
    if (days < 0) return "overdue";
    if (days <= 3) return "soon";
    return "upcoming";
}

function dueBadgeLabel(days) {
    if (days < 0) return `${Math.abs(days)} hari terlambat`;
    if (days === 0) return "Hari ini!";
    if (days === 1) return "Besok";
    return `${days} hari lagi`;
}

function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

let currentStudent = null;

function matchKelas(itemKelas, student) {
    const ik = (itemKelas || "").trim();
    if (!ik || !student) return true;

    const sk  = (student.kelas || "").trim().toUpperCase();
    const sl  = (student.level || "").trim().toLowerCase();
    const ikU = ik.toUpperCase();
    const ikL = ik.toLowerCase();

    if (!ikL || ikL === "semua" || ikL.includes("semua")) return true;
    if (ikL === "sd" || ikL === "smp") return ikL === sl;
    if (ikU === sk) return true;
    if (/^\d+$/.test(ik) && sk.startsWith(ik)) return true;
    return false;
}

function updateBerandaStats() {
    const t = document.getElementById("statTugas");
    const u = document.getElementById("statUjian");
    const m = document.getElementById("statMateri");
    const p = document.getElementById("statPrestasi");
    if (t) t.textContent = allAssignments.length;
    if (u) u.textContent = allExams.filter(e => daysUntil(e.date) >= 0).length;
    if (m) m.textContent = allResources.length;
    if (p) p.textContent = allAchievements.length;

    const tasksDue = allAssignments.filter(
        a => daysUntil(a.dueDate) >= 0 && daysUntil(a.dueDate) <= 3
    ).length;
    const badge = document.getElementById("tugasBadge");
    if (badge) {
        badge.textContent = tasksDue;
        badge.style.display = tasksDue > 0 ? "inline-block" : "none";
    }
    updateBerandaPreviews();
}

function updateBerandaPreviews() {

    const tugasPreview = document.getElementById("tugasPreview");
    if (tugasPreview) {
        const sorted = [...allAssignments].sort((a, b) => a.dueDate - b.dueDate);
        if (!sorted.length) {
            tugasPreview.innerHTML = `<div class="hub-empty" style="padding:20px 0;"><i class="fas fa-inbox"></i><p>Belum ada tugas untuk kelasmu.</p></div>`;
        } else {
            tugasPreview.innerHTML = sorted.slice(0, 3).map(a => {
                const days = daysUntil(a.dueDate);
                const urg  = urgencyFromDays(days);
                return `<div class="task-card" style="padding:14px 16px;margin-bottom:8px;">
                    <div class="task-bar ${urg}"></div>
                    <div class="task-body">
                        <div class="task-subject">${a.subject}</div>
                        <div class="task-title" style="font-size:13.5px;">${a.title}</div>
                    </div>
                    <div class="task-due-badge ${dueBadgeClass(days)}" style="font-size:10.5px;padding:3px 9px;flex-shrink:0;">${dueBadgeLabel(days)}</div>
                </div>`;
            }).join("");
        }
    }

const ujianPreview = document.getElementById("ujianPreview");
    if (ujianPreview) {
        const upcoming = [...allExams]
            .filter(e => daysUntil(e.date) >= 0)
            .sort((a, b) => a.date - b.date)
            .slice(0, 2);
        if (!upcoming.length) {
            ujianPreview.innerHTML = `<div class="hub-empty" style="padding:30px 0;"><i class="fas fa-check-circle"></i><p>Tidak ada ujian mendatang</p></div>`;
        } else {
            ujianPreview.innerHTML = upcoming.map(e => {
                const days = daysUntil(e.date);
                return `<div style="display:flex;align-items:center;gap:14px;padding:13px 16px;background:var(--hub-card2);border-radius:10px;margin-bottom:8px;">
                    <div style="text-align:center;min-width:44px;">
                        <div style="font-size:22px;font-weight:700;color:var(--hub-white);line-height:1;">${e.date.getDate()}</div>
                        <div style="font-size:10px;color:var(--hub-muted);text-transform:uppercase;">${MONTHS_ID[e.date.getMonth()].slice(0,3)}</div>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:14px;font-weight:600;color:var(--hub-white);">${e.name}</div>
                        <div style="font-size:12px;color:var(--hub-muted);margin-top:2px;">${days} hari lagi</div>
                    </div>
                    <span class="exam-type-badge ${e.type}" style="margin-bottom:0;">${e.type.toUpperCase()}</span>
                </div>`;
            }).join("");
        }
    }
}

const DEMO_ASSIGNMENTS = [
    {
        subject: "Matematika",
        title: "Latihan Soal Bilangan Bulat",
        desc: "Kerjakan halaman 58–61, soal A dan B. Tunjukkan langkah-langkah penyelesaian.",
        teacher: "Bpk. Freddy Lumanov",
        dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })()
    },
    {
        subject: "Bahasa Indonesia",
        title: "Menulis Cerpen Tema Persahabatan",
        desc: "Tulis cerpen minimal 500 kata, kumpulkan dalam format PDF via Google Classroom.",
        teacher: "Ibu Dewi Rahayu",
        dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 4); return d; })()
    },
    {
        subject: "IPA",
        title: "Laporan Praktikum Fotosintesis",
        desc: "Buat laporan lengkap (tujuan, alat & bahan, prosedur, hasil, kesimpulan).",
        teacher: "Ibu Sandra Kusuma",
        dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 8); return d; })()
    },
    {
        subject: "Pendidikan Agama",
        title: "Hafalan Doa Rosario",
        desc: "Hafalkan doa Rosario lengkap dan siap untuk diuji pada pertemuan berikutnya.",
        teacher: "Bpk. Andreas Suharto",
        dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d; })()
    },
    {
        subject: "IPS",
        title: "Peta Pikiran Kerajaan Hindu-Buddha",
        desc: "Buat mind map dengan minimal 5 cabang, dapat dibuat tangan atau digital.",
        teacher: "Ibu Maria Tanoto",
        dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 6); return d; })()
    }
];

const DEMO_RESOURCES = [
    { title: "Modul Matematika Bab 3 — Bilangan Bulat", type: "pdf", subject: "Matematika", kelas: "Semua Kelas", uploader: "Bpk. Freddy Lumanov", url: "#" },
    { title: "Soal Latihan UTS Bahasa Indonesia", type: "pdf", subject: "Bahasa Indonesia", kelas: "Kelas 7 & 8", uploader: "Ibu Dewi Rahayu", url: "#" },
    { title: "PPT Kerajaan Hindu-Buddha di Nusantara", type: "ppt", subject: "IPS", kelas: "Kelas 7", uploader: "Ibu Maria Tanoto", url: "#" },
    { title: "Rangkuman IPA Semester 2", type: "pdf", subject: "IPA", kelas: "Semua Kelas", uploader: "Ibu Sandra Kusuma", url: "#" },
    { title: "Kumpulan Soal UAS Matematika 3 Tahun Terakhir", type: "pdf", subject: "Matematika", kelas: "Kelas 9", uploader: "Bpk. Freddy Lumanov", url: "#" },
    { title: "Lembar Kerja Siswa — Ekosistem", type: "sheet", subject: "IPA", kelas: "Kelas 8", uploader: "Ibu Sandra Kusuma", url: "#" },
    { title: "Tutorial Presentasi PowerPoint untuk Siswa", type: "video", subject: "TIK", kelas: "Semua Kelas", uploader: "Bpk. Freddy Lumanov", url: "#" }
];

const DEMO_EXAMS = [
    {
        name: "Ulangan Harian Matematika",
        type: "ulangan",
        date: (() => { const d = new Date(); d.setDate(d.getDate() + 4); return d; })()
    },
    {
        name: "Ujian Praktek IPA",
        type: "praktek",
        date: (() => { const d = new Date(); d.setDate(d.getDate() + 10); return d; })()
    },
    {
        name: "UTS Semester 2",
        type: "uts",
        date: (() => { const d = new Date(); d.setDate(d.getDate() + 18); return d; })()
    },
    {
        name: "UAS / Ujian Akhir Tahun",
        type: "uas",
        date: (() => { const d = new Date(); d.setDate(d.getDate() + 55); return d; })()
    }
];

const DEMO_ACHIEVEMENTS = [
    {
        name: "Kevin Santoso",
        kelas: "Kelas 8A",
        desc: "Juara 1 Olimpiade Matematika Tingkat Kota Bandung — mewakili SMP Santo Andreas dengan skor sempurna di babak final.",
        cat: "akademik",
        medal: "gold",
        date: "Mei 2026"
    },
    {
        name: "Gracia Wijaya",
        kelas: "Kelas 7B",
        desc: "Juara 2 Lomba Debat Bahasa Inggris Tingkat Kabupaten — membawakan argumen yang memukau tentang perubahan iklim.",
        cat: "akademik",
        medal: "silver",
        date: "April 2026"
    },
    {
        name: "Tim Robotics STA",
        kelas: "Kelas 8 & 9",
        desc: "Juara 1 Kompetisi Robotik Tingkat Provinsi Jawa Barat — berhasil menyelesaikan semua tantangan dalam waktu tercepat.",
        cat: "teknologi",
        medal: "special",
        date: "Maret 2026"
    },
    {
        name: "Alicia Fernanda",
        kelas: "Kelas 9C",
        desc: "Medali Perunggu Kejuaraan Taekwondo Pelajar Tingkat Nasional — kategori under-55kg putri.",
        cat: "olahraga",
        medal: "bronze",
        date: "Februari 2026"
    },
    {
        name: "Paduan Suara STA",
        kelas: "Gabungan",
        desc: "Juara 2 Festival Paduan Suara Antar Sekolah Tingkat Provinsi — membawakan repertoire 3 lagu klasik dan kontemporer.",
        cat: "seni",
        medal: "silver",
        date: "Januari 2026"
    }
];

const DEMO_EKSKUL = [];

const SECTION_TITLES = {
    beranda: "Beranda",
    tugas: "Papan Tugas",
    materi: "Perpustakaan Digital",
    ujian: "Countdown Ujian",
    prestasi: "Papan Prestasi",
    ekskul: "Jadwal Ekskul",
    saran: "Kotak Saran"
};

function navigateTo(sectionId) {

    document.querySelectorAll(".hub-section").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".hub-nav-item").forEach(i => i.classList.remove("active"));

const section = document.getElementById("sec-" + sectionId);
    const navItem = document.querySelector(`[data-section="${sectionId}"]`);
    if (section) section.classList.add("active");
    if (navItem) navItem.classList.add("active");

const titleEl = document.getElementById("topbarTitle");
    if (titleEl) titleEl.textContent = SECTION_TITLES[sectionId] || "";

closeSidebar();

if (sectionId === "tugas" && !window._tugasLoaded) renderTugas();
    if (sectionId === "materi" && !window._materiLoaded) renderMateri();
    if (sectionId === "ujian" && !window._ujianLoaded) renderUjian();
    if (sectionId === "prestasi" && !window._prestasiLoaded) renderPrestasi();
    if (sectionId === "ekskul" && !window._ekskulLoaded) renderEkskul();
}

function openSidebar() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("overlay").classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("overlay").classList.remove("show");
    document.body.style.overflow = "";
}

function renderBeranda(student) {
    document.getElementById("welcomeName").textContent = student.name;
    document.getElementById("welcomeLevel").textContent =
        levelLabel(student.level) + (student.kelas ? " · Kelas " + student.kelas : "");

updateBerandaStats();
}

function levelLabel(level) {
    const map = { tk: "TK & Nursery", sd: "Sekolah Dasar", smp: "SMP" };
    return map[level] || level?.toUpperCase() || "Siswa";
}

let allAssignments = [];
let currentFilter = "Semua";

async function renderTugas() {
    window._tugasLoaded = true;
    if (!HUB_ASSIGNMENTS_CSV.includes("PASTE")) {
        try {
            const raw = localStorage.getItem("loggedUser") || sessionStorage.getItem("loggedUser");
            const student = raw ? JSON.parse(raw) : null;
            const myJenjang = (student?.level || "").toLowerCase();

            const res = await fetch(HUB_ASSIGNMENTS_CSV);
            const text = await res.text();
            const rows = parseCSV(text);
            allAssignments = rows.map(r => ({
                jenjang: (r[0] || "").toLowerCase(),
                kelas: r[1] || "",
                subject: r[2] || "",
                title: r[3] || "",
                desc: r[4] || "",
                teacher: r[5] || "",
                dueDate: parseDate(r[6] || "")
            }))
                .filter(a => a.title)
                .filter(a => !a.jenjang || !myJenjang || a.jenjang === myJenjang)
                .filter(a => matchKelas(a.kelas, student));
        } catch (e) { console.warn("Could not load assignments CSV, using demo data."); }
    }
    updateBerandaStats();
    filterTugas("Semua");
}

function filterTugas(filter) {
    currentFilter = filter;
    document.querySelectorAll("#tugasFilters .hub-filter-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.filter === filter);
    });

    let list = allAssignments;
    if (filter !== "Semua") list = list.filter(a => a.subject === filter);

list = [...list].sort((a, b) => a.dueDate - b.dueDate);

    const container = document.getElementById("taskList");
    if (!container) return;

    if (!list.length) {
        container.innerHTML = `<div class="hub-empty"><i class="fas fa-inbox"></i><p>Tidak ada tugas untuk filter ini.</p></div>`;
        return;
    }

    container.innerHTML = list.map(a => {
        const days = daysUntil(a.dueDate);
        const urg = urgencyFromDays(days);
        return `
        <div class="task-card">
            <div class="task-bar ${urg}"></div>
            <div class="task-body">
                <div class="task-subject">${a.subject}</div>
                <div class="task-title">${a.title}</div>
                <div class="task-desc">${a.desc}</div>
                <div class="task-meta">
                    <span class="task-meta-item"><i class="fas fa-user-tie"></i> ${a.teacher}</span>
                    <span class="task-meta-item"><i class="fas fa-calendar"></i> ${shortDate(a.dueDate)}</span>
                </div>
            </div>
            <div class="task-side">
                <span class="task-due-badge ${dueBadgeClass(days)}">${dueBadgeLabel(days)}</span>
            </div>
        </div>`;
    }).join("");
}

let allResources = [];

async function renderMateri() {
    window._materiLoaded = true;
    if (!HUB_RESOURCES_CSV.includes("PASTE")) {
        try {
            const res = await fetch(HUB_RESOURCES_CSV);
            const text = await res.text();
            const rows = parseCSV(text);
            allResources = rows.map(r => ({
                title: r[0] || "",
                type: (r[1] || "pdf").toLowerCase(),
                subject: r[2] || "",
                kelas: r[3] || "",
                uploader: r[4] || "",
                url: r[5] || "#"
            }))
                .filter(r => r.title)
                .filter(r => matchKelas(r.kelas, currentStudent));
        } catch (e) { console.warn("Could not load resources CSV, using demo data."); }
    }
    updateBerandaStats();
    renderResourceList(allResources);
}

function filterResources(filter) {
    document.querySelectorAll("#materiFilters .hub-filter-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.filter === filter);
    });
    const list = filter === "Semua"
        ? allResources
        : allResources.filter(r => r.subject === filter);
    renderResourceList(list);
}

function searchResources(q) {
    const lower = q.toLowerCase();
    const list = allResources.filter(r =>
        r.title.toLowerCase().includes(lower) ||
        r.subject.toLowerCase().includes(lower) ||
        r.kelas.toLowerCase().includes(lower)
    );
    renderResourceList(list);
}

const RESOURCE_ICON_MAP = {
    pdf: "fa-file-pdf", ppt: "fa-file-powerpoint",
    doc: "fa-file-word", sheet: "fa-file-excel", video: "fa-film"
};

function renderResourceList(list) {
    const container = document.getElementById("resourceList");
    if (!container) return;
    if (!list.length) {
        container.innerHTML = `<div class="hub-empty"><i class="fas fa-folder-open"></i><p>Tidak ada materi ditemukan.</p></div>`;
        return;
    }
    container.innerHTML = list.map(r => {
        const icon = RESOURCE_ICON_MAP[r.type] || "fa-file";
        return `
        <div class="resource-card">
            <div class="resource-icon ${r.type}"><i class="fas ${icon}"></i></div>
            <div class="resource-body">
                <div class="resource-title">${r.title}</div>
                <div class="resource-meta">
                    <span><i class="fas fa-book-open" style="margin-right:4px;"></i>${r.subject}</span>
                    <span><i class="fas fa-users" style="margin-right:4px;"></i>${r.kelas}</span>
                    <span><i class="fas fa-user-tie" style="margin-right:4px;"></i>${r.uploader}</span>
                </div>
            </div>
            <a class="resource-dl-btn" href="${r.url}" target="_blank" rel="noopener">
                <i class="fas fa-download"></i> Unduh
            </a>
        </div>`;
    }).join("");
}

let allExams = [];
let countdownTimers = [];

async function renderUjian() {
    window._ujianLoaded = true;
    if (!HUB_EXAMS_CSV.includes("PASTE")) {
        try {
            const raw = localStorage.getItem("loggedUser") || sessionStorage.getItem("loggedUser");
            const student = raw ? JSON.parse(raw) : null;
            const myJenjang = (student?.level || "").toLowerCase();

            const res = await fetch(HUB_EXAMS_CSV);
            const text = await res.text();
            const rows = parseCSV(text);
            allExams = rows.map(r => ({
                jenjang: (r[0] || "").toLowerCase(),
                kelas: r[1] || "",
                name: r[2] || "",
                type: (r[3] || "ulangan").toLowerCase(),
                date: parseDate(r[4] || ""),
                notes: r[5] || "",
                guru: r[6] || ""
            }))
                .filter(e => e.name && !isNaN(e.date))
                .filter(e => !e.jenjang || !myJenjang || e.jenjang === myJenjang)
                .filter(e => matchKelas(e.kelas, student));
        } catch (e) { console.warn("Could not load exams CSV, using demo data."); }
    }
    updateBerandaStats();

const sorted = [...allExams].sort((a, b) => a.date - b.date);

    const container = document.getElementById("examGrid");
    if (!container) return;

    container.innerHTML = sorted.map((e, i) => {
        const days = daysUntil(e.date);
        const isPast = days < 0;
        return `
        <div class="exam-card${isPast ? " past" : ""}" id="examCard_${i}">
            <span class="exam-type-badge ${e.type}">${e.type.toUpperCase()}</span>
            <div class="exam-name">${e.name}</div>
            <div class="exam-date-str">${formatDateID(e.date)}</div>
            ${isPast
                ? `<div class="exam-done-label"><i class="fas fa-check-circle"></i> Sudah selesai</div>`
                : `<div class="exam-countdown" id="cd_${i}">
                       <div class="cd-unit"><div class="cd-val" id="cd_d_${i}">—</div><div class="cd-label">Hari</div></div>
                       <div class="cd-unit"><div class="cd-val" id="cd_h_${i}">—</div><div class="cd-label">Jam</div></div>
                       <div class="cd-unit"><div class="cd-val" id="cd_m_${i}">—</div><div class="cd-label">Menit</div></div>
                   </div>`
            }
        </div>`;
    }).join("");

countdownTimers.forEach(clearInterval);
    countdownTimers = [];

    sorted.forEach((e, i) => {
        if (daysUntil(e.date) < 0) return;
        const tick = () => {
            const diff = e.date - new Date();
            if (diff <= 0) return;
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const dEl = document.getElementById(`cd_d_${i}`);
            const hEl = document.getElementById(`cd_h_${i}`);
            const mEl = document.getElementById(`cd_m_${i}`);
            if (dEl) dEl.textContent = String(d).padStart(2, "0");
            if (hEl) hEl.textContent = String(h).padStart(2, "0");
            if (mEl) mEl.textContent = String(m).padStart(2, "0");
        };
        tick();
        countdownTimers.push(setInterval(tick, 60000));
    });
}

let allAchievements = [];

async function renderPrestasi() {
    window._prestasiLoaded = true;
    if (!HUB_ACHIEVEMENTS_CSV.includes("PASTE")) {
        try {
            const res = await fetch(HUB_ACHIEVEMENTS_CSV);
            const text = await res.text();
            const rows = parseCSV(text);
            allAchievements = rows.map(r => ({
                name: r[0] || "",
                kelas: r[1] || "",
                desc: r[2] || "",
                cat: (r[3] || "akademik").toLowerCase(),
                medal: (r[4] || "gold").toLowerCase(),
                date: r[5] || ""
            })).filter(a => a.name);
        } catch (e) { console.warn("Could not load achievements CSV, using demo data."); }
    }
    updateBerandaStats();
    filterPrestasi("Semua");
}

function filterPrestasi(filter) {
    document.querySelectorAll("#prestasiFilters .hub-filter-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.filter === filter);
    });
    const list = filter === "Semua"
        ? allAchievements
        : allAchievements.filter(a => a.cat === filter.toLowerCase());
    renderAchieveList(list);
}

const MEDAL_EMOJI = { gold: "🥇", silver: "🥈", bronze: "🥉", special: "🏆" };

function renderAchieveList(list) {
    const container = document.getElementById("achieveList");
    if (!container) return;
    if (!list.length) {
        container.innerHTML = `<div class="hub-empty"><i class="fas fa-trophy"></i><p>Tidak ada prestasi dalam kategori ini.</p></div>`;
        return;
    }
    container.innerHTML = list.map(a => `
        <div class="achieve-card">
            <div class="achieve-medal ${a.medal}">${MEDAL_EMOJI[a.medal] || "🏆"}</div>
            <div class="achieve-body">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
                    <div>
                        <div class="achieve-name">${a.name}</div>
                        <div class="achieve-class">${a.kelas}</div>
                    </div>
                    <span class="achieve-cat-badge ${a.cat}">${a.cat}</span>
                </div>
                <div class="achieve-desc">${a.desc}</div>
                <div class="achieve-date"><i class="fas fa-calendar-alt"></i>${a.date}</div>
            </div>
        </div>`).join("");
}

const HUB_EKSKUL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSIys5QOgE7HfD_Vna_8cGx-7Wl8CxkCqUHrZfGVO-zY4JNwfqEMgbiXXTJ3-wMrXDlK_onmNyqThdG/pub?output=csv";

async function renderEkskul() {
    window._ekskulLoaded = true;
    const container = document.getElementById("ekskulContainer");
    if (!container) return;

let ekskulData = [];
    try {
        const res  = await fetch(HUB_EKSKUL_CSV);
        const text = await res.text();
        const rows = parseCSV(text);
        const myLevel = (currentStudent?.level || "").toUpperCase();
        ekskulData = rows.map(r => ({
            day:     r[0] || "",
            time:    r[1] || "",
            name:    r[2] || "",
            coach:   r[3] || "",
            place:   r[4] || "",
            jenjang: (r[5] || "").toUpperCase()
        })).filter(e => e.day && e.name)
          .filter(e => !e.jenjang || e.jenjang === myLevel);
    } catch (err) {
        console.warn("Gagal memuat ekskul CSV.", err);
    }

if (!ekskulData.length) {
        container.innerHTML = `<div class="hub-empty"><i class="fas fa-calendar-xmark"></i><p>Belum ada jadwal ekskul untuk jenjangmu.</p></div>`;
        return;
    }

    const todayIdx = new Date().getDay();
    const ordered = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
    const dayIndex = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5 };

    const grouped = {};
    ekskulData.forEach(e => {
        if (!grouped[e.day]) grouped[e.day] = [];
        grouped[e.day].push(e);
    });

    container.innerHTML = ordered.map(day => {
        if (!grouped[day]) return "";
        const isToday = dayIndex[day] === todayIdx;
        const rows = grouped[day].map(e => `
            <div class="ekskul-row">
                <div class="ekskul-time"><i class="fas fa-clock" style="margin-right:6px;opacity:.6;"></i>${e.time}</div>
                <div class="ekskul-name">${e.name}</div>
                <div class="ekskul-coach"><i class="fas fa-user-tie" style="margin-right:5px;opacity:.6;"></i>${e.coach}</div>
                <div class="ekskul-place"><i class="fas fa-map-marker-alt"></i>${e.place}</div>
            </div>`).join("");

        return `
        <div class="ekskul-day-block">
            <div class="ekskul-day-label">
                ${isToday ? '<span class="ekskul-today-dot"></span>' : ""}
                ${day}${isToday ? " — Hari ini" : ""}
            </div>
            ${rows}
        </div>`;
    }).join("");
}

async function submitSuggestion(e) {
    e.preventDefault();
    const cat = document.getElementById("sugCat").value;
    const msg = document.getElementById("sugMsg").value.trim();

    if (!msg) { showToast("Mohon isi pesan saran terlebih dahulu.", true); return; }

    const btn = document.getElementById("sugBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

    if (HUB_SUGGESTION_FORM_URL.includes("PASTE")) {

        await new Promise(r => setTimeout(r, 1200));
        document.getElementById("sugMsg").value = "";
        document.getElementById("sugCat").value = "Akademik";
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Saran';
        showToast("Saran berhasil dikirim! Terima kasih.");
        return;
    }

try {
        const body = new URLSearchParams();
        body.append(HUB_SUGGESTION_ENTRY_CAT, cat);
        body.append(HUB_SUGGESTION_ENTRY_MSG, msg);
        await fetch(HUB_SUGGESTION_FORM_URL, {
            method: "POST", mode: "no-cors", body
        });
        document.getElementById("sugMsg").value = "";
        showToast("Saran berhasil dikirim! Terima kasih.");
    } catch {
        showToast("Gagal mengirim. Coba lagi.", true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Saran';
    }
}

let toastTimer = null;

function showToast(msg, isError = false) {
    const toast = document.getElementById("hubToast");
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.querySelector(".toast-msg").textContent = msg;
    toast.querySelector("i").className = isError
        ? "fas fa-exclamation-circle"
        : "fas fa-check-circle";
    toast.classList.toggle("error", isError);
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
}

document.addEventListener("DOMContentLoaded", () => {
    const student = requireStudentAuth();
    if (!student) return;
    currentStudent = student;

document.getElementById("chipName").textContent = student.name;
    document.getElementById("chipLevel").textContent =
        levelLabel(student.level) + (student.kelas ? " · Kelas " + student.kelas : "");
    document.getElementById("chipAvatar").textContent = getInitials(student.name);

const dateEl = document.getElementById("topbarDate");
    if (dateEl) dateEl.textContent = formatDateID(new Date());

renderBeranda(student);

navigateTo("beranda");

renderTugas();
    renderUjian();
    renderMateri();
    renderPrestasi();
});
