// ================================================================
// SCHOOL BUCKS FRONTEND
// GITHUB / VERCEL
// ================================================================


// ================================================================
// CONFIGURATION
// ================================================================

// PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE.

const API_URL =
  'https://script.google.com/macros/s/AKfycbyzqTjgUhd1ZjDPeu47pxiVLM5YVMsIduUvhAeElxjG9CYf5YVCvs-T7CRBkEBO_Tw/exec';


// This is the public SCHOOL BUCKS URL.
// Referral links ALWAYS use this URL.

const APP_URL =
  'https://schoolbucks.vercel.app/';


// ================================================================
// STATE
// ================================================================

let sessionToken =
  localStorage.getItem(
    'schoolbucks_token'
  );

let currentUser =
  JSON.parse(
    localStorage.getItem(
      'schoolbucks_user'
    ) || 'null'
  );


// ================================================================
// DOM
// ================================================================

const $ = id =>
  document.getElementById(id);


// ================================================================
// INITIALIZATION
// ================================================================

document.addEventListener(
  'DOMContentLoaded',
  initialize
);


async function initialize() {

  captureReferral();

  registerEvents();

  setTimeout(function() {

    $('loadingScreen')
      .classList.add('hidden');


    if (
      sessionToken &&
      currentUser
    ) {

      showApp();

      loadDashboard();

    } else {

      showAuth();

    }

  }, 400);

}


// ================================================================
// REFERRAL CAPTURE
// ================================================================

function captureReferral() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const referral =
    params.get('ref');


  if (referral) {

    localStorage.setItem(
      'schoolbucks_pending_referral',
      referral
        .trim()
        .toUpperCase()
    );

  }


  const saved =
    localStorage.getItem(
      'schoolbucks_pending_referral'
    );


  if (
    saved &&
    $('registerReferral')
  ) {

    $('registerReferral').value =
      saved;

  }

}


// ================================================================
// EVENTS
// ================================================================

function registerEvents() {

  $('loginForm')
    .addEventListener(
      'submit',
      handleLogin
    );


  $('registerForm')
    .addEventListener(
      'submit',
      handleRegister
    );


  $('showRegister')
    .addEventListener(
      'click',
      function() {

        $('loginPanel')
          .classList.add('hidden');

        $('registerPanel')
          .classList.remove('hidden');

        captureReferral();

      }
    );


  $('showLogin')
    .addEventListener(
      'click',
      function() {

        $('registerPanel')
          .classList.add('hidden');

        $('loginPanel')
          .classList.remove('hidden');

      }
    );


  $('logoutBtn')
    .addEventListener(
      'click',
      logout
    );


  $('homeWithdrawBtn')
    .addEventListener(
      'click',
      openWithdraw
    );


  $('walletWithdrawBtn')
    .addEventListener(
      'click',
      openWithdraw
    );


  $('closeWithdraw')
    .addEventListener(
      'click',
      closeWithdraw
    );


  $('withdrawForm')
    .addEventListener(
      'submit',
      handleWithdrawal
    );


  $('shareBtn')
    .addEventListener(
      'click',
      shareReferral
    );


  document
    .querySelectorAll('.nav-item')
    .forEach(function(button) {

      button.addEventListener(
        'click',
        function() {

          showPage(
            button.dataset.page
          );

        }
      );

    });

}


// ================================================================
// API
// ================================================================

async function api(
  action,
  data = {},
  retry = 0
) {

  if (
    API_URL.includes(
      'PASTE_YOUR'
    )
  ) {

    throw new Error(
      'Apps Script API URL has not been configured.'
    );

  }


  const payload = {

    action: action,

    ...data

  };


  if (
    sessionToken &&
    !payload.token
  ) {

    payload.token =
      sessionToken;

  }


  try {

    const body =
      new URLSearchParams();

    body.append(
      'payload',
      JSON.stringify(payload)
    );


    const response =
      await fetch(
        API_URL,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded;charset=UTF-8'
          },

          body: body.toString()
        }
      );


    if (!response.ok) {

      throw new Error(
        'Server returned HTTP ' +
        response.status
      );

    }


    const result =
      await response.json();


    // Temporary lock/busy response.
    // The frontend automatically retries.
    if (
      result.code === 'BUSY' &&
      retry < 5
    ) {

      await delay(
        1000 * Math.pow(2, retry)
      );

      return api(
        action,
        data,
        retry + 1
      );

    }


    if (
      result.code === 'BUSY'
    ) {

      throw new Error(
        'The system is currently busy. Please try again shortly.'
      );

    }


    if (
      result.error &&
      (
        result.error
          .toLowerCase()
          .includes('session')
      )
    ) {

      logout();

    }


    return result;


  } catch (error) {

    if (
      retry < 3
    ) {

      await delay(
        1000 * Math.pow(2, retry)
      );

      return api(
        action,
        data,
        retry + 1
      );

    }


    throw error;

  }

}


// ================================================================
// LOGIN
// ================================================================

async function handleLogin(event) {

  event.preventDefault();


  const phone =
    $('loginPhone')
      .value
      .trim();

  const password =
    $('loginPassword')
      .value;


  showProcessing(
    'Signing you in...',
    'Securely checking your account.'
  );


  try {

    const result =
      await api(
        'login',
        {
          phone,
          password
        }
      );


    if (!result.success) {

      throw new Error(
        result.error
      );

    }


    sessionToken =
      result.token;

    currentUser =
      result.user;


    saveSession();


    $('loginForm')
      .reset();


    hideProcessing();

    showApp();

    await loadDashboard();

    toast(
      'Welcome back, ' +
      currentUser.name.split(' ')[0] +
      '!'
    );


  } catch (error) {

    hideProcessing();

    toast(
      error.message ||
      'Unable to log in.'
    );

  }

}


// ================================================================
// REGISTER
// ================================================================

async function handleRegister(event) {

  event.preventDefault();


  const name =
    $('registerName')
      .value
      .trim();

  const phone =
    $('registerPhone')
      .value
      .trim();

  const email =
    $('registerEmail')
      .value
      .trim();

  const password =
    $('registerPassword')
      .value;

  const referral =
    $('registerReferral')
      .value
      .trim();


  showProcessing(
    'Creating your account...',
    'Please wait while we securely create your account.'
  );


  try {

    const result =
      await api(
        'register',
        {
          name,
          phone,
          email,
          password,
          referral_code:
            referral
        }
      );


    if (!result.success) {

      throw new Error(
        result.error
      );

    }


    sessionToken =
      result.token;

    currentUser =
      result.user;


    saveSession();


    localStorage.removeItem(
      'schoolbucks_pending_referral'
    );


    $('registerForm')
      .reset();


    hideProcessing();

    showApp();

    await loadDashboard();

    toast(
      'Welcome to SCHOOL BUCKS!'
    );


  } catch (error) {

    hideProcessing();

    toast(
      error.message ||
      'Unable to create account.'
    );

  }

}


// ================================================================
// SESSION
// ================================================================

function saveSession() {

  localStorage.setItem(
    'schoolbucks_token',
    sessionToken
  );


  localStorage.setItem(
    'schoolbucks_user',
    JSON.stringify(
      currentUser
    )
  );

}


function logout() {

  sessionToken = null;
  currentUser = null;


  localStorage.removeItem(
    'schoolbucks_token'
  );

  localStorage.removeItem(
    'schoolbucks_user'
  );


  showAuth();

  toast(
    'You have been logged out.'
  );

}


// ================================================================
// DASHBOARD
// ================================================================

async function loadDashboard() {

  if (!sessionToken) return;


  try {

    const result =
      await api(
        'dashboard'
      );


    if (!result.success) {

      throw new Error(
        result.error
      );

    }


    currentUser =
      result.user;

    saveSession();


    updateUserUI(
      result.user
    );

    updateWalletUI(
      result.wallet
    );

    renderActivity(
      result.recent_activity
    );


  } catch (error) {

    toast(
      error.message ||
      'Unable to load dashboard.'
    );

  }

}


// ================================================================
// WALLET
// ================================================================

async function loadWallet() {

  try {

    const result =
      await api(
        'wallet'
      );


    if (!result.success) {

      throw new Error(
        result.error
      );

    }


    updateWalletUI(
      result.wallet
    );


    renderTransactions(
      result.transactions
    );


  } catch (error) {

    toast(
      error.message ||
      'Unable to load wallet.'
    );

  }

}


// ================================================================
// UI
// ================================================================

function updateUserUI(user) {

  if (!user) return;


  $('welcomeName').textContent =
    'Hello, ' +
    (
      user.name.split(' ')[0] ||
      'Student'
    );


  $('profileName').textContent =
    user.name;


  $('profilePhone').textContent =
    user.phone;


  $('profileEmail').textContent =
    user.email ||
    'Not provided';


  $('profileReferral').textContent =
    user.referral_code;


  $('profileInitial').textContent =
    (
      user.name
        .charAt(0) ||
      'S'
    )
      .toUpperCase();

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

  const lifetime =
    Number(
      wallet.lifetime_earned || 0
    );

  const withdrawn =
    Number(
      wallet.lifetime_withdrawn || 0
    );


  $('homeBalance').textContent =
    money(available);


  $('homePending').textContent =
    money(pending);


  $('homeLifetime').textContent =
    money(lifetime);


  $('walletBalance').textContent =
    money(available);


  $('walletPending').textContent =
    money(pending);


  $('walletWithdrawn').textContent =
    money(withdrawn);

}


// ================================================================
// ACTIVITY
// ================================================================

function renderActivity(items) {

  const container =
    $('recentActivity');


  if (
    !items ||
    items.length === 0
  ) {

    container.innerHTML =
      emptyActivity();

    return;

  }


  container.innerHTML =
    items
      .map(activityHTML)
      .join('');

}


function renderTransactions(items) {

  const container =
    $('transactions');


  if (
    !items ||
    items.length === 0
  ) {

    container.innerHTML =
      emptyActivity();

    return;

  }


  container.innerHTML =
    items
      .map(activityHTML)
      .join('');

}


function activityHTML(item) {

  const amount =
    Number(
      item.student_amount || 0
    );


  const sign =
    amount >= 0
      ? '+'
      : '';


  return `
    <div class="activity-item">

      <div class="activity-main">

        <strong>
          ${escapeHTML(
            item.description ||
            item.type ||
            'Transaction'
          )}
        </strong>

        <span>
          ${escapeHTML(
            formatDate(
              item.timestamp
            )
          )}
        </span>

      </div>

      <div class="activity-amount">
        ${sign}${money(amount)}
      </div>

    </div>
  `;

}


function emptyActivity() {

  return `
    <div class="empty-state">
      No transactions yet.
    </div>
  `;

}


// ================================================================
// REFERRAL SHARING
// ================================================================

async function shareReferral() {

  showProcessing(
    'Preparing your referral...',
    'Creating your personal SCHOOL BUCKS link.'
  );


  try {

    const result =
      await api(
        'share'
      );


    hideProcessing();


    if (!result.success) {

      throw new Error(
        result.error
      );

    }


    const link =
      result.referral_link;


    const shareData = {

      title:
        'Join SCHOOL BUCKS',

      text:
        result.message,

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

        return;

      } catch (error) {

        // User cancelled native share.
        if (
          error.name ===
          'AbortError'
        ) {

          return;

        }

      }

    }


    await copyText(link);

    toast(
      'Referral link copied!'
    );


  } catch (error) {

    hideProcessing();

    toast(
      error.message ||
      'Unable to create referral link.'
    );

  }

}


// ================================================================
// WITHDRAWAL
// ================================================================

function openWithdraw() {

  $('withdrawModal')
    .classList.remove('hidden');

}


function closeWithdraw() {

  $('withdrawModal')
    .classList.add('hidden');

}


async function handleWithdrawal(event) {

  event.preventDefault();


  const amount =
    Number(
      $('withdrawAmount')
        .value
    );


  const method =
    $('withdrawMethod')
      .value;


  const number =
    $('withdrawNumber')
      .value
      .trim();


  closeWithdraw();


  showProcessing(
    'Submitting withdrawal...',
    'Your request is being securely processed.'
  );


  try {

    const result =
      await api(
        'withdraw',
        {
          amount,
          payment_method:
            method,
          payment_number:
            number
        }
      );


    hideProcessing();


    if (!result.success) {

      throw new Error(
        result.error
      );

    }


    $('withdrawForm')
      .reset();


    toast(
      'Withdrawal request submitted.'
    );


    await loadDashboard();

    await loadWallet();


  } catch (error) {

    hideProcessing();

    toast(
      error.message ||
      'Unable to submit withdrawal.'
    );

  }

}


// ================================================================
// NAVIGATION
// ================================================================

function showPage(pageId) {

  document
    .querySelectorAll('.page')
    .forEach(function(page) {

      page.classList.add(
        'hidden'
      );

    });


  const page =
    $(pageId);


  if (page) {

    page.classList.remove(
      'hidden'
    );

  }


  document
    .querySelectorAll('.nav-item')
    .forEach(function(button) {

      button.classList.toggle(
        'active',
        button.dataset.page ===
        pageId
      );

    });


  if (
    pageId ===
    'walletPage'
  ) {

    loadWallet();

  }

}


function showAuth() {

  $('appScreen')
    .classList.add('hidden');

  $('authScreen')
    .classList.remove('hidden');

  $('loginPanel')
    .classList.remove('hidden');

  $('registerPanel')
    .classList.add('hidden');

}


function showApp() {

  $('authScreen')
    .classList.add('hidden');

  $('appScreen')
    .classList.remove('hidden');

  showPage(
    'homePage'
  );

}


// ================================================================
// PROCESSING
// ================================================================

function showProcessing(
  title,
  text
) {

  $('processingTitle')
    .textContent =
    title ||
    'Please wait...';


  $('processingText')
    .textContent =
    text ||
    'Your request is being securely processed.';


  $('processingModal')
    .classList.remove(
      'hidden'
    );

}


function hideProcessing() {

  $('processingModal')
    .classList.add(
      'hidden'
    );

}


// ================================================================
// HELPERS
// ================================================================

function delay(ms) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );

}


function money(value) {

  return '$' +
    Number(value || 0)
      .toFixed(2);

}


function formatDate(value) {

  if (!value) return '-';

  const date =
    new Date(value);

  if (
    isNaN(
      date.getTime()
    )
  ) {

    return String(value);

  }

  return date.toLocaleString(
    undefined,
    {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }
  );

}


function escapeHTML(value) {

  return String(
    value ?? ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );

}


async function copyText(text) {

  if (
    navigator.clipboard
  ) {

    await navigator.clipboard.writeText(
      text
    );

    return;

  }


  const textarea =
    document.createElement(
      'textarea'
    );

  textarea.value =
    text;

  document.body.appendChild(
    textarea
  );

  textarea.select();

  document.execCommand(
    'copy'
  );

  textarea.remove();

}


function toast(message) {

  const element =
    $('toast');


  element.textContent =
    message;


  element.classList.add(
    'show'
  );


  clearTimeout(
    toast.timer
  );


  toast.timer =
    setTimeout(
      function() {

        element.classList.remove(
          'show'
        );

      },
      3000
    );

}


// ================================================================
// SERVICE WORKER
// ================================================================

if (
  'serviceWorker' in navigator
) {

  window.addEventListener(
    'load',
    function() {

      navigator.serviceWorker
        .register('/sw.js')
        .catch(function(error) {

          console.log(
            'Service worker registration failed:',
            error
          );

        });

    }
  );

}
