import type { ArtShape } from "@/lib/mockData";

export interface ArtworkSVGProps {
  shape: ArtShape;
  stops?: [string, string];
}

/* ── Genesis Bloom — the flagship hero piece ────────────── */
export function GenesisBloom() {
  return (
    <svg viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <radialGradient id="gb-bg"    cx="50%" cy="45%" r="65%">
          <stop offset="0%"   stopColor="#2d0a1e" />
          <stop offset="55%"  stopColor="#1a0930" />
          <stop offset="100%" stopColor="#0d0d18" />
        </radialGradient>
        <radialGradient id="gb-core"  cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#e11d48" stopOpacity="0.45" />
          <stop offset="50%"  stopColor="#9333ea" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#e11d48" stopOpacity="0"    />
        </radialGradient>
        <radialGradient id="gb-glow2" cx="65%" cy="35%" r="45%">
          <stop offset="0%"   stopColor="#c026d3" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#c026d3" stopOpacity="0"    />
        </radialGradient>
        <linearGradient id="gb-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#e11d48" />
          <stop offset="100%" stopColor="#c026d3" />
        </linearGradient>
        <filter id="gb-blur-sm"><feGaussianBlur stdDeviation="3"  /></filter>
        <filter id="gb-blur-lg"><feGaussianBlur stdDeviation="22" /></filter>
      </defs>

      <rect width="480" height="480" fill="url(#gb-bg)" />
      <circle cx="240" cy="220" r="200" fill="url(#gb-core)"  filter="url(#gb-blur-lg)" />
      <circle cx="310" cy="175" r="140" fill="url(#gb-glow2)" filter="url(#gb-blur-lg)" />

      <circle cx="240" cy="240" r="180" fill="none" stroke="#e11d48" strokeWidth="0.5"  opacity="0.08" />
      <circle cx="240" cy="240" r="155" fill="none" stroke="#c026d3" strokeWidth="0.5"  opacity="0.10" />
      <circle cx="240" cy="240" r="130" fill="none" stroke="#e11d48" strokeWidth="0.75" opacity="0.13" />
      <circle cx="240" cy="240" r="105" fill="none" stroke="#c026d3" strokeWidth="1"    opacity="0.16" />
      <circle cx="240" cy="240" r="80"  fill="none" stroke="#e11d48" strokeWidth="1"    opacity="0.20" />

      <line x1="0"   y1="240" x2="480" y2="240" stroke="#e11d48" strokeWidth="0.4" opacity="0.07" />
      <line x1="240" y1="0"   x2="240" y2="480" stroke="#e11d48" strokeWidth="0.4" opacity="0.07" />
      <line x1="0"   y1="0"   x2="480" y2="480" stroke="#c026d3" strokeWidth="0.3" opacity="0.05" />
      <line x1="480" y1="0"   x2="0"   y2="480" stroke="#c026d3" strokeWidth="0.3" opacity="0.05" />

      <polygon points="240,100 380,240 240,380 100,240" fill="rgba(225,29,72,0.04)" stroke="url(#gb-stroke)" strokeWidth="1.5"  opacity="0.55" />
      <polygon points="240,148 332,240 240,332 148,240" fill="rgba(225,29,72,0.07)" stroke="url(#gb-stroke)" strokeWidth="1.25" opacity="0.45" />
      <polygon points="240,192 288,240 240,288 192,240" fill="rgba(225,29,72,0.14)" stroke="url(#gb-stroke)" strokeWidth="1.5"  opacity="0.70" />

      <circle cx="240" cy="240" r="36" fill="rgba(225,29,72,0.22)" filter="url(#gb-blur-sm)" />
      <circle cx="240" cy="240" r="12" fill="#fb7185" filter="url(#gb-blur-sm)" opacity="0.9" />
      <circle cx="240" cy="240" r="5"  fill="#ffffff" opacity="0.95" />
      <circle cx="240" cy="240" r="2"  fill="#ffffff" />

      <circle cx="380" cy="80"  r="2.5" fill="#e11d48" opacity="0.70" />
      <circle cx="405" cy="100" r="1.5" fill="#c026d3" opacity="0.60" />
      <circle cx="365" cy="118" r="1"   fill="#fb7185" opacity="0.50" />
      <circle cx="425" cy="72"  r="1"   fill="#e879f9" opacity="0.45" />
      <circle cx="90"  cy="88"  r="2"   fill="#c026d3" opacity="0.65" />
      <circle cx="68"  cy="112" r="1.5" fill="#e11d48" opacity="0.55" />
      <circle cx="112" cy="70"  r="1"   fill="#fb7185" opacity="0.50" />
      <circle cx="392" cy="388" r="2"   fill="#e11d48" opacity="0.60" />
      <circle cx="415" cy="368" r="1.5" fill="#c026d3" opacity="0.55" />
      <circle cx="372" cy="415" r="1"   fill="#e879f9" opacity="0.50" />
      <circle cx="85"  cy="392" r="2"   fill="#c026d3" opacity="0.60" />
      <circle cx="64"  cy="368" r="1.5" fill="#e11d48" opacity="0.50" />
      <circle cx="108" cy="418" r="1"   fill="#fb7185" opacity="0.45" />
      <circle cx="240" cy="28"  r="2"   fill="#c026d3" opacity="0.50" />
      <circle cx="198" cy="46"  r="1.5" fill="#e11d48" opacity="0.45" />
      <circle cx="282" cy="46"  r="1"   fill="#fb7185" opacity="0.40" />
      <circle cx="450" cy="240" r="2"   fill="#e879f9" opacity="0.50" />
      <circle cx="450" cy="196" r="1.5" fill="#c026d3" opacity="0.40" />
      <circle cx="30"  cy="240" r="2"   fill="#e11d48" opacity="0.50" />
      <circle cx="30"  cy="284" r="1.5" fill="#c026d3" opacity="0.40" />
      <circle cx="240" cy="452" r="1.5" fill="#e11d48" opacity="0.45" />
      <circle cx="308" cy="440" r="1"   fill="#c026d3" opacity="0.40" />
    </svg>
  );
}

/* ── Generic abstract art — 8 shape variants ────────────── */
function AbstractArt({ id, stops, shape }: {
  id:    string;
  stops: [string, string];
  shape: Exclude<ArtShape, "genesis">;
}) {
  const [c1, c2] = stops;

  const shapeContent: Record<string, React.ReactNode> = {
    hex: (
      <>
        <polygon points="200,60 340,60 420,200 340,340 200,340 120,200" fill="none" stroke={`url(#s-${id})`} strokeWidth="1.5" opacity="0.5" />
        <polygon points="200,110 300,110 360,200 300,290 200,290 140,200" fill="none" stroke={`url(#s-${id})`} strokeWidth="1" opacity="0.4" />
        <polygon points="200,155 265,155 300,200 265,245 200,245 165,200" fill={`url(#s-${id})`} fillOpacity="0.15" stroke={`url(#s-${id})`} strokeWidth="1.5" opacity="0.7" />
        <circle cx="200" cy="200" r="18" fill={c1} opacity="0.7" filter={`url(#f-${id})`} />
        <circle cx="200" cy="200" r="7"  fill="#fff" opacity="0.92" />
      </>
    ),
    grid: (
      <>
        {[40,80,120,160,200,240,280,320,360].map(v=>(
          <g key={v}>
            <line x1={v} y1="0"   x2={v} y2="400" stroke={c1} strokeWidth="0.5" opacity="0.12"/>
            <line x1="0" y1={v}   x2="400" y2={v} stroke={c2} strokeWidth="0.5" opacity="0.12"/>
          </g>
        ))}
        <circle cx="200" cy="200" r="90" fill="none" stroke={`url(#s-${id})`} strokeWidth="1.5" opacity="0.4"/>
        <circle cx="200" cy="200" r="55" fill="none" stroke={`url(#s-${id})`} strokeWidth="1"   opacity="0.5"/>
        <circle cx="200" cy="200" r="24" fill={`url(#s-${id})`} fillOpacity="0.3" stroke={`url(#s-${id})`} strokeWidth="2" opacity="0.8"/>
        <circle cx="200" cy="200" r="8"  fill="#fff" opacity="0.95"/>
      </>
    ),
    wave: (
      <>
        <path d="M0,100 Q100,40 200,100 T400,100"  fill="none" stroke={c1} strokeWidth="1.5" opacity="0.3"/>
        <path d="M0,150 Q100,90 200,150 T400,150"  fill="none" stroke={c2} strokeWidth="1.5" opacity="0.4"/>
        <path d="M0,200 Q100,140 200,200 T400,200" fill="none" stroke={c1} strokeWidth="2"   opacity="0.5"/>
        <path d="M0,250 Q100,190 200,250 T400,250" fill="none" stroke={c2} strokeWidth="1.5" opacity="0.4"/>
        <path d="M0,300 Q100,240 200,300 T400,300" fill="none" stroke={c1} strokeWidth="1"   opacity="0.3"/>
        <circle cx="200" cy="200" r="40" fill={`url(#s-${id})`} fillOpacity="0.2" filter={`url(#f-${id})`}/>
        <circle cx="200" cy="200" r="6"  fill="#fff" opacity="0.95"/>
      </>
    ),
    burst: (
      <>
        {Array.from({length:12},(_,i)=>{
          const a=(i*30*Math.PI)/180;
          return <line key={i} x1="200" y1="200" x2={200+Math.cos(a)*160} y2={200+Math.sin(a)*160} stroke={i%2?c1:c2} strokeWidth="0.75" opacity="0.25"/>;
        })}
        <circle cx="200" cy="200" r="110" fill="none" stroke={`url(#s-${id})`} strokeWidth="1" opacity="0.3"/>
        <circle cx="200" cy="200" r="70"  fill="none" stroke={`url(#s-${id})`} strokeWidth="1" opacity="0.4"/>
        <circle cx="200" cy="200" r="35"  fill={`url(#s-${id})`} fillOpacity="0.25" stroke={`url(#s-${id})`} strokeWidth="2" opacity="0.7"/>
        <circle cx="200" cy="200" r="10"  fill={c1} filter={`url(#f-${id})`} opacity="0.9"/>
        <circle cx="200" cy="200" r="4"   fill="#fff" opacity="0.95"/>
      </>
    ),
    circuit: (
      <>
        <rect x="60"  y="60"  width="280" height="280" rx="8" fill="none" stroke={c1} strokeWidth="0.75" opacity="0.2"/>
        <rect x="100" y="100" width="200" height="200" rx="6" fill="none" stroke={c2} strokeWidth="0.75" opacity="0.25"/>
        <line x1="60"  y1="200" x2="130" y2="200" stroke={c1} strokeWidth="1" opacity="0.35"/>
        <line x1="270" y1="200" x2="340" y2="200" stroke={c1} strokeWidth="1" opacity="0.35"/>
        <line x1="200" y1="60"  x2="200" y2="130" stroke={c2} strokeWidth="1" opacity="0.35"/>
        <line x1="200" y1="270" x2="200" y2="340" stroke={c2} strokeWidth="1" opacity="0.35"/>
        <rect x="140" y="140" width="120" height="120" rx="4" fill={`url(#s-${id})`} fillOpacity="0.12" stroke={`url(#s-${id})`} strokeWidth="1.5" opacity="0.6"/>
        <circle cx="200" cy="200" r="22" fill={c1} filter={`url(#f-${id})`} opacity="0.6"/>
        <circle cx="200" cy="200" r="8"  fill="#fff" opacity="0.95"/>
        {[{x:130,y:200},{x:270,y:200},{x:200,y:130},{x:200,y:270}].map((p,i)=>(
          <circle key={i} cx={p.x} cy={p.y} r="5" fill={i%2?c1:c2} opacity="0.7"/>
        ))}
      </>
    ),
    orbit: (
      <>
        <ellipse cx="200" cy="200" rx="160" ry="60" fill="none" stroke={c1} strokeWidth="1" opacity="0.25" transform="rotate(-30 200 200)"/>
        <ellipse cx="200" cy="200" rx="140" ry="55" fill="none" stroke={c2} strokeWidth="1" opacity="0.25" transform="rotate(30 200 200)"/>
        <ellipse cx="200" cy="200" rx="120" ry="45" fill="none" stroke={c1} strokeWidth="1" opacity="0.3"  transform="rotate(90 200 200)"/>
        <circle cx="200" cy="200" r="50" fill={`url(#s-${id})`} fillOpacity="0.2" stroke={`url(#s-${id})`} strokeWidth="1.5" opacity="0.6"/>
        <circle cx="200" cy="200" r="22" fill={c1} filter={`url(#f-${id})`} opacity="0.5"/>
        <circle cx="200" cy="200" r="9"  fill="#fff" opacity="0.95"/>
        <circle cx="346" cy="218" r="7"  fill={c1} opacity="0.8"/>
        <circle cx="228" cy="57"  r="5"  fill={c2} opacity="0.7"/>
        <circle cx="60"  cy="182" r="4"  fill={c1} opacity="0.6"/>
      </>
    ),
    prism: (
      <>
        <polygon points="200,40 370,320 30,320"    fill="none" stroke={`url(#s-${id})`} strokeWidth="1.5" opacity="0.45"/>
        <polygon points="200,90 320,295 80,295"    fill="none" stroke={`url(#s-${id})`} strokeWidth="1"   opacity="0.35"/>
        <polygon points="200,140 270,270 130,270"  fill={`url(#s-${id})`} fillOpacity="0.12" stroke={`url(#s-${id})`} strokeWidth="1.5" opacity="0.7"/>
        <line x1="200" y1="40"  x2="200" y2="320" stroke={c2} strokeWidth="0.75" opacity="0.2"/>
        <line x1="200" y1="40"  x2="30"  y2="320" stroke={c1} strokeWidth="0.75" opacity="0.2"/>
        <line x1="200" y1="40"  x2="370" y2="320" stroke={c2} strokeWidth="0.75" opacity="0.2"/>
        <circle cx="200" cy="200" r="20" fill={c1} filter={`url(#f-${id})`} opacity="0.7"/>
        <circle cx="200" cy="200" r="6"  fill="#fff" opacity="0.95"/>
      </>
    ),
    plasma: (
      <>
        <circle cx="200" cy="200" r="130" fill="none" stroke={c1} strokeWidth="1" opacity="0.2"/>
        <circle cx="160" cy="170" r="80"  fill={c1} fillOpacity="0.12" filter={`url(#f-${id})`}/>
        <circle cx="240" cy="230" r="80"  fill={c2} fillOpacity="0.12" filter={`url(#f-${id})`}/>
        <circle cx="200" cy="200" r="90"  fill="none" stroke={`url(#s-${id})`} strokeWidth="2" opacity="0.4" strokeDasharray="8 6"/>
        <circle cx="200" cy="200" r="55"  fill="none" stroke={`url(#s-${id})`} strokeWidth="1.5" opacity="0.5"/>
        <circle cx="200" cy="200" r="25"  fill={`url(#s-${id})`} fillOpacity="0.3" stroke={`url(#s-${id})`} strokeWidth="2" opacity="0.8"/>
        <circle cx="200" cy="200" r="8"   fill="#fff" opacity="0.95"/>
      </>
    ),
  };

  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%", height:"100%", display:"block" }}>
      <defs>
        <radialGradient id={`bg-${id}`} cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stopColor={c1} stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#0d0d18"/>
        </radialGradient>
        <linearGradient id={`s-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={c1}/>
          <stop offset="100%" stopColor={c2}/>
        </linearGradient>
        <filter id={`f-${id}`}><feGaussianBlur stdDeviation="12"/></filter>
      </defs>
      <rect width="400" height="400" fill={`url(#bg-${id})`}/>
      <circle cx="200" cy="200" r="180" fill={c1} fillOpacity="0.06" filter={`url(#f-${id})`}/>
      {shapeContent[shape]}
    </svg>
  );
}

/* ── Public component ────────────────────────────────────── */
export default function ArtworkSVG({ shape, stops = ["#e11d48", "#c026d3"] }: ArtworkSVGProps) {
  if (shape === "genesis") return <GenesisBloom />;
  return <AbstractArt id={shape} stops={stops} shape={shape} />;
}
