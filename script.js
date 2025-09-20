import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { 
  getFirestore, collection, getDocs, addDoc, serverTimestamp,
  doc, getDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

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
let editingClientId = null;

const clientsTable = document.getElementById("clientsTable");
const addClientForm = document.getElementById("addClientForm");

// Tabs
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
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
          <button onclick="openInteractions('${docSnap.id}','${c.name}')">View Interactions</button>
          <button onclick="editClient('${docSnap.id}')">Edit</button>
          <button onclick="deleteClient('${docSnap.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

// Add/Edit client
addClientForm.addEventListener("submit", async e=>{
  e.preventDefault();

  const clientData = {
    name: document.getElementById("clientName").value,
    phones: [
      document.getElementById("clientPhone1").value,
      document.getElementById("clientPhone2").value
    ].filter(Boolean),
    stage: document.getElementById("clientStage").value,
    interestedServices:[{
      primary: document.getElementById("clientCountry").value,
      sub: document.getElementById("clientService").value,
      estimatedPrice: parseFloat(document.getElementById("clientPrice").value)
    }],
    updatedAt: serverTimestamp()
  };

  if(editingClientId){
    await updateDoc(doc(db,"clients",editingClientId), clientData);
    alert("Client updated!");
    editingClientId = null;
  } else {
    clientData.createdAt = serverTimestamp();
    await addDoc(collection(db,"clients"), clientData);
    alert("Client added!");
  }

  addClientForm.reset();
  loadClients();
  document.querySelector(".tab-btn[data-tab='salesLeadsTab']").click();
});

// Edit client
window.editClient = async function(clientId){
  const docSnap = await getDoc(doc(db,"clients",clientId));
  if(docSnap.exists()){
    const c = docSnap.data();
    document.getElementById("clientName").value = c.name;
    document.getElementById("clientPhone1").value = c.phones[0] || "";
    document.getElementById("clientPhone2").value = c.phones[1] || "";
    document.getElementById("clientStage").value = c.stage || "";
    document.getElementById("clientCountry").value = c.interestedServices?.[0]?.primary || "";
    document.getElementById("clientService").value = c.interestedServices?.[0]?.sub || "";
    document.getElementById("clientPrice").value = c.interestedServices?.[0]?.estimatedPrice || "";
    editingClientId = clientId;
    document.querySelector(".tab-btn[data-tab='addClientTab']").click();
  }
}

// Delete client
window.deleteClient = async function(clientId){
  if(confirm("Are you sure you want to delete this client?")){
    await deleteDoc(doc(db,"clients",clientId));
    alert("Client deleted!");
    loadClients();
  }
}

// Interactions
window.openInteractions = async function(clientId, clientName){
  currentClientId = clientId;
  document.getElementById("modalClientName").innerText = clientName;
  document.getElementById("interactionModal").style.display="flex";
  loadInteractions();
}

window.closeModal = ()=>document.getElementById("interactionModal").style.display="none";

async function loadInteractions(){
  const interactionsTable = document.getElementById("interactionsTable");
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

// Initial load
loadClients();


