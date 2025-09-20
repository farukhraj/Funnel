import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Modal
const addClientBtn = document.getElementById("addClientBtn");
const clientModal = document.getElementById("clientModal");
const closeModal = document.getElementById("closeModal");
const clientForm = document.getElementById("clientForm");

addClientBtn.addEventListener("click", () => clientModal.style.display = "flex");
closeModal.addEventListener("click", () => clientModal.style.display = "none");

// Add Client
clientForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  await addDoc(collection(db, "clients"), {
    name: document.getElementById("clientName").value,
    phones: [document.getElementById("clientPhone").value],
    stage: document.getElementById("clientStage").value,
    interestedServices: [{
      primary: document.getElementById("clientCountry").value,
      sub: document.getElementById("clientService").value,
      estimatedPrice: parseFloat(document.getElementById("clientPrice").value)
    }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  clientModal.style.display = "none";
  clientForm.reset();
  loadClients();
});

// Load Clients
async function loadClients() {
  const tableBody = document.getElementById("clientsTable");
  tableBody.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "clients"));
  querySnapshot.forEach((docSnap) => {
    const client = docSnap.data();
    const phones = client.phones?.join(", ") || "N/A";
    let servicesText = "";
    if (client.interestedServices) {
      client.interestedServices.forEach(s => servicesText += `${s.primary} (${s.sub}) $${s.estimatedPrice}<br>`);
    }
    tableBody.innerHTML += `
      <tr>
        <td>${client.name}</td>
        <td>${client.stage}</td>
        <td>${phones}</td>
        <td>${servicesText}</td>
        <td><button onclick="viewInteractions('${docSnap.id}','${client.name}')">View Interactions</button></td>
      </tr>
    `;
  });
}

// Interactions
let currentClientId = null;
window.viewInteractions = async function(id, name) {
  currentClientId = id;
  document.getElementById("clientNameTitle").innerText = name;
  document.getElementById("interactionsSection").style.display = "block";
  loadInteractions();
}

async function loadInteractions() {
  const tableBody = document.getElementById("interactionsTable");
  tableBody.innerHTML = "";
  if (!currentClientId) return;
  const querySnapshot = await getDocs(collection(db, "clients", currentClientId, "interactions"));
  querySnapshot.forEach(docSnap => {
    const i = docSnap.data();
    tableBody.innerHTML += `
      <tr>
        <td>${i.date?.toDate().toLocaleString() || "N/A"}</td>
        <td>${i.type || "N/A"}</td>
        <td>${i.phoneUsed || "N/A"}</td>
        <td>${i.notes || ""}</td>
      </tr>
    `;
  });
}

// Add Interaction
document.getElementById("addInteractionForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!currentClientId) return;
  await addDoc(collection(db, "clients", currentClientId, "interactions"), {
    type: document.getElementById("interactionType").value,
    phoneUsed: document.getElementById("phoneUsed").value,
    notes: document.getElementById("notes").value,
    date: serverTimestamp()
  });
  document.getElement
