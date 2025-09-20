import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

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
const clientModal = document.getElementById("clientModal");
const modalClientName = document.getElementById("modalClientName");
const profileForm = document.getElementById("profileForm");
const addInteractionForm = document.getElementById("addInteractionForm");
const interactionsTable = document.getElementById("interactionsTable");

// Tab switching
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-content").forEach(c=>c.style.display="none");
    document.getElementById(btn.dataset.tab).style.display="block";
  });
});

// Modal tab switching
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
  snapshot.forEach(docSnap=>{
    const c = docSnap.data();
    const phones = c.phones?.join(", ")||"";
    const services = c.interestedServices?.map(s=>`${s.primary} (${s.sub}) $${s.estimatedPrice}`).join(", ")||"";
    clientsTable.innerHTML += `
      <tr>
        <td data-label="Name">${c.name}</td>
        <td data-label="Stage">${c.stage||""}</td>
        <td data-label="Phones">${phones}</td>
        <td data-label="Services">${services}</td>
        <td data-label="Actions">
          <button onclick="openClientModal('${docSnap.id}','${c.name}')">View Profile</button>
        </td>
      </tr>
    `;
  });
}

// Add client
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await addDoc(collection(db,"clients"), clientData);
  addClientForm.reset();
  loadClients();
});

// Open client modal
window.openClientModal = async function(clientId, clientName){
  currentClientId = clientId;
  modalClientName.innerText = clientName;
  clientModal.style.display="flex";

  // Load profile data
  const snapshot = await getDocs(collection(db,"clients"));
  snapshot.forEach(docSnap=>{
    if(docSnap.id === clientId){
      const c = docSnap.data();
      document.getElementById("modalName").value = c.name||"";
      document.getElementById("modalPhone1").value = c.phones?.[0]||"";
      document.getElementById("modalPhone2").value = c.phones?.[1]||"";
      document.getElementById("modalEmail").value = c.email||"";
      document.getElementById("modalAddress").value = c.address||"";
      document.getElementById("modalStage").value = c.stage||"";
      document.getElementById("modalExecutive").value = c.assignedExecutive||"";
      document.getElementById("modalCountry").value = c.interestedServices?.[0]?.primary||"";
      document.getElementById("modalService").value = c.interestedServices?.[0]?.sub||"";
      document.getElementById("modalPrice").value = c.interestedServices?.[0]?.estimatedPrice||"";
      document.getElementById("modalProfilePic").value = c.profilePicture||"";
    }
  });

  loadInteractions();
}

// Close modal
window.closeModal = ()=> clientModal.style.display="none";

// Save profile from modal
profileForm.addEventListener("submit", async e=>{
  e.preventDefault();
  if(!currentClientId) return;
  const docRef = doc(db,"clients",currentClientId);
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
  await updateDoc(docRef, data);
  alert("Profile updated!");
  loadClients();
});

// Add interaction
addInteractionForm.addEventListener("submit", async e=>{
  e.preventDefault();
  if(!currentClientId) return;
  const docRef = collection(db,"clients",currentClientId,"interactions");
  await addDoc(docRef, {
    type: document.getElementById("interactionType").value,
    phoneUsed: document.getElementById("phoneUsed").value,
    nextFollowUp: document.getElementById("nextFollowUp").value,
    notes: document.getElementById("notes").value,
    date: serverTimestamp()
  });
  addInteractionForm.reset();
  loadInteractions();
});

// Load interactions
async function loadInteractions(){
  interactionsTable.innerHTML="";
  if(!currentClientId) return;
  const snapshot = await getDocs(collection(db,"clients",currentClientId,"interactions"));
  snapshot.forEach(docSnap=>{
    const i = docSnap.data();
    const date = i.date?.toDate().toLocaleString() || "";
    interactionsTable.innerHTML += `
      <tr>
        <td data-label="Date">${date}</td>
        <td data-label="Type">${i.type||""}</td>
        <td data-label="Phone">${i.phoneUsed||""}</td>
        <td data-label="Next Follow-up">${i.nextFollowUp||""}</td>
        <td data-label="Notes">${i.notes||""}</td>
      </tr>
    `;
  });
}

// Initial load
loadClients();
