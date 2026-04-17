import { ImageResponse } from "next/og";

export const alt = "A Mixtape for you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(120% 80% at 30% 120%, #2b0741 0%, transparent 60%), linear-gradient(180deg, #1a0a2e 0%, #0e0420 100%)",
          fontFamily: "monospace",
          padding: 60,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 24,
            border: "4px solid #ff4fd8",
            borderRadius: 24,
            boxShadow: "0 0 60px rgba(255, 79, 216, 0.6)",
          }}
        />

        <div
          style={{
            width: 820,
            height: 480,
            borderRadius: 28,
            border: "6px solid #ff4fd8",
            background:
              "radial-gradient(120% 80% at 30% 120%, #2b0741 0%, transparent 60%), linear-gradient(180deg, #1a0a2e 0%, #0e0420 100%)",
            boxShadow:
              "0 0 60px rgba(255, 79, 216, 0.6), inset 0 0 40px rgba(255, 79, 216, 0.25)",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: 32,
          }}
        >
          <div
            style={{
              width: "100%",
              height: 44,
              borderRadius: 8,
              display: "flex",
              background:
                "linear-gradient(90deg, #ff4f4f 0 16.66%, #ff9b3d 16.66% 33.33%, #f7d154 33.33% 50%, #29f0c8 50% 66.66%, #4bb3ff 66.66% 83.33%, #a271ff 83.33% 100%)",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              marginTop: 56,
            }}
          >
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  border: "6px solid #ff4fd8",
                  background:
                    "radial-gradient(circle, #ffb3ea 0 22%, #ff7ae5 22% 40%, #2b0741 40% 58%, #0e0420 58% 100%)",
                  boxShadow:
                    "0 0 20px rgba(255, 79, 216, 0.6), inset 0 0 20px rgba(0, 0, 0, 0.55)",
                  display: "flex",
                }}
              />
            ))}
          </div>

          <div
            style={{
              marginTop: "auto",
              background: "#0a0613",
              border: "4px solid #ff4fd8",
              borderRadius: 8,
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#ff7ae5",
              fontSize: 32,
              letterSpacing: 2,
            }}
          >
            <span>♥ POSTCARD REMIX</span>
            <span>SIDE A</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 72,
            fontWeight: 700,
            color: "#fff",
            textShadow: "0 0 20px rgba(255, 79, 216, 0.9)",
            letterSpacing: 2,
            display: "flex",
          }}
        >
          A Mixtape for you
        </div>
      </div>
    ),
    { ...size },
  );
}
