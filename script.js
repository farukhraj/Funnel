import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

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

// Tabs
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-content").forEach(c=>c.style.display="none");
    document.getElementById(btn.dataset.tab).style.display="block";
  });
});

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
  document.getElementById("totalClients").innerText = snapshot.size;
  snapshot.forEach(docSnap=>{
    const c = docSnap.data();
    const phones = c.phones?.join(", ") || "N/A";
    const services = c.interestedServices?.map(s=>`${s.primary} (${s.sub}) $${s.estimatedPrice}`).join(", ") || "";
    clientsTable.innerHTML += `
      <tr>
        <td>${c.name}</td>
        <td>${c.stage}</td>
        <td>${phones}</td>
        <td>${services}</td>
        <td>
          <button onclick="openInteractions('${docSnap.id}','${c.name}')">View Interactions</button>
        </td>
      </tr>
    `;
  });
}

// Add or Update client
addClientForm.addEventListener("submit", async e=>{
  e.preventDefault();
  const clientData = {
    name: document.getElementById("clientName").value,
    phones: [document.getElementById("clientPhone1").value, document.getElementById("clientPhone2").value].filter(Boolean),
    email: document.getElementById("clientEmail").value,
    address: document.getElementById("clientAddress").value,
    assignedExecutive: document.getElementById("assignedExecutive").value,
    stage: document.getElementById("clientStage").value,
    interestedServices: [{
      primary: document.getElementById("clientCountry").value,
      sub: document.getElementById("clientService").value,
      estimatedPrice: parseFloat(document.getElementById("clientPrice").value)
    }],
    profilePicture: document.getElementById("profilePicture").value,
    updatedAt: serverTimestamp()
  };

  if(editingClientId){
    const docRef = doc(db,"clients",editingClientId);
    await updateDoc(docRef, clientData);
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

// Open client modal
window.openInteractions = async function(clientId, clientName){
  currentClientId = clientId;
  modalClientName.innerText = clientName;
  interactionModal.style.display = "flex";

  // Load profile info
  const clientRef = doc(db,"clients",clientId);
  const clientSnap = await getDocs(collection(db,"clients"));
  const cSnap = await clientRef.get ? await clientRef.get() : await clientRef; // some adjustment
  if(cSnap.exists()){
    const c = cSnap.data();
    document.getElementById("modalClientNameInput").value = c.name;
    document.getElementById("modalClientPhone1").value = c.phones?.[0] || "";
    document.getElementById("modalClientPhone2").value = c.phones?.[1] || "";
    document.getElementById("modalClientEmail").value = c.email || "";
    document.getElementById("modalClientAddress").value = c.address || "";
    document.getElementById("modalAssignedExecutive").value = c.assignedExecutive || "";
    document.getElementById("modalClientStage").value = c.stage || "";
    document.getElementById("modalClientCountry").value = c.interestedServices?.[0]?.primary || "";
    document.getElementById("modalClientService").value = c.interestedServices?.[0]?.sub || "";
    document.getElementById("modalClientPrice").value = c.interestedServices?.[0]?.estimatedPrice || "";
    document.getElementById("modalProfilePicture").value = c.profilePicture || "";
  }

  loadInteractions();
}

// Close modal
window.closeModal = ()=>interactionModal.style.display="none";

// Load interactions/history
async function loadInteractions(){
  interactionsTable.innerHTML="";
  if(!currentClientId) return;
  const snapshot = await getDocs(collection(db,"clients",currentClientId,"history"));
  snapshot.forEach(docSnap=>{
    const h = docSnap.data();
    let details = "";
    if(h.type==="profileEdit"){
      details = JSON.stringify(h.changes);
    } else if(h.type==="interaction"){
      details = h.notes || "";
    }
    const date = h.date?.toDate().toLocaleString() || "N/A";
    interactionsTable.innerHTML += `
      <tr>
        <td>${date}</td>
        <td>${h.type || ""}</td>
        <td>${h.phoneUsed || ""}</td>
        <td>${details}</td>
      </tr>
    `;
  });
}

// Add new interaction
addInteractionForm.addEventListener("submit", async e=>{
  e.preventDefault();
  if(!currentClientId) return;
  const data = {
    type: "interaction",
    interactionType: document.getElementById("interactionType").value,
    phoneUsed: document.getElementById("phoneUsed").value,
    notes: document.getElementById("notes").value,
    date: serverTimestamp()
  };
  await addDoc(collection(db,"clients",currentClientId,"history"), data);
  addInteractionForm.reset();
  loadInteractions();
});

// Initial load
loadClients();
