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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load Clients
async function loadClients() {
  const tableBody = document.getElementById("clientsTable");
  tableBody.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "clients"));
  querySnapshot.forEach(docSnap => {
    const client = docSnap.data();
    const phones = client.phones?.join(", ") || "N/A";
    const services = client.interestedServices?.map(s => `${s.primary} (${s.sub}) $${s.estimatedPrice}`).join("<br>") || "";
    tableBody.innerHTML += `
      <tr>
        <td>${client.name}</td>
        <td>${client.stage || ""}</td>
        <td>${phones}</td>
        <td>${services}</td>
        <td><button onclick="viewInteractions('${docSnap.id}','${client.name}')">View Interactions</button></td>
      </tr>
    `;
  });
}

// Add Client
document.getElementById("addClientForm").addEventListener("submit", async e => {
  e.preventDefault();
  await addDoc(collection(db, "clients"), {
    name: document.getElementById("clientName").value,
    phones: [document.getElementById("clientPhone1").value, document.getElementById("clientPhone2").value].filter(Boolean),
    stage: document.getElementById("clientStage").value,
    interestedServices: [{
      primary: document.getElementById("clientCountry").value,
      sub: document.getElementById("clientService").value,
      estimatedPrice: parseFloat(document.getElementById("clientPrice").value)
    }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  e.target.reset();
  alert("Client added!");
  loadClients();
});

// Open Interactions in new page
window.viewInteractions = (clientId, clientName) => {
  window.location.href = `interactions.html?clientId=${clientId}&clientName=${encodeURIComponent(clientName)}`;
}

// Initial load
loadClients();
