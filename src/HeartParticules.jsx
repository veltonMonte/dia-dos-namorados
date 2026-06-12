import { useCallback } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function HeartParticles() {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="hearts"
      init={particlesInit}
      options={{
        fullScreen: {
          enable: true,
          zIndex: 0,
        },
        particles: {
          number: {
            value: 30,
          },
          move: {
            enable: true,
            direction: "bottom",
            speed: 2,
          },
          size: {
            value: {
              min: 10,
              max: 20,
            },
          },
          opacity: {
            value: 0.8,
          },
          shape: {
            type: "circle",
          },
        },
      }}
    />
  );
}