import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elements
const clientsTable = document.getElementById("clientsTable");
const totalClients = document.getElementById("totalClients");
const addClientForm = document.getElementById("addClientForm");
const interactionModal = document.getElementById("interactionModal");
const modalClientName = document.getElementById("modalClientName");
const profileForm = document.getElementById("profileForm");
const addInteractionForm = document.getElementById("addInteractionForm");
const interactionsTable = document.getElementById("interactionsTable");

let currentClientId = null;
let editingClientId = null;

// Tabs
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-content").forEach(c=>c.style.display="none");
    document.getElementById(btn.dataset.tab).style.display="block";
  });
});

document.querySelectorAll(".modal-tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".modal-tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".modal-tab-content").forEach(c=>c.style.display="none");
    document.getElementById(btn.dataset.tab).style.display="block";
  });
});

// Load clients
async function loadClients(){
  clientsTable.innerHTML="";
  const snapshot = await getDocs(collection(db,"clients"));
  totalClients.innerText = snapshot.size;
  snapshot.forEach(docSnap=>{
    const c = docSnap.data();
    const phones = c.phones?.join(", ")||"";
    const services = c.interestedServices?.map(s=>`${s.primary} (${s.sub}) $${s.estimatedPrice}`).join(", ")||"";
    clientsTable.innerHTML += `
      <tr>
        <td>${c.name}</td>
        <td>${c.stage||""}</td>
        <td>${phones}</td>
        <td>${services}</td>
        <td>
          <button onclick="openClientModal('${docSnap.id}','${c.name}')">View Profile</button>
        </td>
      </tr>
    `;
  });
}

// Add/Edit Client
addClientForm.addEventListener("submit", async e=>{
  e.preventDefault();
  const clientData = {
    name: document.getElementById("clientName").value,
    phones: [document.getElementById("clientPhone1").value, document.getElementById("clientPhone2").value].filter(Boolean),
    email: document.getElementById("clientEmail").value,
    address: document.getElementById("clientAddress").value,
    stage: document.getElementById("clientStage").value,
    assignedExecutive: document.getElementById("clientExecutive").value,
    interestedServices:[{
      primary: document.getElementById("clientCountry").value,
      sub: document.getElementById("clientService").value,
      estimatedPrice: parseFloat(document.getElementById("clientPrice").value)
    }],
    profilePicture: document.getElementById("clientProfilePic").value,
    updatedAt: serverTimestamp()
  };

  if(editingClientId){
    await updateDoc(doc(db,"clients",editingClientId), clientData);
    editingClientId = null;
  } else {
    clientData.createdAt = serverTimestamp();
    await addDoc(collection(db,"clients"), clientData);
  }

  addClientForm.reset();
  loadClients();
});

// Open Modal
window.openClientModal = async function(clientId, clientName){
  currentClientId = clientId;
  modalClientName.innerText = clientName;
  interactionModal.style.display="flex";

  // Load profile
  const clientRef = doc(db,"clients",clientId);
  const clientSnap = await getDocs(collection(db,"clients"));
  // populate fields (simplified)
  document.getElementById("modalName").value = clientName;

  loadInteractions();
}

// Close Modal
window.closeModal = ()=> interactionModal.style.display="none";

// Load interactions
async function loadInteractions(){
  interactionsTable.innerHTML="";
  if(!currentClientId) return;
  const snapshot = await getDocs(collection(db,"clients",currentClientId,"history"));
  snapshot.forEach(docSnap=>{
    const h = docSnap.data();
    const date = h.date?.toDate().toLocaleString()||"N/A";
    interactionsTable.innerHTML += `
      <tr>
        <td>${date}</td>
        <td>${h.type||"Profile Edit"}</td>
        <td>${h.phoneUsed||""}</td>
        <td>${h.notes||JSON.stringify(h)}</td>
      </tr>
    `;
  });
}

// Save profile from modal
profileForm.addEventListener("submit", async e=>{
  e.preventDefault();
  if(!currentClientId) return;
  const data = {
    name: document.getElementById("modalName").value,
    phones: [document.getElementById("modalPhone1").value, document.getElementById("modalPhone2").value].filter(Boolean),
    email: document.getElementById("modalEmail").value,
    address: document.getElementById("modalAddress").value,
    stage: document.getElementById("modalStage").value,
    assignedExecutive: document.getElementById("modalExecutive").value,
    interestedServices:[{
      primary: document.getElementById("modalCountry").value,
      sub: document.getElementById("modalService").value,
      estimatedPrice: parseFloat(document.getElementById("modalPrice").value)
    }],
    profilePicture: document.getElementById("modalProfilePic").value,
    updatedAt: serverTimestamp()
  };
  await updateDoc(doc(db,"clients",currentClientId), data);
  await addDoc(collection(db,"clients",currentClientId,"history"), {...data, type:"Profile Edit", date:serverTimestamp()});
  alert("Profile saved!");
  loadInteractions();
});

// Add interaction
addInteractionForm.addEventListener("submit", async e=>{
  e.preventDefault();
  if(!currentClientId) return;
  const interaction = {
    type: document.getElementById("interactionType").value,
    phoneUsed: document.getElementById("phoneUsed").value,
    notes: document.getElementById("notes").value,
    date: serverTimestamp()
  };
  await addDoc(collection(db,"clients",currentClientId,"history"), interaction);
  addInteractionForm.reset();
  loadInteractions();
});

// Initial load
loadClients();
