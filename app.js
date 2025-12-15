import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    serverTimestamp,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const EMAILJS_SERVICE_ID = "service_m3ty5rw";
const TEMPLATE_ID_VERIFICATION = "template_qhpij1u";
const TEMPLATE_ID_SUCCESS = "template_lq8h4da";

const firebaseConfig = {
  apiKey: "AIzaSyA0aCuwob1xtJFi0uEs1di6zm5LJd4UgbA",
  authDomain: "codenamoo-test.firebaseapp.com",
  projectId: "codenamoo-test",
  storageBucket: "codenamoo-test.firebasestorage.app",
  messagingSenderId: "890199846006",
  appId: "1:890199846006:web:e9b99799a1bdc07bc78357",
  measurementId: "G-D6VZZZTSG7"
};

try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    let currentVerificationCode = '';
    let currentEmail = '';
    let verificationTimer;
    const VERIFICATION_TIME_LIMIT = 180;

    document.addEventListener('DOMContentLoaded', () => {
        const emailInput = document.getElementById('email-input');
        const notifyButton = document.getElementById('notify-button');
        const privacyAgree = document.getElementById('privacy-agree');
        
        const verificationModal = document.getElementById('verification-modal');
        const targetEmailSpan = document.getElementById('target-email');
        const verificationCodeInput = document.getElementById('verification-code-input');
        const verificationSubmitBtn = document.getElementById('verification-submit-btn');
        const verificationResendBtn = document.getElementById('verification-resend-btn');
        
        const verificationCloseBtn = verificationModal.querySelector('#verification-close-btn');
        const timerDisplay = document.getElementById('timer-display');

        const originalButtonHtml = notifyButton.innerHTML;
        const loadingSpinnerHtml = `
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;

        function resetButton() {
            notifyButton.disabled = false;
            notifyButton.innerHTML = originalButtonHtml;
        }

        function generateVerificationCode() {
            return Math.floor(100000 + Math.random() * 900000).toString();
        }

        async function sendVerificationEmail(email) {
            try {
                currentVerificationCode = generateVerificationCode();
                
                await emailjs.send(
                    EMAILJS_SERVICE_ID,    
                    TEMPLATE_ID_VERIFICATION,  
                    {  
                        email: email,  
                        verification_code: currentVerificationCode  
                    }
                );
                return true;
            } catch (mailError) {
                console.warn("EmailJS 인증 메일 발송 실패:", mailError);
                return false;
            }
        }
        
        function startVerificationTimer() {
            let timeLeft = VERIFICATION_TIME_LIMIT;
            
            if (verificationTimer) {
                clearInterval(verificationTimer);
            }

            const updateTimer = () => {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                if (timeLeft <= 0) {
                    clearInterval(verificationTimer);
                    hideVerificationModal(false);
                    window.showModal('⏰ 시간 만료', '인증 제한 시간이 초과되었습니다. 다시 시도해주세요.');
                    return;
                }
                
                if (timeLeft <= 30) {
                    timerDisplay.classList.add('text-red-500');
                    timerDisplay.classList.remove('text-gray-600');
                } else {
                    timerDisplay.classList.add('text-gray-600');
                    timerDisplay.classList.remove('text-red-500');
                }
                
                timeLeft--;
            };

            updateTimer();
            verificationTimer = setInterval(updateTimer, 1000);
        }

        notifyButton.addEventListener('click', async () => {
            currentEmail = emailInput.value.trim();
            const isAgreed = privacyAgree.checked;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!currentEmail || !emailRegex.test(currentEmail)) {
                window.showModal('⚠️ 입력 오류', '유효한 이메일 주소를 입력해주세요.');
                emailInput.focus();
                return;
            }
            if (!isAgreed) {
                window.showModal('⚠️ 필수 동의', '[필수] 개인정보 수집 및 이용에 동의해야 합니다.');
                return;
            }

            notifyButton.disabled = true;
            notifyButton.innerHTML = loadingSpinnerHtml;

            try {
                const docSnap = await getDoc(doc(db, "launch_notifications", currentEmail));
                if (docSnap.exists() && docSnap.data().status === 'verified') {
                    window.showModal('⚠️ 중복 등록', '이미 등록된 이메일 주소입니다.');
                    resetButton();
                    return;
                }

                const success = await sendVerificationEmail(currentEmail);

                if (success) {
                    targetEmailSpan.textContent = currentEmail;
                    verificationCodeInput.value = '';
                    showVerificationModal();
                    startVerificationTimer();
                } else {
                    window.showModal('🚨 오류 발생', '메일 발송 중 오류가 발생했습니다. 다시 시도해주세요.');
                }
            } catch (e) {
                console.error("Error:", e);
                window.showModal('🚨 오류 발생', '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            } finally {
                resetButton();
            }
        });

        function showVerificationModal() {
            verificationModal.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
            setTimeout(() => {
                verificationModal.classList.remove('opacity-0');
                verificationModal.querySelector('#verification-content').classList.remove('translate-y-4', 'opacity-0');
            }, 10);
            verificationCodeInput.focus();
        }

        function hideVerificationModal(isVerified = true) {
            if (verificationTimer) {
                clearInterval(verificationTimer);
                verificationTimer = null;
            }
            
            if (!isVerified) {
                currentVerificationCode = null; 
            }

            verificationModal.classList.add('opacity-0');
            verificationModal.querySelector('#verification-content').classList.add('translate-y-4', 'opacity-0');
            setTimeout(() => {
                verificationModal.classList.add('hidden', 'pointer-events-none');
            }, 300);
        }
        
        if (verificationCloseBtn) {
            verificationCloseBtn.addEventListener('click', () => {
                hideVerificationModal(false);
                window.showModal('❌ 인증 취소', '이메일 인증이 취소되었습니다. 다시 알림을 신청해주세요.');
            });
        }

        verificationCodeInput.addEventListener('input', (e) => {
            const code = e.target.value.trim();
            verificationSubmitBtn.disabled = code.length !== 6 || isNaN(code);
        });

        verificationSubmitBtn.addEventListener('click', async () => {
            const inputCode = verificationCodeInput.value.trim();
            verificationSubmitBtn.disabled = true;

            if (currentVerificationCode === null) {
                window.showModal('❌ 인증 실패', '인증 시간이 만료되었거나 취소되었습니다. 다시 시도해주세요.');
                verificationSubmitBtn.disabled = false;
                return;
            }

            if (inputCode === currentVerificationCode) {
                let successMessage = '🎉 알림 신청 완료';
                let successTitle = `성공적으로 등록되었습니다! 주소로 알림 신청 완료 메일을 보내드렸어요!`;
                
                try {
                    
                    await setDoc(doc(db, "launch_notifications", currentEmail), {
                        email: currentEmail,
                        status: 'verified',
                        timestamp: serverTimestamp()
                    });
                    
                    try {
                        await emailjs.send(
                            EMAILJS_SERVICE_ID,
                            TEMPLATE_ID_SUCCESS,
                            { email: currentEmail }  
                        );
                    } catch (emailError) {
                        
                        console.error("Success EmailJS Send Error (Non-critical):", emailError);
                        successTitle = '등록은 성공했습니다. 다만, 완료 메일 발송에 실패했습니다. (내부 오류)';
                    }
                    
                    
                    hideVerificationModal(true);
                    window.showModal(successMessage, successTitle);
                    
                    emailInput.value = '';
                    privacyAgree.checked = false;

                } catch (dbError) {
                    
                    console.error("Firestore Save Error (Critical):", dbError);
                    hideVerificationModal(false);
                    window.showModal('🚨 등록 실패', '데이터베이스 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
                }

            } else {
                hideVerificationModal(false); 
                window.showModal('❌ 인증 실패', '인증 번호가 일치하지 않습니다. 다시 시도해주세요.');
                verificationCodeInput.value = '';
            }
            verificationSubmitBtn.disabled = verificationCodeInput.value.length !== 6;  
        });

        verificationResendBtn.addEventListener('click', async () => {
            verificationResendBtn.disabled = true;
            verificationResendBtn.textContent = '재전송 중...';

            const success = await sendVerificationEmail(currentEmail);
            startVerificationTimer();

            if (success) {
                window.showModal('✅ 재전송 완료', '새로운 인증 번호를 메일로 다시 발송했습니다.');
            } else {
                window.showModal('🚨 재전송 실패', '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
            }

            verificationResendBtn.disabled = false;
            verificationResendBtn.textContent = '재전송';
        });
    });
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}