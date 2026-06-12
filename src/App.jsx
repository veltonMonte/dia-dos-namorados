import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { loadSlim } from "@tsparticles/slim";

const START_DATE = new Date(2021, 7, 14, 0, 0, 0);

function getDiff() {
  const now = new Date();
  const diffMs = now - START_DATE;

  let years = now.getFullYear() - START_DATE.getFullYear();
  let months = now.getMonth() - START_DATE.getMonth();
  let days = now.getDate() - START_DATE.getDate();
  let hours = now.getHours() - START_DATE.getHours();
  let minutes = now.getMinutes() - START_DATE.getMinutes();
  let seconds = now.getSeconds() - START_DATE.getSeconds();

  if (seconds < 0) {
    seconds += 60;
    minutes--;
  }

  if (minutes < 0) {
    minutes += 60;
    hours--;
  }

  if (hours < 0) {
    hours += 24;
    days--;
  }

  if (days < 0) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalDays: Math.floor(diffMs / 86400000),
  };
}

// particle options moved into component

export default function App() {
  const [time, setTime] = useState(getDiff());
  const [particlesReady, setParticlesReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getDiff());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const particlesInit = useCallback(async (engine) => {
    try {
      await loadSlim(engine);
    } catch (e) {
      // ignore
    }
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    try {
      console.log("tsparticles loaded =>", !!container);
      setParticlesReady(true);
    } catch (e) {
      // ignore
    }
  }, []);

  const heartSvg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
      <path fill='%23ff5a87' d='M12 21s-7.072-4.872-9.192-7.04C-0.6 10.632 1.6 6 6 6c2.2 0 3.6 1.2 4 2 .4-.8 1.8-2 4-2 4.4 0 6.6 4.632 3.192 7.96C19.072 16.128 12 21 12 21z'/>
    </svg>`;
  const heartDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(heartSvg)}`;

  const particlesOptions = {
    // keep canvas above the content so decorative hearts are visible;
    // pointer-events is disabled in CSS so clicks pass through
    fullScreen: { enable: true, zIndex: 20 },
    particles: {
      number: { value: 100, density: { enable: false } },
      color: { value: ["#ff6b8a", "#ff3b7a", "#ff9bb3", "#ffffff"] },
      shape: {
        type: "image",
        image: [{ src: heartDataUrl, width: 48, height: 48 }]
      },
      opacity: { value: 0.95, random: { enable: true, minimumValue: 0.45 }, animation: { enable: false } },
      size: { value: { min: 18, max: 64 }, random: { enable: true, minimumValue: 14 }, animation: { enable: false } },
      move: {
        enable: true,
        direction: "bottom",
        speed: { min: 0.8, max: 2.6 },
        outModes: { default: "out" },
        straight: false,
        random: false
      },
      rotate: { value: { min: 0, max: 360 }, direction: "random", animation: { enable: true, speed: 20 } }
    },
    detectRetina: true
  };

  return (
    <>
      <Particles id="hearts" init={particlesInit} options={particlesOptions} loaded={particlesLoaded} />
      <div className="app-shell" style={{ position: "relative", zIndex: 1 }}>
        <div className="container">
          <h1>Para nós 💗</h1>

          <p className="subtitle">
            Com carinho, amor e gratidão
          </p>

          <div className="photos">
            <img
              src="/photos/WhatsApp_Image_2026-06-12_at_02_04_46.jpeg"
              alt="nós dois"
            />

            <img
              src="/photos/WhatsApp_Image_2026-06-12_at_02_04_45.jpeg"
              alt="nós dois no espelho"
            />
          </div>

          <div className="card">
            <h2>Estamos juntos há...</h2>

            <div className="timer">
              <div className="box">
                <div className="num">{time.years}</div>
                <div className="label">anos</div>
              </div>

              <div className="box">
                <div className="num">{time.months}</div>
                <div className="label">meses</div>
              </div>

              <div className="box">
                <div className="num">{time.days}</div>
                <div className="label">dias</div>
              </div>

              <div className="box">
                <div className="num">{time.hours}</div>
                <div className="label">horas</div>
              </div>

              <div className="box">
                <div className="num">{time.minutes}</div>
                <div className="label">minutos</div>
              </div>

              <div className="box">
                <div className="num">{time.seconds}</div>
                <div className="label">segundos</div>
              </div>
            </div>

            <p
              style={{
                marginTop: "16px",
                textAlign: "center",
                color: "#ffb3c6",
                fontSize: "14px",
              }}
            >
              Desde 14 de agosto de 2021 — são{" "}
              {time.totalDays.toLocaleString("pt-BR")} dias ao seu lado.
            </p>
          </div>

          <div className="card">
            <h2>Uma cartinha pra você</h2>

            <div className="letter">
              <p>
                Obrigado por dividir comigo tantos momentos,
                conversas, sonhos, desafios e alegrias.
              </p>

              <p>
                Cada dia ao seu lado é especial e me faz mais feliz.
              </p>

              <p>Te amo muito 💗</p>
            </div>
          </div>

          <div
            className="card"
            style={{ textAlign: "center" }}
          >
            <h2>Uma música pra você</h2>

            <button
              className="btn-audio"
              onClick={() => navigate("/lyrics")}
            >
              Ouvir "Always" — letra
            </button>
          </div>

          <p className="footer">
            Feito com amor 💗
          </p>
        </div>
      </div>
    </>
  );
}
