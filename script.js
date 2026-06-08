
const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");
let currentSlide = 0;
let intervalId;
let eyebrowTimer;
const HEAD_SPEED = 95;

document.addEventListener("DOMContentLoaded", function () {
    if (slides.length > 0) {
        showSlide(currentSlide);
        intervalId = setInterval(nextSlide, 5000);
        dots.forEach((dot, index) => {
            dot.addEventListener("click", () => {
                clearInterval(intervalId);
                showSlide(index);
                intervalId = setInterval(nextSlide, 5000);
            });
        });
    }
});

function showSlide(index) {
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;
    currentSlide = index;
    slides.forEach(slide => slide.classList.remove("displaySlide"));
    slides[currentSlide].classList.add("displaySlide");
    const content = slides[currentSlide].querySelector(".slide-content");
    if (content) {
        content.style.animation = "none";
        content.offsetHeight;
        content.style.animation = "";
    }

    const img = slides[currentSlide].querySelector(".slide-img");
    if (img) {
        img.style.animation = "none";
        img.offsetHeight;
        img.style.animation = "";
    }

    const heading = slides[currentSlide].querySelector(".slide-heading");
    if (heading) {
        heading.style.animation = "none";
        heading.offsetHeight;
        heading.style.animation = "";
    }

    const eyebrow = slides[currentSlide].querySelector(".slide-eyebrow");
    if (eyebrow) {
        eyebrow.style.animation = "none";
        eyebrow.offsetHeight;
        eyebrow.style.animation = "";
    }

    const subheading = slides[currentSlide].querySelector(".slide-subheading");
    if (subheading) {
        subheading.style.animation = "none";
        subheading.offsetHeight;
        subheading.style.animation = "";
    }

    const btns = slides[currentSlide].querySelector(".slide-btns");
    if (btns) {
        btns.style.animation = "none";
        btns.offsetHeight;
        btns.style.animation = "";
    }

    dots.forEach((dot, i) => {
        dot.classList.toggle("dotActive", i === currentSlide);
    });
}

function prevSlide() {
    clearInterval(intervalId);
    showSlide(currentSlide - 1);
    intervalId = setInterval(nextSlide, 5000);
}

function nextSlide() {
    clearInterval(intervalId);
    showSlide(currentSlide + 1);
    intervalId = setInterval(nextSlide, 5000);
}

const gallerySlide = document.querySelectorAll(".gallery-slide");
let galleryIndex = 0;
let galleryIntervalID = 0;

const navbar = document.querySelector(".nav-bar");
const carousel = document.querySelector(".slides");

if (navbar) {
    navbar.classList.remove("nav-hidden");
    if (carousel) {
        window.addEventListener("scroll", () => {
            const carouselBottom = carousel.getBoundingClientRect().bottom;
            if (carouselBottom <= 0) {
                navbar.classList.add("nav-scrolled");
            } else {
                navbar.classList.remove("nav-scrolled");
            }
        });
    }
}

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTreOQ_yv8kN98ByfBr13q_eTPzhex5i5EHs2gdVXyWs9CZYVDTZEpyiaYDKLmL8jcSKXBsVEc9nd4v/pub?output=csv";

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

async function fetchStudents() {
    const response = await fetch(SHEET_CSV_URL);
    const text = await response.text();
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
            } else { cur += ch; }
        }
        cols.push(cur.trim());
        return {
            id:     cols[0] || "",
            name:   cols[1] || "",
            status: cols[2] || "",
            password: cols[3] || "",
            level:  cols[4] || "",
            fileid: cols[5] || "",
            kelas:  cols[6] || ""
        };
    });
}

async function handleLogin() {
    const inputId = document.getElementById("username").value.trim();
    const inputPw = document.getElementById("password").value.trim();

    if (!inputId || !inputPw) {
        alert("Harap isi ID dan Password.");
        return;
    }

    const btn = document.querySelector(".login-btn");
    btn.innerHTML = 'Memuat... <i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const students = await fetchStudents();
        const match = students.find(s => s.id === inputId && s.password === inputPw);

        if (match) {

            const rememberMe = document.querySelector(".remember input[type='checkbox']")?.checked;
            const store = rememberMe ? localStorage : sessionStorage;
            store.setItem("loggedUser", JSON.stringify({
                name: match.name,
                status: match.status,
                level: match.level,
                fileid: match.fileid,
                kelas: match.kelas
            }));
            window.location.href = "results.html";
        } else {
            alert("ID atau Password salah. Silakan coba lagi.");
            btn.innerHTML = 'Masuk <i class="fas fa-arrow-right"></i>';
            btn.disabled = false;
        }
    } catch (err) {
        alert("Gagal mengambil data. Periksa koneksi internet Anda.");
        console.error(err);
        btn.innerHTML = 'Masuk <i class="fas fa-arrow-right"></i>';
        btn.disabled = false;
    }
}