"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "@/lib/i18n";

import {
  LayoutGrid, Folder, Upload, Home, ClipboardList,
  ChevronRight, AlertTriangle, Clock, Flag,
  TrendingUp, CheckCircle2, Circle, RefreshCw,
  Plus, QrCode, Eye, HardHat, Truck, Shield,
  Camera, Calendar, Play, Send,
  Download, History, Target, GitBranch, Zap, FileDown,
  Users, Timer,
} from "lucide-react";

/**
 * YouTube Short Recording Page
 * 
 * Open in Chrome at 1080x1920 (or any portrait window).
 * Screen record this page — it auto-advances through all scenes
 * with a title card intro and outro.
 * 
 * URL: /demo-record
 */

const C = {
  bg: "#000000", card: "#1A1A1C", cardHi: "#222225", line: "#2A2A2E",
  text: "#FFFFFF", dim: "#8E8E93", dim2: "#6B6B70",
  orange: "#FF6B1A", orangeDim: "rgba(255,107,26,0.12)",
  red: "#FF3B30", yellow: "#FFCC00", green: "#34C759",
  blue: "#0A84FF", purple: "#BF5AF2", teal: "#30D5C8",
};

const SCENES = [
  { id: "title", label: "" },
  { id: "command", label: t('ui.command.center') },
  { id: "priority", label: t('ui.priority.view') },
  { id: "lookahead", label: t('ui.3.week.lookahead') },
  { id: "reforecast", label: t('ui.schedule.reforecast') },
  { id: "reports", label: t('ui.observations') },
  { id: "readycheck", label: t('ui.ready.check') },
  { id: "subs", label: t('ui.sub.portal.qr') },
  { id: "export", label: t('ui.mspdi.export') },
  { id: "outro", label: "" },
];

const SCENE_DURATION = 4000; // 4s per scene

function PulseLogo({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 12 H6 L8.5 6 L11 18 L13.5 9 L16 14 L18 12 H22"
        stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 340, height: 720, background: C.bg, borderRadius: 48,
      border: "8px solid #1C1C1E",
      boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
      overflow: "hidden", position: "relative", display: "flex", flexDirection: "column",
    }}>
      <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 100, height: 28, background: "#000", borderRadius: 20, zIndex: 50 }} />
      <div style={{ position: "absolute", top: 14, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 28px", fontSize: 12, fontWeight: 600, color: C.text, zIndex: 40 }}>
        <span>5:27</span>
        <span style={{ fontSize: 11 }}>●●●●</span>
      </div>
      <div style={{ flex: 1, paddingTop: 44, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

function BottomNav({ active = "home" }: { active?: string }) {
  const items = [
    { id: "dashboard", label: t('ui.dashboard'), Icon: LayoutGrid },
    { id: "projects", label: t('ui.projects'), Icon: Folder },
    { id: "upload", label: t('ui.upload'), Icon: Upload },
    { id: "home", label: t('ui.home'), Icon: Home },
  ];
  return (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 0 14px", borderTop: `1px solid ${C.line}`, background: C.bg }}>
      {items.map(({ id, label, Icon }) => {
        const on = active === id;
        return (
          <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <Icon size={18} color={on ? C.orange : C.dim} strokeWidth={on ? 2.2 : 1.8} />
            <span style={{ fontSize: 9, color: on ? C.orange : C.dim, fontWeight: on ? 600 : 500 }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Scene: Title Card ── */
function TitleCard() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 30 }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ width: 80, height: 80, background: C.orange, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <PulseLogo size={48} color="#F5F3EE" />
      </motion.div>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.text, textAlign: "center", letterSpacing: -0.5 }}>{t('ui.iron')}<span style={{ color: C.orange }}>{t('ui.track')}</span>
        </div>
        <div style={{ fontSize: 14, color: C.dim, textAlign: "center", marginTop: 4 }}>{t('ui.project.pulse')}</div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        style={{ fontSize: 12, color: C.dim, textAlign: "center", lineHeight: 1.6, marginTop: 8 }}>{t('ui.run.your.job')}<br />{t('ui.don.t.chase.it')}
      </motion.div>
    </div>
  );
}

/* ── Scene: Command Center ── */
function CommandScene() {
  return (
    <>
      <div style={{ flex: 1, padding: "16px 18px 0", overflow: "hidden" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 12 }}>{t('ui.command.center')}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { label: t('ui.active.projects.03dbc1'), value: "6", color: C.text },
            { label: t('ui.high.risks.664f7c'), value: "11", color: C.red },
            { label: t('ui.overdue').toUpperCase(), value: "290", color: C.yellow },
            { label: t('ui.avg.completion.5720de'), value: "54%", color: C.green },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: C.card, borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 8, letterSpacing: 1.4, color: C.dim, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginTop: 4, lineHeight: 1 }}>{s.value}</div>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ background: C.card, borderRadius: 16, padding: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{t('ui.park.10.phase.a')}</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <span style={{ fontSize: 11, color: C.dim }}>{t('ui.progress.1b9027')}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>93%</span>
          </div>
          <div style={{ height: 6, background: C.line, borderRadius: 3, overflow: "hidden", marginTop: 4 }}>
            <motion.div initial={{ width: 0 }} animate={{ width: "93%" }} transition={{ delay: 0.6, duration: 0.8 }}
              style={{ height: "100%", background: `linear-gradient(90deg, ${C.orange}, ${C.green})` }} />
          </div>
        </motion.div>
      </div>
      <BottomNav active="dashboard" />
    </>
  );
}

/* ── Scene: Priority ── */
function PriorityScene() {
  return (
    <>
      <div style={{ flex: 1, padding: "16px 18px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <Zap size={16} color={C.orange} />
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{t('ui.priority.today')}</span>
        </div>
        {[
          { title: t('ui.set.transformer.and.pull.feeders'), trade: "Electrical", risk: "critical", color: C.red },
          { title: t('ui.install.fire.dampers.bldg.a'), trade: "Mechanical", risk: "at risk", color: C.yellow },
          { title: t('ui.concrete.pour.level.3.deck'), trade: "Concrete", risk: "on track", color: C.green },
          { title: t('ui.roof.drain.rough.in'), trade: "Plumbing", risk: "on track", color: C.green },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 * i }}
            style={{ background: C.card, borderLeft: `3px solid ${item.color}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.title}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 10, color: C.orange }}>{item.trade}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: item.color, textTransform: "uppercase" }}>{item.risk}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <BottomNav active="home" />
    </>
  );
}

/* ── Scene: Lookahead ── */
function LookaheadScene() {
  return (
    <>
      <div style={{ flex: 1, padding: "16px 18px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={16} color={C.orange} />
            <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{t('ui.week.1')}</span>
          </div>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}
            style={{ display: "flex", alignItems: "center", gap: 4, background: C.card, borderRadius: 8, padding: "6px 10px" }}>
            <QrCode size={12} color={C.orange} />
            <span style={{ fontSize: 10, fontWeight: 600, color: C.dim }}>QR</span>
          </motion.div>
        </div>
        <div style={{ fontSize: 10, color: C.dim, marginBottom: 8 }}>{t('ui.monday.apr.21')}</div>
        {[
          { name: t('ui.structural.steel.tower.2'), pct: 60, color: C.blue },
          { name: t('ui.electrical.rough.in.bldg.a'), pct: 85, color: C.orange },
          { name: t('ui.concrete.pour.level.3'), pct: 0, color: C.dim },
        ].map((t, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.1 }}
            style={{ background: C.card, borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{t.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.color }}>{t.pct}%</span>
            </div>
            <div style={{ height: 3, background: C.line, borderRadius: 2 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${t.pct}%` }} transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                style={{ height: "100%", background: t.color, borderRadius: 2 }} />
            </div>
          </motion.div>
        ))}
        <div style={{ fontSize: 10, color: C.dim, marginTop: 14, marginBottom: 8 }}>{t('ui.wednesday.apr.23')}</div>
        {[
          { name: t('ui.fire.sprinkler.bldg.b'), pct: 25, color: C.orange },
          { name: t('ui.drywall.hang.level.2'), pct: 0, color: C.dim },
        ].map((t, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.1 }}
            style={{ background: C.card, borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{t.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.color }}>{t.pct}%</span>
            </div>
          </motion.div>
        ))}
      </div>
      <BottomNav active="home" />
    </>
  );
}

/* ── Scene: Reforecast ── */
function ReforecastScene() {
  return (
    <>
      <div style={{ flex: 1, padding: "16px 18px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <GitBranch size={16} color={C.orange} />
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{t('ui.reforecast')}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: C.card, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 8, color: C.dim, fontWeight: 600, letterSpacing: 1 }}>{t('ui.forecast.delta.26625e')}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.red, marginTop: 2 }}>{t('ui.5d.late')}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: C.card, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 8, color: C.dim, fontWeight: 600, letterSpacing: 1 }}>{t('ui.critical.path.2e4a67')}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.red, marginTop: 2 }}>8</div>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ background: C.orangeDim, borderLeft: `3px solid ${C.orange}`, borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.orange, letterSpacing: 1, marginBottom: 4 }}>{t('ui.recovery.action')}</div>
          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>{t('ui.increase.crew.on.structural.steel.to.recover.3.days')}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          style={{ background: C.card, borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <Download size={16} color={C.orange} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{t('ui.export.mspdi')}</div>
            <div style={{ fontSize: 10, color: C.dim }}>{t('ui.ms.project.and.p6.compatible')}</div>
          </div>
        </motion.div>
      </div>
      <BottomNav active="home" />
    </>
  );
}

/* ── Scene: Reports ── */
function ReportsScene() {
  return (
    <>
      <div style={{ flex: 1, padding: "16px 18px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <ClipboardList size={16} color={C.orange} />
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{t('ui.observations')}</span>
        </div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: "#1e3a5f", borderRadius: "12px 12px 0 0", padding: "10px 14px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{t('ui.field.observation.ir.003')}</span>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ background: C.card, borderRadius: "0 0 12px 12px", padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Camera size={14} color={C.orange} />
            <span style={{ fontSize: 11, color: C.text }}>{t('ui.3.photos.attached')}</span>
          </div>
          {[
            { pri: "High", priColor: C.red, title: t('ui.missing.backing.corridor.2') },
            { pri: "Medium", priColor: C.yellow, title: t('ui.electrical.box.misaligned.room.102') },
          ].map((iss, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, color: "#fff", background: iss.priColor }}>{iss.pri}</span>
              <span style={{ fontSize: 11, color: C.text }}>{iss.title}</span>
            </div>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: C.card, borderRadius: 10, padding: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <FileDown size={14} color={C.orange} />
            <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{t('ui.print.pdf')}</span>
          </div>
          <div style={{ flex: 1, background: C.card, borderRadius: 10, padding: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Send size={14} color={C.blue} />
            <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{t('ui.share')}</span>
          </div>
        </motion.div>
      </div>
      <BottomNav active="home" />
    </>
  );
}

/* ── Scene: Ready Check ── */
function ReadyCheckScene() {
  return (
    <>
      <div style={{ flex: 1, padding: "16px 18px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <Send size={16} color={C.orange} />
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{t('ui.ready.check')}</span>
        </div>
        {[
          { name: t('ui.ats.electric'), status: "Confirmed ✓", statusColor: C.green, task: "Rough-In Electrical — Mon Apr 21" },
          { name: t('ui.buildtek.framing'), status: "Awaiting", statusColor: C.yellow, task: "Exterior Framing Bldg B — Tue Apr 22" },
          { name: t('ui.ams.fire.protection'), status: "Issue Flagged", statusColor: C.red, task: "Sprinkler install delayed — material" },
        ].map((sub, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 * i }}
            style={{ background: C.card, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{sub.name}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: sub.statusColor }}>{sub.status}</span>
            </div>
            <span style={{ fontSize: 10, color: C.dim }}>{sub.task}</span>
          </motion.div>
        ))}
      </div>
      <BottomNav active="home" />
    </>
  );
}

/* ── Scene: Subs + QR ── */
function SubsScene() {
  return (
    <>
      <div style={{ flex: 1, padding: "16px 18px 0", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, alignSelf: "flex-start" }}>
          <QrCode size={16} color={C.orange} />
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{t('ui.sub.portal')}</span>
        </div>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ width: 140, height: 140, background: C.orange, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <QrCode size={80} color="#F5F3EE" />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t('ui.week.1.lookahead')}</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{t('ui.scan.to.view.no.login.required')}</div>
          <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{t('ui.expires.in.7.days')}</div>
        </motion.div>
      </div>
      <BottomNav active="home" />
    </>
  );
}

/* ── Scene: Export ── */
function ExportScene() {
  return (
    <>
      <div style={{ flex: 1, padding: "16px 18px 0", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 50, height: 50, background: "#2B7B2B", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>P</span>
            </div>
            <span style={{ fontSize: 9, color: C.dim }}>{t('ui.ms.project')}</span>
          </div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }}
            style={{ fontSize: 18, color: C.dim }}>→</motion.div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 50, height: 50, background: C.orange, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
              <PulseLogo size={30} color="#F5F3EE" />
            </div>
            <span style={{ fontSize: 9, color: C.dim }}>{t('ui.irontrack')}</span>
          </div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }}
            style={{ fontSize: 18, color: C.dim }}>→</motion.div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 50, height: 50, background: "#C74634", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>P6</span>
            </div>
            <span style={{ fontSize: 9, color: C.dim }}>{t('ui.primavera')}</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t('ui.import.reforecast.export')}</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{t('ui.mspdi.xml.works.everywhere')}</div>
        </motion.div>
      </div>
      <BottomNav active="home" />
    </>
  );
}

/* ── Scene: Outro ── */
function OutroCard() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 30 }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
        style={{ width: 70, height: 70, background: C.orange, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <PulseLogo size={42} color="#F5F3EE" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>{t('ui.iron')}<span style={{ color: C.orange }}>{t('ui.track')}</span>{t('ui.pulse')}
        </div>
        <div style={{ fontSize: 13, color: C.dim, marginTop: 6 }}>{t('ui.irontrack.pulse.vercel.app')}</div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        style={{ background: C.orange, borderRadius: 12, padding: "12px 24px" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{t('ui.try.it.free')}</span>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
        style={{ fontSize: 11, color: C.dim, textAlign: "center", lineHeight: 1.5 }}>{t('ui.19.99.mo.14.day.free.trial')}<br />{t('ui.built.for.superintendents')}
      </motion.div>
    </div>
  );
}

/* ── SCENE RENDERER ── */
function SceneView({ sceneId }: { sceneId: string }) {
  switch (sceneId) {
    case "title": return <TitleCard />;
    case "command": return <CommandScene />;
    case "priority": return <PriorityScene />;
    case "lookahead": return <LookaheadScene />;
    case "reforecast": return <ReforecastScene />;
    case "reports": return <ReportsScene />;
    case "readycheck": return <ReadyCheckScene />;
    case "subs": return <SubsScene />;
    case "export": return <ExportScene />;
    case "outro": return <OutroCard />;
    default: return <TitleCard />;
  }
}

/* ═══ MAIN PAGE ═══ */
export default function DemoRecordPage() {
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setScene((s) => (s < SCENES.length - 1 ? s + 1 : s));
    }, SCENE_DURATION);
    return () => clearInterval(timer);
  }, []);

  const currentScene = SCENES[scene];
  const isBookend = currentScene.id === "title" || currentScene.id === "outro";

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#000",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
    }}>
      {/* Scene label */}
      {!isBookend && (
        <motion.div
          key={`label-${scene}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{ marginBottom: 16, textAlign: "center" }}
        >
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.orange, fontWeight: 700 }}>
            {String(scene).padStart(2, "0")} / {String(SCENES.length - 2).padStart(2, "0")}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginTop: 4 }}>
            {currentScene.label}
          </div>
        </motion.div>
      )}

      {/* Phone */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scene}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.35 }}
        >
          <Phone>
            <SceneView sceneId={currentScene.id} />
          </Phone>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
        {SCENES.map((_, i) => (
          <div key={i} style={{
            width: i === scene ? 20 : 6, height: 6, borderRadius: 3,
            background: i === scene ? C.orange : i < scene ? C.orange : C.line,
            opacity: i <= scene ? 1 : 0.3,
            transition: "all 0.3s",
          }} />
        ))}
      </div>
    </div>
  );
}
