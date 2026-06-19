import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let id = localStorage.getItem("hackathonId");
let currentRating = 0;

const detailsDiv = document.getElementById("details");

async function loadDetails() {
  if (!id) {
    detailsDiv.innerHTML = "<p>No hackathon selected.</p>";
    return;
  }

  try {
    const docRef = doc(db, "hackathons", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      let data = docSnap.data();

      const startDate = data.startDate ? new Date(data.startDate).toLocaleDateString() : 'N/A';
      const endDate = data.endDate ? new Date(data.endDate).toLocaleDateString() : 'N/A';
      const ratingStars = data.rating ? '★'.repeat(Math.round(data.rating)) : '☆☆☆☆☆';

      detailsDiv.innerHTML = `
        <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 30px; backdrop-filter: blur(10px);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
            <div>
              <h2>${data.name}</h2>
              <p style="color: #cbd5e1; margin-top: 5px;">by <strong style="color: #06b6d4;">${data.organizer}</strong></p>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 32px; color: #fbbf24;">${ratingStars}</div>
              <p style="color: #cbd5e1;">${data.rating ? data.rating.toFixed(1) : '0'}/5 (${data.reviewCount || 0} reviews)</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
            <div style="background: rgba(99, 102, 241, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid var(--primary);">
              <p style="font-size: 12px; color: #94a3b8; text-transform: uppercase;">Prize Pool</p>
              <p style="font-size: 20px; color: #06b6d4; font-weight: bold; margin-top: 5px;">${data.prizePool}</p>
            </div>
            <div style="background: rgba(99, 102, 241, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid var(--secondary);">
              <p style="font-size: 12px; color: #94a3b8; text-transform: uppercase;">Mode</p>
              <p style="font-size: 20px; color: #06b6d4; font-weight: bold; margin-top: 5px;">${data.mode || 'N/A'}</p>
            </div>
            <div style="background: rgba(99, 102, 241, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #fbbf24;">
              <p style="font-size: 12px; color: #94a3b8; text-transform: uppercase;">Dates</p>
              <p style="font-size: 14px; color: #06b6d4; font-weight: bold; margin-top: 5px;">${startDate} - ${endDate}</p>
            </div>
          </div>

          <hr style="border: none; border-top: 1px solid var(--border-color); margin: 20px 0;">

          <h3 style="color: #06b6d4; margin-top: 20px; margin-bottom: 10px;">📝 Description</h3>
          <p style="line-height: 1.8; color: #cbd5e1;">${data.description || 'No description available'}</p>

          ${data.eligibility ? `
            <h3 style="color: #06b6d4; margin-top: 20px; margin-bottom: 10px;">✅ Eligibility</h3>
            <p style="line-height: 1.8; color: #cbd5e1;">${data.eligibility}</p>
          ` : ''}

          ${data.rules ? `
            <h3 style="color: #06b6d4; margin-top: 20px; margin-bottom: 10px;">⚖️ Rules & Guidelines</h3>
            <p style="line-height: 1.8; color: #cbd5e1;">${data.rules}</p>
          ` : ''}

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;">
            ${data.teamSize ? `<p><strong>👥 Team Size:</strong> ${data.teamSize}</p>` : ''}
            ${data.location ? `<p><strong>📍 Location:</strong> ${data.location}</p>` : ''}
            ${data.contactEmail ? `<p><strong>📧 Contact:</strong> <a href="mailto:${data.contactEmail}" style="color: #6366f1;">${data.contactEmail}</a></p>` : ''}
            ${data.registrationDeadline ? `<p><strong>⏰ Deadline:</strong> ${new Date(data.registrationDeadline).toLocaleDateString()}</p>` : ''}
          </div>
        </div>
      `;

      // Load reviews for this hackathon
      loadReviews();
    } else {
      detailsDiv.innerHTML = "<p style='color: #ef4444;'>No Data Found</p>";
    }
  } catch (error) {
    console.error("Error loading details:", error);
    detailsDiv.innerHTML = "<p style='color: #ef4444;'>Error loading hackathon details</p>";
  }
}

// Rating System
window.setRating = function(rating) {
  currentRating = rating;
  const stars = document.querySelectorAll(".star");
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add("active");
      star.textContent = "★";
    } else {
      star.classList.remove("active");
      star.textContent = "★";
    }
  });
  document.getElementById("ratingText").textContent = `You rated: ${rating} star${rating !== 1 ? 's' : ''}`;
};

// Submit Feedback
window.submitFeedback = async function() {
  if (!id) {
    alert("❌ No hackathon selected");
    return;
  }

  const feedback = document.getElementById("feedback").value.trim();

  if (!feedback && currentRating === 0) {
    alert("⚠️ Please rate and/or write feedback!");
    return;
  }

  try {
    await addDoc(collection(db, "reviews"), {
      hackathonId: id,
      rating: currentRating,
      feedback: feedback,
      timestamp: new Date(),
      author: "Anonymous User"
    });

    // Update hackathon average rating
    const docRef = doc(db, "hackathons", id);
    const docSnap = await getDoc(docRef);
    const currentData = docSnap.data();
    
    const newReviewCount = (currentData.reviewCount || 0) + 1;
    const currentRatingSum = (currentData.rating || 0) * (currentData.reviewCount || 0);
    const newRating = (currentRatingSum + currentRating) / newReviewCount;

    await updateDoc(docRef, {
      rating: newRating,
      reviewCount: newReviewCount
    });

    alert("✅ Thank you! Your feedback has been saved!");
    document.getElementById("feedback").value = "";
    document.getElementById("ratingText").textContent = "Click to rate";
    document.querySelectorAll(".star").forEach(star => star.classList.remove("active"));
    currentRating = 0;

    loadReviews();
  } catch (error) {
    console.error("Error submitting feedback:", error);
    alert("❌ Error submitting feedback. Please try again.");
  }
};

// Load Reviews
async function loadReviews() {
  try {
    const q = query(collection(db, "reviews"), where("hackathonId", "==", id));
    const querySnapshot = await getDocs(q);
    
    const reviewsList = document.getElementById("reviewsList");
    reviewsList.innerHTML = "";

    if (querySnapshot.empty) {
      reviewsList.innerHTML = '<p style="color: #cbd5e1; text-align: center; padding: 20px;">No reviews yet. Be the first to review!</p>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const stars = '★'.repeat(data.rating || 0) + '☆'.repeat(5 - (data.rating || 0));
      const timestamp = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString() : 'Recently';

      reviewsList.innerHTML += `
        <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid var(--border-color); border-radius: 10px; padding: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
            <div>
              <p style="color: #06b6d4; font-weight: 600;">${data.author || 'Anonymous'}</p>
              <p style="font-size: 12px; color: #94a3b8;">${timestamp}</p>
            </div>
            <p style="color: #fbbf24; font-size: 18px;">${stars}</p>
          </div>
          <p style="color: #cbd5e1; line-height: 1.6;">${data.feedback || '(No comment)'}</p>
        </div>
      `;
    });
  } catch (error) {
    console.error("Error loading reviews:", error);
  }
}

window.register = function () {
  alert("🚀 Redirecting to registration...");
  window.open("https://example.com/register", "_blank");
}

window.share = function () {
  if (navigator.share) {
    navigator.share({
      title: "Check this hackathon",
      text: "Found an amazing hackathon on India Hackathon Hub!",
      url: window.location.href
    }).catch(err => console.log("Sharing failed:", err));
  } else {
    alert("📤 Share feature not supported on your device");
  }
}

window.saveBookmark = async function () {
  let id = localStorage.getItem("hackathonId");
  if (!id) return;

  try {
    let docRef = doc(db, "hackathons", id);
    let snap = await getDoc(docRef);

    if (snap.exists()) {
      await setDoc(doc(db, "bookmarks", id), snap.data());
      alert("❤️ Saved to bookmarks!");
    }
  } catch (error) {
    console.error("Error saving bookmark:", error);
    alert("❌ Error saving bookmark");
  }
};

loadDetails();
