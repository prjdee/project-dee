/* --------------------------------------------------
   PROJECT DEE - GLOBAL BLUE ENERGY BEAMS BACKGROUND (global-energy-beams.js)
   Renders a subtle, non-intrusive ambient background animation.
   Enforces pointer-events: none and z-index: 0 to sit strictly behind text.
-------------------------------------------------- */

(function() {
    // Create fixed full-page background canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'global-energy-beams-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none'; // Never block mouse, touch or scroll
    canvas.style.zIndex = '0'; // Placed strictly behind section content layers (z-index: 2)
    canvas.style.opacity = '0.22'; // Soft, subtle background glow
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let time = 0;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initBeams();
    }
    window.addEventListener('resize', resize);

    // Mouse coordinates for gentle dynamic interaction
    const mouse = { x: null, y: null };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    let energyBeams = [];
    let energyParticles = [];

    class EnergyBeam {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * (width + 400) - 200;
            this.width = Math.random() * 100 + 45;
            this.angle = (Math.random() - 0.5) * 0.35 + 0.15;
            this.speedX = (Math.random() * 0.4 + 0.15) * (Math.random() > 0.5 ? 1 : -1);
            this.pulseSpeed = Math.random() * 0.015 + 0.005;
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.baseAlpha = Math.random() * 0.18 + 0.08;
            
            const bluePalettes = [
                { core: 'rgba(0, 243, 255, ', glow: 'rgba(0, 102, 255, ' },
                { core: 'rgba(0, 170, 255, ', glow: 'rgba(0, 80, 230, ' },
                { core: 'rgba(59, 130, 246, ', glow: 'rgba(30, 58, 238, ' },
                { core: 'rgba(160, 230, 255, ', glow: 'rgba(0, 200, 255, ' }
            ];
            this.color = bluePalettes[Math.floor(Math.random() * bluePalettes.length)];
        }

        update() {
            this.x += this.speedX;
            if (this.x < -350 || this.x > width + 350) {
                this.reset();
            }
            this.pulsePhase += this.pulseSpeed;
        }

        draw() {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.translate(this.x, 0);
            ctx.rotate(this.angle);

            const currentAlpha = this.baseAlpha + Math.sin(this.pulsePhase + time * 0.8) * 0.04;

            let mouseBoost = 0;
            if (mouse.x !== null) {
                const dist = Math.abs(this.x - mouse.x);
                if (dist < 250) {
                    mouseBoost = (1 - dist / 250) * 0.06;
                }
            }

            const finalAlpha = Math.max(0.04, Math.min(0.35, currentAlpha + mouseBoost));

            // Outer soft glow
            const auraGradient = ctx.createLinearGradient(-this.width, 0, this.width, height * 1.3);
            auraGradient.addColorStop(0, 'rgba(0, 243, 255, 0)');
            auraGradient.addColorStop(0.2, `${this.color.glow}${finalAlpha * 0.4})`);
            auraGradient.addColorStop(0.7, `${this.color.glow}${finalAlpha * 0.25})`);
            auraGradient.addColorStop(1, 'rgba(0, 102, 255, 0)');

            ctx.fillStyle = auraGradient;
            ctx.fillRect(-this.width, -100, this.width * 2, height + 200);

            // Inner core energy beam
            const coreGradient = ctx.createLinearGradient(-this.width / 2, 0, this.width / 2, height * 1.2);
            coreGradient.addColorStop(0, 'rgba(0, 243, 255, 0)');
            coreGradient.addColorStop(0.15, `${this.color.core}${finalAlpha})`);
            coreGradient.addColorStop(0.65, `${this.color.core}${finalAlpha * 0.6})`);
            coreGradient.addColorStop(1, 'rgba(0, 102, 255, 0)');

            ctx.fillStyle = coreGradient;
            ctx.fillRect(-this.width / 2, -100, this.width, height + 200);

            // Soft core line
            ctx.strokeStyle = `rgba(240, 253, 255, ${finalAlpha * 0.5})`;
            ctx.lineWidth = 0.8;
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.moveTo(0, -100);
            ctx.lineTo(0, height + 200);
            ctx.stroke();

            ctx.restore();
        }
    }

    class EnergyParticle {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * width;
            this.y = initial ? Math.random() * height : height + 20;
            this.size = Math.random() * 1.8 + 0.6;
            this.speedY = -(Math.random() * 0.6 + 0.2);
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.alpha = Math.random() * 0.35 + 0.15;
            this.pulseSpeed = Math.random() * 0.02 + 0.01;
            this.phase = Math.random() * Math.PI * 2;
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.phase) * 0.2;
            this.phase += this.pulseSpeed;

            if (this.y < -20) {
                this.reset();
            }
        }

        draw() {
            const pAlpha = Math.max(0, this.alpha * (0.6 + Math.sin(this.phase) * 0.4));
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 243, 255, ${pAlpha})`;
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 4;
            ctx.fill();
            ctx.restore();
        }
    }

    function initBeams() {
        energyBeams = [];
        energyParticles = [];
        const beamCount = Math.max(5, Math.floor(width / 180));
        for (let i = 0; i < beamCount; i++) {
            energyBeams.push(new EnergyBeam());
        }

        const particleCount = Math.max(20, Math.floor(width / 45));
        for (let i = 0; i < particleCount; i++) {
            energyParticles.push(new EnergyParticle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        time += 0.015;

        energyBeams.forEach(beam => {
            beam.update();
            beam.draw();
        });

        energyParticles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        requestAnimationFrame(animate);
    }

    resize();
    animate();

})();
