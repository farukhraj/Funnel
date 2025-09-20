import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

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
let currentClientName = "";

// Load Clients
async function loadClients() {
  const tableBody = document.getElementById("clientsTable");
  tableBody.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "clients"));
  querySnapshot.forEach((docSnap) => {
    const client = docSnap.data();
    const phones = client.phones ? client.phones.join(", ") : "N/A";

    let servicesText = "";
    if (client.interestedServices && client.interestedServices.length > 0) {
      client.interestedServices.forEach(service => {
        servicesText += `${service.primary || ""} (${service.sub || ""}) $${service.estimatedPrice || ""}<br>`;
      });
    }

    const row = `
      <tr>
        <td>${client.name || "N/A"}</td>
        <td>${client.stage || "N/A"}</td>
        <td>${phones}</td>
        <td>${servicesText}</td>
        <td><button onclick="viewInteractions('${docSnap.id}', '${client.name}')">View Interactions</button></td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}

// Add Client
document.getElementById("addClientForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const stage = document.getElementById("stage").value;
  const phone1 = document.getElementById("phone1").value;
  const phone2 = document.getElementById("phone2").value;
  const servicePrimary = document.getElementById("servicePrimary").value;
  const serviceSub = document.getElementById("serviceSub").value;
  const estimatedPrice = parseFloat(document.getElementById("estimatedPrice").value);

  await addDoc(collection(db, "clients"), {
    name,
    stage,
    phones: [phone1, phone2].filter(Boolean),
    interestedServices: [{ primary: servicePrimary, sub: serviceSub, estimatedPrice }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  e.target.reset();
  loadClients();
});

// View Interactions
window.viewInteractions = async function(clientId, clientName) {
  currentClientId = clientId;
  currentClientName = clientName;
  document.getElementById("clientNameTitle").innerText = clientName;
  document.getElementById("interactionsSection").style.display = "block";
  loadInteractions();
}

// Load Interactions
async function loadInteractions() {
  const tableBody = document.getElementById("interactionsTable");
  tableBody.innerHTML = "";

  if (!currentClientId) return;

  const interactionsRef = collection(db, "clients", currentClientId, "interactions");
  const querySnapshot = await getDocs(interactionsRef);
  querySnapshot.forEach((docSnap) => {
    const interaction = docSnap.data();
    const row = `
      <tr>
        <td>${interaction.date?.toDate().toLocaleString() || "N/A"}</td>
        <td>${interaction.type || "N/A"}</td>
        <td>${interaction.phoneUsed || "N/A"}</td>
        <td>${interaction.notes || ""}</td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}

// Add Interaction
document.getElementById("addInteractionForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentClientId) return;

  const type = document.getElementById("interactionType").value;
  const phoneUsed = document.getElementById("phoneUsed").value;
  const notes = document.getElementById("notes").value;

  const interactionsRef = collection(db, "clients", currentClientId, "interactions");
  await addDoc(interactionsRef, {
    type,
    phoneUsed,
    notes,
    date: serverTimestamp()
  });

  e.target.reset();
  loadInteractions();
});

loadClients();
