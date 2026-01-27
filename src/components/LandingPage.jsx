import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import './LandingPage.css';
import { useNavigate } from 'react-router-dom';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, useGSAP);

const LandingPage = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const generatorRef = useRef(null);
  const animationCleanupRef = useRef([]);
  const isFirstRenderRef = useRef(true);

  // Clean up animations
  useEffect(() => {
    return () => {
      // Kill all GSAP animations
      gsap.globalTimeline.clear();
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      
      // Kill specific animations
      animationCleanupRef.current.forEach(cleanup => cleanup?.());
      animationCleanupRef.current = [];
    };
  }, []);

  // Main GSAP animations with cleanup
  useGSAP(() => {
    if (!isFirstRenderRef.current) return;
    isFirstRenderRef.current = false;

    // Kill existing ScrollTriggers
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());

    // Hero section animations
    const heroAnimations = () => {
      const heroTl = gsap.timeline();
      
      // Ensure elements are visible first
      gsap.set('.hero-title span, .hero-feature-item, .hero-cta', {
        opacity: 1,
        visibility: 'visible'
      });

      // Animate background elements
      heroTl.fromTo('.hero-bg-element', 
        { scale: 0, opacity: 0 },
        { 
          duration: 1.5,
          scale: 1,
          opacity: 0.3,
          stagger: 0.2,
          ease: 'expo.out'
        }
      );

      // Main title animation
      heroTl.fromTo('.hero-title span', 
        { y: 100, opacity: 1 },
        { 
          duration: 1.2,
          y: 0,
          stagger: 0.1,
          ease: 'power3.out'
        },
        '-=1'
      );

      // Feature list animation
      heroTl.fromTo('.hero-feature-item', 
        { x: -50, opacity: 1 },
        { 
          duration: 1,
          x: 0,
          stagger: 0.15,
          ease: 'power3.out'
        },
        '-=0.5'
      );

      // CTA buttons animation
      heroTl.fromTo('.hero-cta', 
        { y: 30, opacity: 1 },
        { 
          duration: 0.8,
          y: 0,
          ease: 'power3.out'
        },
        '-=0.3'
      );

      // Continuous floating animation
      const floatAnim = gsap.to('.floating-element', {
        y: 20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.2
      });

      return () => floatAnim.kill();
    };

    // Parallax effect
    const parallaxAnim = () => {
      const parallax = gsap.to('.parallax-layer', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          id: 'parallax'
        }
      });

      return () => parallax.scrollTrigger?.kill();
    };

    // Why section animations
    const whyAnimations = () => {
      const whyAnim = gsap.from('.why-card', {
        opacity: 1,
        y: 80,
        duration: 1,
        stagger: 0.15,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: '.why-section',
          start: 'top 85%',
          end: 'bottom 15%',
          toggleActions: 'play none none reverse',
          id: 'why-section'
        }
      });

      return () => whyAnim.scrollTrigger?.kill();
    };

    // Timeline steps animation
    const timelineAnimations = () => {
      const steps = gsap.utils.toArray('.timeline-step');
      const stepAnimations = steps.map((step, i) => {
        return gsap.from(step, {
          opacity: 1,
          x: i % 2 === 0 ? -100 : 100,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: step,
            start: 'top 90%',
            end: 'bottom 10%',
            toggleActions: 'play none none reverse',
            id: `step-${i}`
          }
        });
      });

      return () => stepAnimations.forEach(anim => anim.scrollTrigger?.kill());
    };

    // Features grid animation
    const featuresAnimations = () => {
      const featureCards = gsap.utils.toArray('.feature-card');
      
      // Ensure cards are visible
      gsap.set(featureCards, { 
        opacity: 1,
        visibility: 'visible',
        rotationY: 0
      });

      const featuresAnim = gsap.from(featureCards, {
        scale: 0.8,
        opacity: 1,
        duration: 0.8,
        stagger: {
          amount: 0.5,
          grid: 'auto',
          from: 'center'
        },
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.features-section',
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
          id: 'features-section'
        }
      });

      return () => featuresAnim.scrollTrigger?.kill();
    };

    // Password generator showcase
    const generatorAnimations = () => {
      const genTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.generator-section',
          start: 'top 75%',
          end: 'bottom 25%',
          scrub: 1,
          id: 'generator-section'
        }
      });

      genTl.fromTo('.generator-visual', 
        { scale: 0, rotation: -10, opacity: 1 },
        { 
          duration: 1,
          scale: 1,
          rotation: 0,
          ease: 'back.out(1.7)'
        }
      )
      .fromTo('.generator-control', 
        { x: -30, opacity: 1 },
        { 
          duration: 0.5,
          x: 0,
          stagger: 0.1,
          ease: 'power2.out'
        },
        '-=0.5'
      );

      return () => genTl.scrollTrigger?.kill();
    };

    // Trust section animation
    const trustAnimations = () => {
      const trustAnim = gsap.from('.trust-card', {
        opacity: 1,
        y: 50,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.trust-section',
          start: 'top 85%',
          end: 'bottom 15%',
          toggleActions: 'play none none reverse',
          id: 'trust-section'
        }
      });

      return () => trustAnim.scrollTrigger?.kill();
    };

    // Final CTA animation
    const ctaAnimations = () => {
      const ctaAnim = gsap.from('.final-cta', {
        scale: 0.9,
        opacity: 1,
        duration: 1.2,
        ease: 'elastic.out(1, 0.5)',
        scrollTrigger: {
          trigger: '.final-section',
          start: 'top 90%',
          end: 'bottom 10%',
          toggleActions: 'play none none reverse',
          id: 'cta-section'
        }
      });

      return () => ctaAnim.scrollTrigger?.kill();
    };

    // Text reveal animations
    const textRevealAnimations = () => {
      const textElements = gsap.utils.toArray('.reveal-text');
      
      // Ensure text is visible
      gsap.set(textElements, { 
        opacity: 1,
        visibility: 'visible'
      });

      const reveals = textElements.map(text => {
        return gsap.from(text, {
          y: 50,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: text,
            start: 'top 95%',
            end: 'bottom 5%',
            toggleActions: 'play none none reverse',
            id: `text-${Math.random()}`
          }
        });
      });

      return () => reveals.forEach(reveal => reveal.scrollTrigger?.kill());
    };

    // Counter animations
    const counterAnimations = () => {
      const counters = gsap.utils.toArray('.counter');
      
      counters.forEach(counter => {
        const target = +counter.getAttribute('data-target') || 0;
        const duration = 2;
        const step = target / (duration * 60);
        let current = 0;
        let animationId;

        const updateCounter = () => {
          if (current < target) {
            current += step;
            counter.textContent = Math.ceil(current);
            animationId = requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target;
          }
        };

        const scrollTrigger = ScrollTrigger.create({
          trigger: counter,
          start: 'top 90%',
          onEnter: () => updateCounter(),
          once: true,
          id: `counter-${Math.random()}`
        });

        // Store cleanup function
        animationCleanupRef.current.push(() => {
          if (animationId) cancelAnimationFrame(animationId);
          scrollTrigger.kill();
        });
      });
    };

    // Run all animations
    const cleanups = [
      heroAnimations(),
      parallaxAnim(),
      whyAnimations(),
      timelineAnimations(),
      featuresAnimations(),
      generatorAnimations(),
      trustAnimations(),
      ctaAnimations(),
      textRevealAnimations(),
      counterAnimations
    ].filter(Boolean);

    animationCleanupRef.current.push(...cleanups);

    // Refresh ScrollTrigger after all animations are set up
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

  }, { scope: containerRef, dependencies: [] });

  // Interactive password generator
  const [password, setPassword] = React.useState('Tr0ub4d0r&3');
  const [length, setLength] = React.useState(12);
  const [options, setOptions] = React.useState({
    numbers: true,
    symbols: true,
    words: false
  });

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let pool = chars;
    if (options.numbers) pool += numbers;
    if (options.symbols) pool += symbols;
    
    let newPass = '';
    for (let i = 0; i < length; i++) {
      newPass += pool.charAt(Math.floor(Math.random() * pool.length));
    }
    
    setPassword(newPass);
    
    // Animation for password change
    gsap.fromTo('.password-output', 
      { scale: 0.8 },
      { scale: 1, duration: 0.3, ease: 'back.out(1.7)' }
    );
  };

  // Handle hover effects with GSAP to avoid conflicts
  const setupHoverEffects = () => {
    // Feature cards hover
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          scale: 1.05,
          rotationY: 180,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
      
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          scale: 1,
          rotationY: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
    });

    // Why cards hover
    const whyCards = document.querySelectorAll('.why-card');
    whyCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          y: -10,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
      
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          y: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
    });
  };

  useEffect(() => {
    setupHoverEffects();
    
    return () => {
      // Clean up event listeners
      document.querySelectorAll('.feature-card, .why-card').forEach(card => {
        card.replaceWith(card.cloneNode(true));
      });
    };
  }, []);

  return (
    <div className="landing-page" ref={containerRef}>
      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              <span>Secure Your Digital World.</span>
              <span>One Password at a Time.</span>
            </h1>
            
            <div className="hero-features">
              <div className="hero-feature-item floating-element">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <span>Smart password storage</span>
              </div>
              <div className="hero-feature-item floating-element">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.135 17.725 5.57 16 5.126M5 11V9C5 7.135 6.275 5.57 8 5.126M9 5.126C9.31 5.043 9.64 5 10 5H14C14.36 5 14.69 5.043 15 5.126" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span>Master key access protection</span>
              </div>
              <div className="hero-feature-item floating-element">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span>OTP-backed account recovery</span>
              </div>
              <div className="hero-feature-item floating-element">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span>Intelligent password generation</span>
              </div>
            </div>
            
            <div className="hero-cta">
              <button className="btn btn-primary btn-glow" onClick={() => navigate('/register')}>
                <span>Get Started</span>
                <svg className="btn-arrow" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="btn btn-secondary" onClick={() => window.location.href = '#features'}>
                <span>Explore Features</span>
              </button>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="visual-container">
              <div className="password-vault floating-element">
                <div className="vault-header">
                  <div className="vault-title">Secure Vault</div>
                  <div className="vault-status">
                    <div className="status-dot active"></div>
                    <span>Protected</span>
                  </div>
                </div>
                <div className="vault-items">
                  {['google.com', 'github.com', 'stripe.com', 'netflix.com', 'amazon.com'].map((site, i) => (
                    <div className="vault-item" key={i}>
                      <div className="item-icon">{site.charAt(0).toUpperCase()}</div>
                      <div className="item-content">
                        <div className="item-domain">{site}</div>
                        <div className="item-password">••••••••••</div>
                      </div>
                      <button className="item-action">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5C16.477 5 20.268 7.943 21.542 12C20.268 16.057 16.477 19 12 19C7.523 19 3.732 16.057 2.458 12Z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className="hero-background">
          <div className="hero-bg-element circle-1 parallax-layer"></div>
          <div className="hero-bg-element circle-2 parallax-layer"></div>
          <div className="hero-bg-element circle-3 parallax-layer"></div>
          <div className="grid-overlay"></div>
        </div>
      </section>

      {/* Why Section */}
      <section className="why-section" id="features">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title reveal-text">Why Password Security Matters</h2>
            <p className="section-subtitle reveal-text">
              Weak passwords are the #1 cause of data breaches. Here's how we protect you.
            </p>
          </div>
          
          <div className="why-cards">
            <div className="why-card">
              <div className="card-icon">💀</div>
              <h3 className="card-title">Password Reuse Risk</h3>
              <p className="card-text">
                Using the same password everywhere means one breach compromises all your accounts.
              </p>
              <div className="card-stat">
                <span className="counter" data-target="65">76</span>%
                <span className="stat-label">of people reuse passwords</span>
              </div>
            </div>
            
            <div className="why-card">
              <div className="card-icon">⚡</div>
              <h3 className="card-title">Weak Password Vulnerability</h3>
              <p className="card-text">
                Simple passwords can be cracked in seconds by modern brute-force attacks.
              </p>
              <div className="card-stat">
                <span className="counter" data-target="81">45</span>%
                <span className="stat-label">of breaches involve weak passwords</span>
              </div>
            </div>
            
            <div className="why-card">
              <div className="card-icon">🛡️</div>
              <h3 className="card-title">Our Protection Layer</h3>
              <p className="card-text">
                Master key + OTP verification adds military-grade security to your digital life.
              </p>
              <div className="card-stat">
                100%
                <span className="stat-label">encryption guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Timeline */}
      <section className="timeline-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title reveal-text">How It Works</h2>
            <p className="section-subtitle reveal-text">
              Simple steps to ultimate password security
            </p>
          </div>
          
          <div className="timeline">
            {[
              { num: '01', title: 'Sign Up', desc: 'Create your secure account with email verification' },
              { num: '02', title: 'Set Master Key', desc: 'Choose your single, secure master password' },
              { num: '03', title: 'Add Passwords', desc: 'Securely store passwords for all your accounts' },
              { num: '04', title: 'Access Anywhere', desc: 'View/copy passwords with your master key' },
              { num: '05', title: 'Auto Protection', desc: 'Auto-lock after 5 failed attempts' },
              { num: '06', title: 'OTP Recovery', desc: 'Regain access via secure OTP email' }
            ].map((step, index) => (
              <div className="timeline-step" key={index}>
                <div className="step-number">{step.num}</div>
                <div className="step-content">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>
                {index < 5 && <div className="step-connector"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section" ref={featuresRef}>
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title reveal-text">Powerful Security Features</h2>
            <p className="section-subtitle reveal-text">
              Everything you need for complete password protection
            </p>
          </div>
          
          <div className="features-grid">
            {[
              { icon: '🔑', title: 'Master Key Lock', desc: 'One key protects all your passwords' },
              { icon: '🚫', title: 'Auto Lockout', desc: 'Locks after 5 failed attempts' },
              { icon: '📧', title: 'OTP Verification', desc: 'Secure email verification for recovery' },
              { icon: '📊', title: 'Strength Analyzer', desc: 'Real-time password strength checking' },
              { icon: '⚙️', title: 'Smart Generator', desc: 'Customizable password generation' },
              { icon: '⏱️', title: 'Crack Time Estimate', desc: 'See how long passwords would last' },
              { icon: '📋', title: 'Password History', desc: 'Track all generated passwords' },
              { icon: '✏️', title: 'Easy Editing', desc: 'Update stored passwords anytime' }
            ].map((feature, index) => (
              <div className="feature-card" key={index}>
                <div className="card-inner">
                  <div className="card-front">
                    <div className="card-icon">{feature.icon}</div>
                    <h3 className="card-title">{feature.title}</h3>
                    <p className="card-text">{feature.desc}</p>
                  </div>
                  <div className="card-back">
                    <h3>Learn More</h3>
                    <p>Click to discover how this feature protects you</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Password Generator Showcase */}
      <section className="generator-section" ref={generatorRef}>
        <div className="section-container">
          <div className="generator-header">
            <h2 className="section-title reveal-text">Smart Password Generator</h2>
            <p className="section-subtitle reveal-text">
              Create uncrackable passwords in seconds
            </p>
          </div>
          
          <div className="generator-content">
            <div className="generator-visual">
              <div className="generator-output">
                <div className="password-output">{password}</div>
                <div className="password-strength">
                  <div className="strength-indicator">
                    <div className="strength-bar"></div>
                    <div className="strength-label">Very Strong</div>
                  </div>
                  <div className="crack-time">
                    <span className="time-estimate">3 years</span>
                    <span className="time-label">to crack</span>
                  </div>
                </div>
              </div>
              
              <div className="generator-controls">
                <div className="control-group">
                  <label className="control-label">Length: <span className="length-value">{length}</span></label>
                  <input 
                    type="range" 
                    min="8" 
                    max="32" 
                    value={length}
                    onChange={(e) => setLength(parseInt(e.target.value))}
                    className="length-slider"
                  />
                </div>
                
                <div className="generator-options">
                  {['numbers', 'symbols', 'words'].map((option) => (
                    <div className="generator-control" key={option}>
                      <label className="option-toggle">
                        <input 
                          type="checkbox" 
                          checked={options[option]}
                          onChange={() => setOptions(prev => ({...prev, [option]: !prev[option]}))}
                        />
                        <span className="toggle-slider"></span>
                        <span className="option-label">Include {option}</span>
                      </label>
                    </div>
                  ))}
                </div>
                
                <button className="btn btn-generate" onClick={generatePassword}>
                  <span>Generate New</span>
                  <svg viewBox="0 0 24 24" fill="none" style={{height:"23vh"}}>
                    <path d="M20 7H10C6.68629 7 4 9.68629 4 13C4 16.3137 6.68629 19 10 19H20M20 7L16 3M20 7L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="generator-info">
              <h3 className="info-title">Why Generated Passwords Win</h3>
              <ul className="info-list">
                <li>Completely random with no predictable patterns</li>
                <li>Unique for every account you create</li>
                <li>Customizable to meet any site's requirements</li>
                <li>Virtually impossible to guess or brute-force</li>
              </ul>
              <div className="security-badge">
                <div className="badge-icon">🔒</div>
                <div className="badge-text">Military-Grade Encryption</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Privacy */}
      <section className="trust-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title reveal-text">Your Privacy, Guaranteed</h2>
            <p className="section-subtitle reveal-text">
              We're serious about protecting what matters most
            </p>
          </div>
          
          <div className="trust-cards">
            <div className="trust-card">
              <div className="trust-icon">👁️</div>
              <h3 className="trust-title">Zero-Knowledge Design</h3>
              <p className="trust-text">
                We never see your passwords. Your master key stays encrypted on your device.
              </p>
            </div>
            
            <div className="trust-card">
              <div className="trust-icon">📜</div>
              <h3 className="trust-title">Transparent Security</h3>
              <p className="trust-text">
                Open about our practices. Regularly audited by independent security experts.
              </p>
            </div>
            
            <div className="trust-card">
              <div className="trust-icon">🚫</div>
              <h3 className="trust-title">No Data Selling</h3>
              <p className="trust-text">
                We don't track or sell your data. Your privacy is our core principle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-section" id="signup">
        <div className="section-container">
          <div className="final-cta">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Secure Your Digital Life?</h2>
              <p className="cta-subtitle">
                Join thousands who've taken control of their password security
              </p>
              <div className="cta-stats">
                <div className="stat">
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Secure Users</div>
                </div>
                <div className="stat">
                  <div className="stat-number">99.9%</div>
                  <div className="stat-label">Uptime</div>
                </div>
                <div className="stat">
                  <div className="stat-number">24/7</div>
                  <div className="stat-label">Protection</div>
                </div>
              </div>
              <div className="cta-buttons">
                <button className="btn btn-primary btn-large btn-glow" 
                  onClick={() => navigate('/register')}>
                  <span>Sign Up Now</span>
                  <svg className="btn-arrow" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="btn btn-secondary btn-large"
                  onClick={() => window.location.href = '/features'}>
                  <span>Learn More</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="cta-background">
          <div className="cta-wave"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="section-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">PassOP</div>
              <div className="footer-tagline">Your key to digital security</div>
            </div>
            
            <div className="footer-links">
              <a href="/privacy" className="footer-link">Privacy Policy</a>
              <a href="/terms" className="footer-link">Terms of Service</a>
              <a href="/security" className="footer-link">Security</a>
              <a href="/contact" className="footer-link">Contact</a>
              <a href="/support" className="footer-link">Support</a>
            </div>
            
            <div className="footer-copy">
              © 2026 PassOP. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;