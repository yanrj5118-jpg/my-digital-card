// --- 탭 전환 로직 ---
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // 버튼 활성화 상태 변경
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 탭 내용 전환
    const targetId = btn.getAttribute('data-target');
    tabContents.forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(targetId).classList.add('active');
    
    // 명함첩 탭 열리면 데이터 다시 로드
    if (targetId === 'tab-contacts') {
      loadContacts();
    }
  });
});

// --- 명함 스캐너 (OCR 관련) ---
const cameraInput = document.getElementById('camera-input');
const imagePreview = document.getElementById('image-preview');
const scanStatus = document.getElementById('scan-status');
const resultForm = document.getElementById('result-form');

// 추출 결과 입력칸들
const nameInput = document.getElementById('result-name');
const phoneInput = document.getElementById('result-phone');
const extraInput = document.getElementById('result-extra');

// 사진 선택/촬영 시 동작
cameraInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // 1. 이미지 미리보기 보여주기
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreview.style.display = 'block';
    
    // 이전 결과 폼 숨기기
    resultForm.classList.add('hidden');
    
    // OCR 로직 시작
    startScan(e.target.result);
  };
  reader.readAsDataURL(file);
});

// Tesseract.js 를 이용해 글자 읽기
async function startScan(imageFile) {
  scanStatus.style.display = 'block';
  scanStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 마법처럼 글자를 읽는 중...';
  
  try {
    // 한국어 + 영어 (kor+eng) 모드로 인식
    const result = await Tesseract.recognize(imageFile, 'kor+eng', {
      logger: m => console.log(m) // 로딩 상태 확인용
    });

    const text = result.data.text;
    console.log("인식된 텍스트:", text);
    
    scanStatus.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981;"></i> 글자 추출 성공!';
    
    // 간단한 정규식으로 전화번호/이름 비스무리한 것 뽑기 
    // (실제 완벽하진 않으나 프로토타입용)
    const phoneRegex = /(01[016789]-?\d{3,4}-?\d{4})/;
    const phoneMatch = text.match(phoneRegex);
    
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    // 가장 위쪽 줄이나 3글자 정도 되는 걸 이름으로 추정
    const nameEstimate = lines.length > 0 ? lines[0] : "";

    nameInput.value = nameEstimate;
    phoneInput.value = phoneMatch ? phoneMatch[0] : "";
    extraInput.value = text;
    
    // 수정 폼 보여주기
    resultForm.classList.remove('hidden');

  } catch (error) {
    console.error("OCR 에러:", error);
    scanStatus.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i> 인식에 실패했습니다. 밝은 곳에서 다시 찍어주세요.';
  }
}

// --- 명함 데이터 저장 (LocalStorage) ---
const saveBtn = document.getElementById('save-card-btn');
const contactsList = document.getElementById('contacts-list');

saveBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const extra = extraInput.value.trim();
  
  if(!name && !phone) {
    alert("이름이나 연락처를 입력해주세요.");
    return;
  }
  
  const newContact = {
    id: Date.now(),
    name,
    phone,
    extra,
    date: new Date().toLocaleDateString()
  };
  
  // 기존 데이터 불러오기 -> 추가 -> 다시 저장
  const saved = JSON.parse(localStorage.getItem('myContacts') || '[]');
  saved.push(newContact);
  localStorage.setItem('myContacts', JSON.stringify(saved));
  
  alert("명함첩에 저장되었습니다!");
  
  // 폼 초기화 및 명함첩 탭으로 자동 이동
  resultForm.classList.add('hidden');
  imagePreview.style.display = 'none';
  scanStatus.style.display = 'none';
  cameraInput.value = "";
  
  document.querySelector('.nav-btn[data-target="tab-contacts"]').click();
});

// 명함첩 화면에 그리기
function loadContacts() {
  const saved = JSON.parse(localStorage.getItem('myContacts') || '[]');
  
  if(saved.length === 0) {
    contactsList.innerHTML = `<div class="empty-state">저장된 명함이 없습니다.<br>스캐너로 명함을 추가해보세요!</div>`;
    return;
  }
  
  contactsList.innerHTML = '';
  // 최신순 정렬
  saved.sort((a,b) => b.id - a.id).forEach(contact => {
    const el = document.createElement('div');
    el.className = 'contact-item';
    el.innerHTML = `
      <div class="c-name">${contact.name || '이름 없음'}</div>
      <div class="c-phone"><i class="fas fa-phone-alt"></i> ${contact.phone || '번호 없음'}</div>
      <div class="c-extra">${contact.extra ? contact.extra.substring(0, 50) + '...' : ''}</div>
      <button class="delete-btn" onclick="deleteContact(${contact.id})">삭제</button>
    `;
    contactsList.appendChild(el);
  });
}

// 명함 삭제 글로벌 함수
window.deleteContact = function(id) {
  if(confirm("이 명함을 삭제할까요?")) {
    let saved = JSON.parse(localStorage.getItem('myContacts') || '[]');
    saved = saved.filter(c => c.id !== id);
    localStorage.setItem('myContacts', JSON.stringify(saved));
    loadContacts(); // 새로고침
  }
}

// 초기 로드 시 실행
loadContacts();
