// script.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, doc, getDoc, updateDoc, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

/* -------------------------
   FIREBASE CONFIG - replace if needed
   ------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyCC26AlX5xVRo_s0nDI1Ua26JbWh2d1FKk",
  authDomain: "leads-to-funnel.firebaseapp.com",
  projectId: "leads-to-funnel",
  storageBucket: "leads-to-funnel.firebasestorage.app",
  messagingSenderId: "574308221054",
  appId: "1:574308221054:web:9a27e9b1e8e8c0270d982f",
  measurementId: "G-2M5P17GZZJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* -------------------------
   DOM elements
   ------------------------- */
const clientsTableBody = document.getElementById("clientsTable");
const totalClientsEl = document.getElementById("totalClients");
const addClientForm = document.getElementById("addClientForm");

const clientModal = document.getElementById("clientModal");
const modalClientTitle = document.getElementById("modalClientTitle");
const profileForm = document.getElementById("profileForm");
const addHistoryForm = document.getElementById("addHistoryForm");
const historyTableBody = document.getElementById("historyTableBody");

let currentClientId = null;
let lastLoadedClient = null; // store last data to detect changes

/* -------------------------
   Utility helpers
   ------------------------- */
function el(tag, props = {}, children = []) {
  const e = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else e.setAttribute(k, v);
  });
  children.forEach(child => e.append(child));
  return e;
}

function safeText(v){ return v === undefined || v === null ? "" : String(v) }

/* -------------------------
   Tab switching (bottom nav)
   ------------------------- */
document.querySelectorAll(".bottom-nav .tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".bottom-nav .tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    // show tab content
    const tabId = btn.dataset.tab;
    document.querySelectorAll(".tab-content").forEach(s => s.style.display = "none");
    const show = document.getElementById(tabId);
    if (show) show.style.display = "block";
  });
});

/* -------------------------
   Modal internal tabs
   ------------------------- */
document.querySelectorAll(".modal-tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".modal-tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".modal-tab-content").forEach(c=>c.style.display="none");
    const tabId = btn.dataset.tab;
    const elTab = document.getElementById(tabId);
    if(elTab) elTab.style.display = "block";
  });
});

document.getElementById("modalCloseBtn")?.addEventListener("click", ()=> closeClientModal());
document.querySelector(".modal-close")?.addEventListener("click", ()=> closeClientModal());

/* -------------------------
   Load clients (Leads)
   ------------------------- */
async function loadClients(){
  try{
    clientsTableBody.innerHTML = "";
    const qSnap = await getDocs(collection(db, "clients"));
    totalClientsEl && (totalClientsEl.textContent = qSnap.size);
    qSnap.forEach(docSnap => {
      const c = docSnap.data();
      const tr = document.createElement("tr");

      const tdName = el("td", {"data-label":"Name"});
      tdName.textContent = safeText(c.name);

      const tdStage = el("td", {"data-label":"Stage"});
      tdStage.textContent = safeText(c.stage);

      const tdPhones = el("td", {"data-label":"Phones"});
      tdPhones.textContent = Array.isArray(c.phones) ? c.phones.join(", ") : safeText(c.phones);

      const tdServices = el("td", {"data-label":"Services"});
      if(Array.isArray(c.interestedServices) && c.interestedServices.length){
        tdServices.textContent = c.interestedServices.map(s=>`${s.primary||""} (${s.sub||""}) ${s.estimatedPrice ? `$${s.estimatedPrice}` : ""}`).join("; ");
      } else tdServices.textContent = "";

      const tdActions = el("td", {"data-label":"Actions"});
      const btn = el("button");
      btn.textContent = "View Profile";
      btn.addEventListener("click", ()=> openClientModal(docSnap.id));
      tdActions.appendChild(btn);

      tr.append(tdName, tdStage, tdPhones, tdServices, tdActions);
      clientsTableBody.appendChild(tr);
    });
  }catch(err){
    console.error("loadClients error:", err);
    alert("Failed to load clients (see console).");
  }
}

/* -------------------------
   Add / Edit Client (main Add Client tab)
   ------------------------- */
addClientForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  try{
    const clientData = {
      name: document.getElementById("clientName").value,
      phones: [document.getElementById("clientPhone1").value, document.getElementById("clientPhone2").value].filter(Boolean),
      email: document.getElementById("clientEmail").value || "",
      address: document.getElementById("clientAddress").value || "",
      stage: document.getElementById("clientStage").value || "",
      assignedExecutive: document.getElementById("clientExecutive").value || "",
      interestedServices: [{
        primary: document.getElementById("clientCountry").value || "",
        sub: document.getElementById("clientService").value || "",
        estimatedPrice: parseFloat(document.getElementById("clientPrice").value) || 0
      }],
      profilePicture: document.getElementById("clientProfilePic").value || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // create new client
    await addDoc(collection(db,"clients"), clientData);
    addClientForm.reset();
    await loadClients();
  }catch(err){
    console.error("add client error:", err);
    alert("Failed to add client.");
  }
});

/* -------------------------
   Open client modal (load profile + history)
   ------------------------- */
async function openClientModal(clientId){
  try{
    currentClientId = clientId;
    // fetch single client doc
    const ref = doc(db, "clients", clientId);
    const snap = await getDoc(ref);
    if(!snap.exists()){
      alert("Client not found");
      return;
    }
    const c = snap.data();
    lastLoadedClient = c; // store snapshot

    // fill profile fields
    modalClientTitle.textContent = c.name || "Client";
    document.getElementById("modalName").value = c.name || "";
    document.getElementById("modalPhone1").value = (c.phones && c.phones[0]) || "";
    document.getElementById("modalPhone2").value = (c.phones && c.phones[1]) || "";
    document.getElementById("modalEmail").value = c.email || "";
    document.getElementById("modalAddress").value = c.address || "";
    document.getElementById("modalStage").value = c.stage || "";
    document.getElementById("modalExecutive").value = c.assignedExecutive || "";
    document.getElementById("modalCountry").value = c.interestedServices?.[0]?.primary || "";
    document.getElementById("modalService").value = c.interestedServices?.[0]?.sub || "";
    document.getElementById("modalPrice").value = c.interestedServices?.[0]?.estimatedPrice || "";
    document.getElementById("modalProfilePic").value = c.profilePicture || "";

    // show modal (profile tab by default)
    clientModal.style.display = "flex";
    // switch modal to Profile tab
    document.querySelectorAll(".modal-tab-btn").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".modal-tab-content").forEach(c=>c.style.display = "none");
    const pbtn = document.querySelector('.modal-tab-btn[data-tab="profileTab"]');
    if(pbtn){ pbtn.classList.add("active"); document.getElementById("profileTab").style.display = "block"; }

    // load history
    await loadHistory();
  }catch(err){
    console.error("openClientModal error:", err);
    alert("Failed to open client.");
  }
}
window.openClientModal = openClientModal; // allow global access if needed by inline handlers

/* -------------------------
   Save profile (modal)
   -> update client doc and record profileEdit in history (stores changed fields)
   ------------------------- */
profileForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  if(!currentClientId) return alert("No client selected");
  try{
    const newData = {
      name: document.getElementById("modalName").value,
      phones: [document.getElementById("modalPhone1").value, document.getElementById("modalPhone2").value].filter(Boolean),
      email: document.getElementById("modalEmail").value || "",
      address: document.getElementById("modalAddress").value || "",
      stage: document.getElementById("modalStage").value || "",
      assignedExecutive: document.getElementById("modalExecutive").value || "",
      interestedServices: [{
        primary: document.getElementById("modalCountry").value || "",
        sub: document.getElementById("modalService").value || "",
        estimatedPrice: parseFloat(document.getElementById("modalPrice").value) || 0
      }],
      profilePicture: document.getElementById("modalProfilePic").value || "",
      updatedAt: serverTimestamp()
    };

    // compute changes (simple shallow comparison)
    const changes = {};
    const old = lastLoadedClient || {};
    if((old.name || "") !== (newData.name || "")) changes.name = {from: old.name || "", to: newData.name || ""};
    if((old.email || "") !== (newData.email || "")) changes.email = {from: old.email || "", to: newData.email || ""};
    if((old.address || "") !== (newData.address || "")) changes.address = {from: old.address || "", to: newData.address || ""};
    if((old.stage || "") !== (newData.stage || "")) changes.stage = {from: old.stage || "", to: newData.stage || ""};
    if((old.assignedExecutive || "") !== (newData.assignedExecutive || "")) changes.assignedExecutive = {from: old.assignedExecutive || "", to: newData.assignedExecutive || ""};
    // compare first interestedService entry
    const oldSvc = (old.interestedServices && old.interestedServices[0]) || {};
    const newSvc = newData.interestedServices[0] || {};
    if((oldSvc.primary || "") !== (newSvc.primary || "")) changes.service_country = {from: oldSvc.primary||"", to: newSvc.primary||""};
    if((oldSvc.sub || "") !== (newSvc.sub || "")) changes.service_sub = {from: oldSvc.sub||"", to: newSvc.sub||""};
    if((oldSvc.estimatedPrice || 0) !== (newSvc.estimatedPrice || 0)) changes.estimatedPrice = {from: oldSvc.estimatedPrice || 0, to: newSvc.estimatedPrice || 0};

    // update client doc
    await updateDoc(doc(db,"clients",currentClientId), newData);

    // if any changes — record profile edit in history
    if(Object.keys(changes).length){
      await addDoc(collection(db,"clients",currentClientId,"history"), {
        type: "profileEdit",
        changes,
        date: serverTimestamp()
      });
    }

    alert("Profile saved.");
    // reload clients list and history
    await loadClients();
    await loadHistory();
    lastLoadedClient = newData; // update lastLoadedClient
  }catch(err){
    console.error("save profile error:", err);
    alert("Failed to save profile.");
  }
});

/* -------------------------
   Add history (interaction / stage change)
   ------------------------- */
addHistoryForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  if(!currentClientId) return alert("No client selected");
  try{
    const type = document.getElementById("historyType").value;
    if(!type) return alert("Select a type.");

    const payload = {
      type: type,
      phoneUsed: document.getElementById("historyPhone").value || "",
      nextFollowUp: document.getElementById("historyNextFollowUp").value || "",
      notes: document.getElementById("historyNotes").value || "",
      date: serverTimestamp()
    };

    // if StageChange, also update client stage and log profileEdit
    if(type === "StageChange"){
      const newStage = document.getElementById("historyNotes").value || ""; // We assume user writes new stage in notes or better provide a stage input; using notes for now
      if(newStage){
        await updateDoc(doc(db,"clients",currentClientId), { stage: newStage, updatedAt: serverTimestamp() });
        // record a profileEdit change too
        await addDoc(collection(db,"clients",currentClientId,"history"), {
          type: "profileEdit",
          changes: { stage: { from: lastLoadedClient?.stage || "", to: newStage }},
          date: serverTimestamp()
        });
      }
    }

    await addDoc(collection(db,"clients",currentClientId,"history"), payload);
    addHistoryForm.reset();
    await loadHistory();
  }catch(err){
    console.error("add history error:", err);
    alert("Failed to add history.");
  }
});

/* -------------------------
   Load history for current client
   ------------------------- */
async function loadHistory(){
  try{
    historyTableBody.innerHTML = "";
    if(!currentClientId) return;
    // order by date descending
    const q = query(collection(db,"clients",currentClientId,"history"), orderBy("date", "desc"));
    const snap = await getDocs(q);
    snap.forEach(docSnap => {
      const h = docSnap.data();
      const tr = document.createElement("tr");

      const dateText = h.date && h.date.toDate ? h.date.toDate().toLocaleString() : (h.date ? String(h.date) : "");

      const tdDate = el("td", {"data-label":"Date"});
      tdDate.textContent = dateText;

      const tdType = el("td", {"data-label":"Type"}); tdType.textContent = safeText(h.type || "");

      const tdPhone = el("td", {"data-label":"Phone"}); tdPhone.textContent = safeText(h.phoneUsed || "");

      const tdNext = el("td", {"data-label":"Next Follow-up"}); tdNext.textContent = safeText(h.nextFollowUp || "");

      const tdDetails = el("td", {"data-label":"Details"});
      if(h.type === "profileEdit"){
        tdDetails.textContent = JSON.stringify(h.changes || {});
      } else {
        // interaction
        tdDetails.textContent = String(h.notes || "");
      }

      tr.append(tdDate, tdType, tdPhone, tdNext, tdDetails);
      historyTableBody.appendChild(tr);
    });
  }catch(err){
    console.error("loadHistory error:", err);
  }
}

/* -------------------------
   Close modal helper
   ------------------------- */
function closeClientModal(){
  clientModal.style.display = "none";
  currentClientId = null;
  lastLoadedClient = null;
  // reset modal forms
  profileForm.reset();
  addHistoryForm.reset();
}
window.closeClientModal = closeClientModal;

/* -------------------------
   initial run
   ------------------------- */
document.addEventListener("DOMContentLoaded", async ()=>{
  await loadClients();
});
