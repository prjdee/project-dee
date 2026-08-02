/* --------------------------------------------------
   PROJECT DEE - INTERACTIVE CANVAS BACKGROUND (canvas-effect.js)
   Renders a lightweight soundwave particle visualizer reponsive to mouse
   Optimized for mobile battery saving via IntersectionObserver & throttling.
 -------------------------------------------------- */

(function() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId = null;
    let isVisible = true;

    // Particle settings
    let particles = [];
    let particleCount = window.innerWidth < 768 ? 40 : 100; // Drastically reduce on mobile
    let waveFrequency = 0.005;
    let waveAmplitude = 30;
    let time = 0;

    // Mouse coordinates
    const mouse = {
        x: null,
        y: null,
        radius: window.innerWidth < 768 ? 80 : 150
    };

    // Track mouse movement
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    // Clear mouse position when it leaves the window
    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Resize handler
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particleCount = window.innerWidth < 768 ? 40 : 100;
        mouse.radius = window.innerWidth < 768 ? 80 : 150;
        initParticles();
    }
    
    window.addEventListener('resize', resizeCanvas);

    // Particle Class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            // Place particles in waves along the center vertical area
            this.baseY = canvas.height * 0.5 + (Math.random() - 0.5) * 150;
            this.y = this.baseY;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 0.5 + 0.1;
            this.amplitudeOffset = Math.random() * 100;
            this.waveSpeed = Math.random() * 0.02 + 0.005;
            this.alpha = Math.random() * 0.4 + 0.2;
            // Alternate particle accent colors based on Project Dee logo (Cyan vs Magenta/Red)
            this.color = Math.random() > 0.5 
                ? `rgba(0, 243, 255, ${this.alpha})` // Cyber Cyan
                : `rgba(255, 0, 60, ${this.alpha * 0.7})`; // Neon Red
        }

        update() {
            // Horizontal travel
            this.x += this.speedX;
            if (this.x > canvas.width) {
                this.x = 0;
                this.baseY = canvas.height * 0.5 + (Math.random() - 0.5) * 150;
            }

            // Vertical wave movement (simulating audio frequencies)
            const waveY = Math.sin(this.x * waveFrequency + time + this.amplitudeOffset) * waveAmplitude;
            this.y = this.baseY + waveY;

            // Mouse interaction (repel particles slightly)
            if (mouse.x !== null && mouse.y !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    // Push particles away from mouse
                    this.y += (dy / distance) * force * 50;
                    this.x += (dx / distance) * force * 30;
                }
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    // Initialize particles array
    function initParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    // Drawing connections between close particles to simulate circuit/constellation
    function drawConnections() {
        const maxDist = window.innerWidth < 768 ? 60 : 100;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const dx = particles[a].x - particles[b].x;
                const dy = particles[a].y - particles[b].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDist) {
                    // Set opacity based on distance
                    const alpha = (1 - dist / maxDist) * 0.15;
                    ctx.strokeStyle = `rgba(0, 243, 255, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Animation Loop
    function animate() {
        if (!isVisible) return; // Stop animation completely if not visible

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        time += 0.01;

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Skip connection rendering on mobile to save GPU cycles
        if (window.innerWidth >= 768) {
            drawConnections();
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    // IntersectionObserver to pause animation when Hero is scrolled out of view
    function setupVisibilityObserver() {
        const heroSection = document.getElementById('home');
        if (!heroSection) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
                if (isVisible) {
                    // Resume animation
                    if (!animationFrameId) {
                        animate();
                    }
                } else {
                    // Pause animation
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                        animationFrameId = null;
                    }
                }
            });
        }, { threshold: 0.1 });

        observer.observe(heroSection);
    }

    // Setup and Run
    resizeCanvas();
    setupVisibilityObserver();
    
})();
