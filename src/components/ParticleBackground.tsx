import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const ParticleBackground = () => {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    if (!init) return <></>;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}>
            <Particles
                id="tsparticles"
                options={{
                    background: { color: { value: "transparent" } },
                    fpsLimit: 60,
                    interactivity: {
                        events: {
                            onHover: { enable: true, mode: "grab" },
                            resize: { enable: true, delay: 0.5 }
                        },
                        modes: {
                            grab: { distance: 160, links: { opacity: 0.5 } }
                        },
                    },
                    particles: {
                        color: { value: "#ffffff" },
                        links: {
                            color: "#ffffff",
                            distance: 180,
                            enable: true,
                            opacity: 0.15,
                            width: 1,
                        },
                        move: {
                            direction: "none",
                            enable: true,
                            outModes: { default: "bounce" },
                            random: true,
                            speed: 0.6,
                            straight: false,
                        },
                        number: { density: { enable: true, width: 800 }, value: 70 },
                        opacity: { value: 0.4 },
                        shape: { type: "circle" },
                        size: { value: { min: 1, max: 2.5 } },
                    },
                    detectRetina: true,
                }}
            />
        </div>
    );
};

export default ParticleBackground;
