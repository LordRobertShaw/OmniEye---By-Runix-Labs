import React, { useState } from "react";
import { 
  Eye, 
  Cpu, 
  Sparkles, 
  Download, 
  Sliders, 
  RefreshCw, 
  Shield, 
  Zap, 
  Copy, 
  Check, 
  Settings, 
  Compass, 
  Gauge,
  Layers,
  Megaphone,
  Award,
  FileText,
  Palette,
  Tv,
  ExternalLink,
  ShieldAlert
} from "lucide-react";

interface LogoVariation {
  id: string;
  name: string;
  codename: string;
  themeColor: string;
  accentColor: string;
  description: string;
  conceptNotes: string;
  alchemicalFormula: string;
}

export default function OmniBrandLogoLaboratory() {
  const [activeTab, setActiveTab] = useState<string>("concept-4"); // Default to the newly uploaded sovereign brand mark
  const [pulseSpeed, setPulseSpeed] = useState<number>(3); // seconds for one pulse
  const [rotationSpeed, setRotationSpeed] = useState<number>(12); // seconds for full spin
  const [showCircuitOverlays, setShowCircuitOverlays] = useState<boolean>(true);
  const [showRuneGlow, setShowRuneGlow] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [ecoMode, setEcoMode] = useState<boolean>(false);
  
  // Marketing & Advertising Schema active scenarios and copy clip states
  const [activeMediaTab, setActiveMediaTab] = useState<string>("hero");
  const [copiedMarketingText, setCopiedMarketingText] = useState<string | null>(null);

  const variations: LogoVariation[] = [
    {
      id: "concept-1",
      name: "Variation I: The Ra-Nexus Eye",
      codename: "HORUS-CYBERNETIC.EXE",
      themeColor: "#fbbf24", // Gold
      accentColor: "#06b6d4", // Cyan
      description: "A high-fidelity fusion of the ancient Egyptian Eye of Horus with hyper-conductive cybernetic circuitry. Featuring concentric alchemical rings etched with digital hieroglyphics that continuously synchronize to route system data packages securely.",
      conceptNotes: "Symbolizes all-seeing diagnostic intelligence, continuous uptime, and divine protective cryptography. Perfect as a master branding mark for Omni's security, routing, and cloud-computing infrastructure layers.",
      alchemicalFormula: "👁️ + ⚡ + 𓁹 + ⌬ = OMNI-SECURE"
    },
    {
      id: "concept-2",
      name: "Variation II: The Aether-Core Pyramid",
      codename: "PYRAMID-QUANTUM.ALCH",
      themeColor: "#ec4899", // Neon Pink
      accentColor: "#f59e0b", // Amber
      description: "An obsidian and gold wireframe prism representing the primordial Mound of Creation (Benben). An all-seeing core floats inside an illuminated capstone, projecting an active quantum network-state monitoring beam over rotating sacred geometry rings.",
      conceptNotes: "Symbolizes structural scaling integrity, absolute power distribution, and multi-dimensional analytics. Best suited as the flagship logo for Omni Network Management dashboards.",
      alchemicalFormula: "▲ + 𓆃 + ⚛️ + ☤ = OMNI-STATE"
    },
    {
      id: "concept-3",
      name: "Variation III: The Solaris-Prime Chrono-Seal",
      codename: "KHEPRI-CHRONO.SYS",
      themeColor: "#8b5cf6", // Purple
      accentColor: "#10b981", // Emerald
      description: "An advanced mystical alchemical seal inspired by the winged scarab (rebirth/creation) and mechanical camera iris blades. When fully activated, it reveals an infinite glowing singularity core wrapped in ancient chemical circuit equations.",
      conceptNotes: "Symbolizes automated recovery, continuous microservice rebirth, and self-healing system optimization. Ideal for Omni's auto-failover, backup systems, and optimization runbooks.",
      alchemicalFormula: "𓆣 + ⚙️ + ❂ + ⎔ = OMNI-OPTIMIZE"
    },
    {
      id: "concept-4",
      name: "Variation IV: The Omni Sovereign Destiny Seal",
      codename: "SOVEREIGN-DESTINY.CORE",
      themeColor: "#c084fc", // Light Purple
      accentColor: "#f472b6", // Nebula Pink
      description: "The ultimate alchemical sovereign seal. Centered around a hyper-conductive obsidian Eye of Destiny looking through an active celestial stardust portal, framed by a heavy golden pyramid, intersecting cosmic orbits, and sacred cybernetic runes.",
      conceptNotes: "The master brand mark representing the ultimate synthesis of Omni's security, networking, and intelligence systems. Serves as the high-impact banner icon for executive marketing, premium software distribution, and secure hardware seals.",
      alchemicalFormula: "👁️ + 🜏 + ⌬ + 🌌 = OMNI-SOVEREIGN"
    }
  ];

  const currentVar = variations.find((v) => v.id === activeTab) || variations[0];

  // Marketing Slogans map for each brand mark
  const marketingCopyMap: Record<string, { slogans: string[]; socialBio: string; adHeadline: string; emailSubject: string; emailBody: string }> = {
    "concept-1": {
      slogans: [
        "SECURE THE FLOW. RULE THE SPECTRUM.",
        "ALL-SEEING NETWORKING FOR HYPER-SCALE INFRASTRUCTURE.",
        "THE RA-NEXUS EYE: DEFENSIVE CRYPTOGRAPHY BY DIVINE RIGHT."
      ],
      socialBio: "Omni Ra-Nexus is the industry's premier self-healing, zero-trust routing network. Fusing ancient security paradigms with hyper-conductive quantum wireframes. 👁️⚡",
      adHeadline: "The All-Seeing Diagnostic Guard Your Network Deserves.",
      emailSubject: "⚡ Security Upgrade Activated: Meet the Ra-Nexus Core Router Protocol",
      emailBody: "Dear Operator,\n\nWe have successfully initialized the Ra-Nexus Eye diagnostic subsystem over your distributed endpoints. Featuring concentric alchemical rings etched with digital hieroglyphics, your routing layers are now protected by divine cryptography and 100% active routing uptime.\n\nVerify Handshake Now.\n\nSovereign Regards,\nThe Omni Network Core."
    },
    "concept-2": {
      slogans: [
        "BENBEN QUANTUM STATE: ABSOLUTE ANALYTICS.",
        "DISTRIBUTE POWER. STRUCTURAL SCALING INTEGRITY.",
        "THE FLOATING CAPSTONE: UNBIASED CLOUD DOMINANCE."
      ],
      socialBio: "Observing multi-dimensional state telemetry via advanced Aether-Core Pyramids. Continuous structural scaling for distributed enterprise databases. ⌬▲",
      adHeadline: "Sovereign Network Orchestration. Floor to Capstone.",
      emailSubject: "▲ Benben Architecture Online: Initialize Scaling Clusters Now",
      emailBody: "Greetings Administrator,\n\nThe Aether-Core Pyramid has reached peak alignment. Your local cluster has successfully merged with Benben's distributed ledger, providing zero-latency state synchronization across all geographic grids.\n\nView Your Fleet Diagnostics.\n\nSovereign Regards,\nThe Omni Network Core."
    },
    "concept-3": {
      slogans: [
        "KHEPRI AUTOMATED REBIRTH: FAILURE IS EPHEMERAL.",
        "SELF-HEALING MICROSERVICES. INFINITE FAILOVER.",
        "THE CHRONO-SEAL IRIS: TIME-DILATED DATA ENVELOPE."
      ],
      socialBio: "Automated failure recovery, continuous container rebirth, and self-healing systems modeled after the infinite solar cycles of the Solaris Scarab. 𓆣⚙️",
      adHeadline: "Your Infrastructure. Reborn Automatically in 30ms.",
      emailSubject: "𓆣 Solaris FAILOVER Restored: Automated Container Rebirth Complete",
      emailBody: "Attention System Engineer,\n\nA failover event was detected on Subnet-3. Solaris-Prime Chrono-Seal immediately engaged mechanical camera iris blades to quarantine the leaking node, and safely birthed an identical replacement microservice within 30 milliseconds.\n\nAudit Recovery Logs.\n\nSovereign Regards,\nThe Omni Network Core."
    },
    "concept-4": {
      slogans: [
        "THE EYE OF DESTINY: ABSOLUTE SOVEREIGN CRYPTOGRAPHY.",
        "UNIFIED PORTAL SYNTHESIS. NETWORK EXCELLENCE GUARANTEED.",
        "SOVEREIGN COVENANT: ONE EMBLEM TO SECURE THE CONDUIT."
      ],
      socialBio: "The master brand mark of Omni's executive tier. Bringing a hyper-conductive, galaxy-backed obsidian seal to enterprise firewalls, quantum routes, and military-grade hardware seals. 🌌👁️",
      adHeadline: "The Crown Jewel of Zero-Trust Enterprise Security Systems.",
      emailSubject: "🌌 Sovereign Seal Deployed: Absolute Network Dominance Achieved",
      emailBody: "Salutations Executive,\n\nWe are proud to confirm the successful laser-engraving and cryptographic binding of the Omni Sovereign Destiny Seal across your hardware inventory. Featuring high-contrast cosmic nebula starfields and dual alchemical anchor wings, your conduit is now certified tamper-proof at the physical and digital levels.\n\nUnlock Executive Dashboard.\n\nSovereign Regards,\nThe Omni Sovereign Council."
    }
  };

  const marketingCopy = marketingCopyMap[currentVar.id] || marketingCopyMap["concept-4"];

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMarketingText(label);
    setTimeout(() => setCopiedMarketingText(null), 2000);
  };

  // Helper to copy raw SVG string to clipboard
  const handleCopySVG = () => {
    const svgElement = document.getElementById(`svg-render-${activeTab}`);
    if (svgElement) {
      const svgOuterHtml = svgElement.outerHTML;
      navigator.clipboard.writeText(svgOuterHtml);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // Helper to download SVG file
  const handleDownloadSVG = () => {
    const svgElement = document.getElementById(`svg-render-${activeTab}`);
    if (svgElement) {
      const svgOuterHtml = svgElement.outerHTML;
      const blob = new Blob([svgOuterHtml], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `omni_master_logo_${activeTab}_brand.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="col-span-1 md:col-span-2 bg-[#0b0b0b] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-6">
      
      {/* Decorative ambient alchemical glow in background */}
      <div 
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[120px] opacity-10 transition-colors duration-700 pointer-events-none"
        style={{ backgroundColor: currentVar.themeColor }}
      />
      <div 
        className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-[120px] opacity-5 transition-colors duration-700 pointer-events-none"
        style={{ backgroundColor: currentVar.accentColor }}
      />

      {/* Header with Title and Egyptian Alchemical Theme */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono uppercase tracking-widest font-bold">
              Brand Catalyst
            </span>
            <span className="text-gray-500 font-mono text-[9px]">v2.5 // SECURE BLUEPRINT</span>
          </div>
          <h2 className="text-base md:text-xl font-black text-white uppercase tracking-wider font-sans mt-1 flex items-center gap-2">
            <Compass className="h-5 w-5 text-amber-400 animate-spin-slow" />
            OMNI Master Logo & Alchemy Laboratory
          </h2>
          <p className="text-[11px] text-gray-500 font-mono uppercase mt-0.5">
            Designing cybernetic-mystical brand artifacts for the complete Omni product fleet
          </p>
        </div>

        {/* Tab Selection Switchers */}
        <div className="flex flex-wrap gap-1 bg-black/60 p-1 rounded-xl border border-white/5 w-full md:w-auto">
          {variations.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                setActiveTab(v.id);
                setCopiedCode(false);
              }}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                activeTab === v.id
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {v.id === "concept-1" ? "I. Ra-Nexus" : v.id === "concept-2" ? "II. Aether-Core" : v.id === "concept-3" ? "III. Solaris-Prime" : "IV. Sovereign-Seal"}
            </button>
          ))}
        </div>
      </div>

      {/* Central Interface: Screen split between SVG Interactive Viewport and Control Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: The Interactive Live SVG Render Canvas */}
        <div className="lg:col-span-7 bg-[#060606] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[380px] group shadow-inner">
          
          {/* Subtle grid backing for alchemical blueprint vibes */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#111111_1px,transparent_1px),linear-gradient(to_bottom,#111111_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-45 rounded-2xl" />
          
          {/* Diagnostic Corner Lines for sci-fi look */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/10 group-hover:border-amber-500/30 transition-colors" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/10 group-hover:border-amber-500/30 transition-colors" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/10 group-hover:border-amber-500/30 transition-colors" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/10 group-hover:border-amber-500/30 transition-colors" />

          {/* Current Tech Details Tag */}
          <div className="absolute top-4 left-10 text-[8px] font-mono text-gray-500 uppercase flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>Active Vector Rendering: {currentVar.codename}</span>
          </div>

          <div className="absolute bottom-4 left-10 text-[8px] font-mono text-gray-600 uppercase">
            SVG Vector Core // Auto-Responsive Dimensions
          </div>

          {/* Static, GPU-Accelerated Circular Ambient Glow (Smoothly composites on GPU) */}
          <div 
            className="absolute inset-16 rounded-full blur-[45px] pointer-events-none transition-all duration-700"
            style={{ 
              background: `radial-gradient(circle, ${currentVar.themeColor} 0%, ${currentVar.accentColor} 100%)`,
              opacity: ecoMode ? 0.05 : 0.18
            }}
          />

          {/* Render Area with CSS-Variable-based rotation & pulse timings */}
          <div className="relative w-72 h-72 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            
            {/* VARIATION I: THE RA-NEXUS EYE */}
            {activeTab === "concept-1" && (
              <svg
                id="svg-render-concept-1"
                viewBox="0 0 300 300"
                className="w-full h-full select-none"
              >
                <defs>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#67e8f9" />
                    <stop offset="100%" stopColor="#0891b2" />
                  </linearGradient>
                  <linearGradient id="darkMetal" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#262626" />
                    <stop offset="100%" stopColor="#171717" />
                  </linearGradient>
                </defs>

                {/* Outer Alchemical Circle */}
                <circle
                  cx="150"
                  cy="150"
                  r="135"
                  fill="none"
                  stroke="url(#goldGrad)"
                  strokeWidth="2"
                  strokeDasharray="12, 6, 4, 6"
                  className="origin-center"
                  style={{
                    animation: ecoMode ? "none" : `spin-clockwise ${rotationSpeed}s linear infinite`
                  }}
                />

                {/* Inner Hieroglyphic Ring */}
                <circle
                  cx="150"
                  cy="150"
                  r="118"
                  fill="none"
                  stroke="url(#cyanGrad)"
                  strokeWidth="1.5"
                  strokeDasharray="30, 10, 5, 10"
                  className="origin-center"
                  style={{
                    animation: ecoMode ? "none" : `spin-counter ${rotationSpeed * 0.75}s linear infinite`,
                    opacity: showCircuitOverlays ? 0.8 : 0.3
                  }}
                />

                {/* Cybernetic Nodes connection path */}
                {showCircuitOverlays && (
                  <g stroke="#0891b2" strokeWidth="0.75" fill="none" opacity="0.65">
                    <line x1="150" y1="15" x2="150" y2="40" strokeDasharray="3,3" />
                    <line x1="150" y1="260" x2="150" y2="285" strokeDasharray="3,3" />
                    <line x1="15" y1="150" x2="40" y2="150" strokeDasharray="3,3" />
                    <line x1="260" y1="150" x2="285" y2="150" strokeDasharray="3,3" />
                    {/* diagonal tech web lines */}
                    <path d="M 60,60 L 95,95 M 240,60 L 205,95 M 60,240 L 95,205 M 240,240 L 205,205" />
                    <circle cx="95" cy="95" r="2.5" fill="#67e8f9" />
                    <circle cx="205" cy="95" r="2.5" fill="#67e8f9" />
                    <circle cx="95" cy="205" r="2.5" fill="#67e8f9" />
                    <circle cx="205" cy="205" r="2.5" fill="#67e8f9" />
                  </g>
                )}

                {/* Sacred Geometry Triangles */}
                <polygon
                  points="150,45 241,202 59,202"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="0.75"
                  opacity="0.3"
                />
                <polygon
                  points="150,255 59,98 241,98"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="0.75"
                  opacity="0.3"
                />

                {/* THE EYE OF HORUS MAIN BODY */}
                <g transform="translate(0, -5)" className="origin-center">
                  
                  {/* Outer shadow backing */}
                  <path
                    d="M 60,155 C 90,105 210,105 240,155 C 210,205 90,205 60,155 Z"
                    fill="#101010"
                    opacity="0.9"
                  />

                  {/* Main Eye Arch */}
                  <path
                    d="M 55,155 C 90,95 210,95 245,155"
                    fill="none"
                    stroke="url(#goldGrad)"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />

                  {/* Bottom Arch */}
                  <path
                    d="M 55,155 C 100,195 200,195 245,155"
                    fill="none"
                    stroke="url(#goldGrad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  {/* Horus Tear Drop (Falcon Markings - Egyptian Detail) */}
                  <path
                    d="M 95,172 C 90,205 102,230 115,238 C 117,215 110,190 102,174"
                    fill="url(#goldGrad)"
                  />

                  {/* Horus Spiral (Tail of Falcon - Symbol of Royal Power) */}
                  <path
                    d="M 175,174 C 185,190 205,205 212,192 C 218,180 185,172 178,198 C 172,215 190,225 202,228"
                    fill="none"
                    stroke="url(#goldGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Eyelid cybernetic sub-segment */}
                  {showCircuitOverlays && (
                    <path
                      d="M 80,128 C 115,115 185,115 220,128"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="1.5"
                      strokeDasharray="4, 3"
                    />
                  )}

                  {/* Glowing central Iris ring */}
                  <circle
                    cx="150"
                    cy="150"
                    r="34"
                    fill="url(#darkMetal)"
                    stroke="url(#goldGrad)"
                    strokeWidth="3"
                  />

                  {/* Quantum core Cyber Pupil */}
                  <circle
                    cx="150"
                    cy="150"
                    r="20"
                    fill="url(#cyanGrad)"
                    className="origin-center"
                    style={{
                      animation: showRuneGlow && !ecoMode ? `pulse-scale ${pulseSpeed}s ease-in-out infinite` : "none"
                    }}
                  />

                  {/* Pupil Inner lens reflection reflection */}
                  <circle
                    cx="144"
                    cy="144"
                    r="4"
                    fill="#ffffff"
                    opacity="0.8"
                  />

                  {/* Micro circuit rays inside iris */}
                  {showCircuitOverlays && (
                    <g stroke="#67e8f9" strokeWidth="1" opacity="0.8">
                      <line x1="150" y1="116" x2="150" y2="124" />
                      <line x1="150" y1="176" x2="150" y2="184" />
                      <line x1="116" y1="150" x2="124" y2="150" />
                      <line x1="176" y1="150" x2="184" y2="150" />
                    </g>
                  )}
                </g>
              </svg>
            )}

            {/* VARIATION II: THE AETHER-CORE PYRAMID */}
            {activeTab === "concept-2" && (
              <svg
                id="svg-render-concept-2"
                viewBox="0 0 300 300"
                className="w-full h-full select-none"
              >
                <defs>
                  <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#be185d" />
                  </linearGradient>
                  <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <radialGradient id="beamGrad" cx="50%" cy="0%" r="100%">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Laser scan grid projection from capstone */}
                {showCircuitOverlays && (
                  <polygon
                    points="150,75 30,260 270,260"
                    fill="url(#beamGrad)"
                    className="origin-top"
                    style={{
                      animation: ecoMode ? "none" : `laser-sweep ${pulseSpeed * 2}s ease-in-out infinite`
                    }}
                  />
                )}

                {/* Outer sacred Metatron-inspired rings */}
                <circle
                  cx="150"
                  cy="165"
                  r="125"
                  fill="none"
                  stroke="url(#amberGrad)"
                  strokeWidth="1.5"
                  strokeDasharray="4, 15, 4, 15"
                  className="origin-center"
                  style={{
                    animation: ecoMode ? "none" : `spin-clockwise ${rotationSpeed * 1.5}s linear infinite`
                  }}
                />

                <circle
                  cx="150"
                  cy="165"
                  r="110"
                  fill="none"
                  stroke="url(#pinkGrad)"
                  strokeWidth="1"
                  strokeDasharray="40, 5"
                  className="origin-center"
                  style={{
                    animation: ecoMode ? "none" : `spin-counter ${rotationSpeed * 0.8}s linear infinite`,
                    opacity: 0.6
                  }}
                />

                {/* Pyramid Wireframe Base */}
                <polygon
                  points="150,75 40,240 260,240"
                  fill="none"
                  stroke="url(#amberGrad)"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />

                {/* Pyramid internal structural layers */}
                <g stroke="#be185d" strokeWidth="1" opacity="0.4">
                  <line x1="150" y1="75" x2="150" y2="240" />
                  <line x1="150" y1="130" x2="40" y2="240" />
                  <line x1="150" y1="130" x2="260" y2="240" />
                  <line x1="95" y1="157" x2="205" y2="157" />
                  <line x1="68" y1="198" x2="232" y2="198" />
                </g>

                {/* Floating Capstone (Symbol of Ascended Alchemy) */}
                <polygon
                  points="150,45 120,90 180,90"
                  fill="#0c0c0c"
                  stroke="url(#pinkGrad)"
                  strokeWidth="2.5"
                  className="origin-center"
                  style={{
                    animation: ecoMode ? "none" : `hover-bob 4s ease-in-out infinite`
                  }}
                />

                {/* THE ALL-SEEING EYE INSIDE CAPSTONE */}
                <g transform="translate(0, -20)">
                  {/* Eye boundary */}
                  <path
                    d="M 125,95 C 135,80 165,80 175,95 C 165,110 135,110 125,95 Z"
                    fill="#15060d"
                    stroke="url(#amberGrad)"
                    strokeWidth="1.5"
                  />
                  {/* Glowing Pupil */}
                  <circle
                    cx="150"
                    cy="95"
                    r="6"
                    fill="url(#pinkGrad)"
                    style={{
                      animation: showRuneGlow && !ecoMode ? `pulse-scale ${pulseSpeed}s ease-in-out infinite` : "none"
                    }}
                  />
                  <circle cx="148" cy="93" r="1.5" fill="#ffffff" />
                </g>

                {/* Alchemical elemental runes on the ground */}
                <g fill="url(#amberGrad)" fontSize="8" fontFamily="monospace" opacity="0.7">
                  <text x="30" y="255">🜁 AIR</text>
                  <text x="235" y="255">🜄 WATER</text>
                  <text x="135" y="275">🜃 EARTH</text>
                  <text x="138" y="32">🜂 FIRE</text>
                </g>

                {/* Circuit node junctions on pyramid edges */}
                {showCircuitOverlays && (
                  <g fill="#ec4899">
                    <circle cx="150" cy="75" r="4.5" className="animate-pulse" />
                    <circle cx="40" cy="240" r="3.5" />
                    <circle cx="260" cy="240" r="3.5" />
                    <circle cx="95" cy="157" r="2.5" />
                    <circle cx="205" cy="157" r="2.5" />
                  </g>
                )}
              </svg>
            )}

            {/* VARIATION III: THE SOLARIS-PRIME CHRONO-SEAL */}
            {activeTab === "concept-3" && (
              <svg
                id="svg-render-concept-3"
                viewBox="0 0 300 300"
                className="w-full h-full select-none"
              >
                <defs>
                  <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                  <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                  <linearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#78350f" />
                  </linearGradient>
                </defs>

                {/* Rotating Outer Hexagonal Seal Grid */}
                <polygon
                  points="150,15 267,82 267,218 150,285 33,218 33,82"
                  fill="none"
                  stroke="url(#purpleGrad)"
                  strokeWidth="2.5"
                  strokeDasharray="20, 10"
                  className="origin-center"
                  style={{
                    animation: ecoMode ? "none" : `spin-clockwise ${rotationSpeed * 1.8}s linear infinite`
                  }}
                />

                {/* Sacred Pentagram framework */}
                <polygon
                  points="150,28 245,210 55,98 245,98 55,210"
                  fill="none"
                  stroke="url(#emeraldGrad)"
                  strokeWidth="0.75"
                  opacity="0.35"
                />

                {/* Scarab Wings/Wings of Horus (Symmetrical side arches) */}
                <path
                  d="M 33,150 C 40,80 100,55 140,55"
                  fill="none"
                  stroke="url(#brassGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity="0.85"
                />
                <path
                  d="M 267,150 C 260,80 200,55 160,55"
                  fill="none"
                  stroke="url(#brassGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity="0.85"
                />

                <path
                  d="M 33,150 C 50,210 110,245 145,245"
                  fill="none"
                  stroke="url(#brassGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  opacity="0.75"
                />
                <path
                  d="M 267,150 C 250,210 190,245 155,245"
                  fill="none"
                  stroke="url(#brassGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  opacity="0.75"
                />

                {/* Inner mechanical shutter ring */}
                <circle
                  cx="150"
                  cy="150"
                  r="72"
                  fill="#0c0c0d"
                  stroke="url(#purpleGrad)"
                  strokeWidth="3.5"
                />

                {/* Mechanical Camera Iris Blades (Fusing tech with the all-seeing pupil) */}
                <g stroke="url(#brassGrad)" strokeWidth="1.5" opacity="0.8" fill="none">
                  <path d="M 150,78 L 195,115 M 195,115 L 214,165 M 214,165 L 175,215 M 175,215 L 125,215 M 125,215 L 86,165 M 86,165 L 105,115 M 105,115 L 150,78" />
                  <line x1="150" y1="78" x2="165" y2="105" />
                  <line x1="222" y1="150" x2="190" y2="160" />
                  <line x1="150" y1="222" x2="135" y2="195" />
                  <line x1="78" y1="150" x2="110" y2="140" />
                </g>

                {/* Spinning Dial Core */}
                <circle
                  cx="150"
                  cy="150"
                  r="45"
                  fill="none"
                  stroke="url(#emeraldGrad)"
                  strokeWidth="1.5"
                  strokeDasharray="6, 12, 18, 6"
                  className="origin-center"
                  style={{
                    animation: `spin-counter ${rotationSpeed * 0.5}s linear infinite`
                  }}
                />

                {/* Central singularity eyeball core */}
                <circle
                  cx="150"
                  cy="150"
                  r="30"
                  fill="url(#purpleGrad)"
                  className="origin-center"
                  style={{
                    animation: showRuneGlow && !ecoMode ? `pulse-scale ${pulseSpeed}s ease-in-out infinite` : "none"
                  }}
                />

                {/* Glowing cyan core nucleus */}
                <circle
                  cx="150"
                  cy="150"
                  r="14"
                  fill="url(#emeraldGrad)"
                />

                <circle cx="146" cy="146" r="3" fill="#ffffff" />

                {/* Alchemical glyphs/nodes */}
                {showCircuitOverlays && (
                  <g fill="#34d399">
                    <circle cx="150" cy="55" r="4" />
                    <circle cx="150" cy="245" r="4" />
                    <circle cx="33" cy="150" r="4.5" className="animate-pulse" />
                    <circle cx="267" cy="150" r="4.5" className="animate-pulse" />
                  </g>
                )}
              </svg>
            )}

            {/* VARIATION IV: THE OMNI SOVEREIGN DESTINY SEAL */}
            {activeTab === "concept-4" && (
              <svg
                id="svg-render-concept-4"
                viewBox="0 0 320 320"
                className="w-full h-full select-none"
              >
                <defs>
                  {/* Celestial Galaxy Purple-Pink radial gradient */}
                  <radialGradient id="nebulaGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#d8b4fe" stopOpacity="1" />
                    <stop offset="40%" stopColor="#818cf8" stopOpacity="0.8" />
                    <stop offset="70%" stopColor="#4c1d95" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#0c0a0f" stopOpacity="0" />
                  </radialGradient>
                  
                  {/* Metallic Grey Obsidian stroke gradient */}
                  <linearGradient id="obsidianMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e2e8f0" />
                    <stop offset="30%" stopColor="#475569" />
                    <stop offset="70%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>

                  {/* Warm Golden Alchemy lines gradient */}
                  <linearGradient id="goldLustre" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#854d0e" />
                  </linearGradient>

                  {/* Deep Starfield center core gradient */}
                  <radialGradient id="portalCore" cx="50%" cy="50%" r="45%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="25%" stopColor="#f472b6" />
                    <stop offset="60%" stopColor="#6b21a8" />
                    <stop offset="90%" stopColor="#1e1b4b" />
                    <stop offset="100%" stopColor="#03001e" />
                  </radialGradient>
                </defs>

                {/* BACKGROUND: Nebulous Deep Space Galactic Starfield */}
                <circle cx="160" cy="160" r="145" fill="url(#nebulaGrad)" opacity="0.85" />
                
                {showRuneGlow && !ecoMode && (
                  <g opacity="0.65">
                    <circle cx="160" cy="160" r="140" fill="none" stroke="rgba(192, 132, 252, 0.15)" strokeWidth="1" strokeDasharray="1, 8" className="origin-center" style={{ animation: "spin-clockwise 30s linear infinite" }} />
                    <circle cx="160" cy="160" r="130" fill="none" stroke="rgba(244, 114, 182, 0.1)" strokeWidth="1.5" strokeDasharray="3, 15" className="origin-center" style={{ animation: "spin-counter 40s linear infinite" }} />
                  </g>
                )}

                {/* BACKGROUND ORBITS: Sacred Spirograph Mandala Lineage */}
                <g stroke="url(#goldLustre)" strokeWidth="0.5" fill="none" opacity="0.35">
                  <circle cx="160" cy="160" r="142" strokeDasharray="2, 5" />
                  <circle cx="160" cy="160" r="115" />
                  <circle cx="100" cy="160" r="60" />
                  <circle cx="220" cy="160" r="60" />
                  <circle cx="160" cy="100" r="60" />
                  <circle cx="160" cy="220" r="60" />
                  <path d="M 60,60 L 260,260 M 260,60 L 60,260 M 160,20 L 160,300 M 20,160 L 300,160" strokeDasharray="2, 8" />
                </g>

                {/* MASTER PYRAMID: Equilateral Triangle Core */}
                <polygon
                  points="160,32 290,250 30,250"
                  fill="none"
                  stroke="url(#obsidianMetal)"
                  strokeWidth="5"
                  strokeLinejoin="round"
                  className="drop-shadow-2xl"
                />
                <polygon
                  points="160,32 290,250 30,250"
                  fill="none"
                  stroke="url(#goldLustre)"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                  opacity="0.8"
                />
                <polygon
                  points="160,48 275,242 45,242"
                  fill="none"
                  stroke="url(#obsidianMetal)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  opacity="0.5"
                />

                {/* OUTER CONCENTRIC METALLIC SHIELD RINGS */}
                <g className="origin-center" style={{ animation: ecoMode ? "none" : `spin-clockwise ${rotationSpeed * 1.5}s linear infinite` }}>
                  <circle cx="160" cy="160" r="102" fill="none" stroke="url(#obsidianMetal)" strokeWidth="4.5" />
                  <circle cx="160" cy="160" r="102" fill="none" stroke="url(#goldLustre)" strokeWidth="1" opacity="0.6" />
                  <g stroke="url(#goldLustre)" strokeWidth="1" opacity="0.75">
                    <line x1="160" y1="58" x2="160" y2="64" />
                    <line x1="160" y1="256" x2="160" y2="262" />
                    <line x1="58" y1="160" x2="64" y2="160" />
                    <line x1="256" y1="160" x2="262" y2="160" />
                    <line x1="89" y1="89" x2="94" y2="94" />
                    <line x1="231" y1="89" x2="226" y2="94" />
                    <line x1="89" y1="231" x2="94" y2="226" />
                    <line x1="231" y1="231" x2="226" y2="226" />
                  </g>
                </g>

                <g className="origin-center" style={{ animation: ecoMode ? "none" : `spin-counter ${rotationSpeed * 1.1}s linear infinite` }}>
                  <circle cx="160" cy="160" r="92" fill="none" stroke="url(#obsidianMetal)" strokeWidth="2.5" strokeDasharray="30, 8, 12, 8" />
                  <circle cx="160" cy="160" r="92" fill="none" stroke="#c084fc" strokeWidth="1" strokeDasharray="30, 8, 12, 8" opacity="0.7" />
                </g>

                {/* BEACON AT APEX: Sovereign Runic Antennas & Alchemical Fire symbol */}
                <g transform="translate(160, 48)" className="origin-center">
                  <line x1="0" y1="-25" x2="0" y2="10" stroke="url(#goldLustre)" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="0" cy="-25" r="3" fill="url(#portalCore)" />
                  <path d="M -10,-10 L 0,-20 L 10,-10 M -8,-5 L 0,-13 L 8,-5" fill="none" stroke="url(#goldLustre)" strokeWidth="1.5" strokeLinecap="round" />
                  {showRuneGlow && !ecoMode && (
                    <circle cx="0" cy="-25" r="8" fill="none" stroke="#c084fc" strokeWidth="0.75" className="animate-ping" style={{ animationDuration: "2s" }} />
                  )}
                </g>

                {/* BOTTOM BASE PLINTH: Laser engraved brand mark shield */}
                <g transform="translate(160, 240)">
                  <polygon points="-22,-5 22,-5 15,22 -15,22" fill="#09090b" stroke="url(#obsidianMetal)" strokeWidth="3.5" />
                  <polygon points="-22,-5 22,-5 15,22 -15,22" fill="none" stroke="url(#goldLustre)" strokeWidth="1" opacity="0.8" />
                  <line x1="0" y1="0" x2="0" y2="15" stroke="url(#goldLustre)" strokeWidth="1.5" />
                  <line x1="-8" y1="4" x2="8" y2="4" stroke="url(#goldLustre)" strokeWidth="1.5" />
                  <circle cx="0" cy="15" r="1.5" fill="#f472b6" />
                </g>

                {/* CENTRAL EYE STRUCTURE: The Sovereign Eye of Destiny */}
                <g transform="translate(160, 160)" className="origin-center">
                  {/* Winged Brackets holding the central eye */}
                  <path
                    d="M -90,-10 C -70,-35 -30,-45 0,-45 C 30,-45 70,-35 90,-10 C 70,-5 30,0 0,0 C -30,0 -70,-5 -90,-10 Z"
                    fill="#0c0a0e"
                    stroke="url(#obsidianMetal)"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    opacity="0.95"
                  />
                  <path
                    d="M -90,-10 C -70,-35 -30,-45 0,-45 C 30,-45 70,-35 90,-10"
                    fill="none"
                    stroke="url(#goldLustre)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  
                  {/* Symmetrical metallic heavy cyber wings at the bottom of the eye bracket */}
                  <path
                    d="M -75,10 C -50,45 -10,65 0,65 C 10,65 50,45 75,10"
                    fill="none"
                    stroke="url(#obsidianMetal)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M -75,10 C -50,45 -10,65 0,65 C 10,65 50,45 75,10"
                    fill="none"
                    stroke="url(#goldLustre)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.8"
                  />

                  {/* Center Eye socket shadow */}
                  <path
                    d="M -65,0 C -35,-30 35,-30 65,0 C 35,30 -35,30 -65,0 Z"
                    fill="#050307"
                    stroke="url(#obsidianMetal)"
                    strokeWidth="3.5"
                  />

                  {/* Elegant Gold Trim Eyeball border */}
                  <path
                    d="M -65,0 C -35,-30 35,-30 65,0 C 35,30 -35,30 -65,0 Z"
                    fill="none"
                    stroke="url(#goldLustre)"
                    strokeWidth="1.2"
                    opacity="0.9"
                  />

                  {/* PORTAL CORE IRIS: Pulsing hyper-drive star-field portal */}
                  <circle
                    cx="0"
                    cy="0"
                    r="28"
                    fill="url(#portalCore)"
                    className="origin-center"
                    style={{
                      animation: showRuneGlow && !ecoMode ? `pulse-scale ${pulseSpeed}s ease-in-out infinite` : "none"
                    }}
                  />

                  {/* Glowing Eye Pupil Core */}
                  <circle
                    cx="0"
                    cy="0"
                    r="13"
                    fill="#ffffff"
                    className="origin-center"
                    style={{
                      filter: "drop-shadow(0 0 10px #c084fc) drop-shadow(0 0 4px #ffffff)"
                    }}
                  />
                  
                  {/* Micro iris mechanical details */}
                  {showCircuitOverlays && (
                    <g stroke="rgba(255,255,255,0.8)" strokeWidth="0.75" fill="none">
                      <line x1="0" y1="-12" x2="0" y2="12" />
                      <line x1="-12" y1="0" x2="12" y2="0" />
                      <circle cx="0" cy="0" r="19" stroke="#f472b6" strokeWidth="0.5" strokeDasharray="3, 3" />
                    </g>
                  )}

                  {/* High contrast lens reflection glints */}
                  <circle cx="-6" cy="-6" r="3" fill="#ffffff" opacity="0.9" />
                  <circle cx="8" cy="8" r="1.5" fill="#ffffff" opacity="0.7" />

                  {/* Left and Right alchemical runic wings anchors */}
                  <g stroke="url(#goldLustre)" strokeWidth="1.5" fill="none" opacity="0.8">
                    <path d="M -90,-10 L -105,-8 L -100,5" />
                    <path d="M -85,2 L -98,12 M -78,12 L -88,24" />
                    <path d="M 90,-10 L 105,-8 L 100,5" />
                    <path d="M 85,2 L 98,12 M 78,12 L 88,24" />
                  </g>

                  {/* Symmetrical runes hanging in space beneath the eye */}
                  <g fill="url(#goldLustre)" fontSize="8" fontFamily="monospace" opacity="0.75">
                    <text x="-48" y="32">🜏</text>
                    <text x="-32" y="44">⌬</text>
                    <text x="38" y="32">🜔</text>
                    <text x="24" y="44">⎔</text>
                  </g>
                </g>
              </svg>
            )}

          </div>

          {/* Quick Active Controls beneath the render area */}
          <div className="flex gap-4 w-full justify-between items-center mt-4 border-t border-white/5 pt-4 text-gray-500 font-mono text-[10px] select-none">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 uppercase">Interactive Preview:</span>
              <span className="text-amber-400 uppercase font-bold">{currentVar.id.replace("-", " ")}</span>
            </div>
            <div className="flex gap-2">
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400">VECTOR SCALE: TRUE</span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400">60FPS RENDER</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Interactive Control Console & Description Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-5">
          
          {/* Logo Concept Information Card */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4">
            
            {/* Identity Seal */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-mono font-black text-white tracking-widest uppercase">
                  Identity Core Specs
                </span>
              </div>
              <span 
                className="text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${currentVar.themeColor}15`, color: currentVar.themeColor }}
              >
                {activeTab === "concept-1" ? "Active Nexus" : activeTab === "concept-2" ? "Pyramid State" : activeTab === "concept-3" ? "Failover Seal" : "Sovereign Seal"}
              </span>
            </div>

            {/* Spec Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Concept Name</label>
                <p className="text-sm font-bold text-white uppercase tracking-wide">
                  {currentVar.name}
                </p>
              </div>

              <div>
                <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Functional Description</label>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  {currentVar.description}
                </p>
              </div>

              <div>
                <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Brand Strategy & Placement</label>
                <p className="text-xs text-gray-400 leading-relaxed font-sans italic">
                  {currentVar.conceptNotes}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-mono">
                <span className="text-gray-500 uppercase">Alchemical Synthesis Formula:</span>
                <span className="text-amber-400 font-bold tracking-wider">{currentVar.alchemicalFormula}</span>
              </div>
            </div>
          </div>

          {/* Interactive Core Tuning Sliders (Tuning the SVG elements in real-time) */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-2.5">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-mono font-black text-white tracking-widest uppercase">
                Interactive Energy Tuner
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              {/* Rotation speed slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500 uppercase flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin-slow" /> Alchemical Ring Spin Speed
                  </span>
                  <span className="text-white">{rotationSpeed}s / turn</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  step="1"
                  value={rotationSpeed}
                  onChange={(e) => setRotationSpeed(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer bg-neutral-800 rounded-lg appearance-none h-1.5"
                />
              </div>

              {/* Pulse Speed slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500 uppercase flex items-center gap-1">
                    <Zap className="h-3 w-3 text-cyan-400" /> Cybernetic Core Pulse Frequency
                  </span>
                  <span className="text-white">{pulseSpeed}s / loop</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.1"
                  value={pulseSpeed}
                  onChange={(e) => setPulseSpeed(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer bg-neutral-800 rounded-lg appearance-none h-1.5"
                />
              </div>

              {/* Interactive Switches */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => setShowCircuitOverlays(!showCircuitOverlays)}
                  className={`py-1.5 px-2 rounded-lg border transition text-center flex items-center justify-center gap-1.5 cursor-pointer uppercase font-bold ${
                    showCircuitOverlays
                      ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                      : "bg-black/40 border-white/5 text-gray-500"
                  }`}
                >
                  <Cpu className="h-3.5 w-3.5" />
                  {showCircuitOverlays ? "Circuits ON" : "Circuits OFF"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowRuneGlow(!showRuneGlow)}
                  className={`py-1.5 px-2 rounded-lg border transition text-center flex items-center justify-center gap-1.5 cursor-pointer uppercase font-bold ${
                    showRuneGlow
                      ? "bg-pink-500/10 border-pink-500/20 text-pink-400"
                      : "bg-black/40 border-white/5 text-gray-500"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {showRuneGlow ? "Glow ON" : "Glow OFF"}
                </button>
              </div>

              {/* Eco Performance Switch */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setEcoMode(!ecoMode)}
                  className={`w-full py-2 px-3 rounded-lg border transition text-center flex items-center justify-center gap-2 cursor-pointer uppercase font-bold text-[10px] md:text-xs ${
                    ecoMode
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm"
                      : "bg-black/20 border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                  }`}
                >
                  <Zap className={`h-3.5 w-3.5 ${ecoMode ? "text-emerald-400 animate-pulse" : "text-gray-500"}`} />
                  {ecoMode ? "⚡ ECO MODE ACTIVE (Animations Paused)" : "🔋 ENGAGE ECO PERFORMANCE MODE (Reduce Lag)"}
                </button>
              </div>
            </div>
          </div>

          {/* Action Footer: Exporting and downloading the actual blueprint vector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCopySVG}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[#141414] hover:bg-[#1f1f1f] border border-white/10 text-gray-300 font-mono font-bold text-xs uppercase rounded-xl transition cursor-pointer active:scale-95 shadow-md"
            >
              {copiedCode ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  Code Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-amber-500" />
                  Copy SVG Code
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadSVG}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-xs uppercase rounded-xl transition cursor-pointer active:scale-95 shadow-md shadow-amber-500/10"
            >
              <Download className="h-4 w-4" />
              Download Asset
            </button>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* OMNI ACTIVE CAMPAIGN ENGINE // BRAND MARKETING & ADVERTISING SUITE */}
      {/* ========================================================================= */}
      <div className="mt-12 bg-[#09090b] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        {/* Abstract background galaxy gradients for marketing suite */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Suite Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-pink-500 animate-pulse" />
              <span className="text-[10px] font-mono font-black text-pink-500 uppercase tracking-widest">
                Omni Fleet Campaign Portal
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wider font-sans mt-1">
              Active Marketing & Advertising Schema
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5 uppercase">
              Simulating enterprise hero placements, physical outdoor billboards, and brand copy systems.
            </p>
          </div>

          {/* Slogan Switcher or Status */}
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2.5 rounded-xl">
            <Award className="h-4 w-4 text-amber-500" />
            <div>
              <span className="text-[8px] font-mono text-gray-500 uppercase block leading-none">Campaign Lock:</span>
              <span className="text-xs font-mono font-bold text-gray-300 uppercase leading-none">
                {currentVar.codename}
              </span>
            </div>
          </div>
        </div>

        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: Media Placements Preview (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Tab switchers for different marketing placements */}
            <div className="flex flex-wrap gap-1 bg-black/60 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setActiveMediaTab("hero")}
                className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeMediaTab === "hero"
                    ? "bg-pink-500 text-black font-extrabold shadow-lg shadow-pink-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Tv className="h-3.5 w-3.5" />
                Landing Hero
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab("billboard")}
                className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeMediaTab === "billboard"
                    ? "bg-purple-500 text-black font-extrabold shadow-lg shadow-purple-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                City Billboard
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab("social")}
                className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeMediaTab === "social"
                    ? "bg-indigo-500 text-black font-extrabold shadow-lg shadow-indigo-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Social Banner
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab("hardware")}
                className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeMediaTab === "hardware"
                    ? "bg-amber-500 text-black font-extrabold shadow-lg shadow-amber-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Cpu className="h-3.5 w-3.5" />
                Secure Hardware
              </button>
            </div>

            {/* Media Canvas Placement */}
            <div className="bg-[#050505] border border-white/5 rounded-2xl p-6 min-h-[340px] flex flex-col justify-between relative overflow-hidden group shadow-inner font-sans">
              <div className="absolute top-2 left-2 flex items-center gap-2 text-[8px] font-mono text-gray-600 uppercase select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                PLACEMENT SIMULATION // LIVE VECTOR DRAW
              </div>
              <div className="absolute top-2 right-2 text-[8px] font-mono text-gray-600 select-none">
                RESOLUTION: RESPONSIVE SCREEN
              </div>

              {/* Placement 1: Landing Hero Banner */}
              {activeMediaTab === "hero" && (
                <div className="flex flex-col md:flex-row items-center gap-6 mt-4 w-full h-full my-auto">
                  {/* Copy content left */}
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/20">
                      <Sparkles className="h-3 w-3 text-pink-400 animate-spin-slow" />
                      <span className="text-[8px] font-mono text-pink-400 font-bold uppercase tracking-wider">SECURE CONDUIT ACTIVE</span>
                    </div>
                    <h4 className="text-xl md:text-2xl font-black text-white leading-tight uppercase font-sans">
                      {marketingCopy.adHeadline}
                    </h4>
                    <p className="text-xs text-gray-400 font-sans leading-relaxed">
                      Initialize the elite corporate interface layers today. Fully armed with zero-trust defensive telemetry matrices.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
                      <button className="px-4 py-2 bg-pink-500 hover:bg-pink-400 text-black text-[10px] font-mono font-black uppercase rounded-lg transition shadow-md shadow-pink-500/15 cursor-pointer">
                        Get Secure Conduit Key
                      </button>
                      <button className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-mono uppercase rounded-lg transition border border-white/5 cursor-pointer">
                        Fleet Blueprint
                      </button>
                    </div>
                  </div>

                  {/* Render scaled floating branding SVG right */}
                  <div className="w-48 h-48 md:w-56 md:h-56 shrink-0 relative flex items-center justify-center p-4 rounded-full bg-gradient-to-b from-white/5 to-transparent border border-white/5 shadow-2xl animate-bounce" style={{ animationDuration: "8s" }}>
                    <div className="absolute inset-0 bg-pink-500/5 rounded-full blur-2xl opacity-60" />
                    {/* Interactive vector cloning based on activeTab */}
                    {activeTab === "concept-1" && <div className="w-full h-full">{document.getElementById("svg-render-concept-1") ? <svg viewBox="0 0 300 300" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-1")!.innerHTML }} /> : <div className="text-[10px] text-gray-600 font-mono">LOADING VECTOR...</div>}</div>}
                    {activeTab === "concept-2" && <div className="w-full h-full">{document.getElementById("svg-render-concept-2") ? <svg viewBox="0 0 300 300" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-2")!.innerHTML }} /> : <div className="text-[10px] text-gray-600 font-mono">LOADING VECTOR...</div>}</div>}
                    {activeTab === "concept-3" && <div className="w-full h-full">{document.getElementById("svg-render-concept-3") ? <svg viewBox="0 0 300 300" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-3")!.innerHTML }} /> : <div className="text-[10px] text-gray-600 font-mono">LOADING VECTOR...</div>}</div>}
                    {activeTab === "concept-4" && <div className="w-full h-full">{document.getElementById("svg-render-concept-4") ? <svg viewBox="0 0 320 320" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-4")!.innerHTML }} /> : <div className="text-[10px] text-gray-600 font-mono">LOADING VECTOR...</div>}</div>}
                  </div>
                </div>
              )}

              {/* Placement 2: City Highway Billboard */}
              {activeMediaTab === "billboard" && (
                <div className="mt-6 flex flex-col justify-between items-center w-full h-full space-y-6">
                  {/* Realistic simulated frame */}
                  <div className="w-full bg-[#111] border-4 border-[#222] rounded-xl p-4 relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-2xl">
                    {/* Metal mesh backdrop dots */}
                    <div className="absolute inset-0 bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:8px_8px] opacity-40" />
                    
                    {/* Left Brand Mark */}
                    <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full justify-between">
                      <div className="w-28 h-28 shrink-0 flex items-center justify-center rounded-xl bg-black border border-white/5 p-2">
                        {activeTab === "concept-1" && <div className="w-full h-full">{document.getElementById("svg-render-concept-1") ? <svg viewBox="0 0 300 300" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-1")!.innerHTML }} /> : <div className="text-[8px] text-gray-600 font-mono">LOADING...</div>}</div>}
                        {activeTab === "concept-2" && <div className="w-full h-full">{document.getElementById("svg-render-concept-2") ? <svg viewBox="0 0 300 300" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-2")!.innerHTML }} /> : <div className="text-[8px] text-gray-600 font-mono">LOADING...</div>}</div>}
                        {activeTab === "concept-3" && <div className="w-full h-full">{document.getElementById("svg-render-concept-3") ? <svg viewBox="0 0 300 300" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-3")!.innerHTML }} /> : <div className="text-[8px] text-gray-600 font-mono">LOADING...</div>}</div>}
                        {activeTab === "concept-4" && <div className="w-full h-full">{document.getElementById("svg-render-concept-4") ? <svg viewBox="0 0 320 320" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-4")!.innerHTML }} /> : <div className="text-[8px] text-gray-600 font-mono">LOADING...</div>}</div>}
                      </div>

                      {/* Right Big Bold Text */}
                      <div className="flex-1 space-y-2 text-center md:text-left">
                        <span className="text-[9px] font-mono text-purple-400 font-black tracking-widest uppercase">THE OMNI COVENANT</span>
                        <h5 className="text-lg md:text-xl font-black text-white leading-tight uppercase font-sans tracking-wide">
                          {marketingCopy.slogans[0]}
                        </h5>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                          DIVINE SYMMETRY // MULTI-CLOUD INFRASTRUCTURE LAYER
                        </p>
                      </div>
                    </div>

                    {/* Bottom bezel tags */}
                    <div className="flex justify-between items-center text-[7px] font-mono text-gray-600 border-t border-white/5 pt-2 mt-4 z-10">
                      <span>STREET BILLBOARD SIMULATION #942</span>
                      <span>BRIGHTNESS METER: 100% (HIGH CONTRAST NEBULA)</span>
                    </div>
                  </div>

                  {/* Billboard post poles */}
                  <div className="flex gap-12 -mt-6 select-none">
                    <div className="w-2 h-14 bg-gradient-to-r from-gray-800 to-gray-950 border-x border-white/5" />
                    <div className="w-2 h-14 bg-gradient-to-r from-gray-800 to-gray-950 border-x border-white/5" />
                  </div>
                </div>
              )}

              {/* Placement 3: Social Media Banner */}
              {activeMediaTab === "social" && (
                <div className="mt-6 flex flex-col justify-center h-full w-full">
                  <div className="w-full bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between">
                    {/* Top banner graphics */}
                    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-black p-4 min-h-[110px] relative overflow-hidden flex items-center justify-between">
                      {/* Grid overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:16px_16px]" />
                      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl" />
                      
                      {/* Left content */}
                      <div className="z-10 space-y-1 max-w-[70%]">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500 text-black text-[7px] font-mono font-bold uppercase tracking-wider">OMNI FLEET CODENAME: {currentVar.codename}</span>
                        <h5 className="text-sm md:text-base font-black text-white uppercase tracking-wider font-sans leading-tight">
                          {marketingCopy.slogans[1] || marketingCopy.slogans[0]}
                        </h5>
                        <p className="text-[9px] text-gray-400 font-sans leading-tight truncate">
                          {marketingCopy.socialBio}
                        </p>
                      </div>

                      {/* Right small avatar brand mark */}
                      <div className="w-16 h-16 shrink-0 bg-black/90 border border-white/10 rounded-full p-1.5 flex items-center justify-center shadow-lg z-10 font-mono">
                        {activeTab === "concept-1" && <div className="w-full h-full">{document.getElementById("svg-render-concept-1") ? <svg viewBox="0 0 300 300" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-1")!.innerHTML }} /> : null}</div>}
                        {activeTab === "concept-2" && <div className="w-full h-full">{document.getElementById("svg-render-concept-2") ? <svg viewBox="0 0 300 300" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-2")!.innerHTML }} /> : null}</div>}
                        {activeTab === "concept-3" && <div className="w-full h-full">{document.getElementById("svg-render-concept-3") ? <svg viewBox="0 0 300 300" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-3")!.innerHTML }} /> : null}</div>}
                        {activeTab === "concept-4" && <div className="w-full h-full">{document.getElementById("svg-render-concept-4") ? <svg viewBox="0 0 320 320" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-4")!.innerHTML }} /> : null}</div>}
                      </div>
                    </div>

                    {/* Bottom user profile placeholder simulating LinkedIn/X */}
                    <div className="bg-[#141414] p-4 flex justify-between items-center text-[10px] font-mono border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-gray-800 border border-white/5 flex items-center justify-center font-bold text-white text-[8px]">Ω</div>
                        <div>
                          <span className="text-white block font-bold leading-none">Omni Corporation</span>
                          <span className="text-gray-500 block text-[8px] leading-none mt-0.5">@OmniCovenant // 2.4M Handshakes Secure</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400">Enterprise</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400">Verified System</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] font-mono text-gray-500 text-center mt-3 uppercase">
                    Perfect aspect ratio layout for LinkedIn, Twitter, and executive community profiles.
                  </p>
                </div>
              )}

              {/* Placement 4: Secure Hardware Physical Seal */}
              {activeMediaTab === "hardware" && (
                <div className="mt-4 flex flex-col justify-between h-full w-full">
                  <div className="w-full bg-[#18181b] border border-gray-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
                    {/* Simulated brushed aluminum streaks */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/2 via-transparent to-black/20 pointer-events-none" />
                    
                    {/* Screws on corner of hardware server */}
                    <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center text-[4px] text-black font-bold select-none">+</div>
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center text-[4px] text-black font-bold select-none">+</div>
                    <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center text-[4px] text-black font-bold select-none">+</div>
                    <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center text-[4px] text-black font-bold select-none">+</div>

                    <div className="flex flex-col md:flex-row items-center gap-6">
                      {/* Laser stamp logo indicator left */}
                      <div className="w-24 h-24 shrink-0 rounded bg-black/80 border-2 border-amber-500/20 p-2 relative flex items-center justify-center shadow-lg group-hover:border-amber-500/40 transition">
                        {/* Laser trace light sweep */}
                        <div className="absolute inset-y-0 w-0.5 bg-amber-400 opacity-40 blur-[1px]" style={{ left: "50%", animation: "laser-sweep 3s ease-in-out infinite" }} />
                        {activeTab === "concept-1" && <div className="w-full h-full">{document.getElementById("svg-render-concept-1") ? <svg viewBox="0 0 300 300" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-1")!.innerHTML }} /> : null}</div>}
                        {activeTab === "concept-2" && <div className="w-full h-full">{document.getElementById("svg-render-concept-2") ? <svg viewBox="0 0 300 300" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-2")!.innerHTML }} /> : null}</div>}
                        {activeTab === "concept-3" && <div className="w-full h-full">{document.getElementById("svg-render-concept-3") ? <svg viewBox="0 0 300 300" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-3")!.innerHTML }} /> : null}</div>}
                        {activeTab === "concept-4" && <div className="w-full h-full">{document.getElementById("svg-render-concept-4") ? <svg viewBox="0 0 320 320" className="w-full h-full" dangerouslySetInnerHTML={{ __html: document.getElementById("svg-render-concept-4")!.innerHTML }} /> : null}</div>}
                      </div>

                      {/* Hardware stats right */}
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-widest">OMNI SECURE SEALS</span>
                          <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 text-[6px] font-mono font-bold uppercase tracking-widest">TAMPER EVIDENCE PROTECTED</span>
                        </div>
                        <h5 className="text-xs font-mono font-black text-white uppercase tracking-wider block">
                          CORE CHASSIS MODULE // MODEL S-800
                        </h5>
                        
                        <div className="bg-black/60 rounded p-2.5 space-y-1 border border-white/5 text-[8px] font-mono text-gray-500">
                          <div>CHASSIS ID: <span className="text-gray-300">OMNI-HW-SEAL-X-990</span></div>
                          <div>LASER ETCHING DEPTH: <span className="text-gray-300">0.05MM BRUSHED OXIDE</span></div>
                          <div>HANDSHAKE INTEGRITY: <span className="text-emerald-400">99.9999% DECENTRALIZED COVENANT</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] font-mono text-gray-500 text-center mt-3 uppercase">
                    Physical branding schematic for high-end server chassis plates, cryptographic router modules, and tamper-proof hardware guards.
                  </p>
                </div>
              )}

              {/* Placement Footer with branding specifications summary */}
              <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-4 text-[8px] font-mono text-gray-600 select-none">
                <span className="uppercase">Brand: Omni System Suite v4.0</span>
                <span className="text-amber-500 uppercase font-black">Active Scheme: {currentVar.name}</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Copywriting Slogans & System Messaging (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Copywriting Section */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                <FileText className="h-4 w-4 text-pink-500" />
                <span className="text-xs font-mono font-black text-white tracking-widest uppercase">
                  Sovereign Copywriter Hub
                </span>
              </div>

              {/* Slogan List */}
              <div className="space-y-3">
                <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Pre-Generated Slogans & Taglines</label>
                {marketingCopy.slogans.map((slogan, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 bg-black/60 p-2.5 rounded-xl border border-white/5 group hover:border-white/10 transition">
                    <p className="text-[10px] font-mono text-gray-300 font-bold leading-relaxed max-w-[80%] uppercase tracking-wide">
                      "{slogan}"
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopyText(slogan, `slogan-${index}`)}
                      className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer shrink-0"
                      title="Copy Slogan"
                    >
                      {copiedMarketingText === `slogan-${index}` ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-amber-500" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Social Bios */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono text-gray-500 uppercase block">Optimized Social Media Bio (X/LinkedIn)</label>
                  <button
                    type="button"
                    onClick={() => handleCopyText(marketingCopy.socialBio, "bio")}
                    className="text-[8px] font-mono text-amber-500 uppercase hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {copiedMarketingText === "bio" ? "Copied!" : "Copy Bio"}
                  </button>
                </div>
                <div className="bg-black/60 p-3 rounded-xl border border-white/5 text-[10px] font-sans text-gray-400 leading-relaxed">
                  {marketingCopy.socialBio}
                </div>
              </div>
            </div>

            {/* Newsletter and Launch Messaging */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-mono font-black text-white tracking-widest uppercase">
                    System Broadcast Email
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(`${marketingCopy.emailSubject}\n\n${marketingCopy.emailBody}`, "email")}
                  className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-[8px] hover:bg-purple-500/20 transition cursor-pointer"
                >
                  {copiedMarketingText === "email" ? "Copied Mailer!" : "Copy Broadcast Template"}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[8px] font-mono text-gray-600 block uppercase mb-1">Subject Line</span>
                  <div className="bg-black/60 p-2 rounded border border-white/5 text-[10px] font-mono font-bold text-gray-300">
                    {marketingCopy.emailSubject}
                  </div>
                </div>

                <div>
                  <span className="text-[8px] font-mono text-gray-600 block uppercase mb-1">Message Body</span>
                  <div className="bg-black/60 p-3 rounded-xl border border-white/5 text-[9px] font-mono text-gray-400 leading-relaxed h-32 overflow-y-auto whitespace-pre-wrap select-text">
                    {marketingCopy.emailBody}
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Color Swatches & Specs */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                <Palette className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-mono font-black text-white tracking-widest uppercase">
                  Campaign Visual Specs
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/60 p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[7px] font-mono text-gray-600 block uppercase">PRIMARY HEX</span>
                    <span className="text-[10px] font-mono font-bold text-white block uppercase mt-0.5">{currentVar.themeColor}</span>
                  </div>
                  <div className="w-6 h-6 rounded border border-white/20 shadow-inner" style={{ backgroundColor: currentVar.themeColor }} />
                </div>

                <div className="bg-black/60 p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[7px] font-mono text-gray-600 block uppercase">SECONDARY HEX</span>
                    <span className="text-[10px] font-mono font-bold text-white block uppercase mt-0.5">{currentVar.accentColor}</span>
                  </div>
                  <div className="w-6 h-6 rounded border border-white/20 shadow-inner" style={{ backgroundColor: currentVar.accentColor }} />
                </div>
              </div>

              <div className="bg-black/60 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[7px] font-mono text-gray-600 block uppercase mb-1">ALCHEMICAL SYNTHESIS FORMULA</span>
                <span className="text-xs font-mono font-bold text-amber-500 tracking-wide block uppercase">
                  {currentVar.alchemicalFormula}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Embedded CSS Animations for rich interactive visuals */}
      <style>{`
        @keyframes spin-clockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-counter {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.15); filter: brightness(1.4) drop-shadow(0 0 8px currentColor); }
        }
        @keyframes hover-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes laser-sweep {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg); }
        }
        .spin-slow {
          animation: spin-clockwise 20s linear infinite;
        }
      `}</style>

    </div>
  );
}
