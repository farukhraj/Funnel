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

let currentClientId = null;

// DOM elements
const clientsTable = document.getElementById("clientsTable");
const addClientForm = document.getElementById("addClientForm");
const interactionModal = document.getElementById("interactionModal");
const modalClientName = document.getElementById("modalClientName");
const addInteractionForm = document.getElementById("addInteractionForm");
const interactionsTable = document.getElementById("interactionsTable");

// Load clients
async function loadClients(){
  clientsTable.innerHTML = "";
  const snapshot = await getDocs(collection(db,"clients"));
  snapshot.forEach(docSnap=>{
    const c = docSnap.data();
    const phones = c.phones?.join(", ") || "N/A";
    const services = c.interestedServices?.map(s=>`${s.primary} (${s.sub}) $${s.estimatedPrice}`).join(", ") || "";

    clientsTable.innerHTML += `
      <tr>
        <td data-label="Name">${c.name}</td>
        <td data-label="Stage">${c.stage}</td>
        <td data-label="Phones">${phones}</td>
        <td data-label="Services">${services}</td>
        <td data-label="Actions">
          <button onclick="openInteractions('${docSnap.id}','${c.name}')">View/Edit</button>
        </td>
      </tr>
    `;
  });

  // Update dashboard count
  const totalClients = document.getElementById("totalClients");
  if(totalClients) totalClients.innerText = snapshot.size;
}

// Add client
addClientForm.addEventListener("submit", async e=>{
  e.preventDefault();
  const name = document.getElementById("clientName").value;
  const phone1 = document.getElementById("clientPhone1").value;
  const phone2 = document.getElementById("clientPhone2").value;
  const stage = document.getElementById("clientStage").value;
  const country = document.getElementById("clientCountry").value;
  const service = document.getElementById("clientService").value;
  const price = parseFloat(document.getElementById("clientPrice").value);

  await addDoc(collection(db,"clients"),{
    name,
    phones: [phone1, phone2].filter(Boolean),
    stage,
    interestedServices: [{primary:country, sub:service, estimatedPrice:price}],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  addClientForm.reset();
  loadClients();
  alert("Client added!");
});

// Open interactions modal
window.openInteractions = async function(clientId, clientName){
  currentClientId = clientId;
  modalClientName.innerText = clientName;
  interactionModal.style.display = "flex";
  loadInteractions();
}

// Close modal
window.closeModal = function(){ interactionModal.style.display="none"; }

// Load interactions
async function loadInteractions(){
  interactionsTable.innerHTML="";
  if(!currentClientId) return;

  const snapshot = await getDocs(collection(db,"clients",currentClientId,"interactions"));
  snapshot.forEach(docSnap=>{
    const i = docSnap.data();
    const date = i.date?.toDate().toLocaleString() || "N/A";
    interactionsTable.innerHTML += `
      <tr>
        <td data-label="Date">${date}</td>
        <td data-label="Type">${i.type || ""}</td>
        <td data-label="Phone">${i.phoneUsed || ""}</td>
        <td data-label="Notes">${i.notes || ""}</td>
        <td data-label="Edit"><button>Edit</button></td>
      </tr>
    `;
  });
}

// Add interaction
addInteractionForm.addEventListener("submit", async e=>{
  e.preventDefault();
  if(!currentClientId) return;

  const type = document.getElementById("interactionType").value;
  const phone = document.getElementById("interactionPhone").value;
  const notes = document.getElementById("interactionNotes").value;

  await addDoc(collection(db,"clients",currentClientId,"interactions"),{
    type, phoneUsed:phone, notes, date:serverTimestamp()
  });

  addInteractionForm.reset();
  loadInteractions();
});

loadClients();
