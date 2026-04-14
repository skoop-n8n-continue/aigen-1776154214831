const PRODUCTS_PER_CYCLE = 1;
let PRODUCTS = [];
let currentBatch = 0;

// Initialize GSAP plugins
if (typeof DrawSVGPlugin !== 'undefined') gsap.registerPlugin(DrawSVGPlugin);
if (typeof CustomEase !== 'undefined') gsap.registerPlugin(CustomEase);
if (typeof SplitText !== 'undefined') gsap.registerPlugin(SplitText);

async function loadProducts() {
    try {
        const response = await fetch('./products.json');
        const data = await response.json();
        PRODUCTS = data.products || [];
    } catch (error) {
        console.error('Failed to load products.json:', error);
        // Fallback for development/testing if products.json is missing
        PRODUCTS = [
            {
                name: "UltraCharge X1",
                price: "$1,299",
                image_url: "https://via.placeholder.com/800x800/080c10/00f2ff?text=Charger+X1",
                meta: "350kW | Liquid Cooled | Smart App"
            }
        ];
    }

    createEnergyLines();
    updateTime();
    setInterval(updateTime, 1000);
    startCycle();
}

function updateTime() {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    document.getElementById('time-display').textContent = timeString;
}

function createEnergyLines() {
    const container = document.getElementById('lines-container');
    const lineCount = 12;

    for (let i = 0; i < lineCount; i++) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        line.setAttribute("class", "pulse-line");

        // Create random paths from edges to center
        const startX = Math.random() > 0.5 ? (Math.random() > 0.5 ? 0 : 1920) : Math.random() * 1920;
        const startY = startX === 0 || startX === 1920 ? Math.random() * 1080 : (Math.random() > 0.5 ? 0 : 1080);

        const midX = 960 + (Math.random() - 0.5) * 800;
        const midY = 540 + (Math.random() - 0.5) * 800;

        const endX = 960;
        const endY = 540;

        const d = `M${startX},${startY} Q${midX},${midY} ${endX},${endY}`;
        line.setAttribute("d", d);
        container.appendChild(line);
    }
}

function getBatch(batchIndex) {
    const totalProducts = PRODUCTS.length;
    if (totalProducts === 0) return [];

    const start = (batchIndex * PRODUCTS_PER_CYCLE) % totalProducts;
    return [PRODUCTS[start]];
}

function renderBatch(products) {
    const container = document.getElementById('products-container');
    const overlay = document.getElementById('data-overlay');
    container.innerHTML = '';
    overlay.innerHTML = '';

    products.forEach((product, index) => {
        // Render Product
        const productEl = document.createElement('div');
        productEl.className = 'product';
        productEl.innerHTML = `
            <div class="product-image-wrapper">
                <div class="product-glow-ring"></div>
                <img class="product-image" src="${product.image_url}" alt="${product.name}">
            </div>
        `;
        container.appendChild(productEl);

        // Render Data Card
        const metaTags = (product.meta || '').split('|').map(tag => `<span class="meta-tag">${tag.trim()}</span>`).join('');
        const cardEl = document.createElement('div');
        cardEl.className = 'product-info-card';
        cardEl.innerHTML = `
            <h2 class="product-name">${product.name}</h2>
            <div class="product-price">${product.price}</div>
            <div class="meta-container">${metaTags}</div>
        `;
        overlay.appendChild(cardEl);
    });
}

function animateCycle(batchIndex) {
    const batch = getBatch(batchIndex);
    if (batch.length === 0) {
        setTimeout(() => animateCycle(batchIndex), 1000);
        return;
    }

    renderBatch(batch);

    const tl = gsap.timeline({
        onComplete: () => {
            // Small delay before next cycle
            gsap.delayedCall(1, () => animateCycle(batchIndex + 1));
        }
    });

    const product = document.querySelector('.product');
    const image = document.querySelector('.product-image');
    const ring = document.querySelector('.product-glow-ring');
    const card = document.querySelector('.product-info-card');
    const lines = document.querySelectorAll('.pulse-line');
    const name = document.querySelector('.product-name');
    const statBoxes = document.querySelectorAll('.stat-box');
    const powerValue = document.getElementById('power-value');
    const chargeValue = document.getElementById('charge-value');
    const powerBar = document.getElementById('power-bar');
    const batteryFill = document.getElementById('battery-fill');

    // Stats proxy for animation
    const stats = { power: 0, charge: 0 };

    // 1. Entrance Phase
    tl.set(product, { opacity: 1 });
    tl.set(lines, { drawSVG: "0% 0%", opacity: 0.5 });

    // Energy lines pulse towards center
    tl.to(lines, {
        duration: 1.5,
        drawSVG: "100% 110%",
        stagger: 0.1,
        ease: "power2.inOut"
    });

    // Product Reveal
    tl.from(image, {
        duration: 2,
        scale: 0.5,
        y: 100,
        opacity: 0,
        ease: "expo.out"
    }, "-=1");

    tl.to(ring, {
        duration: 2,
        scale: 1.2,
        opacity: 1,
        ease: "elastic.out(1, 0.5)"
    }, "-=1.5");

    // UI Reveal
    tl.to(card, {
        duration: 1,
        x: 0,
        opacity: 1,
        ease: "power3.out"
    }, "-=1");

    tl.to(statBoxes, {
        duration: 1,
        x: 0,
        opacity: 1,
        stagger: 0.2,
        ease: "power3.out"
    }, "-=0.8");

    // Split text animation for name
    if (typeof SplitText !== 'undefined') {
        const split = new SplitText(name, { type: "words,chars" });
        tl.from(split.chars, {
            duration: 0.8,
            opacity: 0,
            y: 20,
            stagger: 0.05,
            ease: "back.out(1.7)"
        }, "-=0.8");
    }

    // 2. Living Moment (Idle & Live Stats)
    // Animate stats values
    const targetPower = 150 + Math.random() * 200;
    const targetCharge = 20 + Math.floor(Math.random() * 60);

    tl.to(stats, {
        power: targetPower,
        charge: targetCharge,
        duration: 3,
        ease: "power2.out",
        onUpdate: () => {
            powerValue.textContent = stats.power.toFixed(1);
            chargeValue.textContent = Math.floor(stats.charge);
            powerBar.style.width = `${(stats.power / 350) * 100}%`;
            batteryFill.style.width = `${stats.charge}%`;
        }
    }, "living");

    tl.to(image, {
        duration: 4,
        y: "-=20",
        repeat: 1,
        yoyo: true,
        ease: "sine.inOut"
    }, "living");

    tl.to(ring, {
        duration: 4,
        rotation: 360,
        scale: 1.3,
        repeat: 1,
        yoyo: true,
        ease: "none"
    }, "living");

    // Random energy pulses during idle
    tl.to(lines, {
        duration: 1,
        opacity: 0.8,
        drawSVG: "0% 10%",
        stagger: {
            each: 0.2,
            repeat: 3,
            yoyo: true
        },
        ease: "none"
    }, "living");

    // Fluctuate power during idle
    tl.to(stats, {
        power: "+=15",
        duration: 0.5,
        repeat: 10,
        yoyo: true,
        ease: "sine.inOut",
        onUpdate: () => {
            powerValue.textContent = stats.power.toFixed(1);
            powerBar.style.width = `${(stats.power / 350) * 100}%`;
        }
    }, "living+=3");

    // 3. Exit Phase
    tl.to([card, ...statBoxes], {
        duration: 0.8,
        x: (i) => i === 0 ? -100 : 100,
        opacity: 0,
        stagger: 0.1,
        ease: "power3.in"
    });

    tl.to(product, {
        duration: 1,
        scale: 1.5,
        opacity: 0,
        filter: "blur(20px)",
        ease: "power4.in"
    }, "-=0.5");

    tl.to(lines, {
        duration: 0.5,
        opacity: 0,
        drawSVG: "100% 100%",
        ease: "power2.in"
    }, "-=0.8");
}

function startCycle() {
    // Background fade in
    gsap.from("#background", {
        duration: 3,
        scale: 1.1,
        opacity: 0,
        ease: "power2.out"
    });

    gsap.from("header", {
        duration: 1.5,
        y: -50,
        opacity: 0,
        ease: "power3.out",
        delay: 0.5
    });

    gsap.from("#global-footer", {
        duration: 1.5,
        y: 50,
        opacity: 0,
        ease: "power3.out",
        delay: 0.5
    });

    animateCycle(0);
}

window.addEventListener('DOMContentLoaded', loadProducts);
