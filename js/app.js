import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let allHackathons = [];
let trendingHackathons = [];

const list = document.getElementById("hackathonList");
const trendingList = document.getElementById("trendingList");

async function loadHackathons() {
  try {
    const querySnapshot = await getDocs(collection(db, "hackathons"));

    allHackathons = [];

    querySnapshot.forEach((doc) => {
      let data = doc.data();
      data.id = doc.id;
      data.rating = data.rating || 0;
      data.views = data.views || 0;
      allHackathons.push(data);
    });

    // Sort by rating for trending
    trendingHackathons = [...allHackathons].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);

    displayTrending(trendingHackathons);
    displayHackathons(allHackathons);
  } catch (error) {
    console.error("Error loading hackathons:", error);
    list.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 20px;">❌ Error loading hackathons. Please try again.</p>';
  }
}

function displayTrending(dataArray) {
  trendingList.innerHTML = "";

  if (dataArray.length === 0) {
    trendingList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #cbd5e1;">No trending hackathons yet</p>';
    return;
  }

  dataArray.forEach((data) => {
    const badge = data.rating > 4 ? '<div class="trending-badge">🔥 TRENDING</div>' : '';
    const modeClass = data.mode === "Online" ? "online" : "offline";
    
    trendingList.innerHTML += `
      <div class="card trending-card" onclick="openDetails('${data.id}')">
        ${badge}
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <div>
            <h3>${data.name}</h3>
            <p style="font-size: 12px; color: #94a3b8;">${data.organizer}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; color: #fbbf24;">${'★'.repeat(Math.round(data.rating || 0))}</div>
            <p style="font-size: 12px; color: #cbd5e1;">${data.rating ? data.rating.toFixed(1) : '0'}/5</p>
          </div>
        </div>
        <p>💰 Prize: ${data.prizePool}</p>
        <div class="card-footer">
          <span class="badge ${modeClass}">${data.mode}</span>
          <span class="badge">👁️ ${data.views || 0} views</span>
        </div>
      </div>
    `;
  });
}

function displayHackathons(dataArray) {
  list.innerHTML = "";

  if (dataArray.length === 0) {
    list.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><p style="font-size: 48px; margin-bottom: 10px;">🔍</p><p style="color: #cbd5e1;">No hackathons found. Try adjusting your filters.</p></div>';
    return;
  }

  dataArray.forEach((data) => {
    const modeClass = data.mode === "Online" ? "online" : "offline";
    const ratingStars = data.rating ? '★'.repeat(Math.round(data.rating)) : '☆☆☆☆☆';
    
    list.innerHTML += `
      <div class="card" onclick="openDetails('${data.id}')">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <div style="flex: 1;">
            <h3>${data.name}</h3>
            <p style="font-size: 13px; color: #94a3b8;">Organizer: ${data.organizer}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; color: #fbbf24;">${ratingStars}</div>
            <p style="font-size: 12px; color: #cbd5e1;">${data.rating ? data.rating.toFixed(1) : '0'}/5</p>
          </div>
        </div>
        
        <p style="color: #cbd5e1; margin: 8px 0;">💰 Prize: <strong>${data.prizePool}</strong></p>
        ${data.location ? `<p style="color: #cbd5e1; margin: 8px 0;">📍 Location: ${data.location}</p>` : ''}
        <p style="color: #cbd5e1; margin: 8px 0; font-size: 13px;">${data.description ? data.description.substring(0, 80) + '...' : 'No description'}</p>
        
        <div class="card-footer">
          <span class="badge ${modeClass}">${data.mode}</span>
          <span class="badge">👁️ ${data.views || 0}</span>
          <button onclick="openDetails('${data.id}'); event.stopPropagation();" class="secondary" style="flex: 1; margin-left: auto;">View Details →</button>
        </div>
      </div>
    `;
  });
}

window.openDetails = function(id){
  localStorage.setItem("hackathonId", id);
  // Increment views
  const hackathon = allHackathons.find(h => h.id === id);
  if (hackathon) {
    hackathon.views = (hackathon.views || 0) + 1;
  }
  window.location.href = "details.html";
}

// 🔍 SEARCH FUNCTION
window.searchHackathons = function () {
  let value = document.getElementById("searchBox").value.toLowerCase();

  let filtered = allHackathons.filter(item =>
    item.name.toLowerCase().includes(value) ||
    item.organizer.toLowerCase().includes(value) ||
    (item.location && item.location.toLowerCase().includes(value))
  );

  displayHackathons(filtered);
};

// 🎯 FILTER FUNCTION
window.filterHackathons = function () {
  let value = document.getElementById("filter").value;

  if (value === "all") {
    displayHackathons(allHackathons);
  } else {
    let filtered = allHackathons.filter(item =>
      item.mode === value
    );
    displayHackathons(filtered);
  }
};

// ⭐ SORT BY TRENDING
window.sortByTrending = function () {
  let sorted = [...allHackathons].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  displayHackathons(sorted);
  alert("Sorted by ratings! ⭐");
};

loadHackathons();
