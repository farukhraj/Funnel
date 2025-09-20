import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

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

// Tab navigation
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-section").forEach(c=>c.style.display="none");
    document.getElementById(btn.dataset.tab).style.display="block";
  });
});

// Load clients
async function loadClients(){
  const table = document.getElementById("clientsTable");
  table.innerHTML = "";
  const snapshot = await getDocs(collection(db,"clients"));
  snapshot.forEach(docSnap=>{
    const c = docSnap.data();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${c.name||""}</td>
      <td>${c.stage||""}</td>
      <td>${(c.phones||[]).join(", ")}</td>
      <td>${c.interestedServices?.[0]?.primary||""}</td>
      <td><button class="btn btn-sm btn-primary" onclick="openClient('${docSnap.id}')">View</button></td>
    `;
    table.appendChild(row);
  });
}

// Add client
document.getElementById("addClientForm").addEventListener("submit",async e=>{
  e.preventDefault();
  await addDoc(collection(db,"clients"),{
    name: document.getElementById("clientName").value,
    stage: document.getElementById("clientStage").value,
    phones:[document.getElementById("clientPhone1").value, document.getElementById("clientPhone2").value].filter(Boolean),
    email: document.getElementById("clientEmail").value,
    interestedServices:[{
      primary: document.getElementById("clientCountry").value,
      sub: document.getElementById("clientService").value,
      estimatedPrice: parseFloat(document.getElementById("clientPrice").value)
    }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  e.target.reset();
  loadClients();
  alert("Client added!");
});

// Open modal
window.openClient = async function(clientId){
  currentClientId = clientId;
  const docRef = doc(db,"clients",clientId);
  const snap = await getDoc(docRef);
  if(snap.exists()){
    const c = snap.data();
    document.getElementById("modalClientName").innerText = c.name;
    document.getElementById("editName").value = c.name||"";
    document.getElementById("editStage").value = c.stage||"";
    document.getElementById("editPhone1").value = c.phones?.[0]||"";
    document.getElementById("editPhone2").value = c.phones?.[1]||"";
    document.getElementById("editEmail").value = c.email||"";
    document.getElementById("editCountry").value = c.interestedServices?.[0]?.primary||"";
    document.getElementById("editService").value = c.interestedServices?.[0]?.sub||"";
    document.getElementById("editPrice").value = c.interestedServices?.[0]?.estimatedPrice||"";
  }
  loadInteractions();
  new bootstrap.Modal(document.getElementById("clientModal")).show();
};

// Update profile
document.getElementById("editClientForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!currentClientId) return;
  const docRef = doc(db,"clients",currentClientId);
  await updateDoc(docRef,{
    name: document.getElementById("editName").value,
    stage: document.getElementById("editStage").value,
    phones:[document.getElementById("editPhone1").value, document.getElementById("editPhone2").value].filter(Boolean),
    email: document.getElementById("editEmail").value,
    interestedServices:[{
      primary: document.getElementById("editCountry").value,
      sub: document.getElementById("editService").value,
      estimatedPrice: parseFloat(document.getElementById("editPrice").value)
    }],
    updatedAt: serverTimestamp()
  });
  alert("Profile updated!");
  loadClients();
});

// Load interactions
async function loadInteractions(){
  const table = document.getElementById("interactionsTable");
  table.innerHTML = "";
  if(!currentClientId) return;
  const snapshot = await getDocs(collection(db,"clients",currentClientId,"interactions"));
  snapshot.forEach(docSnap=>{
    const i = docSnap.data();
    const date = i.date?.toDate().toLocaleString()||"";
    const row = document.createElement("tr");
    row.innerHTML = `<td>${date}</td><td>${i.type}</td><td>${i.notes}</td>`;
    table.appendChild(row);
  });
}

// Add interaction
document.getElementById("addInteractionForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!currentClientId) return;
  await addDoc(collection(db,"clients",currentClientId,"interactions"),{
    type: document.getElementById("interactionType").value,
    notes: document.getElementById("interactionNotes").value,
    date: serverTimestamp()
  });
  e.target.reset();
  loadInteractions();
  alert("Interaction added!");
});

loadClients();
