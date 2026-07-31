/* ==========================================================
   BenchBridge — Home Page Script
   Handles: navbar scroll, mobile nav, fade-in observer,
            smooth active nav-link highlighting
========================================================== */

"use strict";

/* ========================
   NAVBAR — shadow on scroll
======================== */

const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }
}, { passive: true });

/* ========================
   MOBILE NAV — hamburger
======================== */

const hamburger  = document.getElementById("hamburger");
const mobileNav  = document.getElementById("mobileNav");

hamburger.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", String(isOpen));
    mobileNav.setAttribute("aria-hidden", String(!isOpen));

    // swap icon
    hamburger.querySelector("i").className = isOpen
        ? "fa-solid fa-xmark"
        : "fa-solid fa-bars";
});

// Close mobile nav when a link is clicked
document.querySelectorAll(".mobile-link, .mobile-cta").forEach(link => {
    link.addEventListener("click", () => {
        mobileNav.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
        mobileNav.setAttribute("aria-hidden", "true");
        hamburger.querySelector("i").className = "fa-solid fa-bars";
    });
});

/* ========================
   FADE-IN — IntersectionObserver
======================== */

const fadeEls = document.querySelectorAll(".fade-in, .fade-in-delay");

const fadeObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                fadeObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);

fadeEls.forEach(el => fadeObserver.observe(el));

/* ========================
   ACTIVE NAV LINK — scroll spy
======================== */

const sections  = document.querySelectorAll("section[id]");
const navLinks  = document.querySelectorAll(".nav-link");

const spyObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute("id");
                navLinks.forEach(link => {
                    link.classList.toggle(
                        "active",
                        link.getAttribute("href") === `#${id}`
                    );
                });
            }
        });
    },
    { threshold: 0.35 }
);

sections.forEach(sec => spyObserver.observe(sec));

/* ========================
   SMOOTH SCROLL — anchors
======================== */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", (e) => {
        const target = document.querySelector(anchor.getAttribute("href"));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });
});

/* ========================
   STAGGER — feature cards
======================== */

document.querySelectorAll(".feature-card").forEach((card, i) => {
    card.style.transitionDelay = `${i * 80}ms`;
});

/* ========================
   STAGGER — timeline steps
======================== */

document.querySelectorAll(".timeline-step").forEach((step, i) => {
    step.style.transitionDelay = `${i * 120}ms`;
    step.classList.add("fade-in");
    fadeObserver.observe(step);
});
