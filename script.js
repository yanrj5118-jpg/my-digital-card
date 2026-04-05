// --- 0. 내 프로필 로드/저장 로직 ---
const profileNameEl = document.getElementById('my-profile-name');
const profileTitleEl = document.getElementById('my-profile-title');
const profileBioEl = document.getElementById('my-profile-bio');

// 로컬스토리지에서 프로필 불러오기
function loadMyProfile() {
  const profile = JSON.parse(localStorage.getItem('myProfile'));
  if (profile) {
    profileNameEl.textContent = profile.name || '홍길동';
    profileTitleEl.textContent = profile.title || '직업 없음';
    profileBioEl.textContent = profile.bio || '자기소개가 없습니다.';
  }
}
loadMyProfile(); // 초기 로드

// --- 1. 프로필 수정 기능 (모달) ---
const editModal = document.getElementById('edit-modal');
const btnEditProfile = document.getElementById('btn-edit-profile');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const btnSaveEdit = document.getElementById('btn-save-edit');

const inputName = document.getElementById('edit-name');
const inputTitle = document.getElementById('edit-title');
const inputBio = document.getElementById('edit-bio');

// 수정 버튼 클릭 시 모달 열기
btnEditProfile.addEventListener('click', () => {
  inputName.value = profileNameEl.textContent;
  inputTitle.value = profileTitleEl.textContent;
  inputBio.value = profileBioEl.textContent;
  editModal.classList.remove('hidden');
});

// 취소
btnCancelEdit.addEventListener('click', () => {
  editModal.classList.add('hidden');
});

// 저장
btnSaveEdit.addEventListener('click', () => {
  const newProfile = {
    name: inputName.value,
    title: inputTitle.value,
    bio: inputBio.value
  };
  localStorage.setItem('myProfile', JSON.stringify(newProfile));
  loadMyProfile(); // 즉시 반영
  editModal.classList.add('hidden');
});

// --- 2. QR 코드 모달 기능 ---
const qrModal = document.getElementById('qr-modal');
const btnShowQr = document.getElementById('btn-show-qr');
const btnCloseQr = document.getElementById('btn-close-qr');
const qrContainer = document.getElementById('qrcode');
const qrLoader = document.getElementById('qr-loader');
let qrcodeInstance = null;

btnShowQr.addEventListener('click', () => {
  qrModal.classList.remove('hidden');
  
  // 현재 접속 중인 주소 (로컬일 경우 로컬 주소, 깃허브면 깃허브 주소)
  const currentUrl = window.location.href;
  
  // QR 내용 지우고 새로 생성
  qrContainer.innerHTML = "";
  qrLoader.style.display = "block";
  
  // 약간의 딜레이 후 생성 (로딩 모션 보여주기 위함)
  setTimeout(() => {
    qrcodeInstance = new QRCode(qrContainer, {
      text: currentUrl,
      width: 180,
      height: 180,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.M
    });
    qrLoader.style.display = "none";
  }, 300);
});

btnCloseQr.addEventListener('click', () => {
  qrModal.classList.add('hidden');
});


// --- 3. 탭 전환 로직 ---
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const targetId = btn.getAttribute('data-target');
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
    
    if (targetId === 'tab-contacts') loadContacts();
  });
});

// --- 4. 명함 스캐너 (OCR 관련) ---
const cameraInput = document.getElementById('camera-input');
const imagePreview = document.getElementById('image-preview');
const scanStatus = document.getElementById('scan-status');
const resultForm = document.getElementById('result-form');

const resName = document.getElementById('result-name');
const resPhone = document.getElementById('result-phone');
const resExtra = document.getElementById('result-extra');

cameraInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreview.style.display = 'block';
    resultForm.classList.add('hidden');
    startScan(e.target.result);
  };
  reader.readAsDataURL(file);
});

async function startScan(imageFile) {
  scanStatus.style.display = 'block';
  scanStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 마법처럼 글자를 읽는 중...';
  
  try {
    const result = await Tesseract.recognize(imageFile, 'kor+eng+chi_sim+chi_tra', {
      logger: m => console.log(m)
    });

    const text = result.data.text;
    scanStatus.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981;"></i> 추출 성공! 아래 칸에서 수정 가능합니다.';
    
    const phoneRegex = /(01[016789]-?\d{3,4}-?\d{4})/;
    const phoneMatch = text.match(phoneRegex);
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const nameEstimate = lines.length > 0 ? lines[0] : "";

    resName.value = nameEstimate;
    resPhone.value = phoneMatch ? phoneMatch[0] : "";
    resExtra.value = text;
    
    resultForm.classList.remove('hidden');

  } catch (error) {
    scanStatus.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i> 인식에 실패했습니다. 다시 찍어주세요.';
  }
}

// --- 5. 타인 명함 데이터 저장 (LocalStorage) ---
const saveBtn = document.getElementById('save-card-btn');
const contactsList = document.getElementById('contacts-list');

saveBtn.addEventListener('click', () => {
  const name = resName.value.trim();
  const phone = resPhone.value.trim();
  const extra = resExtra.value.trim();
  
  if(!name && !phone) {
    alert("이름이나 연락처를 입력해주세요.");
    return;
  }
  
  const newContact = {
    id: Date.now(), name, phone, extra, date: new Date().toLocaleDateString()
  };
  
  const saved = JSON.parse(localStorage.getItem('myContacts') || '[]');
  saved.push(newContact);
  localStorage.setItem('myContacts', JSON.stringify(saved));
  alert("명함첩에 저장되었습니다!");
  
  resultForm.classList.add('hidden');
  imagePreview.style.display = 'none';
  scanStatus.style.display = 'none';
  cameraInput.value = "";
  
  document.querySelector('.nav-btn[data-target="tab-contacts"]').click();
});

function loadContacts() {
  const saved = JSON.parse(localStorage.getItem('myContacts') || '[]');
  if(saved.length === 0) {
    contactsList.innerHTML = `<div class="empty-state">저장된 명함이 없습니다.<br>스캐너로 명함을 추가해보세요!</div>`;
    return;
  }
  contactsList.innerHTML = '';
  saved.sort((a,b) => b.id - a.id).forEach(contact => {
    const el = document.createElement('div');
    el.className = 'contact-item';
    el.innerHTML = `
      <div class="c-name">${contact.name || '이름 없음'}</div>
      <div class="c-phone"><i class="fas fa-phone-alt"></i> ${contact.phone || '번호 없음'}</div>
      <div class="c-extra">${contact.extra ? contact.extra.substring(0, 50) + '...' : ''}</div>
      <div style="display:flex; justify-content:flex-end; gap:5px; margin-top:5px;">
        <button class="delete-btn" style="background:rgba(99, 102, 241, 0.2); color:var(--accent-color); margin-top:0;" onclick="openEditContact(${contact.id})">수정</button>
        <button class="delete-btn" style="margin-top:0;" onclick="deleteContact(${contact.id})">삭제</button>
      </div>
    `;
    contactsList.appendChild(el);
  });
}

window.deleteContact = function(id) {
  if(confirm("이 명함을 삭제할까요?")) {
    let saved = JSON.parse(localStorage.getItem('myContacts') || '[]');
    saved = saved.filter(c => c.id !== id);
    localStorage.setItem('myContacts', JSON.stringify(saved));
    loadContacts(); 
  }
}

// --- 타인 명함(고객 정보) 편집 로직 ---
const editContactModal = document.getElementById('edit-contact-modal');
const inputContactName = document.getElementById('edit-contact-name');
const inputContactPhone = document.getElementById('edit-contact-phone');
const inputContactExtra = document.getElementById('edit-contact-extra');
let currentEditingContactId = null;

window.openEditContact = function(id) {
  const saved = JSON.parse(localStorage.getItem('myContacts') || '[]');
  const contact = saved.find(c => c.id === id);
  if(contact) {
    currentEditingContactId = id;
    inputContactName.value = contact.name || '';
    inputContactPhone.value = contact.phone || '';
    inputContactExtra.value = contact.extra || '';
    editContactModal.classList.remove('hidden');
  }
}

document.getElementById('btn-cancel-contact-edit').addEventListener('click', () => {
  editContactModal.classList.add('hidden');
  currentEditingContactId = null;
});

document.getElementById('btn-save-contact-edit').addEventListener('click', () => {
  if(!currentEditingContactId) return;
  
  let saved = JSON.parse(localStorage.getItem('myContacts') || '[]');
  const index = saved.findIndex(c => c.id === currentEditingContactId);
  if(index !== -1) {
    saved[index].name = inputContactName.value.trim();
    saved[index].phone = inputContactPhone.value.trim();
    saved[index].extra = inputContactExtra.value.trim();
    localStorage.setItem('myContacts', JSON.stringify(saved));
    loadContacts();
  }
  editContactModal.classList.add('hidden');
  currentEditingContactId = null;
});

loadContacts();
