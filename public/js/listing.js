// Mock job data for Limpyo Service
const jobs = [
  {
    title: "Clear plates and clean tables at Mall restaurant.",
    description: "Mall restaurant needs help clearing tables.",
    location: "Guadalupe",
    date: "12-23-2023",
    time: "11AM - 9PM",
    rate: 65,
    rateType: "Per Hour",
    image: "/gisugo-local/public/images/cleaning1.jpg",
    completed: false
  },
  {
    title: "Pickup trash and mop the floors after catering event.",
    description: "Cleanup after catering event.",
    location: "Banilad",
    date: "12-23-2023",
    time: "6PM - 10PM",
    rate: 350,
    rateType: "Completed",
    image: "/gisugo-local/public/images/cleaning2.jpg",
    completed: true
  },
  // Add more jobs as needed
];

function renderJobs(jobs) {
  const container = document.getElementById('job-listings');
  container.innerHTML = jobs.map(job => `
    <div class="job-card">
      <img src="${job.image}" alt="" class="job-card__image">
      <div class="job-card__info">
        <h3 class="job-card__title">${job.title}</h3>
        <p class="job-card__desc">${job.description}</p>
        <div class="job-card__meta">
          <span class="job-card__location">${job.location}</span>
          <span class="job-card__datetime">${job.date} ${job.time}</span>
        </div>
        <div class="job-card__rate">
          ₱${job.rate} <span>${job.rateType}</span>
        </div>
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderJobs(jobs);
}); 