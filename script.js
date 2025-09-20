import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Firebase
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

let currentClientId = null, editClientId = null;

// DOM elements
const clientsTable = document.getElementById("clientsTable");
const addClientForm = document.getElementById("addClientForm");
const interactionModal = document.getElementById("interactionModal");
const modalClientName = document.getElementById("modalClientName");
const addInteractionForm = document.getElementById("addInteractionForm");
const interactionsTable = document.getElementById("interactionsTable");
const editClientModal = document.getElementById("editClientModal");
const editClientForm = document.getElementById("editClientForm");

// Tabs
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-content").forEach(c=>c.style.display="none");
    document.getElementById(btn.dataset.tab).style.display="block";
  });
});

// Load clients
async function loadClients(){
  clientsTable.innerHTML="";
  const snapshot = await getDocs(collection(db,"clients"));
  document.getElementById("totalClients").innerText = snapshot.size;
  snapshot.forEach(docSnap=>{
    const c = docSnap.data();
    const phones = c.phones?.join(", ")||"N/A";
    const services = c.interestedServices?.map(s=>`${s.primary} (${s.sub}) $${s.estimatedPrice}`).join(", ")||"";
    clientsTable.innerHTML += `
      <tr>
        <td data-label="Name">${c.name}</td>
        <td data-label="Stage">${c.stage}</td>
        <td data-label="Phones">${phones}</td>
        <td data-label="Services">${services}</td>
        <td data-label="Actions">
          <button onclick="openInteractions('${docSnap.id}','${c.name}')">View/Edit Interactions</button>
          <button onclick="openEditClient('${docSnap.id}')">Edit Client</button>
        </td>
      </tr>
    `;
  });
}

// Add client
addClientForm.addEventListener("submit", async e=>{
  e.preventDefault();
  await addDoc(collection(db,"clients"),{
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
  addClientForm.reset();
  loadClients();
  alert("Client added!");
});

// Interactions modal
window.openInteractions = async function(clientId, clientName){
  currentClientId = clientId;
  modalClientName.innerText = clientName;
  interactionModal.style.display="flex";
  loadInteractions();
}
window.closeModal = ()=>interactionModal.style.display="none";
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
        <td data-label="Type">${i.type||""}</td>
        <td data-label="Phone">${i.phoneUsed||""}</td>
        <td data-label="Notes">${i.notes||""}</td>
      </tr>
    `;
  });
}
addInteractionForm.addEventListener("submit", async e=>{
  e.preventDefault();
  if(!currentClientId) return;
  await addDoc(collection(db,"clients",currentClientId,"interactions"),{
    type: document.getElementById("interactionType").value,
    phoneUsed: document.getElementById("interactionPhone").value,
    notes: document.getElementById("interactionNotes").value,
    date: serverTimestamp()
  });
  addInteractionForm.reset();
  loadInteractions();
});

// Edit client
window.openEditClient = async function(clientId){
  editClientId = clientId;
  const snapshot = await getDocs(collection(db,"clients"));
  snapshot.forEach(docSnap=>{
    if(docSnap.id===clientId){
      const c = docSnap.data();
      document.getElementById("editClientName").value=c.name||"";
      document.getElementById("editClientPhone1").value=c.phones?.[0]||"";
      document.getElementById("editClientPhone2").value=c.phones?.[1]||"";
      document.getElementById("editClientStage").value=c.stage||"";
      document.getElementById("editClientCountry").value=c.interestedServices?.[0]?.primary||"";
      document.getElementById("editClientService").value=c.interestedServices?.[0]?.sub||"";
      document.getElementById("editClientPrice").value=c.interestedServices?.[0]?.estimatedPrice||"";
    }
  });
  editClientModal.style.display="flex";
}
window.closeEditModal = ()=>editClientModal.style.display="none";

editClientForm.addEventListener("submit", async e=>{
  e.preventDefault();
  if(!editClientId) return;
  const snapshot = await getDocs(collection(db,"clients"));
  snapshot.forEach(async docSnap=>{
    if(docSnap.id===editClientId){
      await addDoc(collection(db,"clients"),{
        name: document.getElementById("editClientName").value,
        phones: [document.getElementById("editClientPhone1").value, document.getElementById("editClientPhone2").value].filter(Boolean),
        stage: document.getElementById("editClientStage").value,
        interestedServices:[{
          primary: document.getElementById("editClientCountry").value,
          sub: document.getElementById("editClientService").value,
          estimatedPrice: parseFloat(document.getElementById("editClientPrice").value)
        }],
        updatedAt: serverTimestamp()
      });
    }
  });
  editClientForm.reset();
  editClientModal.style.display="none";
  loadClients();
  alert("Client updated!");
});

// Initial load
loadClients();
