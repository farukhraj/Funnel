import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Firebase configuration
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

// Modal Elements
const addClientBtn = document.getElementById("addClientBtn");
const clientModal = document.getElementById("clientModal");
const closeModal = document.getElementById("closeModal");
const clientForm = document.getElementById("clientForm");

// Open Modal
addClientBtn.addEventListener("click", () => {
  clientModal.style.display = "flex";
});

// Close Modal
closeModal.addEventListener("click", () => {
  clientModal.style.display = "none";
});

// Add Client via Modal
clientForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    await addDoc(collection(db, "clients"), {
      name: document.getElementById("clientName").value,
      phones: [document.getElementById("clientPhone").value],
      stage: document.getElementById("clientStage").value,
      interestedServices: [
        {
          primary: document.getElementById("clientCountry").value,
          sub: document.getElementById("clientService").value,
          estimatedPrice: parseFloat(document.getElementById("clientPrice").value)
        }
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    alert("Client added!");
    clientModal.style.display = "none";
    clientForm.reset();
    loadClients(); // refresh client table without full reload
  } catch (error) {
    console.error("Error adding client: ", error);
    alert("Failed to add client. Check console for details.");
  }
});

// Load Clients into Table
async function loadClients() {
  const tableBody = document.getElementById("clientsTable");
  if (!tableBody) return;
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
        <td>
          <button onclick="viewInteractions('${docSnap.id}', '${client.name}')">View Interactions</button>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}

// Interactions (same as previous)
let currentClientId = null;
window.viewInteractions = async function(clientId, clientName) {
  currentClientId = clientId;
  document.getElementById("clientNameTitle").innerText = clientName;
  document.getElementById("interactionsSection").style.display = "block";
  loadInteractions();
}

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
document.getElementById("addInteractionForm")?.addEventListener("submit", async (e) => {
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

  document.getElementById("addInteractionForm").reset();
  loadInteractions();
});

// Initial load
loadClients();
