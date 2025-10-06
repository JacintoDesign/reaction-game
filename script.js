// Game state management
const GameState = {
    IDLE: 'idle',
    WAITING: 'waiting',
    READY: 'ready',
    COMPLETE: 'complete',
    FALSE_START: 'falseStart'
};

class ReactionTimer {
    constructor() {
        this.state = GameState.IDLE;
        this.startTime = 0;
        this.attempts = [];
        this.timeout = null;
        this.hasPlayedBefore = false;
        
        // Three.js setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.dodecahedron = null;
        this.innerShapes = [];
        this.animationId = null;
        this.glowLight = null;
        
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        const container = document.getElementById('canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // Three.js scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x0F172A, 5, 20);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            50,
            width / height,
            0.1,
            1000
        );
        this.camera.position.z = 6;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Point lights for color
        const pointLight1 = new THREE.PointLight(0x3B82F6, 0.5, 100);
        pointLight1.position.set(2, 2, 2);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0x10B981, 0.3, 100);
        pointLight2.position.set(-2, -2, 2);
        this.scene.add(pointLight2);
        
        // Glow light (for ready state)
        this.glowLight = new THREE.PointLight(0x10B981, 0, 10);
        this.glowLight.position.set(0, 0, 2);
        this.scene.add(this.glowLight);
        
        // Create complex shape - Dodecahedron with inner geometry
        this.createComplexShape();
        
        // Background particles
        this.createBackgroundParticles();
        
        this.animate();
    }
    
    createComplexShape() {
        // Main dodecahedron (12-sided shape)
        const dodecaGeometry = new THREE.DodecahedronGeometry(1.5, 0);
        const dodecaMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x1E293B,
            metalness: 0.4,
            roughness: 0.3,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        this.dodecahedron = new THREE.Mesh(dodecaGeometry, dodecaMaterial);
        this.scene.add(this.dodecahedron);
        
        // Inner icosahedron
        const icoGeometry = new THREE.IcosahedronGeometry(0.8, 0);
        const icoMaterial = new THREE.MeshPhongMaterial({
            color: 0x3B82F6,
            emissive: 0x3B82F6,
            emissiveIntensity: 0.2,
            shininess: 100
        });
        const icosahedron = new THREE.Mesh(icoGeometry, icoMaterial);
        this.innerShapes.push(icosahedron);
        this.scene.add(icosahedron);
        
        // Inner tetrahedron
        const tetraGeometry = new THREE.TetrahedronGeometry(0.5, 0);
        const tetraMaterial = new THREE.MeshPhongMaterial({
            color: 0x10B981,
            emissive: 0x10B981,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.8
        });
        const tetrahedron = new THREE.Mesh(tetraGeometry, tetraMaterial);
        this.innerShapes.push(tetrahedron);
        this.scene.add(tetrahedron);
        
        // Add wireframe overlay for main shape
        const wireframeGeometry = new THREE.WireframeGeometry(dodecaGeometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({
            color: 0x3B82F6,
            transparent: true,
            opacity: 0.3
        });
        const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        this.dodecahedron.add(wireframe);
    }
    
    createBackgroundParticles() {
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 10;
            positions[i + 1] = (Math.random() - 0.5) * 10;
            positions[i + 2] = (Math.random() - 0.5) * 10 - 5;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            color: 0x3B82F6,
            size: 0.02,
            transparent: true,
            opacity: 0.6
        });
        
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(particles);
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Rotate main shape
        if (this.dodecahedron) {
            this.dodecahedron.rotation.x += 0.003;
            this.dodecahedron.rotation.y += 0.005;
            
            // Breathing effect when waiting
            if (this.state === GameState.WAITING) {
                const scale = 1 + Math.sin(Date.now() * 0.002) * 0.05;
                this.dodecahedron.scale.set(scale, scale, scale);
            } else if (this.state === GameState.READY) {
                // Pulsing effect when ready
                const scale = 1 + Math.sin(Date.now() * 0.01) * 0.15;
                this.dodecahedron.scale.set(scale, scale, scale);
                
                // Glow animation
                this.glowLight.intensity = 1 + Math.sin(Date.now() * 0.01) * 0.5;
            } else {
                this.dodecahedron.scale.set(1, 1, 1);
                this.glowLight.intensity = 0;
            }
        }
        
        // Rotate inner shapes at different speeds
        this.innerShapes.forEach((shape, index) => {
            shape.rotation.x += 0.01 * (index + 1);
            shape.rotation.y += 0.008 * (index + 1);
            shape.rotation.z += 0.006 * (index + 1);
        });
        
        this.renderer.render(this.scene, this.camera);
    }
    
    setupEventListeners() {
        // Button controls
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetStats());
        
        // Click controls
        document.getElementById('clickOverlay').addEventListener('click', () => this.handleClick());
        
        // Game box click to start when idle
        document.getElementById('gameBox').addEventListener('click', (e) => {
            if (this.state === GameState.IDLE && !e.target.closest('button')) {
                this.startGame();
            }
        });
        
        // Spacebar control
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.state === GameState.IDLE) {
                    this.startGame();
                } else if (this.state === GameState.WAITING || this.state === GameState.READY) {
                    this.handleClick();
                }
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            const container = document.getElementById('canvas-container');
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }
    
    startGame() {
        if (this.state !== GameState.IDLE && this.state !== GameState.COMPLETE) return;
        
        this.state = GameState.WAITING;
        
        // Hide instructions and start hint
        document.getElementById('instructionsOverlay').style.display = 'none';
        document.getElementById('startHint').style.display = 'none';
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('clickOverlay').classList.add('active');
        document.getElementById('gameBox').className = 'game-box waiting';
        
        // Set shape to waiting color
        this.dodecahedron.material.color.setHex(0xF59E0B);
        this.dodecahedron.material.opacity = 0.8;
        
        // Random delay between 1-5 seconds
        const delay = 1000 + Math.random() * 4000;
        
        this.timeout = setTimeout(() => {
            this.state = GameState.READY;
            this.startTime = performance.now();
            
            document.getElementById('gameBox').className = 'game-box ready';
            
            // Set shape to ready color
            this.dodecahedron.material.color.setHex(0x10B981);
            this.dodecahedron.material.opacity = 0.9;
            
            // Create burst effect
            this.createBurst();
        }, delay);
    }
    
    createBurst() {
        const burstParticles = [];
        for (let i = 0; i < 30; i++) {
            const geometry = new THREE.TetrahedronGeometry(0.05, 0);
            const material = new THREE.MeshBasicMaterial({
                color: 0x10B981,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(geometry, material);
            
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const velocity = {
                x: Math.sin(phi) * Math.cos(theta) * 0.15,
                y: Math.sin(phi) * Math.sin(theta) * 0.15,
                z: Math.cos(phi) * 0.15
            };
            
            particle.userData = { velocity, life: 1 };
            this.scene.add(particle);
            burstParticles.push(particle);
        }
        
        // Animate burst
        const animateBurst = () => {
            let allDead = true;
            burstParticles.forEach(particle => {
                if (particle.userData.life > 0) {
                    allDead = false;
                    particle.position.x += particle.userData.velocity.x;
                    particle.position.y += particle.userData.velocity.y;
                    particle.position.z += particle.userData.velocity.z;
                    particle.userData.life -= 0.015;
                    particle.material.opacity = particle.userData.life;
                    particle.scale.setScalar(particle.userData.life);
                }
            });
            
            if (!allDead) {
                requestAnimationFrame(animateBurst);
            } else {
                burstParticles.forEach(particle => {
                    this.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
            }
        };
        animateBurst();
    }
    
    handleClick() {
        if (this.state === GameState.WAITING) {
            // False start
            this.state = GameState.FALSE_START;
            clearTimeout(this.timeout);
            
            document.getElementById('gameBox').className = 'game-box error';
            this.showErrorMessage();
            
            this.dodecahedron.material.color.setHex(0xEF4444);
            this.dodecahedron.material.opacity = 0.8;
            
            this.endGame();
        } else if (this.state === GameState.READY) {
            // Valid reaction
            const reactionTime = performance.now() - this.startTime;
            this.state = GameState.COMPLETE;
            this.attempts.push(reactionTime);
            
            this.showScore(reactionTime);
            this.updateStats();
            
            document.getElementById('gameBox').className = 'game-box';
            
            this.dodecahedron.material.color.setHex(0x3B82F6);
            this.dodecahedron.material.opacity = 0.7;
            
            this.endGame();
        }
    }
    
    endGame() {
        clearTimeout(this.timeout);
        document.getElementById('clickOverlay').classList.remove('active');
        document.getElementById('startBtn').disabled = false;
        
        setTimeout(() => {
            this.dodecahedron.material.color.setHex(0x1E293B);
            this.dodecahedron.material.opacity = 0.7;
            document.getElementById('gameBox').className = 'game-box idle';
            document.getElementById('errorMessage').classList.remove('visible');
            
            // Only show start hint, never show instructions again after first play
            document.getElementById('startHint').style.display = 'block';
            
            this.state = GameState.IDLE;
        }, 2000);
    }
    
    showErrorMessage() {
        const errorMsg = document.getElementById('errorMessage');
        errorMsg.classList.add('visible');
        
        setTimeout(() => {
            errorMsg.classList.remove('visible');
        }, 2000);
    }
    
    showScore(time) {
        const display = document.getElementById('scoreDisplay');
        const value = document.getElementById('scoreValue');
        const rating = document.getElementById('scoreRating');
        
        const roundedTime = Math.round(time);
        value.textContent = roundedTime + 'ms';
        
        // Determine rating
        let ratingText = '';
        let ratingClass = '';
        
        if (roundedTime < 200) {
            ratingText = '⚡ Amazing!';
            ratingClass = 'amazing';
        } else if (roundedTime < 250) {
            ratingText = '🎯 Very Good';
            ratingClass = 'very-good';
        } else if (roundedTime < 300) {
            ratingText = '✅ Good';
            ratingClass = 'good';
        } else if (roundedTime < 400) {
            ratingText = '👍 Average';
            ratingClass = 'average';
        } else {
            ratingText = '🐌 Below Average';
            ratingClass = 'below-average';
        }
        
        rating.textContent = ratingText;
        rating.className = 'score-rating ' + ratingClass;
        
        display.classList.add('visible');
    }
    
    updateStats() {
        document.getElementById('attempts').textContent = this.attempts.length;
        
        if (this.attempts.length > 0) {
            const best = Math.min(...this.attempts);
            const average = this.attempts.reduce((a, b) => a + b, 0) / this.attempts.length;
            
            document.getElementById('best').textContent = Math.round(best) + 'ms';
            document.getElementById('average').textContent = Math.round(average) + 'ms';
        }
    }
    
    resetStats() {
        this.attempts = [];
        document.getElementById('attempts').textContent = '0';
        document.getElementById('best').textContent = '-';
        document.getElementById('average').textContent = '-';
        document.getElementById('scoreDisplay').classList.remove('visible');
    }
}

// Initialize game
const game = new ReactionTimer();
