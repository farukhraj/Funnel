import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Firebase config
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

let currentClientId = null;
const modal = document.getElementById("interactionModal");

// Load Clients
async function loadClients() {
  const tableBody = document.getElementById("clientsTable");
  tableBody.innerHTML = "";
  const snapshot = await getDocs(collection(db, "clients"));
  document.getElementById("totalClients").innerText = snapshot.size;

  snapshot.forEach(docSnap => {
    const c = docSnap.data();
    const phones = c.phones?.join(", ") || "N/A";
    const services = c.interestedServices?.map(s => `${s.primary} (${s.sub}) $${s.estimatedPrice}`).join("<br>") || "";
    tableBody.innerHTML += `
      <tr>
        <td>${c.name}</td>
        <td>${c.stage}</td>
        <td>${phones}</td>
        <td>${services}</td>
        <td><button onclick="openInteractions('${docSnap.id}', '${c.name}')">View/Edit</button></td>
      </tr>
    `;
  });
}

// Add Client
document.getElementById("addClientForm").addEventListener("submit", async e=>{
  e.preventDefault();
  await addDoc(collection(db, "clients"), {
    name: document.getElementById("clientName").value,
    phones: [document.getElementById("clientPhone1").value, document.getElementById("clientPhone2").value].filter(Boolean),
    stage: document.getElementById("clientStage").value,
    interestedServices:[{
      primary: document.getElementById("clientCountry").value,
      sub: document.getElementById("clientService").value,
      estimatedPrice: parseFloat(document.getElementById("clientPrice").value)
    }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  alert("Client added!");
  e.target.reset();
  loadClients();
});

// Open Interactions Modal
window.openInteractions = async function(clientId, clientName){
  currentClientId = clientId;
  document.getElementById("modalClientName").innerText = clientName;
  modal.style.display = "flex";
  loadInteractions();
}

// Close Modal
window.closeModal = function(){ modal.style.display="none"; }

// Load Interactions
async function loadInteractions(){
  const tbody = document.getElementById("interactionsTable");
  tbody.innerHTML = "";
  if(!currentClientId) return;

  const snapshot = await getDocs(collection(db, "clients", currentClientId, "interactions"));
  snapshot.forEach(docSnap=>{
    const i = docSnap.data();
    tbody.innerHTML += `
      <tr>
        <td>${i.date?.toDate().toLocaleString()||"N/A"}</td>
        <td>${i.type}</td>
        <td>${i.phoneUsed||""}</td>
        <td>${i.notes||""}</td>
        <td><button onclick="editInteraction('${docSnap.id}')">Edit</button></td>
      </tr>
    `;
  });
}

// Edit Interaction (only notes for now)
window.editInteraction = async function(interactionId){
  const ref = doc(db, "clients", currentClientId, "interactions", interactionId);
  const newNotes = prompt("Edit Notes:");
  if(newNotes!==null){
    await updateDoc(ref,{notes:newNotes, updatedAt: serverTimestamp()});
    loadInteractions();
  }
}

// Add Interaction
document.getElementById("addInteractionForm").addEventListener("submit", async e=>{
  e.preventDefault();
  if(!currentClientId) return;
  await addDoc(collection(db, "clients", currentClientId, "interactions"),{
    type: document.getElementById("interactionType").value,
    phoneUsed: document.getElementById("interactionPhone").value,
    notes: document.getElementById("interactionNotes").value,
    date: serverTimestamp()
  });
  e.target.reset();
  loadInteractions();
});

// Initial load
loadClients();
