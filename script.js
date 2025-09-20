import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Firebase config
const firebaseConfig = { /* your config */ };
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
    const servicesText = client.interestedServices?.map(s => `${s.primary} (${s.sub}) $${s.estimatedPrice}`).join("<br>") || "";
    tableBody.innerHTML += `
      <tr>
        <td>${client.name}</td>
        <td>${client.stage}</td>
        <td>${phones}</td>
        <td>${servicesText}</td>
        <td><button onclick="viewInteractions('${docSnap.id}')">View Interactions</button></td>
      </tr>
    `;
  });
}

// Add Client
document.getElementById("addClientForm").addEventListener("submit", async e => {
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
  alert("Client added!");
  e.target.reset();
  loadClients();
});

// Open interactions in new page
window.viewInteractions = function(clientId) {
  window.location.href = `interactions.html?clientId=${clientId}`;
}

// Initial load
loadClients();
