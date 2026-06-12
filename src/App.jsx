import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getDiff());
    }, 1000);

    return () => clearInterval(interval);
  }, []);


  return (
    <>
    
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
