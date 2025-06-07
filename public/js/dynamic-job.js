// ========================== DYNAMIC JOB PAGE FUNCTIONALITY ==========================

// Category configuration for extras
const extrasConfig = {
  hatod: {
    field1: { label: "PICKUP AT:" },
    field2: { label: "DELIVER TO:" }
  },
  hakot: {
    field1: { label: "LOAD AT:" },
    field2: { label: "UNLOAD AT:" }
  },
  kompra: {
    field1: { label: "SHOP AT:" },
    field2: { label: "DELIVER TO:" }
  },
  luto: {
    field1: { label: "LOCATION:" },
    field2: { label: "SUPPLIES:" }
  },
  hugas: {
    field1: { label: "LOCATION:" },
    field2: { label: "SUPPLIES:" }
  },
  laba: {
    field1: { label: "LOCATION:" },
    field2: { label: "SUPPLIES:" }
  },
  limpyo: {
    field1: { label: "LOCATION:" },
    field2: { label: "SUPPLIES:" }
  },
  tindera: {
    field1: { label: "LOCATION:" },
    field2: { label: "PRODUCT:" }
  },
  bantay: {
    field1: { label: "LOCATION:" },
    field2: { label: "SHIFT:" }
  },
  painter: {
    field1: { label: "LOCATION:" },
    field2: { label: "SUPPLIES:" }
  },
  carpenter: {
    field1: { label: "LOCATION:" },
    field2: { label: "MATERIALS:" }
  },
  plumber: {
    field1: { label: "LOCATION:" },
    field2: { label: "MATERIALS:" }
  },
  security: {
    field1: { label: "LOCATION:" },
    field2: { label: "SHIFT:" }
  },
  driver: {
    field1: { label: "PICKUP AT:" },
    field2: { label: "DELIVER TO:" }
  },
  tutor: {
    field1: { label: "LOCATION:" },
    field2: { label: "SUBJECT:" }
  },
  clerical: {
    field1: { label: "LOCATION:" },
    field2: { label: "SOFTWARE:" }
  },
  builder: {
    field1: { label: "LOCATION:" },
    field2: { label: "MATERIALS:" }
  },
  reception: {
    field1: { label: "LOCATION:" },
    field2: { label: "SHIFT:" }
  },
  nurse: {
    field1: { label: "LOCATION:" },
    field2: { label: "SPECIALTY:" }
  },
  doctor: {
    field1: { label: "LOCATION:" },
    field2: { label: "SPECIALTY:" }
  },
  lawyer: {
    field1: { label: "LOCATION:" },
    field2: { label: "PRACTICE:" }
  },
  mechanic: {
    field1: { label: "LOCATION:" },
    field2: { label: "VEHICLE:" }
  },
  electrician: {
    field1: { label: "LOCATION:" },
    field2: { label: "MATERIALS:" }
  },
  tailor: {
    field1: { label: "LOCATION:" },
    field2: { label: "GARMENT:" }
  }
};

function getUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    category: urlParams.get('category'),
    jobNumber: urlParams.get('jobNumber')
  };
}

function loadJobData() {
  const { category, jobNumber } = getUrlParameters();
  
  if (!category || !jobNumber) {
    showErrorMessage('Invalid job URL. Missing category or job number.');
    return;
  }
  
  // Try to get job data from localStorage
  const jobData = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  const categoryJobs = jobData[category] || [];
  
  // Find the specific job
  const job = categoryJobs.find(j => j.jobNumber == jobNumber);
  
  if (!job) {
    showErrorMessage('Job not found. This job may have been removed or does not exist.');
    return;
  }
  
  // Populate the page with job data
  populateJobPage(job);
}

function populateJobPage(jobData) {
  // Set page title
  document.title = `${jobData.jobTitle} - GISUGO`;
  document.getElementById('pageTitle').textContent = `${jobData.jobTitle} - GISUGO`;
  
  // Set job title
  document.getElementById('jobTitle').textContent = jobData.jobTitle;
  
  // Set job photo if available
  if (jobData.photo) {
    const photoContainer = document.getElementById('jobPhotoContainer');
    const photoBorderline = document.getElementById('jobPhotoBorderline');
    const photoImg = document.getElementById('jobPhoto');
    
    photoImg.src = jobData.photo;
    photoContainer.style.display = 'block';
    photoBorderline.style.display = 'block';
  }
  
  // Set date
  if (jobData.jobDate) {
    const date = new Date(jobData.jobDate);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    document.getElementById('jobDate').textContent = date.toLocaleDateString('en-US', options);
  }
  
  // Set time
  if (jobData.startTime && jobData.endTime) {
    document.getElementById('jobTime').textContent = `${jobData.startTime} to ${jobData.endTime}`;
  }
  
  // Set extras based on category
  populateExtras(jobData);
  
  // Set description
  document.getElementById('jobDescription').textContent = jobData.description || 'No description provided.';
  
  // Set payment
  document.getElementById('jobPaymentAmount').textContent = `₱${jobData.paymentAmount}`;
  document.getElementById('jobPaymentRate').textContent = jobData.paymentType;
  document.getElementById('modalPaymentAmount').textContent = `₱${jobData.paymentAmount}`;
}

function populateExtras(jobData) {
  const category = jobData.category;
  const config = extrasConfig[category];
  
  if (!config || !jobData.extras || jobData.extras.length === 0) {
    return; // No extras to show
  }
  
  const extrasRow = document.getElementById('jobExtrasRow');
  extrasRow.style.display = 'flex';
  
  // Populate field 1
  if (jobData.extras[0] && config.field1) {
    const parts = jobData.extras[0].split(':');
    const label = parts[0] ? parts[0].trim() + ':' : config.field1.label;
    const value = parts[1] ? parts[1].trim() : '';
    
    document.getElementById('jobExtra1Label').textContent = label;
    document.getElementById('jobExtra1Value').textContent = value || 'Not specified';
  }
  
  // Populate field 2
  if (jobData.extras[1] && config.field2) {
    const parts = jobData.extras[1].split(':');
    const label = parts[0] ? parts[0].trim() + ':' : config.field2.label;
    const value = parts[1] ? parts[1].trim() : '';
    
    document.getElementById('jobExtra2Label').textContent = label;
    document.getElementById('jobExtra2Value').textContent = value || 'Not specified';
  }
}

function showErrorMessage(message) {
  document.getElementById('jobTitle').textContent = 'Error Loading Job';
  document.getElementById('jobDate').textContent = 'N/A';
  document.getElementById('jobTime').textContent = 'N/A';
  document.getElementById('jobDescription').textContent = message;
  document.getElementById('jobPaymentAmount').textContent = '₱0';
  document.getElementById('jobPaymentRate').textContent = 'N/A';
}

// Initialize menu functionality
function initializeMenu() {
  const menuBtn = document.getElementById('jobMenuBtn');
  const menuOverlay = document.getElementById('jobcatMenuOverlay');
  
  if (menuBtn && menuOverlay) {
    menuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      menuOverlay.classList.toggle('show');
    });
    
    menuOverlay.addEventListener('click', function(e) {
      if (e.target === menuOverlay) {
        menuOverlay.classList.remove('show');
      }
    });
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        menuOverlay.classList.remove('show');
      }
    });
  }
}

// Initialize apply job functionality
function initializeApplyJob() {
  const applyBtn = document.getElementById('jobApplyBtn');
  const applyOverlay = document.getElementById('applyJobOverlay');
  const cancelBtn = document.getElementById('applyCancelBtn');
  const sendBtn = document.getElementById('applySendBtn');
  
  if (applyBtn && applyOverlay) {
    applyBtn.addEventListener('click', function() {
      applyOverlay.style.display = 'flex';
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      applyOverlay.style.display = 'none';
      document.getElementById('applyMessage').value = '';
    });
  }
  
  if (sendBtn) {
    sendBtn.addEventListener('click', function() {
      const message = document.getElementById('applyMessage').value.trim();
      if (!message) {
        alert('Please enter a message before applying.');
        return;
      }
      
      alert('Application sent successfully!');
      applyOverlay.style.display = 'none';
      document.getElementById('applyMessage').value = '';
    });
  }
  
  // Close overlay when clicking outside
  if (applyOverlay) {
    applyOverlay.addEventListener('click', function(e) {
      if (e.target === applyOverlay) {
        applyOverlay.style.display = 'none';
      }
    });
  }
}

// Initialize contact dropdown
function initializeContactDropdown() {
  const contactBtn = document.getElementById('contactBtn');
  const contactDropdown = document.getElementById('contactDropdown');
  
  if (contactBtn && contactDropdown) {
    contactBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      contactDropdown.classList.toggle('show');
    });
    
    document.addEventListener('click', function() {
      contactDropdown.classList.remove('show');
    });
    
    // Handle dropdown item clicks
    contactDropdown.addEventListener('click', function(e) {
      if (e.target.classList.contains('contact-dropdown-item')) {
        const action = e.target.getAttribute('data-action');
        if (action === 'contact') {
          alert('Contact functionality not implemented yet.');
        } else if (action === 'report') {
          alert('Report functionality not implemented yet.');
        }
        contactDropdown.classList.remove('show');
      }
    });
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  loadJobData();
  initializeMenu();
  initializeApplyJob();
  initializeContactDropdown();
}); 