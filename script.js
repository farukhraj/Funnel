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

// Load clients
async function loadClients(){
  const clientsTable = document.getElementById("clientsTable");
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
          <button onclick="openClientModal('${docSnap.id}')">View Profile</button>
        </td>
      </tr>
    `;
  });
}

// Open client modal
window.openClientModal = async function(clientId){
  currentClientId = clientId;
  const docRef = doc(db,"clients",clientId);
  const docSnap = await getDoc(docRef);

  if(docSnap.exists()){
    const c = docSnap.data();
    document.getElementById("modalClientName").innerText = c.name;
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

  document.getElementById("clientModal").style.display="flex";
  loadInteractions();
}

// Close modal
window.closeModal = ()=> document.getElementById("clientModal").style.display="none";

// Initial load
loadClients();
