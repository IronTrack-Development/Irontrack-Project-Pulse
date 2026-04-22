"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Folder, Upload, Home, ClipboardList,
  ChevronRight, ChevronLeft, AlertTriangle, Clock, Flag,
  TrendingUp, CheckCircle2, Circle, Share2, Bell, RefreshCw,
  Plus, QrCode, Eye, HardHat, Truck, Shield,
  Camera, Calendar, Play, RotateCcw, ArrowRight, Copy,
  Printer, UserPlus, GitBranch, Zap, Send,
  Download, History, Target, FileDown,
} from "lucide-react";

const C = {
  bg: "#000000", card: "#1A1A1C", cardHi: "#222225", line: "#2A2A2E",
  text: "#FFFFFF", dim: "#8E8E93", dim2: "#6B6B70",
  orange: "#FF6B1A", orangeDim: "rgba(255,107,26,0.12)",
  red: "#FF3B30", yellow: "#FFCC00", green: "#34C759",
  greenBg: "rgba(52,199,89,0.12)", blue: "#0A84FF",
  blueBg: "rgba(10,132,255,0.12)", purple: "#BF5AF2", teal: "#30D5C8",
};
const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif";

const SCENES = [
  { id: "command", label: "Command Center", sub: "Portfolio overview", icon: LayoutGrid },
  { id: "project", label: "Project Home", sub: "Critical path & pressure", icon: Home },
  { id: "priority", label: "Priority Tab", sub: "Today's must-knows in one screen", icon: Zap },
  { id: "lookahead", label: "3-Week Lookahead + QR", sub: "Weekly QR codes for the trailer", icon: Calendar },
  { id: "sixweek", label: "6-Week Lookahead", sub: "Milestones · Inspections · Procurement", icon: Eye },
  { id: "milestones", label: "Milestones", sub: "What's done, what's coming", icon: Flag },
  { id: "progress", label: "Progress", sub: "Activity breakdown", icon: TrendingUp },
  { id: "reforecast", label: "Reforecast + MPP Export", sub: "Update field, export back to MS Project", icon: GitBranch },
  { id: "reports", label: "Issue Reports", sub: "Generate & share PDFs", icon: ClipboardList },
  { id: "subs", label: "Subs & QR", sub: "Self-registration via QR", icon: QrCode },
];

function PulseLogo({ size = 20, color = "#fff", strokeWidth = 2.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 12 H6 L8.5 6 L11 18 L13.5 9 L16 14 L18 12 H22"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Phone({ children, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {label && (
        <div style={{ fontSize: 11, letterSpacing: 2, color: C.dim, textTransform: "uppercase", fontWeight: 500 }}>{label}</div>
      )}
      <div style={{
        width: 320, height: 680, background: C.bg, borderRadius: 44,
        border: "8px solid #1C1C1E",
        boxShadow: "0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
        overflow: "hidden", position: "relative", display: "flex", flexDirection: "column",
      }}>
        <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 100, height: 28, background: "#000", borderRadius: 20, zIndex: 50 }} />
        <div style={{ position: "absolute", top: 14, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 28px", fontSize: 12, fontWeight: 600, color: C.text, zIndex: 40 }}>
          <span>5:27</span>
          <span style={{ fontSize: 11 }}>●●●● 􀙇</span>
        </div>
        <div style={{ flex: 1, paddingTop: 44, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
      </div>
    </div>
  );
}

function BottomNav({ active = "home", showReport = false }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "projects", label: "Projects", icon: Folder },
    { id: "upload", label: "Upload", icon: Upload },
    { id: "home", label: "Home", icon: Home },
    ...(showReport ? [{ id: "report", label: "Report", icon: ClipboardList }] : []),
  ];
  return (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 0 14px", borderTop: `1px solid ${C.line}`, background: C.bg }}>
      {items.map((it) => {
        const I = it.icon; const on = active === it.id;
        return (
          <div key={it.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <I size={18} color={on ? C.orange : C.dim} strokeWidth={on ? 2.2 : 1.8} />
            <span style={{ fontSize: 9, color: on ? C.orange : C.dim, fontWeight: on ? 600 : 500 }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ fontSize: 9, letterSpacing: 1.4, color: C.dim, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 4, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function MicroStat({ icon: I, color, value, label, rotate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <I size={13} color={color} style={rotate ? { transform: "rotate(45deg)" } : {}} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{value}</span>
      </div>
      <span style={{ fontSize: 9, color: C.dim }}>{label}</span>
    </div>
  );
}

function CommandCenter() {
  return (
    <>
      <div style={{ flex: 1, overflow: "hidden", padding: "16px 18px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text, lineHeight: 1.1, letterSpacing: -0.5 }}>Command<br />Center</div>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>Monday, April 20, 2026</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 28, height: 28, background: C.card, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCw size={13} color={C.dim} />
            </div>
            <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 2.2 }}
              style={{ background: C.orange, borderRadius: 10, padding: "7px 10px", display: "flex", alignItems: "center", gap: 4 }}>
              <Plus size={12} color="#fff" strokeWidth={3} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>Add Project</span>
            </motion.div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <StatCard label="ACTIVE PROJECTS" value="6" color={C.text} />
          <StatCard label="HIGH RISKS" value="11" color={C.red} />
          <StatCard label="OVERDUE ACTIVITIES" value="290" color={C.yellow} />
          <StatCard label="AVG COMPLETION" value="54%" color={C.green} />
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ background: C.card, borderRadius: 16, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, background: C.green, borderRadius: "50%" }} />
              <span style={{ fontSize: 11, color: C.dim }}>—</span>
            </div>
            <div style={{ background: "rgba(52,199,89,0.15)", color: C.green, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 10 }}>100</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginTop: 4 }}>Park 10 Phase A</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: C.dim }}>Schedule Progress</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>93%</span>
          </div>
          <div style={{ height: 6, background: C.line, borderRadius: 3, overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: "93%" }} transition={{ delay: 0.6, duration: 0.8 }} style={{ height: "100%", background: "linear-gradient(90deg, #FF6B1A 0%, #D946A8 50%, #34C759 100%)" }} />
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.line}`, borderRadius: 10, padding: 10, marginTop: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, color: C.dim, fontWeight: 600, marginBottom: 3 }}>TODAY</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Set Transformer & Pull Feeders</div>
            <div style={{ fontSize: 11, color: C.orange, marginTop: 2 }}>Electrical</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 4px", borderBottom: `1px solid ${C.line}`, marginTop: 8 }}>
            <MicroStat icon={AlertTriangle} color={C.green} value={0} label="At Risk" />
            <MicroStat icon={TrendingUp} color={C.green} value={0} label="Critical" rotate />
            <MicroStat icon={Clock} color={C.blue} value="44d" label="To finish" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 10 }}>
            <Flag size={11} color={C.orange} />
            <span style={{ fontSize: 11, color: C.dim, flex: 1 }}>Substantial Completion</span>
            <span style={{ fontSize: 10, color: C.dim }}>Jun 3, 2026</span>
          </div>
        </motion.div>
      </div>
      <BottomNav active="dashboard" />
    </>
  );
}

function SubInfoBox({ label, value, sub }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.line}`, borderRadius: 10, padding: 10 }}>
      <div style={{ fontSize: 8, letterSpacing: 1.2, color: C.dim, fontWeight: 600, lineHeight: 1.3 }}>{label}</div>
      <div style={{ fontSize: 12, color: C.text, fontWeight: 600, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: C.dim, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function MiniGauge({ label, value, color }) {
  const bg = color === C.red ? "rgba(255,59,48,0.08)" : color === C.blue ? "rgba(10,132,255,0.08)" : color === C.green ? "rgba(52,199,89,0.08)" : C.card;
  return (
    <div style={{ flex: 1, background: bg, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: C.dim, marginTop: 4, fontWeight: 500, lineHeight: 1.2 }}>{label}</div>
    </div>
  );
}

function ProjectHome() {
  return (
    <>
      <div style={{ flex: 1, overflow: "hidden", padding: "16px 18px 0" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <MiniGauge label="Critical Pressure" value="Low" color={C.green} />
          <MiniGauge label="Inspections in 7 Days" value="2" color={C.blue} />
          <MiniGauge label="Late Tasks" value="0" color={C.green} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Target size={14} color={C.orange} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: C.text }}>CRITICAL PATH AHEAD</span>
        </div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ background: C.card, borderLeft: `3px solid ${C.orange}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: 1.4, color: C.dim, fontWeight: 600 }}>CURRENT CRITICAL ACTIVITY</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginTop: 3 }}>Set Transformer & Feeders</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 3, display: "flex", gap: 6, alignItems: "center" }}>
            Apr 23, 2026 <ArrowRight size={10} /> May 13, 2026
            <span style={{ color: C.orange, fontWeight: 600, marginLeft: "auto" }}>0% complete</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
            <SubInfoBox label="NEXT CRITICAL SUCCESSOR" value="Energize SES Gear" sub="May 14, 2026" />
            <SubInfoBox label="NEAREST CRITICAL MILESTONE" value="Substantial Completion" sub="Jun 3, 2026" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
            <Clock size={12} color={C.orange} />
            <span style={{ fontSize: 12, color: C.text }}>
              <span style={{ color: C.orange, fontWeight: 700 }}>44 days</span> until finish deadline
            </span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.line}`, borderRadius: 10, padding: 10, marginTop: 10 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.4, color: C.dim, fontWeight: 600, marginBottom: 3 }}>IMPACT</div>
            <div style={{ fontSize: 11, color: C.text, lineHeight: 1.4 }}>"Set Transformer & Feeders" is on the critical path — any delay will compress the schedule</div>
          </div>
        </motion.div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16 }}>
          <Shield size={14} color={C.blue} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: C.text }}>UPCOMING INSPECTIONS</span>
        </div>
        <div style={{ background: C.card, borderRadius: 10, padding: 10, marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Final Electrical Rough-In</div>
          <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>City of Phoenix · Apr 24, 8:00 AM</div>
        </div>
      </div>
      <BottomNav active="home" showReport />
    </>
  );
}

function IconBtn({ children }) {
  return (
    <div style={{ width: 26, height: 26, background: C.card, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </div>
  );
}

function PriorityTab() {
  return (
    <>
      <ProjectHeader tabs={["Priority", "Today", "Tomorrow", "Week 1"]} active={0} projectName="Encanto Storage" projectColor={C.red} />
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        {/* Three pressure gauges */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <MiniGauge label="Critical Pressure" value="High" color={C.red} />
          <MiniGauge label="Inspections in 7 Days" value="1" color={C.blue} />
          <MiniGauge label="Late Tasks" value="21" color={C.red} />
        </div>

        {/* Critical Path Ahead */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <AlertTriangle size={14} color={C.orange} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: C.text }}>CRITICAL PATH AHEAD</span>
        </div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: C.card, borderLeft: `3px solid ${C.orange}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: 1.4, color: C.dim, fontWeight: 600 }}>CURRENT CRITICAL ACTIVITY</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginTop: 3 }}>Encanto Storage</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 3, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            Jul 13, 2025 <ArrowRight size={10} /> Jun 23, 2026
            <span style={{ color: C.orange, fontWeight: 600, marginLeft: "auto" }}>80% complete</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
            <SubInfoBox label="NEXT CRITICAL SUCCESSOR" value="None identified" />
            <SubInfoBox label="NEAREST CRITICAL MILESTONE" value="Building B Unit Frami…" sub="Apr 26, 2026" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
            <Clock size={12} color={C.orange} />
            <span style={{ fontSize: 12, color: C.text }}>
              <span style={{ color: C.orange, fontWeight: 700 }}>64 days</span> until finish deadline
            </span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.line}`, borderRadius: 10, padding: 10, marginTop: 10 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.4, color: C.dim, fontWeight: 600, marginBottom: 3 }}>IMPACT</div>
            <div style={{ fontSize: 11, color: C.text, lineHeight: 1.4 }}>"Encanto Storage" is on the critical path — any delay will compress the schedule</div>
          </div>
        </motion.div>

        {/* Upcoming Inspections */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Shield size={14} color={C.blue} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: C.text, flex: 1 }}>UPCOMING INSPECTIONS</span>
          <span style={{ fontSize: 10, color: C.blue, fontWeight: 600 }}>1 in next 7 days</span>
        </div>

        <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          style={{ background: C.card, borderLeft: `3px solid ${C.blue}`, borderRadius: 12, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ background: "rgba(255,59,48,0.15)", color: C.red, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 6, letterSpacing: 0.5 }}>AT RISK</span>
              <span style={{ fontSize: 10, color: C.dim }}>7d away</span>
            </div>
            <Shield size={13} color={C.blue} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.35 }}>
            T-4 Weeks: SES Installed, Inspected, and Green Tagged by City of Buckeye
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 10, color: C.dim }}>
            <span>Linked to: Secondary Install Finish</span>
            <span>Due: Apr 27, 2026</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 10, color: C.orange }}>
            <Send size={10} /> Ready Check
          </div>
        </motion.div>
      </div>
      <BottomNav active="home" showReport />
    </>
  );
}

function ProjectHeader({ tabs, active, projectName = "Park 10 Phase A", projectColor = "#FFCC00" }) {
  return (
    <div style={{ padding: "4px 14px 0", borderBottom: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: C.dim }}>
          <ChevronLeft size={14} /> Back
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <IconBtn><RefreshCw size={12} color={C.dim} /></IconBtn>
          <IconBtn><Bell size={12} color={C.orange} /></IconBtn>
          <div style={{ background: C.cardHi, borderRadius: 8, padding: "5px 10px", display: "flex", alignItems: "center", gap: 4 }}>
            <Share2 size={11} color={C.text} />
            <span style={{ fontSize: 10, color: C.text, fontWeight: 500 }}>Share</span>
          </div>
          <div style={{ background: C.orange, borderRadius: 8, padding: "5px 7px", display: "flex", alignItems: "center" }}>
            <ClipboardList size={12} color="#fff" />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <div style={{ width: 8, height: 8, background: projectColor, borderRadius: "50%" }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{projectName}</div>
      </div>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 2 }}>
        {tabs.map((t, i) => (
          <div key={t} style={{ fontSize: 12, fontWeight: 600, color: i === active ? C.orange : C.dim, borderBottom: i === active ? `2px solid ${C.orange}` : "2px solid transparent", paddingBottom: 6, whiteSpace: "nowrap" }}>{t}</div>
        ))}
      </div>
    </div>
  );
}

function DayBlock({ day, date, items }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ background: C.card, borderRadius: 12, padding: 12, marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: C.dim, fontWeight: 500 }}>{day}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 1, marginBottom: 10 }}>{date}</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderTop: i === 0 ? `1px solid ${C.line}` : "none", borderBottom: i === items.length - 1 ? "none" : `1px solid ${C.line}` }}>
          <div style={{ flex: 1, paddingRight: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{it.name}</div>
            <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{it.range}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.dim }}>{it.pct}%</div>
        </div>
      ))}
    </motion.div>
  );
}

function QrBoxSmall() {
  const cells = [];
  const pattern = "11111110010011111110100000100110100000011011101010001011101100101011100010110010111011011010010111011101001011101100000101100100001111111010101011111110000000001000000000011010011111110011001011110001001111100101111100000111010001110101110011100000000110100110110110110001110001001011010110011001110001101001000000010101011111111000101101001110000010111110111111101110001001011010011101001011101111100100011011111110101010111001";
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const on = pattern[(y * 21 + x) % pattern.length] === "1";
      cells.push(<div key={`${x}-${y}`} style={{ background: on ? "#000" : "#fff" }} />);
    }
  }
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(21, 1fr)", gridTemplateRows: "repeat(21, 1fr)", width: 90, height: 90 }}>{cells}</div>;
}

function Lookahead() {
  // Two states: lookahead view → tap QR → QR modal
  const [showQr, setShowQr] = useState(false);
  useEffect(() => {
    const seq = setInterval(() => setShowQr((s) => !s), 4500);
    return () => clearInterval(seq);
  }, []);

  return (
    <>
      <ProjectHeader tabs={["Priority", "Today", "Tomorrow", "Week 1"]} active={3} />
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", position: "relative" }}>
        <motion.div
          animate={{ borderColor: showQr ? C.orange : C.line }}
          transition={{ duration: 0.3 }}
          style={{ background: C.card, borderRadius: 12, padding: 12, marginBottom: 10, border: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: C.dim, fontWeight: 500 }}>Week 1</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 1 }}>Apr 19 – Apr 25</div>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <motion.div
              animate={{ scale: showQr ? [1, 1.1, 1] : 1, boxShadow: showQr ? "0 0 0 4px rgba(255,107,26,0.25)" : "0 0 0 0 rgba(255,107,26,0)" }}
              transition={{ duration: 0.6 }}
              style={{ background: C.cardHi, borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 4 }}>
              <QrCode size={12} color={C.orange} />
              <span style={{ fontSize: 10, color: C.text, fontWeight: 600 }}>QR</span>
            </motion.div>
            <div style={{ background: C.cardHi, borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 4 }}>
              <Share2 size={11} color={C.text} />
              <span style={{ fontSize: 10, color: C.text, fontWeight: 500 }}>Share</span>
            </div>
          </div>
        </motion.div>

        <DayBlock day="Thu" date="Apr 23" items={[
          { name: "Set Transformer and Pull Feeders from Transformer to SES Gear", range: "Apr 23 → May 13", pct: 0 },
        ]} />
        <DayBlock day="Fri" date="Apr 24" items={[
          { name: "Final Electrical Rough-In Inspection", range: "Apr 24 → Apr 24", pct: 0 },
        ]} />

        {/* QR modal overlay */}
        <AnimatePresence>
          {showQr && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 14, backdropFilter: "blur(8px)" }}>
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                style={{ background: C.card, borderRadius: 16, padding: 16, width: "100%", maxWidth: 280 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <QrCode size={13} color={C.orange} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Week 1 Lookahead QR</span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: C.dim, marginBottom: 12, lineHeight: 1.4 }}>
                  Post in trailer. Subs scan to view this week's schedule on their phone — no app, no login.
                </div>
                <div style={{ background: "#fff", borderRadius: 8, padding: 14, display: "flex", justifyContent: "center" }}>
                  <QrBoxSmall />
                </div>
                <div style={{ textAlign: "center", fontSize: 10, color: C.dim, marginTop: 10 }}>
                  Park 10 Phase A · Apr 19 – Apr 25
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  <div style={{ flex: 1, background: C.cardHi, borderRadius: 8, padding: "8px 0", textAlign: "center", fontSize: 10, color: C.text, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Copy size={10} /> Copy</div>
                  <div style={{ flex: 1, background: C.orange, borderRadius: 8, padding: "8px 0", textAlign: "center", fontSize: 10, color: "#000", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Printer size={10} /> Print</div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav active="home" showReport />
    </>
  );
}

function CatTile({ icon: I, color, val, label }) {
  return (
    <div style={{ background: C.card, borderRadius: 10, padding: "10px 4px", textAlign: "center" }}>
      <I size={16} color={color} style={{ marginBottom: 3 }} />
      <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 9, color: C.dim, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function SectionHeader({ icon: I, color, title, badge }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, marginBottom: 8 }}>
      <I size={14} color={color} />
      <span style={{ fontSize: 12, fontWeight: 700, color: C.text, flex: 1 }}>{title}</span>
      <div style={{ background: C.cardHi, borderRadius: 8, padding: "2px 8px", fontSize: 10, color: C.orange, fontWeight: 600 }}>{badge}</div>
    </div>
  );
}

function UpcomingItem({ title, range, tag, away }) {
  return (
    <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} style={{ background: C.card, borderRadius: 10, padding: 10, marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text, flex: 1, paddingRight: 6 }}>{title}</div>
        <div style={{ background: "rgba(255,107,26,0.15)", color: C.orange, fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 8 }}>Upcoming</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 10, color: C.dim, alignItems: "center" }}>
        <span>{range}</span>
        <span style={{ background: C.cardHi, padding: "1px 6px", borderRadius: 6 }}>{tag}</span>
        <span style={{ color: C.orange, fontWeight: 600, marginLeft: "auto" }}>{away}</span>
      </div>
    </motion.div>
  );
}

function SixWeek() {
  return (
    <>
      <ProjectHeader tabs={["Week 2", "Week 3", "6-Week", "Milestones"]} active={2} />
      <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>6-Week Lookahead</div>
        <div style={{ fontSize: 11, color: C.dim, marginTop: 2, marginBottom: 14 }}>May 12 — Jun 2 · 16 activities</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
          <CatTile icon={Flag} color={C.orange} val="4" label="Milestones" />
          <CatTile icon={ClipboardList} color={C.blue} val="2" label="Inspections" />
          <CatTile icon={Truck} color={C.purple} val="1" label="Procurement" />
          <CatTile icon={HardHat} color={C.teal} val="9" label="Mobilizations" />
        </div>
        <SectionHeader icon={Flag} color={C.orange} title="Upcoming Milestones" badge="4" />
        <UpcomingItem title="Energize SES Gear" range="May 14 → May 14" tag="Electrical" away="22d away" />
        <UpcomingItem title="Owners Punch" range="May 18 → Jun 1" tag="Closeout" away="26d away" />
        <UpcomingItem title="Final Inspections & Cert" range="May 25 → Jun 3" tag="Inspection" away="33d away" />
        <SectionHeader icon={Truck} color={C.purple} title="Long-Lead & Procurement" badge="1" />
        <div style={{ fontSize: 11, color: C.dim, padding: "4px 2px" }}>Items that need ordering/fabrication NOW to land in 4–6 weeks</div>
      </div>
      <BottomNav active="home" showReport />
    </>
  );
}

function Milestones() {
  const items = [
    { name: "Notice to Proceed", date: "Aug 18, 2025", pct: 100, state: "complete" },
    { name: "Demo Complete", date: "Sep 23, 2025", pct: 100, state: "complete" },
    { name: "Foundation Complete", date: "Nov 5, 2025", pct: 100, state: "complete" },
    { name: "Framing Complete", date: "Jan 17, 2026", pct: 100, state: "complete" },
    { name: "MEP Rough-In Complete", date: "Mar 5, 2026", pct: 100, state: "complete" },
    { name: "Energize SES Gear", date: "May 14, 2026", pct: 0, state: "upcoming" },
    { name: "Substantial Completion", date: "Jun 3, 2026", pct: 0, state: "upcoming" },
  ];
  return (
    <>
      <ProjectHeader tabs={["Week 3", "6-Week", "Milestones", "Progress"]} active={2} />
      <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
        {items.map((m, i) => {
          const done = m.state === "complete";
          return (
            <motion.div key={m.name} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{
                background: done ? "rgba(52,199,89,0.06)" : "rgba(255,107,26,0.06)",
                border: `1px solid ${done ? "rgba(52,199,89,0.2)" : "rgba(255,107,26,0.2)"}`,
                borderRadius: 12, padding: 12, marginBottom: 8, display: "flex", alignItems: "center", gap: 10,
              }}>
              {done ? <CheckCircle2 size={18} color={C.green} /> : <Clock size={18} color={C.orange} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.name}</div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>
                  {m.date} <span style={{ color: done ? C.green : C.orange, marginLeft: 6 }}>{done ? "Complete" : "Upcoming"}</span>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: done ? C.green : C.dim }}>{m.pct}%</div>
            </motion.div>
          );
        })}
      </div>
      <BottomNav active="home" showReport />
    </>
  );
}

function ProgressRow({ label, val, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontSize: 12, color: C.text }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{val}</span>
    </div>
  );
}

function ProgressView() {
  return (
    <>
      <ProjectHeader tabs={["6-Week", "Milestones", "Progress", "Reforecast"]} active={2} />
      <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: C.card, borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 12 }}>
          <TrendingUp size={22} color={C.orange} />
          <div style={{ fontSize: 48, fontWeight: 800, color: C.orange, marginTop: 4, letterSpacing: -2 }}>93%</div>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>Project Complete</div>
        </motion.div>
        <div style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: C.dim }}>Progress</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>93%</span>
          </div>
          <div style={{ height: 8, background: C.line, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
            <motion.div initial={{ width: 0 }} animate={{ width: "93%" }} transition={{ duration: 0.9 }} style={{ height: "100%", background: C.orange, borderRadius: 4 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: C.cardHi, borderRadius: 10, padding: 12 }}>
              <CheckCircle2 size={14} color={C.green} />
              <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginTop: 6 }}>339</div>
              <div style={{ fontSize: 10, color: C.dim }}>Complete</div>
            </div>
            <div style={{ background: C.cardHi, borderRadius: 10, padding: 12 }}>
              <Circle size={14} color={C.dim} />
              <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginTop: 6 }}>17</div>
              <div style={{ fontSize: 10, color: C.dim }}>In Progress</div>
            </div>
          </div>
        </div>
        <div style={{ background: C.card, borderRadius: 16, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Activity Breakdown</div>
          <ProgressRow label="Total Activities" val="375" color={C.text} />
          <ProgressRow label="Complete" val="339" color={C.green} />
          <ProgressRow label="In Progress" val="17" color={C.orange} />
          <ProgressRow label="Not Started" val="19" color={C.dim} />
        </div>
      </div>
      <BottomNav active="home" showReport />
    </>
  );
}

// ============================================================
// NEW SCENE — REFORECAST + MSPDI EXPORT
// ============================================================
function Reforecast() {
  const [state, setState] = useState(0); // 0 dashboard, 1 update progress, 2 reforecasting, 3 export
  useEffect(() => {
    const t = setInterval(() => setState((s) => (s + 1) % 4), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <ProjectHeader tabs={["Progress", "Reforecast", "Reports", "Subs"]} active={1} />
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <AnimatePresence mode="wait">
          {state === 0 && (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: "12px 14px", height: "100%", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <TrendingUp size={15} color={C.orange} />
                <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Schedule Reforecast</span>
              </div>
              <div style={{ fontSize: 10, color: C.dim, marginBottom: 12 }}>Deterministic CPM engine — zero AI</div>

              <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
                <div style={{ background: C.cardHi, borderRadius: 8, padding: "7px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                  <History size={11} color={C.dim} />
                  <span style={{ fontSize: 10, color: C.text, fontWeight: 500 }}>History</span>
                </div>
                <div style={{ background: C.cardHi, borderRadius: 8, padding: "7px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                  <Download size={11} color={C.dim} />
                  <span style={{ fontSize: 10, color: C.text, fontWeight: 500 }}>Export MSPDI</span>
                </div>
                <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}
                  style={{ background: C.orange, borderRadius: 8, padding: "7px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                  <RefreshCw size={11} color="#000" />
                  <span style={{ fontSize: 10, color: "#000", fontWeight: 700 }}>Reforecast</span>
                </motion.div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div style={{ background: C.card, borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.3, color: C.dim, fontWeight: 600 }}>COMPLETION</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.text, marginTop: 4, lineHeight: 1 }}>93%</div>
                  <div style={{ height: 4, background: C.line, borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                    <div style={{ width: "93%", height: "100%", background: "linear-gradient(90deg, #FF6B1A 0%, #34C759 100%)" }} />
                  </div>
                </div>
                <div style={{ background: C.card, borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.3, color: C.dim, fontWeight: 600 }}>FORECAST DELTA</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.green, marginTop: 4, lineHeight: 1.1 }}>On Schedule</div>
                  <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>Finish: Jun 3, 2026</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ background: C.card, borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.3, color: C.dim, fontWeight: 600 }}>CRITICAL PATH</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.red, marginTop: 4, lineHeight: 1 }}>0</div>
                  <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>of 375 total tasks</div>
                </div>
                <div style={{ background: C.card, borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.3, color: C.dim, fontWeight: 600 }}>AT RISK</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.green, marginTop: 4, lineHeight: 1 }}>0</div>
                  <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>339 / 17 in progress</div>
                </div>
              </div>

              <div style={{ background: C.card, borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={13} color={C.blue} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text, flex: 1 }}>Update Progress</span>
                  <span style={{ fontSize: 10, color: C.dim }}>Tap a task to update</span>
                </div>
              </div>
            </motion.div>
          )}

          {state === 1 && (
            <motion.div key="update" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ padding: "12px 14px", height: "100%", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <ChevronLeft size={14} color={C.dim} />
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Update Progress</span>
              </div>
              <div style={{ fontSize: 10, color: C.dim, marginBottom: 10 }}>Adjust % complete in the field — your scheduler updates the .mpp later</div>

              <UpdateRow name="MEP Rough-In" old={85} newPct={100} />
              <UpdateRow name="Drywall L2" old={60} newPct={80} updating />
              <UpdateRow name="Set Transformer" old={0} newPct={15} />
              <UpdateRow name="Pull Feeders to SES" old={0} newPct={5} />

              <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ background: C.orange, borderRadius: 8, padding: "10px 0", textAlign: "center", marginTop: 12, fontSize: 12, fontWeight: 700, color: "#000" }}>
                Run Reforecast →
              </motion.div>
            </motion.div>
          )}

          {state === 2 && (
            <motion.div key="reforecasting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: "20px 14px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}>
                <RefreshCw size={48} color={C.orange} strokeWidth={1.6} />
              </motion.div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginTop: 16 }}>Reforecasting...</div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 4, textAlign: "center" }}>Recomputing critical path & finish dates</div>
              <div style={{ width: "80%", marginTop: 20 }}>
                <SyncStep label="Reading 375 activities" done />
                <SyncStep label="Recalculating dependencies" done />
                <SyncStep label="Forward & backward pass" active />
                <SyncStep label="Building MSPDI XML" />
                <SyncStep label="Finalizing..." last />
              </div>
            </motion.div>
          )}

          {state === 3 && (
            <motion.div key="export" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ padding: "14px", height: "100%", overflowY: "auto" }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.5 }}
                style={{ background: "rgba(52,199,89,0.08)", border: `1px solid rgba(52,199,89,0.3)`, borderRadius: 14, padding: 14, marginBottom: 12, textAlign: "center" }}>
                <CheckCircle2 size={32} color={C.green} style={{ marginBottom: 6 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Reforecast Complete</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Finish date pulled in by 2 days · still on schedule</div>
              </motion.div>

              <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <FileDown size={16} color={C.orange} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>park10-reforecast-04-21.xml</div>
                    <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>MSPDI · 2.4 MB · 375 activities</div>
                  </div>
                </div>
                <div style={{ background: C.cardHi, borderRadius: 8, padding: 10, fontSize: 10, color: C.dim, lineHeight: 1.5 }}>
                  <span style={{ color: C.green, fontWeight: 600 }}>✓</span> Opens directly in MS Project<br />
                  <span style={{ color: C.green, fontWeight: 600 }}>✓</span> Preserves all logic ties & calendars<br />
                  <span style={{ color: C.green, fontWeight: 600 }}>✓</span> Updated % complete + actual dates
                </div>
                <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                  style={{ background: C.orange, borderRadius: 8, padding: "10px 0", textAlign: "center", marginTop: 10, fontSize: 12, fontWeight: 700, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Download size={12} /> Download .xml
                </motion.div>
              </div>

              <div style={{ background: "rgba(255,107,26,0.06)", border: `1px solid rgba(255,107,26,0.2)`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10, color: C.orange, fontWeight: 600, letterSpacing: 1.2, marginBottom: 4 }}>SCHEDULER WORKFLOW</div>
                <div style={{ fontSize: 11, color: C.text, lineHeight: 1.4 }}>
                  Email this to your scheduler. They open in MS Project, review, and accept the field updates — no manual % entry.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: i === state ? 16 : 5, height: 5, borderRadius: 3, background: i === state ? C.orange : C.line, transition: "all 0.3s" }} />
          ))}
        </div>
      </div>
      <BottomNav active="home" showReport />
    </>
  );
}

function UpdateRow({ name, old, newPct, updating }) {
  return (
    <motion.div animate={updating ? { borderColor: [C.line, C.orange, C.line] } : {}} transition={{ duration: 1.5, repeat: Infinity }}
      style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: 10, marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, color: C.dim, textDecoration: "line-through" }}>{old}%</span>
          <ArrowRight size={10} color={C.orange} />
          <span style={{ fontSize: 13, color: C.green, fontWeight: 700 }}>{newPct}%</span>
        </div>
      </div>
      <div style={{ height: 4, background: C.line, borderRadius: 2, marginTop: 6, overflow: "hidden", position: "relative" }}>
        <motion.div initial={{ width: `${old}%` }} animate={{ width: `${newPct}%` }} transition={{ duration: 0.6 }}
          style={{ height: "100%", background: C.green }} />
      </div>
    </motion.div>
  );
}

function PriPill({ label, active }) {
  const colors = { High: C.red, Medium: C.yellow, Low: C.card };
  const bg = active ? colors[label] : C.card;
  const color = active ? (label === "Medium" ? "#000" : "#fff") : C.text;
  return (<div style={{ flex: 1, background: bg, borderRadius: 8, padding: "8px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color }}>{label}</div>);
}

function CatPill({ label, active }) {
  return (<div style={{ flex: 1, background: active ? C.blue : C.card, borderRadius: 8, padding: "8px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#fff" }}>{label}</div>);
}

function Reports() {
  const [state, setState] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setState((s) => (s + 1) % 4), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <ProjectHeader tabs={["Reforecast", "Reports", "Subs", "Settings"]} active={1} />
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <AnimatePresence mode="wait">
          {state === 0 && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <ClipboardList size={15} color={C.orange} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Issue Reports</div>
                  <div style={{ fontSize: 10, color: C.dim }}>1 report generated</div>
                </div>
                <div style={{ background: C.orange, borderRadius: 8, padding: "6px 9px", display: "flex", alignItems: "center", gap: 4 }}>
                  <ClipboardList size={10} color="#fff" />
                  <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>New Report</span>
                </div>
              </div>
              <div style={{ background: C.card, borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, background: C.blueBg, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ClipboardList size={15} color={C.blue} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>IR-001</span>
                      <span style={{ background: C.greenBg, color: C.green, fontSize: 9, padding: "2px 6px", borderRadius: 6, fontWeight: 600 }}>Generated</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 3 }}>SES Gear Pad</div>
                    <div style={{ fontSize: 10, color: C.dim, marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: C.red }}>⚠ 1 issue</span>
                      <span>Apr 17, 2026</span>
                      <span>Electrical</span>
                    </div>
                    <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>By Kevin Callahan</div>
                  </div>
                </div>
                <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 10, paddingTop: 8, textAlign: "center", fontSize: 11, color: C.dim }}>
                  View Report <ChevronRight size={11} style={{ display: "inline", verticalAlign: "middle" }} />
                </div>
              </div>
            </motion.div>
          )}

          {state === 1 && (
            <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 26, height: 26, background: C.card, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronLeft size={13} color={C.text} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 5 }}>
                    <ClipboardList size={12} color={C.orange} /> Generate Report
                  </div>
                  <div style={{ fontSize: 10, color: C.dim }}>Step 1: Select Schedule Item</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 3, background: C.orange, borderRadius: 2 }} />
                <div style={{ flex: 1, height: 3, background: C.line, borderRadius: 2 }} />
                <div style={{ flex: 1, height: 3, background: C.line, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 10, letterSpacing: 1.4, color: C.dim, fontWeight: 600, marginBottom: 8 }}>THIS WEEK (45)</div>
              {[
                { name: "Set Transformer & Feeders", tag: "Electrical", range: "Apr 23 – May 13" },
                { name: "Energize SES Gear", tag: "Electrical", range: "May 14 – May 14" },
                { name: "SES Gear Pad", tag: "Electrical", range: "Apr 17 – Apr 17", highlighted: true },
              ].map((it) => (
                <motion.div key={it.name}
                  animate={it.highlighted ? { borderColor: [C.line, C.orange, C.line] } : {}}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: 11, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{it.name}</div>
                    <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>
                      <span style={{ color: C.orange }}>🔧 {it.tag}</span> · {it.range}
                    </div>
                  </div>
                  <ChevronRight size={13} color={C.dim} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {state === 2 && (
            <motion.div key="add" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Add Issue</div>
              <div style={{ border: `2px dashed ${C.line}`, borderRadius: 12, padding: 24, textAlign: "center", marginBottom: 12 }}>
                <Camera size={22} color={C.orange} />
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginTop: 6 }}>Take Photo / Choose from Library</div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>Tap to open camera</div>
              </div>
              <div style={{ fontSize: 9, letterSpacing: 1.3, color: C.dim, fontWeight: 600, marginBottom: 5 }}>ISSUE TITLE *</div>
              <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 9, padding: "10px 12px", fontSize: 12, color: C.text, marginBottom: 12 }}>Pad elevation off by 1.5"</div>
              <div style={{ fontSize: 9, letterSpacing: 1.3, color: C.dim, fontWeight: 600, marginBottom: 5 }}>PRIORITY</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
                <PriPill label="High" active />
                <PriPill label="Medium" />
                <PriPill label="Low" />
              </div>
              <div style={{ fontSize: 9, letterSpacing: 1.3, color: C.dim, fontWeight: 600, marginBottom: 5 }}>CATEGORY</div>
              <div style={{ display: "flex", gap: 5 }}>
                <CatPill label="QA/QC" active />
                <CatPill label="Safety" />
                <CatPill label="Schedule" />
              </div>
            </motion.div>
          )}

          {state === 3 && (
            <motion.div key="pdf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ background: "#F7F8FA", height: "100%", padding: 12, overflow: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#1E3A5F" }}>IR-001</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <div style={{ background: "#E5E7EB", borderRadius: 6, padding: "4px 8px", fontSize: 10, color: "#333", fontWeight: 600 }}>← Back</div>
                  <div style={{ background: C.orange, borderRadius: 6, padding: "4px 8px", fontSize: 10, color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                    <Printer size={10} /> Print PDF
                  </div>
                </div>
              </div>
              <div style={{ background: "#1E3A5F", borderRadius: 8, padding: "16px 12px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>ISSUE REPORT</span>
                  <span style={{ fontSize: 11, color: "#9DB5D4" }}>IR-001</span>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1E3A5F", marginBottom: 10 }}>Project Issue Report</div>
              <div style={{ background: "#fff", borderRadius: 8, padding: 10, fontSize: 10, lineHeight: 1.7, border: "1px solid #E5E7EB" }}>
                <div><strong style={{ color: "#1E3A5F" }}>Schedule Item:</strong> <span style={{ color: "#333" }}>SES Gear Pad</span></div>
                <div><strong style={{ color: "#1E3A5F" }}>Report #:</strong> <span style={{ color: "#333" }}>IR-001</span></div>
                <div><strong style={{ color: "#1E3A5F" }}>Date:</strong> <span style={{ color: "#333" }}>April 17, 2026</span></div>
                <div><strong style={{ color: "#1E3A5F" }}>Trade:</strong> <span style={{ color: "#333" }}>Electrical</span></div>
                <div><strong style={{ color: "#1E3A5F" }}>Prepared By:</strong> <span style={{ color: "#333" }}>Kevin Callahan</span></div>
                <div><strong style={{ color: "#1E3A5F" }}>Summary:</strong> <span style={{ color: "#D32F2F", fontWeight: 600 }}>1 Issue Identified</span></div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1E3A5F", marginTop: 12, marginBottom: 6, letterSpacing: 0.5 }}>ISSUE SUMMARY</div>
              <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #E5E7EB", fontSize: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 80px", background: "#1E3A5F", color: "#fff", padding: "6px 8px", fontWeight: 700, fontSize: 9, letterSpacing: 1 }}>
                  <span>#</span><span>ISSUE</span><span>PRIORITY</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 80px", padding: "8px", fontSize: 10, color: "#333" }}>
                  <span>01</span>
                  <span style={{ fontWeight: 600 }}>Pad elevation off by 1.5"</span>
                  <span style={{ background: "#FFE5E5", color: C.red, padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 600, textAlign: "center", alignSelf: "flex-start" }}>High</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: i === state ? 16 : 5, height: 5, borderRadius: 3, background: i === state ? C.orange : C.line, transition: "all 0.3s" }} />
          ))}
        </div>
      </div>
      <BottomNav active="home" showReport />
    </>
  );
}

function SyncStep({ label, done, active, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: last ? "none" : `1px solid ${C.line}` }}>
      {done ? <CheckCircle2 size={12} color={C.green} /> :
        active ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><RefreshCw size={12} color={C.orange} /></motion.div> :
          <Circle size={12} color={C.dim2} />}
      <span style={{ fontSize: 11, color: done ? C.text : active ? C.text : C.dim, fontWeight: active ? 600 : 400 }}>{label}</span>
    </div>
  );
}


function SubRow({ name, contact, tasks }) {
  return (
    <div style={{ background: C.card, borderRadius: 12, padding: 12, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{name}</span>
            <span style={{ fontSize: 10, color: C.dim }}>({contact})</span>
          </div>
          <div style={{ background: "rgba(255,107,26,0.15)", color: C.orange, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 6, marginTop: 6, display: "inline-block" }}>{tasks} tasks assigned</div>
        </div>
        <div style={{ background: C.cardHi, borderRadius: 8, padding: "5px 9px", fontSize: 10, color: C.text, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
          <Copy size={10} /> Copy Link
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 10, color: C.green }}>
        <CheckCircle2 size={11} /> Acknowledged by Kevin Callahan
      </div>
    </div>
  );
}

function QrPlaceholder() {
  const cells = [];
  const pattern = "11111110010011111110100000100110100000011011101010001011101100101011100010110010111011011010010111011101001011101100000101100100001111111010101011111110000000001000000000011010011111110011001011110001001111100101111100000111010001110101110011100000000110100110110110110001110001001011010110011001110001101001000000010101011111111000101101001110000010111110111111101110001001011010011101001011101111100100011011111110101010111001";
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const on = pattern[(y * 21 + x) % pattern.length] === "1";
      cells.push(<div key={`${x}-${y}`} style={{ background: on ? "#000" : "#fff" }} />);
    }
  }
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(21, 1fr)", gridTemplateRows: "repeat(21, 1fr)", width: 140, height: 140 }}>{cells}</div>;
}

function SubsQR() {
  return (
    <>
      <ProjectHeader tabs={["Reports", "Subs", "Integrations", "Settings"]} active={1} />
      <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Subcontractors</div>
            <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>2 subs on this project</div>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <motion.div animate={{ boxShadow: ["0 0 0 0 rgba(255,107,26,0)", "0 0 0 8px rgba(255,107,26,0.2)", "0 0 0 0 rgba(255,107,26,0)"] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ background: C.card, borderRadius: 8, padding: "5px 9px", display: "flex", alignItems: "center", gap: 4 }}>
              <QrCode size={11} color={C.text} />
              <span style={{ fontSize: 10, color: C.text, fontWeight: 600 }}>QR Code</span>
            </motion.div>
            <div style={{ background: C.orange, borderRadius: 8, padding: "5px 9px", display: "flex", alignItems: "center", gap: 4 }}>
              <UserPlus size={11} color="#fff" />
              <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>Add Sub</span>
            </div>
          </div>
        </div>
        <SubRow name="ATS Electric" contact="Mark" tasks={6} />
        <SubRow name="Rouser Concrete" contact="Kevin Callahan" tasks={2} />
        <div style={{ marginTop: 16, background: C.card, borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <QrCode size={13} color={C.orange} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>Sub Self-Registration QR</span>
          </div>
          <div style={{ fontSize: 10, color: C.dim, marginBottom: 10, lineHeight: 1.4 }}>Post in trailer. Subs scan to self-register and see their schedule.</div>
          <div style={{ background: "#fff", borderRadius: 8, padding: 12, display: "flex", justifyContent: "center" }}>
            <QrPlaceholder />
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <div style={{ flex: 1, background: C.cardHi, borderRadius: 8, padding: "8px 0", textAlign: "center", fontSize: 11, color: C.text, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Copy size={10} /> Copy Link</div>
            <div style={{ flex: 1, background: C.cardHi, borderRadius: 8, padding: "8px 0", textAlign: "center", fontSize: 11, color: C.text, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Printer size={10} /> Print</div>
          </div>
        </div>
      </div>
      <BottomNav active="home" showReport />
    </>
  );
}

const SCENE_COPY = [
  "One screen. Every project's pulse. Active count, high-risk flags, overdue activities, average completion — plus each project's health score, today's priority activity, and nearest milestone. This is what a super or PM opens at 5 AM before the crew rolls in.",
  "Critical Pressure tells you the truth in one word: High, Medium, Low. Then it names the specific activity driving that pressure, its percent complete, the nearest critical milestone, and days until deadline — with a plain-English impact statement. No digging. No guessing.",
  "The Priority tab is the super's first tap of the day. Three pressure gauges across the top — Critical Pressure, Inspections in 7 Days, Late Tasks — then the critical activity, then the at-risk inspections with linked tasks and Ready Check status. Everything that needs attention today, surfaced before the super has to go looking. This is the screen that turns the app from 'a place to check on the schedule' into 'a place to find out what's about to bite you.'",
  "Each weekly tab now has its own QR code. Print it, post it in the trailer, and any sub on site can scan to view that week's schedule on their phone — no app install, no login, no friction. This is the difference between subs who 'have access' and subs who actually look.",
  "The lookahead a PM actually needs: milestones due, inspections scheduled, long-lead items that need ordering NOW to land in 4–6 weeks, and subs to mobilize. Color-coded by category so your eye goes where it needs to.",
  "Completed milestones in green, upcoming in orange, with exact dates and percent complete. This is what you screenshot and drop in the owner's weekly email.",
  "Big number up top — project percent complete. Then complete vs. remaining, plus total activity breakdown. Built for the 60-second executive update.",
  "The killer feature for schedulers. Update % complete on activities in the field, run the deterministic CPM engine — zero AI, zero black box — and export a clean MSPDI .xml that opens directly in MS Project. Your scheduler stops doing manual percent updates. Your super stops emailing screenshots. Same source of truth, just faster.",
  "Pick a schedule item, snap a photo, add a priority, add a category, generate a branded PDF. This is the piece that saves supers an hour a day — no more Word docs, no more photo-pasting, no more formatting hell.",
  "The QR code goes in the job trailer. Subs scan it, self-register, and see only their own tasks — nothing else. No accounts to create, no training, no friction. This is the feature that makes sub adoption actually happen.",
];

const btnBase = { fontFamily: FONT, fontSize: 11, letterSpacing: 1.4, fontWeight: 700, padding: "8px 14px", border: "none", borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s" };
const btnPrimary = { ...btnBase, background: C.orange, color: "#000" };
const btnGhost = { ...btnBase, background: "transparent", color: C.text, border: `1px solid ${C.line}` };

export default function IronTrackDemo() {
  const [scene, setScene] = useState(0);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => setScene((s) => (s + 1) % SCENES.length), 6500);
    return () => clearTimeout(t);
  }, [auto, scene]);

  const views = [CommandCenter, ProjectHome, PriorityTab, Lookahead, SixWeek, Milestones, ProgressView, Reforecast, Reports, SubsQR];
  const SceneView = views[scene];
  const sc = SCENES[scene];

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(1200px 600px at 85% -5%, rgba(255,107,26,0.08), transparent 60%), radial-gradient(900px 500px at -5% 105%, rgba(10,132,255,0.06), transparent 60%), #0A0A0C`,
      color: C.text, fontFamily: FONT, padding: "24px 28px 40px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: C.orange, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PulseLogo size={22} color="#fff" strokeWidth={2.6} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>IronTrack <span style={{ color: C.orange }}>Project Pulse</span></div>
            <div style={{ fontSize: 10, color: C.dim, letterSpacing: 1.6, marginTop: 2, fontWeight: 500 }}>INTERNAL WALKTHROUGH · GC SIDE</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setAuto(false); setScene(0); }} style={btnGhost}><RotateCcw size={12} /> RESET</button>
          <button onClick={() => setAuto(!auto)} style={{ ...btnPrimary, background: auto ? C.card : C.orange, color: auto ? C.orange : "#000" }}>
            <Play size={12} fill={auto ? C.orange : "#000"} /> {auto ? "AUTOPLAYING" : "AUTOPLAY"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 40, alignItems: "flex-start" }}>
        <div style={{ display: "flex", justifyContent: "center", position: "sticky", top: 20 }}>
          <AnimatePresence mode="wait">
            <motion.div key={scene} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.35 }}>
              <Phone label={sc.label}><SceneView /></Phone>
            </motion.div>
          </AnimatePresence>
        </div>

        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: C.orange, fontWeight: 700, marginBottom: 6 }}>SCENE {String(scene + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}</div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10 }}>{sc.label}</div>
          <div style={{ fontSize: 15, color: C.dim, marginBottom: 24, lineHeight: 1.5 }}>{sc.sub}</div>
          <div style={{ marginBottom: 28, padding: 18, background: C.orangeDim, borderLeft: `3px solid ${C.orange}`, borderRadius: 6 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: C.orange, fontWeight: 700, marginBottom: 6 }}>WHY IT MATTERS</div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.55 }}>{SCENE_COPY[scene]}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 4 }}>
            {SCENES.map((s, i) => {
              const I = s.icon; const on = i === scene;
              return (
                <div key={s.id} onClick={() => { setAuto(false); setScene(i); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: on ? C.card : "transparent", borderLeft: on ? `2px solid ${C.orange}` : "2px solid transparent", borderRadius: 4, cursor: "pointer", transition: "all 0.15s" }}>
                  <div style={{ width: 22, height: 22, background: on ? C.orange : C.card, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <I size={11} color={on ? "#000" : C.dim} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: on ? C.text : C.dim }}>{s.label}</div>
                  </div>
                  <span style={{ fontSize: 10, color: C.dim, fontFamily: "monospace" }}>{String(i + 1).padStart(2, "0")}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
            <button onClick={() => setScene((s) => Math.max(0, s - 1))} disabled={scene === 0} style={{ ...btnGhost, flex: 1, opacity: scene === 0 ? 0.3 : 1, justifyContent: "center" }}>
              <ChevronLeft size={12} /> BACK
            </button>
            <button onClick={() => setScene((s) => Math.min(SCENES.length - 1, s + 1))} disabled={scene === SCENES.length - 1} style={{ ...btnPrimary, flex: 1, opacity: scene === SCENES.length - 1 ? 0.3 : 1, justifyContent: "center" }}>
              NEXT <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 48, paddingTop: 20, borderTop: `1px solid ${C.line}`, textAlign: "center", fontSize: 10, color: C.dim, letterSpacing: 1.5, fontWeight: 500 }}>
        BUILT BY FIELD OPERATORS · 12+ YEARS ON ARIZONA JOBSITES · NOW WITH WEEKLY QR + REFORECAST
      </div>
    </div>
  );
}
