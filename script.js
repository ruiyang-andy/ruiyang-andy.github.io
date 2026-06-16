/* ===================================================================
   Rui Yang — portfolio behavior
   1. lab data
   2. render the lab table (sorted 1 -> 20)
   3. category filtering
   4. in-page PDF viewer (modal)
   =================================================================== */

// The lab PDFs live in this same repo under /labs/, so the viewer loads
// them same-origin (no cross-domain restrictions to work around).
// BLOB is the matching file page in the networking-labs repo, used for
// the modal's "open in new tab" link.
const RAW  = "labs/";
const BLOB = "https://github.com/ruiyang-andy/networking-labs/blob/main/";

// 1. ---------- lab data ----------
const LABS = [
  { id: 20, cat: "ai",       t: "Pretraining & fine-tuning a 1B-parameter LLM with FSDP2", hw: "3× RTX A4000", p: "ai/lab-20-llm-pretraining-fsdp2.pdf" },
  { id: 19, cat: "security", t: "IPSec remote-access VPN with RDP over the tunnel",        hw: "FortiGate 40F", p: "security/lab-19-fortigate-ipsec-vpn.pdf" },
  { id: 18, cat: "security", t: "FortiAP multi-SSID with WPA2-Enterprise + FreeRADIUS",    hw: "FortiAP-421E",  p: "security/lab-18-fortiap-wpa2-enterprise.pdf" },
  { id: 17, cat: "security", t: "FortiGate from bare metal: TFTP flash & hardening",       hw: "FortiGate 40F", p: "security/lab-17-fortigate-tftp-setup.pdf" },
  { id: 16, cat: "security", t: "GlobalProtect VPN with a full certificate chain",         hw: "PA-410",        p: "security/lab-16-pa410-globalprotect.pdf" },
  { id: 15, cat: "ai",       t: "Distributed multi-GPU image generation with ComfyUI",     hw: "2× GPU",        p: "ai/lab-15-comfyui-distributed.pdf" },
  { id: 14, cat: "ai",       t: "Local LLM on Linux with Ollama, Docker & OpenWebUI",      hw: "Ubuntu",        p: "ai/lab-14-local-llm-linux.pdf" },
  { id: 13, cat: "ai",       t: "Local LLM on Windows with knowledge bases",               hw: "Windows 11",    p: "ai/lab-13-local-llm-windows.pdf" },
  { id: 12, cat: "security", t: "Dual-ISP automatic failover & failback",                  hw: "PA-410",        p: "security/lab-12-dual-isp-failover.pdf" },
  { id: 11, cat: "security", t: "URL filtering for a school network",                      hw: "PA-410",        p: "security/lab-11-pa410-url-filtering.pdf" },
  { id: 10, cat: "security", t: "Palo Alto SOHO deployment: zones, VLANs, NAT",            hw: "PA-410",        p: "security/lab-10-pa410-soho.pdf" },
  { id: 9,  cat: "security", t: "Layer 2 attacks & mitigations (offense + defense)",       hw: "Cisco + Kali",  p: "security/lab-09-layer2-attacks.pdf" },
  { id: 8,  cat: "routing",  t: "Multi-SSID wireless AP with per-VLAN security",           hw: "Cisco AP",      p: "networking/lab-08-multi-ssid-ap.pdf" },
  { id: 7,  cat: "routing",  t: "Multi-area IS-IS with L1 / L1-2 routers",                 hw: "Cisco ISR",     p: "networking/lab-07-isis.pdf" },
  { id: 6,  cat: "cloud",    t: "EBS, RDS, load balancing & auto scaling",                 hw: "AWS",           p: "cloud/lab-06-aws-ebs-rds-elb.pdf" },
  { id: 5,  cat: "cloud",    t: "IAM, VPC design & EC2 web server",                        hw: "AWS",           p: "cloud/lab-05-aws-iam-vpc-ec2.pdf" },
  { id: 4,  cat: "routing",  t: "Multi-protocol network with iBGP & eBGP",                 hw: "Cisco ISR",     p: "networking/lab-04-ibgp-ebgp.pdf" },
  { id: 3,  cat: "routing",  t: "Multi-protocol network with eBGP",                        hw: "Cisco ISR",     p: "networking/lab-03-ebgp.pdf" },
  { id: 2,  cat: "routing",  t: "Multi-area OSPF (IPv4/IPv6)",                             hw: "Cisco L3",      p: "networking/lab-02-multi-area-ospf.pdf" },
  { id: 1,  cat: "systems",  t: "Wiping & imaging a Windows 11 desktop",                   hw: "Lenovo",        p: "systems/lab-01-windows-imaging.pdf" },
];

// 2. ---------- render the lab table ----------
const rows = document.getElementById("labrows");
const count = document.getElementById("count");

function labRow(lab) {
  const num = String(lab.id).padStart(2, "0");
  return `
    <a class="lab" href="${BLOB}${lab.p}"
       data-cat="${lab.cat}" data-pdf="${lab.p}" data-title="${lab.t}">
      <span class="id">${num}</span>
      <span class="cat">${lab.cat}</span>
      <span class="t">${lab.t}</span>
      <span class="hw">${lab.hw}</span>
    </a>`;
}

const ordered = [...LABS].sort((a, b) => a.id - b.id);
rows.innerHTML = ordered.map(labRow).join("");

// 3. ---------- category filtering ----------
const filterButtons = document.querySelectorAll(".filters button");

function applyFilter(category) {
  let shown = 0;
  document.querySelectorAll(".lab").forEach(row => {
    const visible = category === "all" || row.dataset.cat === category;
    row.hidden = !visible;
    if (visible) shown++;
  });
  count.textContent = `${shown} of ${LABS.length} labs shown`;
  filterButtons.forEach(btn =>
    btn.setAttribute("aria-pressed", String(btn.dataset.f === category))
  );
}

filterButtons.forEach(btn =>
  btn.addEventListener("click", () => applyFilter(btn.dataset.f))
);
applyFilter("all");

// 4. ---------- in-page PDF viewer ----------
const modal = document.getElementById("pdfModal");
const frame = document.getElementById("modalFrame");
const modalTitle = document.getElementById("modalTitle");
const modalNew = document.getElementById("modalNew");
const modalClose = document.getElementById("modalClose");
let lastFocus = null;

// Self-hosted PDF.js viewer (lives in /pdfjs/web/ in this repo). The
// viewer fetches and renders the PDF bytes itself, which sidesteps the
// "application/octet-stream" header GitHub sends that would otherwise
// force the browser to download the file instead of displaying it.
// Path is relative, so it works the same locally and on GitHub Pages.
const PDFJS = "pdfjs/web/viewer.html?file=";

function openPdf(path, title, trigger) {
  lastFocus = trigger || document.activeElement;
  modalTitle.innerHTML = `<span class="mid">${title || "lab report"}</span>`;

  // Resolve the PDF to an absolute URL first. The viewer lives in a
  // subfolder, so a bare relative path would resolve against the viewer's
  // location, not the site root. new URL(...) anchors it to the page.
  const pdfUrl = new URL(RAW + path, window.location.href).href;
  frame.src = PDFJS + encodeURIComponent(pdfUrl);

  modalNew.href = BLOB + path;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
  modalClose.focus();
}

function closePdf() {
  modal.classList.remove("open");
  frame.src = "";                       // stop loading and free memory
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
}

// open a lab report from any table row
document.querySelectorAll(".lab").forEach(row => {
  row.addEventListener("click", event => {
    event.preventDefault();
    openPdf(row.dataset.pdf, row.dataset.title, row);
  });
});

// open the featured Lab 20 report from its button
const featBtn = document.getElementById("featBtn");
if (featBtn) {
  featBtn.addEventListener("click", event => {
    event.preventDefault();
    openPdf(
      "ai/lab-20-llm-pretraining-fsdp2.pdf",
      "Lab 20 — 1B-parameter LLM with FSDP2",
      featBtn
    );
  });
}

// ways to dismiss: button, backdrop click, Escape key
modalClose.addEventListener("click", closePdf);
modal.addEventListener("click", event => {
  if (event.target === modal) closePdf();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && modal.classList.contains("open")) closePdf();
});

// 5. ---------- adaptive background texture ----------
// Fills the whole viewport with faint config/packet lines, edge to edge,
// and redraws on resize so it always fits regardless of browser width.
// No tiling seams: we generate exactly enough rows to cover the height
// and pad each line long enough to span the width.
const BG_LINES = [
  "192.168.10.1 > 10.0.0.2: ICMP echo request, id 4821, seq 12",
  "O    10.2.2.0/24 [110/20] via 10.0.12.2, 00:14:51, GigabitEthernet0/1",
  "B>  172.16.0.0/16 [20/0] via 10.0.23.3, 1d04h",
  "0x0040:  4500 0054 1c46 4000 4001 a3e4 c0a8 0a01",
  "interface GigabitEthernet0/0.10  encapsulation dot1Q 10",
  "i L2 10.4.4.4/32 [115/20] via 10.0.34.4, GigabitEthernet0/2",
  "%LINEPROTO-5-UPDOWN: Line protocol on Interface Gi0/1, changed to up",
  "spanning-tree vlan 10 priority 24576    root id  8000.0011.2233",
  "crypto isakmp policy 10  encr aes 256  hash sha256  group 14",
  "10.0.12.2     4    65002    1841    1839    0    0  00:31:12  5",
  "tcpdump: listening on eth0, link-type EN10MB (Ethernet), capture size 262144",
  "ip nat inside source list 1 interface GigabitEthernet0/0 overload",
  "0x0050:  3a8f 0050 1f90 6c2e 8001 0000 0204 05b4 0103 0308",
  "router ospf 1  network 10.0.0.0 0.0.0.255 area 0",
  "D    10.5.5.0/24 [90/2172416] via 10.0.45.5, 02:41:09, Gi0/3",
  "access-list 101 permit tcp any host 10.1.1.10 eq 443",
  "14:22:51.118843 ARP, Request who-has 10.0.0.1 tell 10.0.0.55, length 28",
  "set security zones security-zone trust interfaces ge-0/0/0.0",
  "isis net 49.0001.0100.0000.0004.00  is-type level-1-2",
  "%BGP-5-ADJCHANGE: neighbor 10.0.23.3 Up",
  "switchport trunk allowed vlan 10,20,30  switchport mode trunk",
  "vpn ipsec-interface tunnel.1  ike gateway GW-EAST  tunnel esp-aes256",
  "C    10.0.12.0/24 is directly connected, GigabitEthernet0/1",
];

function paintBgTexture() {
  let layer = document.getElementById("bgtex");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "bgtex";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
  }

  const lineHeight = 24;
  const charWidth = 7.8;                       // approx width of one mono char at 13px
  const rowCount = Math.ceil(window.innerHeight / lineHeight) + 2;
  const colsNeeded = Math.ceil(window.innerWidth / charWidth) + 8;

  let html = "";
  for (let r = 0; r < rowCount; r++) {
    // start each row at a different line and pad it to span the full width
    let text = "";
    let i = (r * 7) % BG_LINES.length;         // 7 = stride, avoids vertical repeats lining up
    while (text.length < colsNeeded) {
      text += BG_LINES[i % BG_LINES.length] + "    ";
      i++;
    }
    const top = r * lineHeight;
    html += `<div class="row" style="top:${top}px">${text}</div>`;
  }
  layer.innerHTML = html;
}

let bgResizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(bgResizeTimer);
  bgResizeTimer = setTimeout(paintBgTexture, 150);
});
paintBgTexture();
