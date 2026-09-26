/* ==========================================================
   SCHOOL BUCKS FRONTEND
   ========================================================== */

const API_URL = '/api/backend';

let currentUser = null;

let referralCode = null;


/* ==========================================================
   START
   ========================================================== */

document.addEventListener('DOMContentLoaded', function () {

  detectReferral();

  registerServiceWorker();

  const saved =
    localStorage.getItem('schoolbucks_user');

  setTimeout(function () {

    document
      .getElementById('loadingScreen')
      .classList.add('hidden');


    if (saved) {

      try {

        currentUser =
          JSON.parse(saved);

        showApp();

      } catch (error) {

        localStorage.removeItem(
          'schoolbucks_user'
        );

        showAuthScreen();
      }

    } else {

      showAuthScreen();
    }

  }, 400);

});


/* ==========================================================
   API
   ========================================================== */

async function api(action, data = {}) {

  const response =
    await fetch(API_URL, {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        action: action,
        ...data
      })

    });


  if (!response.ok) {

    throw new Error(
      'Server request failed.'
    );
  }


  const result =
    await response.json();


  if (!result.ok) {

    throw new Error(
      result.error ||
      'Something went wrong.'
    );
  }


  return result;
}


/* ==========================================================
   REFERRALS
   ========================================================== */

function detectReferral() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  referralCode =
    params.get('ref');


  if (referralCode) {

    referralCode =
      referralCode
        .trim()
        .toUpperCase();


    document
      .getElementById('referralBox')
      ?.classList
      .remove('hidden');


    const display =
      document.getElementById(
        'referralDisplay'
      );


    if (display) {

      display.textContent =
        referralCode;
    }


    /*
     * Automatically open registration
     * if somebody arrived through a referral link.
     */

    showAuth('register');
  }
}


async function loadReferralInfo() {

  if (!currentUser) {
    return;
  }


  try {

    const result =
      await api(
        'referrals',
        {
          user_id:
            currentUser.user_id
        }
      );


    document
      .getElementById('profileReferral')
      .textContent =
      result.referral_code;


    document
      .getElementById('referralLink')
      .value =
      result.referral_link;


  } catch (error) {

    console.error(
      'Referral error:',
      error
    );
  }
}


function copyReferral() {

  const input =
    document.getElementById(
      'referralLink'
    );


  if (!input.value) {
    return;
  }


  navigator.clipboard
    .writeText(input.value)
    .then(function () {

      showToast(
        'Referral link copied.'
      );

    })
    .catch(function () {

      input.select();

      document.execCommand(
        'copy'
      );

      showToast(
        'Referral link copied.'
      );
    });
}


async function shareReferral() {

  const link =
    document.getElementById(
      'referralLink'
    ).value;


  if (!link) {
    return;
  }


  const shareData = {

    title:
      'Join SCHOOL BUCKS',

    text:
      'Join SCHOOL BUCKS and earn from surveys, offers and tasks.',

    url:
      link
  };


  if (
    navigator.share
  ) {

    try {

      await navigator.share(
        shareData
      );

    } catch (error) {

      /*
       * User cancelled share.
       */
    }

  } else {

    await navigator.clipboard.writeText(
      link
    );

    showToast(
      'Referral link copied.'
    );
  }
}


/* ==========================================================
   AUTH
   ========================================================== */

function showAuthScreen() {

  document
    .getElementById('authScreen')
    .classList
    .remove('hidden');

  document
    .getElementById('appScreen')
    .classList
    .add('hidden');
}


function showAuth(type) {

  const login =
    document.getElementById(
      'loginForm'
    );

  const register =
    document.getElementById(
      'registerForm'
    );


  const loginTab =
    document.getElementById(
      'loginTab'
    );

  const registerTab =
    document.getElementById(
      'registerTab'
    );


  if (type === 'login') {

    login.classList.remove('hidden');

    register.classList.add('hidden');

    loginTab.classList.add('active');

    registerTab.classList.remove('active');

  } else {

    login.classList.add('hidden');

    register.classList.remove('hidden');

    loginTab.classList.remove('active');

    registerTab.classList.add('active');
  }
}


async function register(event) {

  event.preventDefault();


  const name =
    document.getElementById(
      'registerName'
    ).value.trim();


  const phone =
    document.getElementById(
      'registerPhone'
    ).value.trim();


  const email =
    document.getElementById(
      'registerEmail'
    ).value.trim();


  const password =
    document.getElementById(
      'registerPassword'
    ).value;


  try {

    setLoading(true);


    const result =
      await api(
        'register',
        {
          name,
          phone,
          email,
          password,
          referral:
            referralCode || ''
        }
      );


    if (result.queued) {

      setLoading(false);

      await monitorJob(
        result.job_id,
        'Creating your account...'
      );

      return;
    }


    currentUser =
      result.user;


    localStorage.setItem(
      'schoolbucks_user',
      JSON.stringify(
        currentUser
      )
    );


    showToast(
      'Account created successfully.'
    );


    showApp();


  } catch (error) {

    showToast(
      error.message
    );

  } finally {

    setLoading(false);
  }
}


async function login(event) {

  event.preventDefault();


  const phone =
    document.getElementById(
      'loginPhone'
    ).value.trim();


  const password =
    document.getElementById(
      'loginPassword'
    ).value;


  try {

    setLoading(true);


    const result =
      await api(
        'login',
        {
          phone,
          password
        }
      );


    currentUser =
      result.user;


    localStorage.setItem(
      'schoolbucks_user',
      JSON.stringify(
        currentUser
      )
    );


    showApp();


  } catch (error) {

    showToast(
      error.message
    );

  } finally {

    setLoading(false);
  }
}


function logout() {

  localStorage.removeItem(
    'schoolbucks_user'
  );

  currentUser = null;

  document
    .getElementById('appScreen')
    .classList
    .add('hidden');

  showAuthScreen();

  showAuth('login');
}


/* ==========================================================
   APP
   ========================================================== */

function showApp() {

  document
    .getElementById('authScreen')
    .classList
    .add('hidden');


  document
    .getElementById('appScreen')
    .classList
    .remove('hidden');


  document
    .getElementById('homeName')
    .textContent =
    currentUser.name;


  document
    .getElementById('profileName')
    .textContent =
    currentUser.name;


  document
    .getElementById('profilePhone')
    .textContent =
    currentUser.phone;


  document
    .getElementById('profileEmail')
    .textContent =
    currentUser.email ||
    'Not provided';


  const initial =
    currentUser.name
      ? currentUser.name
        .charAt(0)
        .toUpperCase()
      : 'S';


  document
    .getElementById('profileAvatar')
    .textContent =
    initial;


  showPage('home');

  loadDashboard();

  loadReferralInfo();
}


/* ==========================================================
   NAVIGATION
   ========================================================== */

function showPage(page) {

  const pages = [
    'home',
    'wallet',
    'earn',
    'me'
  ];


  pages.forEach(function(name) {

    const element =
      document.getElementById(
        name + 'Page'
      );


    if (name === page) {

      element.classList.remove(
        'hidden'
      );

    } else {

      element.classList.add(
        'hidden'
      );
    }
  });


  document
    .querySelectorAll('.nav-item')
    .forEach(function(item) {

      item.classList.remove(
        'active'
      );

      if (
        item.dataset.page ===
        page
      ) {

        item.classList.add(
          'active'
        );
      }
    });


  if (page === 'wallet') {
    loadWallet();
  }

  if (page === 'home') {
    loadDashboard();
  }
}


/* ==========================================================
   DASHBOARD
   ========================================================== */

async function loadDashboard() {

  if (!currentUser) {
    return;
  }


  try {

    const result =
      await api(
        'dashboard',
        {
          user_id:
            currentUser.user_id
        }
      );


    updateWalletUI(
      result.wallet
    );


    renderActivity(
      result.recent_activity
    );


  } catch (error) {

    console.error(
      error
    );
  }
}


/* ==========================================================
   WALLET
   ========================================================== */

async function loadWallet() {

  if (!currentUser) {
    return;
  }


  try {

    const result =
      await api(
        'wallet',
        {
          user_id:
            currentUser.user_id
        }
      );


    updateWalletUI(
      result.wallet
    );


    renderTransactions(
      result.transactions
    );


  } catch (error) {

    showToast(
      error.message
    );
  }
}


function updateWalletUI(wallet) {

  const available =
    Number(
      wallet.available || 0
    );


  const pending =
    Number(
      wallet.pending || 0
    );


  const earned =
    Number(
      wallet.lifetime_earned || 0
    );


  const withdrawn =
    Number(
      wallet.lifetime_withdrawn || 0
    );


  document
    .getElementById('balanceAmount')
    .textContent =
    money(available);


  document
    .getElementById('walletBalance')
    .textContent =
    money(available);


  document
    .getElementById('pendingBalance')
    .textContent =
    money(pending);


  document
    .getElementById('walletLifetime')
    .textContent =
    money(earned);


  document
    .getElementById('walletWithdrawn')
    .textContent =
    money(withdrawn);


  document
    .getElementById('lifetimeAmount')
    .textContent =
    money(earned);
}


function money(value) {

  return '$' +
    Number(value || 0)
      .toFixed(2);
}


/* ==========================================================
   ACTIVITY
   ========================================================== */

function renderActivity(rows) {

  const container =
    document.getElementById(
      'recentActivity'
    );


  if (
    !rows ||
    !rows.length
  ) {

    container.innerHTML =
      emptyState(
        'No activity yet.'
      );

    return;
  }


  container.innerHTML =
    rows.slice(0, 5)
      .map(transactionHTML)
      .join('');
}


function renderTransactions(rows) {

  const container =
    document.getElementById(
      'transactions'
    );


  if (
    !rows ||
    !rows.length
  ) {

    container.innerHTML =
      emptyState(
        'No transactions yet.'
      );

    return;
  }


  container.innerHTML =
    rows.map(transactionHTML)
      .join('');
}


function transactionHTML(row) {

  const amount =
    Number(
      row.student_amount || 0
    );


  const isPositive =
    row.type === 'EARNING';


  return `
    <div class="transaction">

      <div class="transaction-icon">
        ${isPositive ? '↗' : '↘'}
      </div>

      <div class="transaction-main">

        <strong>
          ${escapeHTML(
            row.description ||
            row.type ||
            'Transaction'
          )}
        </strong>

        <span>
          ${formatDate(row.timestamp)}
        </span>

      </div>

      <strong class="${
        isPositive
          ? 'positive'
          : 'negative'
      }">

        ${isPositive ? '+' : '-'}
        ${money(Math.abs(amount))}

      </strong>

    </div>
  `;
}


function emptyState(text) {

  return `
    <div class="empty-state">
      ${escapeHTML(text)}
    </div>
  `;
}


/* ==========================================================
   WITHDRAWAL
   ========================================================== */

function openWithdraw() {

  document
    .getElementById('withdrawModal')
    .classList
    .remove('hidden');
}


function closeWithdraw() {

  document
    .getElementById('withdrawModal')
    .classList
    .add('hidden');
}


async function submitWithdrawal() {

  const amount =
    Number(
      document.getElementById(
        'withdrawAmount'
      ).value
    );


  const method =
    document.getElementById(
      'withdrawMethod'
    ).value;


  const number =
    document.getElementById(
      'withdrawNumber'
    ).value.trim();


  if (
    !amount ||
    amount < 2
  ) {

    showToast(
      'Minimum withdrawal is $2.'
    );

    return;
  }


  if (!number) {

    showToast(
      'Enter your EcoCash number.'
    );

    return;
  }


  try {

    closeWithdraw();

    setLoading(true);


    const result =
      await api(
        'withdraw',
        {
          user_id:
            currentUser.user_id,

          amount,

          payment_method:
            method,

          payment_number:
            number
        }
      );


    setLoading(false);


    if (result.queued) {

      await monitorJob(
        result.job_id,
        'Processing withdrawal...'
      );

      return;
    }


    showToast(
      'Withdrawal request submitted.'
    );


    loadDashboard();

    loadWallet();


  } catch (error) {

    setLoading(false);

    showToast(
      error.message
    );
  }
}


/* ==========================================================
   QUEUE
   ========================================================== */

async function monitorJob(
  jobId,
  message
) {

  const modal =
    document.getElementById(
      'queueModal'
    );


  const messageElement =
    document.getElementById(
      'queueMessage'
    );


  const positionElement =
    document.getElementById(
      'queuePosition'
    );


  const progressElement =
    document.getElementById(
      'queueProgress'
    );


  messageElement.textContent =
    message;


  modal.classList.remove(
    'hidden'
  );


  let finished = false;


  while (!finished) {

    try {

      const result =
        await api(
          'jobStatus',
          {
            job_id:
              jobId
          }
        );


      const job =
        result.job;


      if (
        job.status ===
        'QUEUED'
      ) {

        positionElement.textContent =
          job.position > 0
            ? 'Queue position: ' +
              job.position
            : 'Waiting...';


        progressElement.style.width =
          '10%';


      } else if (
        job.status ===
        'PROCESSING'
      ) {

        positionElement.textContent =
          'Processing securely...';


        progressElement.style.width =
          Math.max(
            20,
            Number(job.progress || 20)
          ) + '%';


      } else if (
        job.status ===
        'COMPLETED'
      ) {

        progressElement.style.width =
          '100%';

        positionElement.textContent =
          'Complete ✓';


        finished = true;


        setTimeout(function () {

          modal.classList.add(
            'hidden'
          );

          showToast(
            'Request completed.'
          );

          loadDashboard();

          loadWallet();

        }, 700);


      } else if (
        job.status ===
        'FAILED'
      ) {

        finished = true;

        modal.classList.add(
          'hidden'
        );

        showToast(
          job.error ||
          'The request could not be completed.'
        );
      }


    } catch (error) {

      console.error(
        error
      );
    }


    if (!finished) {

      await sleep(
        2500
      );
    }
  }
}


/* ==========================================================
   UI HELPERS
   ========================================================== */

function setLoading(show) {

  const screen =
    document.getElementById(
      'loadingScreen'
    );


  if (show) {

    screen.classList.remove(
      'hidden'
    );

  } else {

    screen.classList.add(
      'hidden'
    );
  }
}


function showToast(message) {

  const toast =
    document.getElementById(
      'toast'
    );


  toast.textContent =
    message;


  toast.classList.add(
    'show'
  );


  setTimeout(function () {

    toast.classList.remove(
      'show'
    );

  }, 3000);
}


function sleep(ms) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}


function formatDate(value) {

  if (!value) {
    return '';
  }


  try {

    return new Date(value)
      .toLocaleString();

  } catch (error) {

    return '';
  }
}


function escapeHTML(value) {

  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/* ==========================================================
   SERVICE WORKER
   ========================================================== */

function registerServiceWorker() {

  if (
    'serviceWorker' in
    navigator
  ) {

    window.addEventListener(
      'load',
      function () {

        navigator.serviceWorker
          .register(
            '/service-worker.js'
          )
          .catch(function (error) {

            console.error(
              'Service worker failed:',
              error
            );
          });

      }
    );
  }
}
